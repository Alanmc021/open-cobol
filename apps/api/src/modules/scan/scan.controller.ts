import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { scanDirectory } from '@opencobol/parser-core'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../auth/guards/roles.guard.js'
import { Roles } from '../../auth/decorators/roles.decorator.js'

class ScanDto {
  path!: string
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scan')
export class ScanController {
  @Roles('ANALYST')
  @Post()
  scan(@Body() dto: ScanDto) {
    return scanDirectory(dto.path)
  }
}
