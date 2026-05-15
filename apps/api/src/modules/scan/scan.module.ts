import { Module } from '@nestjs/common'
import { ScanController } from './scan.controller.js'

@Module({ controllers: [ScanController] })
export class ScanModule {}
