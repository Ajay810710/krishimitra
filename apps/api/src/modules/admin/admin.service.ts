import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';
import { PRICE_INGEST_QUEUE } from '../pipeline/pipeline.constants.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(PRICE_INGEST_QUEUE) private readonly priceQueue: Queue,
  ) {}

  async getStats() {
    const [
      totalFarmers,
      activeFarmers,
      totalPredictions,
      totalCrops,
      activeCrops,
      totalMandis,
      totalPriceRecords,
      totalAlerts,
      unreadAlerts,
      recentPredictions,
    ] = await Promise.all([
      this.prisma.farmer.count(),
      this.prisma.farmer.count({ where: { isActive: true } }),
      this.prisma.prediction.count(),
      this.prisma.crop.count(),
      this.prisma.crop.count({ where: { isActive: true } }),
      this.prisma.mandi.count(),
      this.prisma.mandiPrice.count(),
      this.prisma.alert.count(),
      this.prisma.alert.count({ where: { isRead: false } }),
      this.prisma.prediction.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
    ]);

    // Predictions by recommendation
    const recBreakdown = await this.prisma.prediction.groupBy({
      by: ['recommendation'],
      _count: true,
    });

    // New farmers in last 7 days
    const newFarmers = await this.prisma.farmer.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });

    // Last price ingest date
    const lastPrice = await this.prisma.mandiPrice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      data: {
        farmers:      { total: totalFarmers, active: activeFarmers, newLast7d: newFarmers },
        predictions:  { total: totalPredictions, last7d: recentPredictions, breakdown: recBreakdown },
        crops:        { total: totalCrops, active: activeCrops },
        mandis:       { total: totalMandis },
        priceRecords: { total: totalPriceRecords, lastIngestAt: lastPrice?.createdAt ?? null },
        alerts:       { total: totalAlerts, unread: unreadAlerts },
      },
    };
  }

  async getFarmers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] }
      : {};

    const [farmers, total] = await Promise.all([
      this.prisma.farmer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, phone: true, preferredLanguage: true,
          isVerified: true, isActive: true, createdAt: true,
          mandi: { select: { name: true } },
          _count: { select: { predictions: true } },
        },
      }),
      this.prisma.farmer.count({ where }),
    ]);

    return { data: { farmers, total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async updateFarmer(id: string, dto: { name?: string; isActive?: boolean }) {
    const updated = await this.prisma.farmer.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, isActive: true },
    });
    return { data: updated };
  }

  async getPredictions(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [predictions, total] = await Promise.all([
      this.prisma.prediction.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, recommendation: true,
          priceMedianKg: true, confidenceScore: true,
          profitLowInr: true, profitHighInr: true,
          landSizeAcres: true, createdAt: true,
          farmer: { select: { name: true, phone: true } },
          crop:   { select: { name: true, nameHindi: true } },
          mandi:  { select: { name: true } },
        },
      }),
      this.prisma.prediction.count(),
    ]);
    return { data: { predictions, total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getCrops() {
    const crops = await this.prisma.crop.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true, name: true, nameHindi: true, category: true,
        isActive: true, typicalDaysToHarvest: true,
        yieldPerAcreMin: true, yieldPerAcreMax: true,
        _count: { select: { predictions: true, mandiPrices: true } },
      },
    });
    return { data: crops };
  }

  async updateCrop(id: string, dto: {
    name?: string; nameHindi?: string; isActive?: boolean;
    yieldPerAcreMin?: number; yieldPerAcreMax?: number;
  }) {
    const updated = await this.prisma.crop.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, nameHindi: true, isActive: true, yieldPerAcreMin: true, yieldPerAcreMax: true },
    });
    return { data: updated };
  }

  async getMandis() {
    const mandis = await this.prisma.mandi.findMany({
      orderBy: [{ isActive: 'desc' }, { state: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, district: true, state: true,
        pincode: true, isActive: true,
        _count: { select: { predictions: true, mandiPrices: true } },
      },
    });
    return { data: mandis };
  }

  async updateMandi(id: string, dto: { name?: string; district?: string; state?: string; isActive?: boolean }) {
    const updated = await this.prisma.mandi.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, district: true, state: true, isActive: true },
    });
    return { data: updated };
  }

  async triggerSync(date: string) {
    await this.priceQueue.add(
      'ingest-manual-prices',
      { date, triggeredBy: 'admin' },
      { attempts: 2, removeOnComplete: 20, removeOnFail: 10 },
    );
    return { data: { message: `Price sync job queued for ${date}`, date } };
  }

  async getSyncStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.priceQueue.getWaitingCount(),
      this.priceQueue.getActiveCount(),
      this.priceQueue.getCompletedCount(),
      this.priceQueue.getFailedCount(),
    ]);

    const recentJobs = await this.priceQueue.getJobs(['completed', 'failed', 'active'], 0, 5);
    const jobs = recentJobs.map((j) => ({
      id: j.id, name: j.name,
      state: j.finishedOn ? (j.returnvalue ? 'completed' : 'failed') : 'active',
      date: j.data?.date,
      triggeredBy: j.data?.triggeredBy,
      processedAt: j.processedOn ? new Date(j.processedOn).toISOString() : null,
      finishedAt:  j.finishedOn  ? new Date(j.finishedOn).toISOString()  : null,
    }));

    return { data: { waiting, active, completed, failed, recentJobs: jobs } };
  }
}
