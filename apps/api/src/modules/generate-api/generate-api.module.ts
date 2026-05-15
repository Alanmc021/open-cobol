import { Module } from '@nestjs/common'
import { GenerateApiController } from './generate-api.controller.js'

@Module({ controllers: [GenerateApiController] })
export class GenerateApiModule {}
