import { Injectable } from '@nestjs/common'
import { indexDirectory } from '@opencobol/rag-engine'
import { RedisService } from '../redis/redis.service.js'

export interface EmbedJob {
  id: string
  path: string
  status: 'running' | 'done' | 'error'
  progress: string[]
  indexed: number
  skipped: number
  error?: string
  startedAt: string
  finishedAt?: string
}

const JOB_TTL = 86_400 // 24h

@Injectable()
export class EmbedService {
  // In-memory fallback when Redis is unavailable
  private readonly mem = new Map<string, EmbedJob>()

  constructor(private readonly redis: RedisService) {}

  startJob(path: string, qdrantUrl?: string, collection?: string): string {
    const id = `embed-${Date.now()}`
    const job: EmbedJob = {
      id,
      path,
      status: 'running',
      progress: [],
      indexed: 0,
      skipped: 0,
      startedAt: new Date().toISOString(),
    }
    this.persist(job)
    this.run(job, qdrantUrl, collection)
    return id
  }

  async getJob(id: string): Promise<EmbedJob | undefined> {
    if (this.redis.available) {
      const raw = await this.redis.get(`embed:${id}`)
      return raw ? (JSON.parse(raw) as EmbedJob) : undefined
    }
    return this.mem.get(id)
  }

  private persist(job: EmbedJob): void {
    if (this.redis.available) {
      void this.redis.set(`embed:${job.id}`, JSON.stringify(job), JOB_TTL)
    } else {
      this.mem.set(job.id, { ...job })
    }
  }

  private async run(job: EmbedJob, qdrantUrl?: string, collection?: string) {
    try {
      for await (const event of indexDirectory(job.path, {
        qdrantUrl: qdrantUrl ?? process.env['QDRANT_URL'] ?? 'http://localhost:6333',
        collection: collection ?? process.env['QDRANT_COLLECTION'] ?? 'opencobol',
      })) {
        if (event.type === 'file') {
          job.indexed += event.chunks ?? 0
          job.progress.push(`✔ ${event.file} (${event.chunks} chunks)`)
        } else if (event.type === 'skipped') {
          job.skipped++
        } else if (event.type === 'removed') {
          job.progress.push(`✗ removed ${event.file}`)
        } else if (event.type === 'error') {
          job.progress.push(`⚠ ${event.file}: ${event.error}`)
        } else if (event.type === 'done') {
          job.status = 'done'
          job.finishedAt = new Date().toISOString()
        }
        this.persist(job)
      }
    } catch (err) {
      job.status = 'error'
      job.error = (err as Error).message
      job.finishedAt = new Date().toISOString()
      this.persist(job)
    }
  }
}
