import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null
  private readonly logger = new Logger(RedisService.name)

  onModuleInit() {
    const url = process.env['REDIS_URL']
    if (!url) {
      this.logger.warn('REDIS_URL not set — Redis features disabled (in-memory fallback)')
      return
    }
    this.client = new Redis(url, { lazyConnect: true, enableReadyCheck: true })
    this.client.on('error', (err: unknown) => this.logger.error(`Redis: ${(err as Error).message}`))
    this.client.connect().catch((err: unknown) => this.logger.error(`Redis connect failed: ${(err as Error).message}`))
    this.logger.log(`Redis connected → ${url}`)
  }

  onModuleDestroy() {
    this.client?.disconnect()
  }

  get available(): boolean {
    return this.client !== null && this.client.status === 'ready'
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) return null
    return this.client!.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.available) return
    if (ttlSeconds) {
      await this.client!.setex(key, ttlSeconds, value)
    } else {
      await this.client!.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.available) return
    await this.client!.del(key)
  }
}
