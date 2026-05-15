import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { createHash, randomUUID } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { UsersService } from '../users/users.service.js'

interface JwtPayload {
  sub: string
  email: string
  role: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await this.users.validatePassword(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    return this.issueTokens(user.id, user.email, user.role)
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload
    try {
      const secret = process.env['JWT_REFRESH_SECRET'] ?? process.env['JWT_SECRET'] ?? ''
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const user = await this.users.findById(payload.sub)
    if (!user) throw new UnauthorizedException('User not found')

    const { accessToken } = await this.issueTokens(user.id, user.email, user.role)
    return { accessToken }
  }

  async createApiKey(userId: string, name: string) {
    const rawKey = `oc_${randomUUID().replace(/-/g, '')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    await this.prisma.apiKey.create({ data: { keyHash, name, userId } })
    return { key: rawKey, name }
  }

  async validateApiKey(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    })

    if (!record) return null
    if (record.expiresAt && record.expiresAt < new Date()) return null

    await this.prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    })

    return record.user
  }

  listApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, name: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    })
  }

  async deleteApiKey(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } })
    if (!key) throw new UnauthorizedException()
    await this.prisma.apiKey.delete({ where: { id } })
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role }
    const accessSecret = process.env['JWT_SECRET'] ?? ''
    const refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? accessSecret

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: accessSecret,
        expiresIn: Number(process.env['JWT_ACCESS_TTL'] ?? 900),
      }),
      this.jwt.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: Number(process.env['JWT_REFRESH_TTL'] ?? 604_800),
      }),
    ])

    return { accessToken, refreshToken }
  }
}
