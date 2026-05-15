import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module.js'
import { AuthModule } from './auth/auth.module.js'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js'
import { RolesGuard } from './auth/guards/roles.guard.js'
import { RedisModule } from './modules/redis/redis.module.js'
import { HealthModule } from './modules/health/health.module.js'
import { AskModule } from './modules/ask/ask.module.js'
import { ExplainModule } from './modules/explain/explain.module.js'
import { DocsModule } from './modules/docs/docs.module.js'
import { ModernizeModule } from './modules/modernize/modernize.module.js'
import { EmbedModule } from './modules/embed/embed.module.js'
import { ScanModule } from './modules/scan/scan.module.js'
import { GenerateApiModule } from './modules/generate-api/generate-api.module.js'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    RedisModule,
    HealthModule,
    AskModule,
    ExplainModule,
    DocsModule,
    ModernizeModule,
    EmbedModule,
    ScanModule,
    GenerateApiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
