import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDebtPaymentDto {
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsUUID('4', { message: 'El id de la cuenta debe ser un UUID válido' })
  @IsOptional()
  accountId?: string;

  @IsDateString({}, { message: 'La fecha debe tener un formato ISO válido' })
  @IsOptional()
  date?: string;

  @IsString({ message: 'La nota debe ser un texto' })
  @IsOptional()
  note?: string;
}
