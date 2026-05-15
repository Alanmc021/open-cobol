import { Injectable } from '@nestjs/common'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(email: string, password: string, role: Role = Role.ANALYST) {
    const passwordHash = await bcrypt.hash(password, 12)
    return this.prisma.user.create({ data: { email, passwordHash, role } })
  }

  validatePassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash)
  }
}
