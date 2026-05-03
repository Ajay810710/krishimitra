import { Controller, Get, Query, Headers } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { extractFarmerIdFromHeader } from '../../common/jwt-extract.js';

@Controller('farmer')
export class FarmerController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/farmer/history */
  @Get('history')
  async getHistory(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
  ) {
    const farmerId = extractFarmerIdFromHeader(auth);
    if (!farmerId) {
      return { predictions: [] };
    }

    const take = limit ? Math.min(parseInt(limit, 10), 100) : 20;

    const predictions = await this.prisma.prediction.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        status: true,
        plantingDate: true,
        harvestDate: true,
        landSizeAcres: true,
        priceLowKg: true,
        priceHighKg: true,
        priceMedianKg: true,
        confidenceScore: true,
        demandTrend: true,
        weatherRisk: true,
        profitLowInr: true,
        profitHighInr: true,
        recommendation: true,
        recommendationText: true,
        recommendationTextHi: true,
        createdAt: true,
        crop: { select: { name: true, nameHindi: true } },
        mandi: { select: { name: true, district: true } },
      },
    });

    return { predictions };
  }
}
