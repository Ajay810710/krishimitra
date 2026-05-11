import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PredictionService } from './prediction.service.js';
import { PredictPriceDto } from './dto/predict-price.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentFarmer } from '../auth/decorators/current-farmer.decorator.js';
import type { JwtPayload } from '../auth/decorators/current-farmer.decorator.js';

@Controller('predict')
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  /** POST /api/predict/price */
  @Post('price')
  async predictPrice(@CurrentFarmer() user: JwtPayload, @Body() dto: PredictPriceDto) {
    return this.predictionService.predictPrice(user.sub, dto);
  }

  /** GET /api/predict/recommend */
  @Get('recommend')
  async getRecommendations(@CurrentFarmer() user: JwtPayload) {
    return { data: await this.predictionService.getRecommendations(user.sub) };
  }
}
