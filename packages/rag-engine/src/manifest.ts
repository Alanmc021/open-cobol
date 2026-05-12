import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface ManifestEntry {
  mtime: number
  chunkIds: string[]
}

type Manifest = Record<string, ManifestEntry>

function manifestPath(collection: string): string {
  const dir = join(homedir(), '.opencobol', 'manifests')
  mkdirSync(dir, { recursive: true })
  return join(dir, `${collection}.json`)
}

export function loadManifest(collection: string): Manifest {
  const path = manifestPath(collection)
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Manifest
  } catch {
    return {}
  }
}

export function saveManifest(collection: string, manifest: Manifest): void {
  writeFileSync(manifestPath(collection), JSON.stringify(manifest, null, 2))
}

export function getFileMtime(filePath: string): number {
  return statSync(filePath).mtimeMs
}

export function isFileChanged(filePath: string, manifest: Manifest): boolean {
  const entry = manifest[filePath]
  if (!entry) return true
  return getFileMtime(filePath) !== entry.mtime
}

export function setManifestEntry(
  manifest: Manifest,
  filePath: string,
  chunkIds: string[],
): void {
  manifest[filePath] = { mtime: getFileMtime(filePath), chunkIds }
}

export function removeManifestEntry(manifest: Manifest, filePath: string): string[] {
  const entry = manifest[filePath]
  delete manifest[filePath]
  return entry?.chunkIds ?? []
}
