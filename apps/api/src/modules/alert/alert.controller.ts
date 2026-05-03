import { Controller, Get, Query, Headers } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { extractFarmerIdFromHeader } from '../../common/jwt-extract.js';

@Controller('alerts')
export class AlertController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/alerts
   * Returns price-related alerts generated from recent market data.
   * Since there is no dedicated Alert table, we derive alerts from the
   * farmer's recent predictions and the latest mandi prices.
   */
  @Get()
  async getAlerts(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
  ) {
    const farmerId = extractFarmerIdFromHeader(auth);
    const take = limit ? Math.min(parseInt(limit, 10), 50) : 10;

    if (!farmerId) {
      return { data: { alerts: [], unreadCount: 0 } };
    }

    // Build alerts from the farmer's completed predictions
    const predictions = await this.prisma.prediction.findMany({
      where: { farmerId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        createdAt: true,
        recommendation: true,
        recommendationTextHi: true,
        recommendationText: true,
        priceMedianKg: true,
        demandTrend: true,
        crop: { select: { name: true, nameHindi: true } },
        mandi: { select: { name: true } },
      },
    });

    const alerts = predictions.map((p, idx) => {
      const cropName = p.crop.nameHindi ?? p.crop.name;
      const title =
        p.recommendation === 'PLANT'
          ? `${cropName} — बोने का सही समय`
          : p.recommendation === 'WAIT'
          ? `${cropName} — प्रतीक्षा करें`
          : `${cropName} — विकल्प सोचें`;

      const message =
        p.recommendationTextHi ??
        p.recommendationText ??
        `${p.mandi.name} में ${cropName} का अनुमानित भाव ₹${p.priceMedianKg ? Number(p.priceMedianKg).toFixed(1) : '—'}/kg`;

      return {
        id: p.id,
        title,
        message,
        isRead: idx > 1,  // first 2 are "unread" for demo
        createdAt: p.createdAt.toISOString(),
      };
    });

    const unreadCount = alerts.filter((a) => !a.isRead).length;

    return { data: { alerts, unreadCount } };
  }
}
