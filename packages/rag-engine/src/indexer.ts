import { scanDirectory } from '@opencobol/parser-core'
import { chunkCobolFile } from './chunker/cobol.js'
import { chunkJclFile } from './chunker/jcl.js'
import { QdrantStore } from './store/qdrant.js'
import { OpenAIEmbeddings } from './providers/embedding/openai.js'
import { loadManifest, saveManifest, isFileChanged, setManifestEntry, removeManifestEntry } from './manifest.js'
import type { EmbeddingProvider } from './providers/embedding/base.js'

export interface IndexOptions {
  qdrantUrl?: string
  collection?: string
  embeddingProvider?: EmbeddingProvider
}

export type IndexProgressType = 'file' | 'skipped' | 'removed' | 'done' | 'error'

export interface IndexProgress {
  type: IndexProgressType
  file?: string
  chunks?: number
  total?: number
  indexed?: number
  skipped?: number
  removed?: number
  error?: string
}

export async function* indexDirectory(
  rootPath: string,
  options: IndexOptions = {},
): AsyncIterable<IndexProgress> {
  const collection = options.collection ?? process.env['QDRANT_COLLECTION'] ?? 'opencobol'
  const provider = options.embeddingProvider ?? new OpenAIEmbeddings()
  const store = new QdrantStore(
    options.qdrantUrl ?? process.env['QDRANT_URL'] ?? 'http://localhost:6333',
    collection,
  )

  await store.ensureCollection(provider.dimensions)

  const scan = scanDirectory(rootPath)
  const indexableFiles = scan.files.filter((f) => f.type === 'program' || f.type === 'copybook' || f.type === 'jcl')

  const manifest = loadManifest(collection)
  const currentPaths = new Set(indexableFiles.map((f) => f.path))

  // Remove stale entries (files deleted from disk)
  let removedCount = 0
  for (const [filePath, entry] of Object.entries(manifest)) {
    if (!currentPaths.has(filePath)) {
      await store.deleteByIds(entry.chunkIds)
      removeManifestEntry(manifest, filePath)
      removedCount++
      yield { type: 'removed', file: filePath.split('/').pop() ?? filePath }
    }
  }

  let totalIndexed = 0
  let skippedCount = 0

  for (const file of indexableFiles) {
    // Skip unchanged files
    if (!isFileChanged(file.path, manifest)) {
      skippedCount++
      yield { type: 'skipped', file: file.name }
      continue
    }

    try {
      // Delete old chunks if re-indexing a changed file
      const oldEntry = manifest[file.path]
      if (oldEntry) {
        await store.deleteByIds(oldEntry.chunkIds)
      }

      // Generate new chunks
      let chunks
      if (file.type === 'jcl') {
        chunks = chunkJclFile(file.path)
      } else {
        chunks = chunkCobolFile(file.path, file.type === 'copybook' ? 'copybook' : 'program')
      }

      const vectors = await provider.embed(chunks.map((c) => c.content))

      await store.upsert(
        chunks.map((chunk, i) => ({
          id: chunk.id,
          vector: vectors[i]!,
          payload: chunk.payload,
        })),
      )

      setManifestEntry(manifest, file.path, chunks.map((c) => c.id))
      totalIndexed += chunks.length
      yield { type: 'file', file: file.name, chunks: chunks.length, indexed: totalIndexed }
    } catch (err) {
      yield { type: 'error', file: file.name, error: (err as Error).message }
    }
  }

  saveManifest(collection, manifest)

  yield {
    type: 'done',
    total: indexableFiles.length,
    indexed: totalIndexed,
    skipped: skippedCount,
    removed: removedCount,
  }
}
