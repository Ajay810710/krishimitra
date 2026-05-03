import { Module } from '@nestjs/common';
import { FarmerController } from './farmer.controller.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  controllers: [FarmerController],
  providers: [PrismaService],
})
export class FarmerModule {}
