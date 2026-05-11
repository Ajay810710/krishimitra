import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PredictionController } from './prediction.controller.js';
import { PredictionService } from './prediction.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [PredictionController],
  providers: [PredictionService, PrismaService],
})
export class PredictionModule {}
