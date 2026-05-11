import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './modules/database/prisma.service.js';
import { PipelineModule } from './modules/pipeline/pipeline.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { MarketModule } from './modules/market/market.module.js';
import { FarmerModule } from './modules/farmer/farmer.module.js';
import { AlertModule } from './modules/alert/alert.module.js';
import { PredictionModule } from './modules/prediction/prediction.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    AuthModule,
    PipelineModule,
    MarketModule,
    FarmerModule,
    AlertModule,
    PredictionModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [PrismaService],
})
export class AppModule {}
