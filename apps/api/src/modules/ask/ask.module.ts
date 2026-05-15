import { Module } from '@nestjs/common'
import { AskController } from './ask.controller.js'
import { AskService } from './ask.service.js'

@Module({ controllers: [AskController], providers: [AskService] })
export class AskModule {}
