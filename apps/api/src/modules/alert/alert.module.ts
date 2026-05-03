import { Module } from '@nestjs/common';
import { AlertController } from './alert.controller.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  controllers: [AlertController],
  providers: [PrismaService],
})
export class AlertModule {}
