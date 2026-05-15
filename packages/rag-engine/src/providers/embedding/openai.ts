import OpenAI from 'openai'
import type { EmbeddingProvider } from './base.js'

const BATCH_SIZE = 100

// Cost reference (per 1M tokens, May 2026):
//   text-embedding-3-small → $0.02  (default — best cost/quality ratio)
//   text-embedding-3-large → $0.13  (6.5× more expensive, better multilingual)
// Configure via OPENAI_EMBEDDING_MODEL env var or constructor param.
const MODEL_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
}

export class OpenAIEmbeddings implements EmbeddingProvider {
  readonly model: string
  readonly dimensions: number

  private client: OpenAI

  constructor(apiKey?: string, model?: string) {
    this.model = model ?? process.env['OPENAI_EMBEDDING_MODEL'] ?? 'text-embedding-3-small'
    this.dimensions = MODEL_DIMENSIONS[this.model] ?? 1536
    this.client = new OpenAI({ apiKey: apiKey ?? process.env['OPENAI_API_KEY'] })
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      })
      results.push(...response.data.map((d) => d.embedding))
    }

    return results
  }
}
