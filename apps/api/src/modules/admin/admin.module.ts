import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './admin.guard.js';
import { PrismaService } from '../database/prisma.service.js';
import { PRICE_INGEST_QUEUE } from '../pipeline/pipeline.constants.js';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: PRICE_INGEST_QUEUE }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, PrismaService],
})
export class AdminModule {}
