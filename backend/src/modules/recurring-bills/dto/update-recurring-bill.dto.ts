import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BillCategory, BillExecutionType, BillFrequency, Currency } from '@prisma/client';

export class UpdateRecurringBillDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsOptional()
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name?: string;

  @IsNumber({}, { message: 'El monto debe ser numérico' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @IsOptional()
  amount?: number;

  @IsEnum(Currency, { message: 'Moneda no válida' })
  @IsOptional()
  currency?: Currency;

  @IsEnum(BillFrequency, { message: 'Frecuencia no válida' })
  @IsOptional()
  frequency?: BillFrequency;

  @IsEnum(BillExecutionType, { message: 'Tipo de ejecución no válido' })
  @IsOptional()
  executionType?: BillExecutionType;

  @IsEnum(BillCategory, { message: 'Categoría no válida' })
  @IsOptional()
  category?: BillCategory;

  @IsInt({ message: 'El día de vencimiento debe ser un número entero' })
  @Min(1)
  @Max(31)
  @IsOptional()
  dueDay?: number;

  @IsUUID('4', { message: 'El ID de la cuenta debe ser un UUID válido' })
  @IsOptional()
  accountId?: string | null;

  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido' })
  @IsOptional()
  categoryId?: string | null;

  @IsBoolean({ message: 'isActive debe ser booleano' })
  @IsOptional()
  isActive?: boolean;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  @MaxLength(255, { message: 'Las notas no pueden superar 255 caracteres' })
  notes?: string | null;
}
