import { Module } from '@nestjs/common';
import { RecurringBillsService } from './recurring-bills.service.js';
import { RecurringBillsController } from './recurring-bills.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringBillsController],
  providers: [RecurringBillsService],
  exports: [RecurringBillsService],
})
export class RecurringBillsModule {}
