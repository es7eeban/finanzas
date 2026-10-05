import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module.js';

@Module({
  imports: [PrismaModule, ExchangeRateModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
