import { QdrantClient } from '@qdrant/js-client-rest'

export interface ChunkPayload {
  file: string
  programId: string | null
  chunkType: 'program-header' | 'paragraph' | 'copybook' | 'jcl-step'
  paragraphName?: string
  performs: string[]
  calls: string[]
  content: string
  lineStart: number
  lineEnd: number
}

export interface SearchHit {
  id: string
  score: number
  payload: ChunkPayload
}

export class QdrantStore {
  private client: QdrantClient
  private collection: string

  constructor(url: string, collection = 'opencobol') {
    this.client = new QdrantClient({ url, checkCompatibility: false })
    this.collection = collection
  }

  async ensureCollection(dimensions: number): Promise<void> {
    const collections = await this.client.getCollections()
    const exists = collections.collections.some((c) => c.name === this.collection)

    if (!exists) {
      await this.client.createCollection(this.collection, {
        vectors: { size: dimensions, distance: 'Cosine' },
      })
    }
  }

  async upsert(points: Array<{ id: string; vector: number[]; payload: ChunkPayload }>): Promise<void> {
    await this.client.upsert(this.collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload as unknown as Record<string, unknown>,
      })),
    })
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.client.delete(this.collection, {
      wait: true,
      points: ids,
    })
  }

  async search(vector: number[], limit = 5): Promise<SearchHit[]> {
    const result = await this.client.search(this.collection, {
      vector,
      limit,
      with_payload: true,
    })

    return result.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload as unknown as ChunkPayload,
    }))
  }

  async collectionCount(): Promise<number> {
    const info = await this.client.getCollection(this.collection)
    return info.points_count ?? 0
  }
}
