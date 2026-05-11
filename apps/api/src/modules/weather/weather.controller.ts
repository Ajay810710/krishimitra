import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service.js';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /** GET /api/weather/forecast?lat=&lng= */
  @Get('forecast')
  getForecast(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latitude  = lat  ? parseFloat(lat)  : 20.5937; // India center default
    const longitude = lng ? parseFloat(lng) : 78.9629;
    return this.weatherService.getForecast(latitude, longitude);
  }

  /** GET /api/weather/risk?lat=&lng=&cropId= */
  @Get('risk')
  getRisk(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latitude  = lat  ? parseFloat(lat)  : 20.5937;
    const longitude = lng ? parseFloat(lng) : 78.9629;
    return this.weatherService.getRisk(latitude, longitude);
  }
}
