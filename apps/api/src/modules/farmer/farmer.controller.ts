import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { PrismaService } from '../database/prisma.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentFarmer } from '../auth/decorators/current-farmer.decorator.js';
import type { JwtPayload } from '../auth/decorators/current-farmer.decorator.js';

class UpdateProfileDto {
  @IsOptional() @IsString() @Length(1, 100) name?: string;
  @IsOptional() @IsString() @Matches(/^(HINDI|KANNADA|TELUGU|TAMIL|ENGLISH)$/) preferredLanguage?: string;
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() state?: string;
}

@Controller('farmer')
@UseGuards(JwtAuthGuard)
export class FarmerController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/farmer/history */
  @Get('history')
  async getHistory(
    @CurrentFarmer() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 100) : 20;

    const predictions = await this.prisma.prediction.findMany({
      where: { farmerId: user.sub },
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

  /** GET /api/farmer/profile */
  @Get('profile')
  async getProfile(@CurrentFarmer() user: JwtPayload) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: user.sub },
      select: {
        id: true, phone: true, name: true, preferredLanguage: true,
        isVerified: true, village: true, district: true, state: true,
        mandiId: true, createdAt: true,
        mandi: { select: { name: true, district: true } },
        _count: { select: { predictions: true } },
      },
    });
    return { data: farmer };
  }

  /** PUT /api/farmer/profile */
  @Put('profile')
  async updateProfile(
    @CurrentFarmer() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.prisma.farmer.update({
      where: { id: user.sub },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.preferredLanguage && { preferredLanguage: dto.preferredLanguage as any }),
        ...(dto.village !== undefined && { village: dto.village }),
        ...(dto.district !== undefined && { district: dto.district }),
        ...(dto.state !== undefined && { state: dto.state }),
      },
      select: {
        id: true, phone: true, name: true, preferredLanguage: true,
        village: true, district: true, state: true,
      },
    });
    return { data: updated };
  }
}
