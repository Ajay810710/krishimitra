import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentFarmer } from '../auth/decorators/current-farmer.decorator.js';
import type { JwtPayload } from '../auth/decorators/current-farmer.decorator.js';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/alerts */
  @Get()
  async getAlerts(
    @CurrentFarmer() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 50) : 20;

    const alerts = await this.prisma.alert.findMany({
      where: { farmerId: user.sub },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true, type: true, title: true, message: true,
        isRead: true, createdAt: true,
      },
    });

    const unreadCount = await this.prisma.alert.count({
      where: { farmerId: user.sub, isRead: false },
    });

    return { data: { alerts, unreadCount } };
  }

  /** PATCH /api/alerts/:id/read */
  @Patch(':id/read')
  async markRead(
    @CurrentFarmer() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.prisma.alert.updateMany({
      where: { id, farmerId: user.sub },
      data: { isRead: true },
    });
    return { success: true };
  }

  /** PATCH /api/alerts/read-all */
  @Patch('read-all')
  async markAllRead(@CurrentFarmer() user: JwtPayload) {
    await this.prisma.alert.updateMany({
      where: { farmerId: user.sub, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
