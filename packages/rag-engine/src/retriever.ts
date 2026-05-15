import OpenAI from 'openai'
import { QdrantStore } from './store/qdrant.js'
import { OpenAIEmbeddings } from './providers/embedding/openai.js'
import type { EmbeddingProvider } from './providers/embedding/base.js'
import type { SearchHit } from './store/qdrant.js'

export interface RetrieveOptions {
  qdrantUrl?: string
  collection?: string
  embeddingProvider?: EmbeddingProvider
  topK?: number
  translateQuery?: boolean
}

export interface RetrievedContext {
  hit: SearchHit
  formattedChunk: string
}

// Cheap heuristic: detect non-English via common PT/ES/FR/DE words and non-ASCII ratio
function isLikelyNonEnglish(text: string): boolean {
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) ?? []).length / text.length
  if (nonAsciiRatio > 0.05) return true
  const ptEsKeywords = /\b(como|funciona|qual|quais|onde|quando|calculo|cálculo|como|qué|cómo|wie|funktioniert|comment|fonctionne)\b/i
  return ptEsKeywords.test(text)
}

// Translate query to English using gpt-4o-mini (~$0.0001 per call)
async function translateToEnglish(query: string): Promise<string> {
  try {
    const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Translate the following query to English for searching a COBOL codebase. Return only the translated text, nothing else.',
        },
        { role: 'user', content: query },
      ],
    })
    return res.choices[0]?.message?.content?.trim() ?? query
  } catch {
    return query
  }
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

  // Auto-translate non-English queries — gpt-4o-mini costs ~$0.0001/call
  const shouldTranslate = options.translateQuery !== false && isLikelyNonEnglish(query)
  const embeddingQuery = shouldTranslate ? await translateToEnglish(query) : query

  const [queryVector] = await provider.embed([embeddingQuery])
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

// Returns a system message string for use in multi-turn chat (no question embedded)
export function buildRagSystemPrompt(contexts: RetrievedContext[]): string {
  const contextBlock = contexts.map((c) => c.formattedChunk).join('\n\n')

  return `You are an expert COBOL analyst with deep knowledge of legacy systems. \
Answer questions based on the COBOL code excerpts below. Be concise and practical. \
You have access to the conversation history — use it to give contextually coherent answers. \
If the answer is not in the provided context, say so clearly. \
IMPORTANT: Always respond in the same language the user used in their question. \
If the question is in Portuguese, answer in Portuguese. If in English, answer in English. Never switch languages mid-conversation.

## Relevant Code Excerpts

${contextBlock}`
}
