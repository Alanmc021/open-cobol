import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { runDocsAgent } from '@opencobol/ai-runtime'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'
import { RedisService } from '../redis/redis.service.js'
import { withRetry } from '../../utils/retry.js'
import { createHash } from 'node:crypto'

class DocsDto {
  filePath!: string
  model?: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('docs')
export class DocsController {
  constructor(private readonly redis: RedisService) {}

  @Roles('ANALYST')
  @Post()
  async generate(@Body() dto: DocsDto) {
    const model = dto.model ?? process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini'
    const cacheKey = `docs:${createHash('md5').update(`${dto.filePath}:${model}`).digest('hex')}`

    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as { documentation: string }

    const opts = dto.model ? { model: dto.model } : {}
    const output = await withRetry(() => runDocsAgent(dto.filePath, opts))
    if (output.error) throw new Error(output.error)

    const result = { documentation: output.documentation }
    await this.redis.set(cacheKey, JSON.stringify(result), 3_600)
    return result
  }
}
