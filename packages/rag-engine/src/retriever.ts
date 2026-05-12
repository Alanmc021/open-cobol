import { QdrantStore } from './store/qdrant.js'
import { OpenAIEmbeddings } from './providers/embedding/openai.js'
import type { EmbeddingProvider } from './providers/embedding/base.js'
import type { SearchHit } from './store/qdrant.js'

export interface RetrieveOptions {
  qdrantUrl?: string
  collection?: string
  embeddingProvider?: EmbeddingProvider
  topK?: number
}

export interface RetrievedContext {
  hit: SearchHit
  formattedChunk: string
}

export async function retrieve(
  query: string,
  options: RetrieveOptions = {},
): Promise<RetrievedContext[]> {
  const provider = options.embeddingProvider ?? new OpenAIEmbeddings()
  const store = new QdrantStore(
    options.qdrantUrl ?? process.env['QDRANT_URL'] ?? 'http://localhost:6333',
    options.collection ?? 'opencobol',
  )

  const [queryVector] = await provider.embed([query])
  if (!queryVector) throw new Error('Failed to generate query embedding')

  const hits = await store.search(queryVector, options.topK ?? 5)

  return hits.map((hit) => ({
    hit,
    formattedChunk: formatHit(hit),
  }))
}

function formatHit(hit: SearchHit): string {
  const { payload, score } = hit
  const scoreStr = `[relevance: ${(score * 100).toFixed(0)}%]`

  if (payload.chunkType === 'program-header') {
    return `--- Program: ${payload.programId ?? payload.file} (header) ${scoreStr}\n${payload.content}`
  }

  if (payload.chunkType === 'paragraph') {
    return `--- ${payload.file} › ${payload.paragraphName} ${scoreStr}\n${payload.content}`
  }

  return `--- ${payload.file} ${scoreStr}\n${payload.content}`
}

export function buildRagPrompt(query: string, contexts: RetrievedContext[]): string {
  const contextBlock = contexts.map((c) => c.formattedChunk).join('\n\n')

  return `You are an expert COBOL analyst. Answer the question based solely on the COBOL code excerpts provided below. Be concise and practical. If the answer is not in the context, say so.

## Relevant Code Excerpts

${contextBlock}

## Question

${query}`
}
