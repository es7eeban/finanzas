import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { BillCategory, BillExecutionType } from '@prisma/client';

export class QueryRecurringBillsDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'El periodo debe tener el formato YYYY-MM (ej. 2026-10)' })
  @IsOptional()
  period?: string;

  @IsEnum(BillCategory)
  @IsOptional()
  category?: BillCategory;

  @IsEnum(BillExecutionType)
  @IsOptional()
  executionType?: BillExecutionType;
}
