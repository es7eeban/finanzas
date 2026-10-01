import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class QueryTransactionsDto {
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  @IsOptional()
  limit?: number = 20;

  @IsDateString({}, { message: 'startDate debe ser una fecha ISO válida' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'endDate debe ser una fecha ISO válida' })
  @IsOptional()
  endDate?: string;

  @IsUUID('4', { message: 'accountId debe ser un UUID válido' })
  @IsOptional()
  accountId?: string;

  @IsUUID('4', { message: 'categoryId debe ser un UUID válido' })
  @IsOptional()
  categoryId?: string;

  @IsEnum(TransactionType, { message: 'type debe ser un tipo de transacción válido' })
  @IsOptional()
  type?: TransactionType;

  @IsString({ message: 'search debe ser texto' })
  @IsOptional()
  search?: string;
}
