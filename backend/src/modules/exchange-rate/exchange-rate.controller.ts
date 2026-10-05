import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService, type ExchangeRateResult } from './exchange-rate.service.js';
import { QueryExchangeRateDto } from './dto/query-exchange-rate.dto.js';

@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get('current')
  async getCurrentRate(@Query() query: QueryExchangeRateDto): Promise<ExchangeRateResult> {
    return this.exchangeRateService.getCurrentRate(query.from || 'USD', query.to || 'CLP');
  }
}
