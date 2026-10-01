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
import { SavingsService } from './savings.service.js';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto.js';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto.js';
import { ContributeSavingGoalDto } from './dto/contribute-saving-goal.dto.js';
import { WithdrawSavingGoalDto } from './dto/withdraw-saving-goal.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { GoalStatus } from '@prisma/client';

@Controller('savings')
@UseGuards(JwtAuthGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSavingGoalDto,
  ) {
    return this.savingsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: GoalStatus,
  ) {
    return this.savingsService.findAll(userId, status);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.savingsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavingGoalDto,
  ) {
    return this.savingsService.update(userId, id, dto);
  }

  @Post(':id/contribute')
  async contribute(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ContributeSavingGoalDto,
  ) {
    return this.savingsService.contribute(userId, id, dto);
  }

  @Post(':id/withdraw')
  async withdraw(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: WithdrawSavingGoalDto,
  ) {
    return this.savingsService.withdraw(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.savingsService.remove(userId, id);
  }
}
