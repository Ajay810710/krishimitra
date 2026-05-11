import { Module } from '@nestjs/common';
import { AlertController } from './alert.controller.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AlertController],
  providers: [PrismaService],
})
export class AlertModule {}
