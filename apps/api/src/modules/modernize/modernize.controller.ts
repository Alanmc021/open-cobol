import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { runModernizationAgent } from '@opencobol/ai-runtime'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'
import { RedisService } from '../redis/redis.service.js'
import { withRetry } from '../../utils/retry.js'
import { createHash } from 'node:crypto'

class ModernizeDto {
  filePath!: string
  targetLanguage?: string
  model?: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('modernize')
export class ModernizeController {
  constructor(private readonly redis: RedisService) {}

  @Roles('DEVELOPER')
  @Post()
  async modernize(@Body() dto: ModernizeDto) {
    const model = dto.model ?? process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini'
    const lang = dto.targetLanguage ?? 'typescript'
    const cacheKey = `modernize:${createHash('md5').update(`${dto.filePath}:${lang}:${model}`).digest('hex')}`

    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as { plan: string }

    const opts = dto.model ? { model: dto.model } : {}
    const output = await withRetry(() => runModernizationAgent(dto.filePath, lang, opts))
    if (output.error) throw new Error(output.error)

    const result = { plan: output.plan }
    await this.redis.set(cacheKey, JSON.stringify(result), 3_600)
    return result
  }
}
