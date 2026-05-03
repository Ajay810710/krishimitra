import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { PredictionService } from './prediction.service.js';
import { PredictPriceDto } from './dto/predict-price.dto.js';
import { extractFarmerIdFromHeader } from '../../common/jwt-extract.js';

@Controller('predict')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  /** POST /api/predict/price */
  @Post('price')
  async predictPrice(
    @Headers('authorization') auth: string,
    @Body() dto: PredictPriceDto,
  ) {
    const farmerId = extractFarmerIdFromHeader(auth);
    if (!farmerId) throw new UnauthorizedException('Authentication required');
    return this.predictionService.predictPrice(farmerId, dto);
  }

  /** GET /api/predict/recommend */
  @Get('recommend')
  async getRecommendations(@Headers('authorization') auth: string) {
    const farmerId = extractFarmerIdFromHeader(auth);
    if (!farmerId) throw new UnauthorizedException('Authentication required');
    return { data: await this.predictionService.getRecommendations(farmerId) };
  }
}
