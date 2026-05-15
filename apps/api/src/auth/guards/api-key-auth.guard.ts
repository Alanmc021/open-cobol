import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from '../auth.service.js'

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: unknown }>()
    const key = req.headers['x-api-key'] as string | undefined
    if (!key) throw new UnauthorizedException('Missing X-API-Key header')

    const user = await this.auth.validateApiKey(key)
    if (!user) throw new UnauthorizedException('Invalid or expired API key')

    req.user = { id: user.id, email: user.email, role: user.role }
    return true
  }
}
