import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DebtStatus } from '@prisma/client';

export class UpdateDebtDto {
  @IsString({ message: 'El nombre del contacto debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @IsOptional()
  contactName?: string;

  @IsDateString({}, { message: 'La fecha límite de pago debe ser una fecha ISO válida' })
  @IsOptional()
  dueDate?: string;

  @IsString({ message: 'Las notas deben ser un texto' })
  @IsOptional()
  notes?: string;

  @IsEnum(DebtStatus, {
    message: 'El estado debe ser PENDING, PARTIALLY_PAID o PAID',
  })
  @IsOptional()
  status?: DebtStatus;
}
