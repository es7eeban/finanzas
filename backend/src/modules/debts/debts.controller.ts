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
import { DebtsService } from './debts.service.js';
import { CreateDebtDto } from './dto/create-debt.dto.js';
import { UpdateDebtDto } from './dto/update-debt.dto.js';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { DebtType, DebtStatus } from '@prisma/client';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDebtDto,
  ) {
    return this.debtsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('type') type?: DebtType,
    @Query('status') status?: DebtStatus,
  ) {
    return this.debtsService.findAll(userId, type, status);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.debtsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDebtDto,
  ) {
    return this.debtsService.update(userId, id, dto);
  }

  @Post(':id/payments')
  async addPayment(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateDebtPaymentDto,
  ) {
    return this.debtsService.addPayment(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.debtsService.remove(userId, id);
  }
}
