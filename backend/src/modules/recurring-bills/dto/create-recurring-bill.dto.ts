import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BillCategory, BillExecutionType, BillFrequency, Currency } from '@prisma/client';

export class CreateRecurringBillDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del servicio o suscripción es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name!: string;

  @IsNumber({}, { message: 'El monto debe ser numérico' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount!: number;

  @IsEnum(Currency, { message: 'Moneda no válida' })
  @IsOptional()
  currency?: Currency = Currency.CLP;

  @IsEnum(BillFrequency, { message: 'Frecuencia no válida' })
  @IsOptional()
  frequency?: BillFrequency = BillFrequency.MONTHLY;

  @IsEnum(BillExecutionType, { message: 'Tipo de ejecución no válido' })
  @IsNotEmpty({ message: 'El tipo de ejecución (automático o manual) es obligatorio' })
  executionType!: BillExecutionType;

  @IsEnum(BillCategory, { message: 'Categoría no válida' })
  @IsNotEmpty({ message: 'La categoría del servicio es obligatoria' })
  category!: BillCategory;

  @IsInt({ message: 'El día de vencimiento debe ser un número entero' })
  @Min(1, { message: 'El día de vencimiento debe ser al menos 1' })
  @Max(31, { message: 'El día de vencimiento no puede superar 31' })
  dueDay!: number;

  @IsUUID('4', { message: 'El ID de la cuenta sugerida debe ser un UUID válido' })
  @IsOptional()
  accountId?: string;

  @IsUUID('4', { message: 'El ID de la categoría contable debe ser un UUID válido' })
  @IsOptional()
  categoryId?: string;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  @MaxLength(255, { message: 'Las notas no pueden superar 255 caracteres' })
  notes?: string;
}
