import { Module } from '@nestjs/common';
import { SchemesController } from './schemes.controller.js';
import { SchemesService } from './schemes.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [SchemesController],
  providers: [SchemesService, PrismaService],
})
export class SchemesModule {}
