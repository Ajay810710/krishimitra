import { Module } from '@nestjs/common';
import { SoilController } from './soil.controller.js';
import { SoilService } from './soil.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [SoilController],
  providers: [SoilService, PrismaService],
})
export class SoilModule {}
