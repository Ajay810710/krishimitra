import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';

class UpdateCropDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameHindi?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) yieldPerAcreMin?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) yieldPerAcreMax?: number;
}

class UpdateMandiDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateFarmerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class SyncDto {
  @IsOptional() @IsString() date?: string;
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /api/admin/stats */
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  /** GET /api/admin/farmers */
  @Get('farmers')
  getFarmers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getFarmers(parseInt(page), parseInt(limit), search);
  }

  /** PUT /api/admin/farmers/:id */
  @Put('farmers/:id')
  updateFarmer(@Param('id') id: string, @Body() dto: UpdateFarmerDto) {
    return this.adminService.updateFarmer(id, dto);
  }

  /** GET /api/admin/predictions */
  @Get('predictions')
  getPredictions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getPredictions(parseInt(page), parseInt(limit));
  }

  /** GET /api/admin/crops */
  @Get('crops')
  getCrops() {
    return this.adminService.getCrops();
  }

  /** PUT /api/admin/crops/:id */
  @Put('crops/:id')
  updateCrop(@Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.adminService.updateCrop(id, dto);
  }

  /** GET /api/admin/mandis */
  @Get('mandis')
  getMandis() {
    return this.adminService.getMandis();
  }

  /** PUT /api/admin/mandis/:id */
  @Put('mandis/:id')
  updateMandi(@Param('id') id: string, @Body() dto: UpdateMandiDto) {
    return this.adminService.updateMandi(id, dto);
  }

  /** POST /api/admin/sync — trigger manual price ingestion */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  triggerSync(@Body() dto: SyncDto) {
    const date = dto.date ?? new Date().toISOString().split('T')[0];
    return this.adminService.triggerSync(date);
  }

  /** GET /api/admin/sync/status — recent pipeline job status */
  @Get('sync/status')
  getSyncStatus() {
    return this.adminService.getSyncStatus();
  }
}
