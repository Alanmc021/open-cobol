import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator.js'

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  DEVELOPER: 2,
  ANALYST: 1,
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required || required.length === 0) return true

    const { user } = ctx.switchToHttp().getRequest<{ user?: { role: Role } }>()
    if (!user) throw new ForbiddenException()

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0
    const minRequired = Math.min(...required.map((r) => ROLE_HIERARCHY[r] ?? 0))

    if (userLevel < minRequired) throw new ForbiddenException('Insufficient role')
    return true
  }
}
