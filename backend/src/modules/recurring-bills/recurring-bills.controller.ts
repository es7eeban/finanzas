import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecurringBillsService } from './recurring-bills.service.js';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto.js';
import { UpdateRecurringBillDto } from './dto/update-recurring-bill.dto.js';
import { MarkRecurringPaidDto } from './dto/mark-recurring-paid.dto.js';
import { QueryRecurringBillsDto } from './dto/query-recurring-bills.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('recurring-bills')
@UseGuards(JwtAuthGuard)
export class RecurringBillsController {
  constructor(private readonly recurringBillsService: RecurringBillsService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateRecurringBillDto,
  ) {
    return this.recurringBillsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryRecurringBillsDto,
  ) {
    return this.recurringBillsService.findAll(userId, query);
  }

  @Get('summary')
  async getSummary(
    @CurrentUser('userId') userId: string,
    @Query('period') period?: string,
  ) {
    return this.recurringBillsService.getSummary(userId, period);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.recurringBillsService.findOne(userId, id);
  }

  @Post(':id/mark-paid')
  async markPaid(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: MarkRecurringPaidDto,
  ) {
    return this.recurringBillsService.markPaid(userId, id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringBillDto,
  ) {
    return this.recurringBillsService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.recurringBillsService.remove(userId, id);
  }
}
