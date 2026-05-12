import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { ScanResult, CobolFile, CopybookDependency, CallDependency } from '@opencobol/shared'
import { analyzeFile } from './detector.js'

const COBOL_EXTENSIONS = new Set(['.cbl', '.cob', '.cobol', '.cpy', '.copy', '.jcl', '.jcllib', '.jclproc'])

function walkDir(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(full, acc)
    } else if (COBOL_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      acc.push(full)
    }
  }
  return acc
}

export function buildCopybookDependencies(files: CobolFile[]): CopybookDependency[] {
  const map = new Map<string, string[]>()
  for (const file of files) {
    for (const cb of file.copybooks) {
      const existing = map.get(cb) ?? []
      existing.push(file.name)
      map.set(cb, existing)
    }
  }
  return [...map.entries()].map(([copybook, usedBy]) => ({ copybook, usedBy }))
}

export function buildCallDependencies(files: CobolFile[]): CallDependency[] {
  const map = new Map<string, Map<string, number>>()
  for (const file of files) {
    for (const target of file.calls) {
      const callers = map.get(target) ?? new Map<string, number>()
      callers.set(file.name, (callers.get(file.name) ?? 0) + 1)
      map.set(target, callers)
    }
  }
  return [...map.entries()].map(([target, callers]) => ({
    target,
    calledBy: [...callers.entries()].map(([file, count]) => ({ file, count })),
  }))
}

export function scanDirectory(rootPath: string): ScanResult {
  const start = Date.now()

  if (!statSync(rootPath).isDirectory()) {
    throw new Error(`Path is not a directory: ${rootPath}`)
  }

  const filePaths = walkDir(rootPath)
  const files: CobolFile[] = filePaths.map(analyzeFile)

  return {
    rootPath,
    files,
    durationMs: Date.now() - start,
    stats: {
      programs: files.filter((f) => f.type === 'program').length,
      copybooks: files.filter((f) => f.type === 'copybook').length,
      jcl: files.filter((f) => f.type === 'jcl').length,
      unknown: files.filter((f) => f.type === 'unknown').length,
      totalLines: files.reduce((s, f) => s + f.lines, 0),
      totalSizeBytes: files.reduce((s, f) => s + f.sizeBytes, 0),
    },
  }
}
