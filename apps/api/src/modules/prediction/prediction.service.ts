/**
 * PredictionService — orchestrates the price prediction workflow.
 * Creates a prediction record, calls the AI engine, and stores results.
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PredictionStatus } from '@prisma/client';
import axios from 'axios';

import { PrismaService } from '../database/prisma.service.js';
import type { PredictPriceDto } from './dto/predict-price.dto.js';
import type { PredictionFeedbackDto } from './dto/feedback.dto.js';

/** Shape of the response from the FastAPI AI engine */
interface AiPredictionResponse {
  prediction_id: string;
  price_low_kg: number;
  price_high_kg: number;
  price_median_kg: number;
  confidence_score: number;
  demand_trend: string;
  weather_risk: string;
  price_crash_prob: number;
  low_demand_prob: number;
  weather_risk_prob: number;
  yield_est_tons_acre: number;
  profit_low_inr: number;
  profit_high_inr: number;
  recommendation: string;
  recommendation_text: string;
  recommendation_text_hi: string;
  model_version: string;
}

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a new prediction:
   * 1. Validates inputs and creates a PENDING record
   * 2. Calls the AI engine via HTTP
   * 3. Updates the record with AI results
   * 4. Returns the completed prediction
   */
  async predictPrice(farmerId: string, dto: PredictPriceDto) {
    const totalInputCostInr =
      dto.inputCosts.seedCostInr +
      dto.inputCosts.fertilizerCostInr +
      dto.inputCosts.labourCostInr +
      dto.inputCosts.irrigationCostInr;

    // Validate planting and harvest dates
    const plantingDate = new Date(dto.plantingDate);
    const harvestDate = new Date(dto.harvestDate);

    if (harvestDate <= plantingDate) {
      throw new BadRequestException('Harvest date must be after planting date');
    }

    // Create a pending prediction record first
    const prediction = await this.prismaService.prediction.create({
      data: {
        farmerId,
        cropId: dto.cropId,
        mandiId: dto.mandiId,
        landParcelId: dto.landParcelId,
        plantingDate,
        harvestDate,
        landSizeAcres: dto.landSizeAcres,
        seedVariety: dto.seedVariety,
        seedBrand: dto.seedBrand,
        seedCostInr: dto.inputCosts.seedCostInr,
        fertilizerCostInr: dto.inputCosts.fertilizerCostInr,
        labourCostInr: dto.inputCosts.labourCostInr,
        irrigationCostInr: dto.inputCosts.irrigationCostInr,
        totalInputCostInr,
        status: PredictionStatus.PROCESSING,
      },
    });

    try {
      const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');

      const aiResponse = await axios.post<AiPredictionResponse>(
        `${aiServiceUrl}/predict/price`,
        {
          prediction_id: prediction.id,
          farmer_id: farmerId,
          crop_id: dto.cropId,
          mandi_id: dto.mandiId,
          planting_date: dto.plantingDate,
          harvest_date: dto.harvestDate,
          land_size_acres: dto.landSizeAcres,
          total_input_cost_inr: totalInputCostInr,
          seed_variety: dto.seedVariety,
        },
        { timeout: 30000 },
      );

      const ai = aiResponse.data;

      // Update prediction with AI results
      const completed = await this.prismaService.prediction.update({
        where: { id: prediction.id },
        data: {
          status: PredictionStatus.COMPLETED,
          priceLowKg: ai.price_low_kg,
          priceHighKg: ai.price_high_kg,
          priceMedianKg: ai.price_median_kg,
          confidenceScore: ai.confidence_score,
          demandTrend: ai.demand_trend as 'HIGH' | 'MODERATE' | 'LOW' | 'DECLINING',
          weatherRisk: ai.weather_risk as 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
          priceCrashProb: ai.price_crash_prob,
          lowDemandProb: ai.low_demand_prob,
          weatherRiskProb: ai.weather_risk_prob,
          yieldEstTonsAcre: ai.yield_est_tons_acre,
          profitLowInr: ai.profit_low_inr,
          profitHighInr: ai.profit_high_inr,
          recommendation: ai.recommendation as 'PLANT' | 'WAIT' | 'CONSIDER_ALTERNATIVES',
          recommendationText: ai.recommendation_text,
          recommendationTextHi: ai.recommendation_text_hi,
          modelVersion: ai.model_version,
        },
        include: {
          crop: { select: { name: true, nameHindi: true } },
          mandi: { select: { name: true, district: true } },
        },
      });

      return completed;
    } catch (error) {
      // Mark prediction as failed but don't delete it
      await this.prismaService.prediction.update({
        where: { id: prediction.id },
        data: { status: PredictionStatus.FAILED },
      });

      this.logger.error(`AI service call failed for prediction ${prediction.id}`, error);
      throw new ServiceUnavailableException(
        'Price forecasting service is temporarily unavailable. Please try again in a few minutes.',
      );
    }
  }

  /**
   * Returns crop recommendations for a farmer based on their location and current market trends.
   */
  async getRecommendations(farmerId: string, mandiId?: string) {
    const farmer = await this.prismaService.farmer.findUnique({
      where: { id: farmerId },
      select: { mandiId: true, district: true, state: true },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    let targetMandiId = mandiId ?? farmer.mandiId;
    if (!targetMandiId) {
      // Fall back to the first available mandi so new users always get recommendations
      const firstMandi = await this.prismaService.mandi.findFirst({ select: { id: true } });
      if (!firstMandi) {
        throw new BadRequestException('No mandis available. Please contact support.');
      }
      targetMandiId = firstMandi.id;
    }

    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');

    try {
      const response = await axios.get(`${aiServiceUrl}/predict/recommend`, {
        params: { mandi_id: targetMandiId, farmer_id: farmerId },
        timeout: 15000,
      });

      return response.data as unknown;
    } catch (error) {
      this.logger.error('Failed to fetch crop recommendations', error);
      throw new ServiceUnavailableException('Recommendation service is temporarily unavailable');
    }
  }

  /** Returns a single prediction by ID — ensures it belongs to the requesting farmer */
  async getPrediction(farmerId: string, predictionId: string) {
    const prediction = await this.prismaService.prediction.findFirst({
      where: { id: predictionId, farmerId },
      include: {
        crop: { select: { name: true, nameHindi: true, nameKannada: true, nameTelugu: true, nameTamil: true } },
        mandi: { select: { name: true, district: true, state: true } },
        landParcel: { select: { name: true, sizeAcres: true } },
      },
    });

    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }

    return prediction;
  }

  /** Records the actual price achieved at harvest for model accuracy tracking */
  async submitFeedback(
    farmerId: string,
    predictionId: string,
    dto: PredictionFeedbackDto,
  ) {
    const prediction = await this.prismaService.prediction.findFirst({
      where: { id: predictionId, farmerId },
    });

    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }

    return this.prismaService.prediction.update({
      where: { id: predictionId },
      data: { actualPriceKg: dto.actualPriceKg },
    });
  }
}
