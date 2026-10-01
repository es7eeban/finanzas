import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsUUID('4', { message: 'El id de la cuenta origen debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La cuenta origen es requerida' })
  accountId: string;

  @IsUUID('4', { message: 'El id de la cuenta destino debe ser un UUID válido' })
  @IsOptional()
  destinationAccountId?: string;

  @IsUUID('4', { message: 'El id de la categoría debe ser un UUID válido' })
  @IsOptional()
  categoryId?: string;

  @IsEnum(TransactionType, {
    message:
      'El tipo de transacción debe ser INCOME, EXPENSE, TRANSFER, SAVING_CONTRIBUTION, SAVING_WITHDRAWAL o DEBT_PAYMENT',
  })
  @IsNotEmpty({ message: 'El tipo de transacción es requerido' })
  type: TransactionType;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsDateString({}, { message: 'La fecha debe tener un formato ISO 8601 válido' })
  @IsOptional()
  date?: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MaxLength(255, { message: 'La descripción no puede superar los 255 caracteres' })
  description: string;

  @IsBoolean({ message: 'isRecurring debe ser booleano' })
  @IsOptional()
  isRecurring?: boolean;

  @IsString({ message: 'recurrenceRule debe ser texto' })
  @IsOptional()
  recurrenceRule?: string;
}
