import { Controller, Get, UseGuards } from '@nestjs/common';
import { SchemesService } from './schemes.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentFarmer } from '../auth/decorators/current-farmer.decorator.js';
import type { JwtPayload } from '../auth/decorators/current-farmer.decorator.js';

@Controller('schemes')
export class SchemesController {
  constructor(private readonly schemesService: SchemesService) {}

  /** GET /api/schemes — all active schemes (public) */
  @Get()
  getAll() {
    return this.schemesService.getAll();
  }

  /** GET /api/schemes/eligible — personalized schemes (auth required) */
  @Get('eligible')
  @UseGuards(JwtAuthGuard)
  getEligible(@CurrentFarmer() user: JwtPayload) {
    return this.schemesService.getEligible(user.sub);
  }
}
