import { Module } from '@nestjs/common'
import { ExplainController } from './explain.controller.js'

@Module({ controllers: [ExplainController] })
export class ExplainModule {}
