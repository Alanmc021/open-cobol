import { Module } from '@nestjs/common'
import { ModernizeController } from './modernize.controller.js'

@Module({ controllers: [ModernizeController] })
export class ModernizeModule {}
