import OpenAI from 'openai'
import type { EmbeddingProvider } from './base.js'

const BATCH_SIZE = 100

export class OpenAIEmbeddings implements EmbeddingProvider {
  readonly model = 'text-embedding-3-small'
  readonly dimensions = 1536

  private client: OpenAI

  constructor(apiKey?: string) {
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
      // response.data is sorted by index
      results.push(...response.data.map((d) => d.embedding))
    }

    return results
  }
}
