import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PredictionController } from './prediction.controller.js';
import { PredictionService } from './prediction.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  imports: [ConfigModule],
  controllers: [PredictionController],
  providers: [PredictionService, PrismaService],
})
export class PredictionModule {}
