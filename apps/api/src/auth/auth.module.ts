import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { JwtStrategy } from './jwt.strategy.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard.js'
import { RolesGuard } from './guards/roles.guard.js'
import { UsersModule } from '../users/users.module.js'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, ApiKeyAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, ApiKeyAuthGuard, RolesGuard],
})
export class AuthModule {}
