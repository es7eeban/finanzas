import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { DebtType } from '@prisma/client';

export class CreateDebtDto {
  @IsString({ message: 'El nombre del contacto debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del contacto es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  contactName: string;

  @IsEnum(DebtType, {
    message: 'El tipo de deuda debe ser LENT (dinero prestado) o BORROWED (deuda adquirida)',
  })
  @IsNotEmpty({ message: 'El tipo de deuda es obligatorio' })
  type: DebtType;

  @IsNumber({}, { message: 'El monto total debe ser un número' })
  @Min(0.01, { message: 'El monto total debe ser mayor a 0' })
  totalAmount: number;

  @IsDateString({}, { message: 'La fecha límite de pago debe ser una fecha ISO válida' })
  @IsOptional()
  dueDate?: string;

  @IsString({ message: 'Las notas deben ser un texto' })
  @IsOptional()
  notes?: string;

  @IsUUID('4', { message: 'El id de la cuenta debe ser un UUID válido' })
  @IsOptional()
  accountId?: string;
}
