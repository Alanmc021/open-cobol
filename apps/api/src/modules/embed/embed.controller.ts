import { Controller, Post, Get, Param, Body, NotFoundException, UseGuards } from '@nestjs/common'
import { EmbedService } from './embed.service.js'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'

class EmbedDto {
  path!: string
  qdrantUrl?: string
  collection?: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('embed')
export class EmbedController {
  constructor(private readonly embedService: EmbedService) {}

  @Roles('DEVELOPER')
  @Post()
  start(@Body() dto: EmbedDto) {
    const id = this.embedService.startJob(dto.path, dto.qdrantUrl, dto.collection)
    return { jobId: id, message: 'Indexing started' }
  }

  @Roles('DEVELOPER')
  @Get(':id')
  async status(@Param('id') id: string) {
    const job = await this.embedService.getJob(id)
    if (!job) throw new NotFoundException(`Job ${id} not found`)
    return job
  }
}
