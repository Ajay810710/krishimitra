import { Module } from '@nestjs/common';
import { FarmerController } from './farmer.controller.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [FarmerController],
  providers: [PrismaService],
})
export class FarmerModule {}
