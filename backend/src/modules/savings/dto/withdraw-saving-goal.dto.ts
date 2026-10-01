import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class WithdrawSavingGoalDto {
  @IsNumber({}, { message: 'El monto a retirar debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsUUID('4', { message: 'El id de la cuenta destino debe ser un UUID válido' })
  @IsOptional()
  destinationAccountId?: string;

  @IsString({ message: 'El motivo de retiro es obligatorio para trazabilidad de emergencia' })
  @IsNotEmpty({ message: 'Debe justificar el motivo del retiro de emergencia' })
  reason: string;

  @IsDateString({}, { message: 'La fecha debe ser un formato ISO válido' })
  @IsOptional()
  date?: string;
}
