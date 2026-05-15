import { Module } from '@nestjs/common'
import { EmbedController } from './embed.controller.js'
import { EmbedService } from './embed.service.js'

@Module({ controllers: [EmbedController], providers: [EmbedService] })
export class EmbedModule {}
