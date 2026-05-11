import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PredictionStatus } from '@prisma/client';

import { PrismaService } from '../database/prisma.service.js';
import type { PredictPriceDto } from './dto/predict-price.dto.js';
import type { PredictionFeedbackDto } from './dto/feedback.dto.js';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Generates a price forecast using the last 30 days of real mandi price data.
   * Applies a seasonal trend factor based on harvest date and adds yield/profit estimates.
   */
  async predictPrice(farmerId: string, dto: PredictPriceDto) {
    const totalInputCostInr =
      dto.inputCosts.seedCostInr +
      dto.inputCosts.fertilizerCostInr +
      dto.inputCosts.labourCostInr +
      dto.inputCosts.irrigationCostInr;

    const plantingDate = new Date(dto.plantingDate);
    const harvestDate  = new Date(dto.harvestDate);

    if (harvestDate <= plantingDate) {
      throw new BadRequestException('Harvest date must be after planting date');
    }

    // Fetch crop details for per-crop yield estimate
    const crop = await this.prismaService.crop.findUnique({
      where: { id: dto.cropId },
      select: { yieldPerAcreMin: true, yieldPerAcreMax: true, category: true },
    });

    // Fetch last 30 days of mandi price data for this crop+mandi
    const recentPrices = await this.prismaService.mandiPrice.findMany({
      where: { cropId: dto.cropId, mandiId: dto.mandiId },
      orderBy: { priceDate: 'desc' },
      take: 30,
      select: { modalPriceKg: true, minPriceKg: true, maxPriceKg: true },
    });

    // Fallback to any mandi if this specific one has no data
    const prices = recentPrices.length > 0
      ? recentPrices
      : await this.prismaService.mandiPrice.findMany({
          where: { cropId: dto.cropId },
          orderBy: { priceDate: 'desc' },
          take: 30,
          select: { modalPriceKg: true, minPriceKg: true, maxPriceKg: true },
        });

    // If still no data, use a default base price
    const baseModal = prices.length > 0
      ? prices.reduce((s, p) => s + Number(p.modalPriceKg), 0) / prices.length
      : 20.0;
    const baseMin = prices.length > 0
      ? prices.reduce((s, p) => s + Number(p.minPriceKg), 0) / prices.length
      : baseModal * 0.85;
    const baseMax = prices.length > 0
      ? prices.reduce((s, p) => s + Number(p.maxPriceKg), 0) / prices.length
      : baseModal * 1.15;

    // Seasonal trend: harvest month affects price (post-harvest prices dip, pre-harvest rise)
    const harvestMonth = harvestDate.getMonth(); // 0-11
    const seasonalFactor = 1 + 0.1 * Math.sin((harvestMonth / 12) * Math.PI * 2);

    // Days to harvest influences confidence
    const daysToHarvest = Math.ceil((harvestDate.getTime() - Date.now()) / 86400000);
    const confidence = Math.max(0.55, Math.min(0.92, 0.92 - daysToHarvest * 0.001));

    const priceMedian = parseFloat((baseModal * seasonalFactor).toFixed(2));
    const priceLow    = parseFloat((baseMin  * seasonalFactor * 0.92).toFixed(2));
    const priceHigh   = parseFloat((baseMax  * seasonalFactor * 1.08).toFixed(2));

    // Per-crop yield estimate (tons/acre) — use DB value if set, else category default
    const CATEGORY_YIELD: Record<string, number> = {
      VEGETABLE: 6.0, GRAIN: 2.0, FRUIT: 8.0, SPICE: 1.5, PULSE: 1.2, OILSEED: 1.0,
    };
    const yieldTonsAcre = crop?.yieldPerAcreMin && crop?.yieldPerAcreMax
      ? (crop.yieldPerAcreMin + crop.yieldPerAcreMax) / 2
      : CATEGORY_YIELD[crop?.category ?? 'GRAIN'] ?? 2.5;

    // Market commission (2.5%) and transport deduction (~5%) reduce net revenue
    const NET_REVENUE_FACTOR = 0.925;
    const totalKg = yieldTonsAcre * dto.landSizeAcres * 1000;
    const profitLow  = parseFloat((totalKg * priceLow  * NET_REVENUE_FACTOR - totalInputCostInr).toFixed(0));
    const profitHigh = parseFloat((totalKg * priceHigh * NET_REVENUE_FACTOR - totalInputCostInr).toFixed(0));

    // Recommendation logic
    const margin = (totalKg * priceMedian - totalInputCostInr) / (totalInputCostInr || 1);
    const recommendation =
      margin > 0.3  ? 'PLANT' :
      margin > 0    ? 'WAIT'  :
      'CONSIDER_ALTERNATIVES';

    const recTextHi =
      recommendation === 'PLANT'
        ? `मौजूदा बाजार रुझान के अनुसार यह फसल अच्छा मुनाफा दे सकती है।`
        : recommendation === 'WAIT'
        ? `कीमतें स्थिर हैं, थोड़ा इंतजार करें और बाजार पर नजर रखें।`
        : `इस फसल पर जोखिम है, कोई विकल्प फसल सोचें।`;

    const prediction = await this.prismaService.prediction.create({
      data: {
        farmerId,
        cropId:         dto.cropId,
        mandiId:        dto.mandiId,
        landParcelId:   dto.landParcelId,
        plantingDate,
        harvestDate,
        landSizeAcres:  dto.landSizeAcres,
        seedVariety:    dto.seedVariety,
        seedBrand:      dto.seedBrand,
        seedCostInr:        dto.inputCosts.seedCostInr,
        fertilizerCostInr:  dto.inputCosts.fertilizerCostInr,
        labourCostInr:      dto.inputCosts.labourCostInr,
        irrigationCostInr:  dto.inputCosts.irrigationCostInr,
        totalInputCostInr,
        status:             PredictionStatus.COMPLETED,
        priceLowKg:         priceLow,
        priceHighKg:        priceHigh,
        priceMedianKg:      priceMedian,
        confidenceScore:    confidence,
        demandTrend:        margin > 0.2 ? 'HIGH' : margin > 0 ? 'MODERATE' : 'LOW',
        weatherRisk:        'LOW',
        priceCrashProb:     Math.max(0, 0.3 - margin * 0.5),
        lowDemandProb:      Math.max(0, 0.2 - margin * 0.3),
        weatherRiskProb:    0.1,
        yieldEstTonsAcre:   yieldTonsAcre,
        profitLowInr:       profitLow,
        profitHighInr:      profitHigh,
        recommendation:     recommendation as 'PLANT' | 'WAIT' | 'CONSIDER_ALTERNATIVES',
        recommendationText:  recTextHi,
        recommendationTextHi: recTextHi,
        modelVersion:       'synthetic-v1',
      },
      include: {
        crop:  { select: { name: true, nameHindi: true } },
        mandi: { select: { name: true, district: true } },
      },
    });

    // Create a persistent alert for this prediction
    const cropName = prediction.crop.nameHindi ?? prediction.crop.name;
    const alertTitle =
      recommendation === 'PLANT'
        ? `${cropName} — बोने का सही समय`
        : recommendation === 'WAIT'
        ? `${cropName} — प्रतीक्षा करें`
        : `${cropName} — विकल्प सोचें`;

    await this.prismaService.alert.create({
      data: {
        farmerId,
        predictionId: prediction.id,
        type: 'RECOMMENDATION',
        title: alertTitle,
        message: recTextHi,
      },
    });

    return prediction;
  }

  /**
   * Returns AI-style crop recommendations derived from recent mandi price trends.
   */
  async getRecommendations(farmerId: string, mandiId?: string) {
    const farmer = await this.prismaService.farmer.findUnique({
      where: { id: farmerId },
      select: { mandiId: true },
    });

    if (!farmer) throw new NotFoundException('Farmer not found');

    const targetMandiId = mandiId ?? farmer.mandiId ?? (
      await this.prismaService.mandi.findFirst({ select: { id: true } })
    )?.id;

    if (!targetMandiId) throw new BadRequestException('No mandis available');

    // Get all crops with last 30d price data for this mandi
    const crops = await this.prismaService.crop.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameHindi: true, category: true, yieldPerAcreMin: true, yieldPerAcreMax: true },
    });

    const recommendations = await Promise.all(
      crops.slice(0, 10).map(async (crop) => {
        const prices = await this.prismaService.mandiPrice.findMany({
          where: { cropId: crop.id, mandiId: targetMandiId },
          orderBy: { priceDate: 'desc' },
          take: 30,
          select: { modalPriceKg: true },
        });

        if (prices.length < 7) return null;

        const recent = prices.slice(0, 7).map((p) => Number(p.modalPriceKg));
        const older  = prices.slice(7, 14).map((p) => Number(p.modalPriceKg));
        const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
        const avgOlder  = older.length  ? older.reduce((a, b) => a + b, 0) / older.length : avgRecent;
        const trend = (avgRecent - avgOlder) / (avgOlder || 1);
        const score = Math.min(1, Math.max(0, 0.5 + trend * 5));

        const rec = score > 0.65 ? 'PLANT' : score > 0.4 ? 'WAIT' : 'CONSIDER_ALTERNATIVES';
        const expectedPrice = parseFloat(avgRecent.toFixed(2));
        const CATEGORY_YIELD: Record<string, number> = {
          VEGETABLE: 6.0, GRAIN: 2.0, FRUIT: 8.0, SPICE: 1.5, PULSE: 1.2, OILSEED: 1.0,
        };
        const yieldTons = crop.yieldPerAcreMin && crop.yieldPerAcreMax
          ? (crop.yieldPerAcreMin + crop.yieldPerAcreMax) / 2
          : CATEGORY_YIELD[crop.category] ?? 2.5;
        const yieldKg = yieldTons * 1000;
        const avgInputCost = yieldKg * expectedPrice * 0.4; // ~40% input cost ratio
        const expectedProfit = Math.round(yieldKg * expectedPrice * 0.925 - avgInputCost);

        return {
          crop_id:               crop.id,
          crop_name:             crop.name,
          crop_name_hindi:       crop.nameHindi ?? crop.name,
          score:                 parseFloat(score.toFixed(2)),
          expected_price_kg:     expectedPrice,
          expected_profit_inr:   expectedProfit,
          recommendation:        rec,
          reason: rec === 'PLANT'
            ? `पिछले 7 दिनों में ${((trend * 100) | 0)}% की बढ़त — बोने का अच्छा समय।`
            : rec === 'WAIT'
            ? `बाजार स्थिर है — अगले 2 सप्ताह में बेहतर संकेत मिल सकते हैं।`
            : `कीमतों में गिरावट — इस फसल पर अभी जोखिम ज्यादा है।`,
        };
      })
    );

    const filtered = recommendations
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score);

    return { recommendations: filtered };
  }

  async getPrediction(farmerId: string, predictionId: string) {
    const prediction = await this.prismaService.prediction.findFirst({
      where: { id: predictionId, farmerId },
      include: {
        crop:       { select: { name: true, nameHindi: true, nameKannada: true, nameTelugu: true, nameTamil: true } },
        mandi:      { select: { name: true, district: true, state: true } },
        landParcel: { select: { name: true, sizeAcres: true } },
      },
    });

    if (!prediction) throw new NotFoundException('Prediction not found');
    return prediction;
  }

  async submitFeedback(farmerId: string, predictionId: string, dto: PredictionFeedbackDto) {
    const prediction = await this.prismaService.prediction.findFirst({
      where: { id: predictionId, farmerId },
    });

    if (!prediction) throw new NotFoundException('Prediction not found');

    return this.prismaService.prediction.update({
      where: { id: predictionId },
      data: { actualPriceKg: dto.actualPriceKg },
    });
  }
}
