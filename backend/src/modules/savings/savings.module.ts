import { Module } from '@nestjs/common';
import { SavingsController } from './savings.controller.js';
import { SavingsService } from './savings.service.js';

@Module({
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
