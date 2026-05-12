export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>
  readonly model: string
  readonly dimensions: number
}
