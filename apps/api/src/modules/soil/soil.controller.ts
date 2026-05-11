import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SoilService } from './soil.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentFarmer } from '../auth/decorators/current-farmer.decorator.js';
import type { JwtPayload } from '../auth/decorators/current-farmer.decorator.js';

class AddSoilTestDto {
  @IsDateString() testDate!: string;
  @IsOptional() @IsString() landParcelId?: string;
  @IsOptional() @IsString() labName?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) nitrogen?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) phosphorus?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) potassium?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(14) @Type(() => Number) ph?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) organicMatter?: number;
  @IsOptional() @IsString() notes?: string;
}

@Controller('soil')
@UseGuards(JwtAuthGuard)
export class SoilController {
  constructor(private readonly soilService: SoilService) {}

  /** GET /api/soil/history */
  @Get('history')
  getHistory(@CurrentFarmer() user: JwtPayload) {
    return this.soilService.getHistory(user.sub);
  }

  /** GET /api/soil/health */
  @Get('health')
  getHealth(@CurrentFarmer() user: JwtPayload) {
    return this.soilService.getHealthReport(user.sub);
  }

  /** POST /api/soil/test */
  @Post('test')
  addTest(@CurrentFarmer() user: JwtPayload, @Body() dto: AddSoilTestDto) {
    return this.soilService.addTest(user.sub, dto);
  }
}
