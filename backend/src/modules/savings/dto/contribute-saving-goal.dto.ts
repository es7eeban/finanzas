import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ContributeSavingGoalDto {
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsUUID('4', { message: 'El id de la cuenta de origen debe ser un UUID válido' })
  @IsOptional()
  sourceAccountId?: string;

  @IsString({ message: 'La nota debe ser un texto' })
  @IsOptional()
  note?: string;

  @IsDateString({}, { message: 'La fecha debe ser un formato ISO válido' })
  @IsOptional()
  date?: string;
}
