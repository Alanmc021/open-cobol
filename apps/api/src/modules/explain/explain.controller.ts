import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { runExplainerAgent } from '@opencobol/ai-runtime'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'
import { RedisService } from '../redis/redis.service.js'
import { withRetry } from '../../utils/retry.js'
import { createHash } from 'node:crypto'

class ExplainDto {
  filePath!: string
  model?: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('explain')
export class ExplainController {
  constructor(private readonly redis: RedisService) {}

  @Roles('ANALYST')
  @Post()
  async explain(@Body() dto: ExplainDto) {
    const model = dto.model ?? process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini'
    const cacheKey = `explain:${createHash('md5').update(`${dto.filePath}:${model}`).digest('hex')}`

    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as { explanation: string }

    const opts = dto.model ? { model: dto.model } : {}
    const output = await withRetry(() => runExplainerAgent(dto.filePath, opts))
    if (output.error) throw new Error(output.error)

    const result = { explanation: output.explanation }
    await this.redis.set(cacheKey, JSON.stringify(result), 3_600)
    return result
  }
}
