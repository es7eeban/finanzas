import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service.js';
import { ExchangeRateController } from './exchange-rate.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
