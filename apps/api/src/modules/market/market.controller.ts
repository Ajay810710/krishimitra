import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Controller('market')
export class MarketController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/market/crops */
  @Get('crops')
  async getCrops() {
    const crops = await this.prisma.crop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameHindi: true,
        nameKannada: true,
        nameTelugu: true,
        nameTamil: true,
        category: true,
        typicalDaysToHarvest: true,
      },
      orderBy: { name: 'asc' },
    });
    return { data: crops };
  }

  /** GET /api/market/mandis */
  @Get('mandis')
  async getMandis() {
    const mandis = await this.prisma.mandi.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        district: true,
        state: true,
        pincode: true,
        latitude: true,
        longitude: true,
      },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });
    return { data: mandis };
  }

  /** GET /api/market/prices/:cropId/:mandiId */
  @Get('prices/:cropId/:mandiId')
  async getPrices(
    @Param('cropId') cropId: string,
    @Param('mandiId') mandiId: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const take = limit ? Math.min(parseInt(limit, 10), 90) : 30;

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate)   dateFilter.lte = new Date(endDate);

    const prices = await this.prisma.mandiPrice.findMany({
      where: {
        cropId, mandiId,
        ...(Object.keys(dateFilter).length > 0 && { priceDate: dateFilter }),
      },
      orderBy: { priceDate: 'desc' },
      take,
      select: {
        id: true,
        priceDate: true,
        variety: true,
        grade: true,
        minPrice: true,
        maxPrice: true,
        modalPrice: true,
        minPriceKg: true,
        maxPriceKg: true,
        modalPriceKg: true,
        source: true,
        crop: { select: { name: true, nameHindi: true } },
        mandi: { select: { name: true, district: true } },
      },
    });
    return { data: prices };
  }
}
