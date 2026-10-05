import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class MarkRecurringPaidDto {
  @IsUUID('4', { message: 'El ID de la cuenta de débito es obligatorio y debe ser un UUID' })
  @IsNotEmpty({ message: 'Debes seleccionar la cuenta donde se debitó el pago' })
  accountId!: string;

  @IsNumber({}, { message: 'El monto pagado debe ser numérico' })
  @Min(0.01, { message: 'El monto pagado debe ser mayor a 0' })
  amountPaid!: number;

  @IsDateString({}, { message: 'La fecha de pago debe ser una fecha ISO válida' })
  @IsOptional()
  paidAt?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'El periodo debe tener el formato YYYY-MM (ej. 2026-10)' })
  @IsOptional()
  period?: string;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  @MaxLength(255, { message: 'Las notas no pueden superar 255 caracteres' })
  notes?: string;
}
