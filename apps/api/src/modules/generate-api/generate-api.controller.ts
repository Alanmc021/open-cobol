import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { runApiGeneratorAgent, type GeneratedApi } from '@opencobol/ai-runtime'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'
import { RedisService } from '../redis/redis.service.js'
import { withRetry } from '../../utils/retry.js'
import { createHash } from 'node:crypto'

class GenerateApiDto {
  filePath!: string
  framework?: string
  model?: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('generate-api')
export class GenerateApiController {
  constructor(private readonly redis: RedisService) {}

  @Roles('DEVELOPER')
  @Post()
  async generate(@Body() dto: GenerateApiDto) {
    const framework = dto.framework ?? 'nestjs'
    const model = dto.model ?? process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini'
    const cacheKey = `generate-api:${createHash('md5').update(`${dto.filePath}:${framework}:${model}`).digest('hex')}`

    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const { result, error } = await withRetry<{ result: GeneratedApi | undefined; error: string | undefined }>(() =>
      runApiGeneratorAgent(dto.filePath, framework, dto.model ? { model: dto.model } : {}),
    )
    if (error) throw new Error(error)

    await this.redis.set(cacheKey, JSON.stringify(result), 3_600)
    return result
  }
}
