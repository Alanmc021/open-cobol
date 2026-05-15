import { Controller, Get } from '@nestjs/common'
import { Public } from '../../auth/decorators/public.decorator.js'

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }
  }
}
