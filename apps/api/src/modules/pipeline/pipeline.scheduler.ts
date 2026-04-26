/**
 * Pipeline scheduler — triggers daily data ingestion jobs via cron.
 * Runs at 7:00 AM IST (01:30 UTC) to fetch fresh mandi prices.
 */

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

import { PRICE_INGEST_QUEUE } from './pipeline.constants.js';

@Injectable()
export class PipelineScheduler {
  private readonly logger = new Logger(PipelineScheduler.name);

  constructor(
    @InjectQueue(PRICE_INGEST_QUEUE) private readonly priceIngestQueue: Queue,
  ) {}

  /**
   * Triggers the Agmarknet price ingestion job every day at 7:00 AM IST.
   * Cron: '30 1 * * *' = 01:30 UTC = 07:00 IST
   */
  @Cron('30 1 * * *')
  async scheduleDailyPriceIngestion(): Promise<void> {
    this.logger.log('Scheduling daily Agmarknet price ingestion job');

    await this.priceIngestQueue.add(
      'ingest-daily-prices',
      {
        date: new Date().toISOString().split('T')[0],
        triggeredBy: 'cron',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }

  /**
   * Manually trigger ingestion (useful for backfilling or testing).
   */
  async triggerManualIngestion(date: string): Promise<void> {
    this.logger.log(`Manual price ingestion triggered for date: ${date}`);

    await this.priceIngestQueue.add(
      'ingest-manual-prices',
      { date, triggeredBy: 'manual' },
      { attempts: 2 },
    );
  }
}
