/**
 * Pipeline module — BullMQ job queues and cron-triggered data ingestion.
 */

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../database/prisma.service.js';
import { PipelineScheduler } from './pipeline.scheduler.js';
import { IngestPricesProcessor } from './processors/ingest-prices.processor.js';
import { PRICE_INGEST_QUEUE } from './pipeline.constants.js';

export { PRICE_INGEST_QUEUE };

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: new URL(configService.get<string>('REDIS_URL', 'redis://localhost:6379')).hostname,
          port: parseInt(
            new URL(configService.get<string>('REDIS_URL', 'redis://localhost:6379')).port || '6379',
            10,
          ),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: PRICE_INGEST_QUEUE }),
  ],
  providers: [PrismaService, PipelineScheduler, IngestPricesProcessor],
})
export class PipelineModule {}
