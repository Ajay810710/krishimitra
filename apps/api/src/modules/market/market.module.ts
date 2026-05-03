import { Module } from '@nestjs/common';
import { MarketController } from './market.controller.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  controllers: [MarketController],
  providers: [PrismaService],
})
export class MarketModule {}
