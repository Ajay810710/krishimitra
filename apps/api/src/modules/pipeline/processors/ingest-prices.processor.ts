/**
 * IngestPricesProcessor — BullMQ worker that fetches and stores mandi price data.
 * Downloads CSV data from data.gov.in (Agmarknet) and upserts into MandiPrice table.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import axios from 'axios';

import { PrismaService } from '../../database/prisma.service.js';
import { PRICE_INGEST_QUEUE } from '../pipeline.constants.js';

interface IngestJobData {
  date: string;
  triggeredBy: 'cron' | 'manual';
}

/** A single row from the Agmarknet CSV/API response */
interface AgmarknetRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

@Processor(PRICE_INGEST_QUEUE)
export class IngestPricesProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestPricesProcessor.name);

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  /** Processes an ingestion job: fetch → parse → upsert */
  async process(job: Job<IngestJobData>): Promise<void> {
    const { date, triggeredBy } = job.data;
    this.logger.log(`Processing price ingestion for ${date} (triggered by: ${triggeredBy})`);

    try {
      const records = await this.fetchAgmarknetData(date);
      await job.updateProgress(30);

      const upsertCount = await this.upsertPriceRecords(records);
      await job.updateProgress(100);

      this.logger.log(`Ingestion complete: upserted ${upsertCount} price records for ${date}`);
    } catch (error) {
      this.logger.error(`Price ingestion failed for ${date}`, error);
      throw error;
    }
  }

  /**
   * Fetches price data from data.gov.in API for a given date.
   * Falls back to sample data in development if API key is not configured.
   */
  private async fetchAgmarknetData(date: string): Promise<AgmarknetRecord[]> {
    const apiKey = process.env['DATA_GOV_API_KEY'];

    if (!apiKey) {
      this.logger.warn('DATA_GOV_API_KEY not set — skipping actual data fetch in dev mode');
      return [];
    }

    const response = await axios.get<{ records: AgmarknetRecord[] }>(
      'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
      {
        params: {
          'api-key': apiKey,
          format: 'json',
          limit: 1000,
          filters: `arrival_date:${date}`,
        },
        timeout: 30000,
      },
    );

    return response.data.records;
  }

  /**
   * Upserts price records into the MandiPrice table.
   * Matches mandis and crops by name, skipping unrecognised ones.
   */
  private async upsertPriceRecords(records: AgmarknetRecord[]): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    let upsertCount = 0;

    for (const record of records) {
      try {
        const [mandi, crop] = await Promise.all([
          this.prismaService.mandi.findFirst({
            where: { name: { contains: record.market, mode: 'insensitive' } },
          }),
          this.prismaService.crop.findFirst({
            where: { name: { equals: record.commodity, mode: 'insensitive' } },
          }),
        ]);

        if (!mandi || !crop) {
          continue; // Skip records for mandis/crops not in our database
        }

        const minPrice = parseFloat(record.min_price) || 0;
        const maxPrice = parseFloat(record.max_price) || 0;
        const modalPrice = parseFloat(record.modal_price) || 0;

        await this.prismaService.mandiPrice.upsert({
          where: {
            mandiId_cropId_priceDate_variety_grade: {
              mandiId: mandi.id,
              cropId: crop.id,
              priceDate: new Date(record.arrival_date),
              variety: record.variety || '',
              grade: '',
            },
          },
          update: { minPrice, maxPrice, modalPrice, minPriceKg: minPrice / 100, maxPriceKg: maxPrice / 100, modalPriceKg: modalPrice / 100 },
          create: {
            mandiId: mandi.id,
            cropId: crop.id,
            priceDate: new Date(record.arrival_date),
            variety: record.variety || '',
            grade: '',
            minPrice,
            maxPrice,
            modalPrice,
            minPriceKg: minPrice / 100,
            maxPriceKg: maxPrice / 100,
            modalPriceKg: modalPrice / 100,
            source: 'AGMARKNET',
          },
        });

        upsertCount++;
      } catch (error) {
        this.logger.warn(`Failed to upsert record for ${record.commodity} at ${record.market}`, error);
      }
    }

    return upsertCount;
  }
}
