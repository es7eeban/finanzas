import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSavingGoalDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre de la meta es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsNumber({}, { message: 'El monto objetivo debe ser un número' })
  @Min(1, { message: 'El monto objetivo debe ser al menos 1' })
  targetAmount: number;

  @IsUUID('4', { message: 'El id de la cuenta de resguardo debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La cuenta de resguardo es obligatoria' })
  targetAccountId: string;

  @IsDateString({}, { message: 'La fecha límite debe ser una fecha ISO válida' })
  @IsNotEmpty({ message: 'La fecha límite es obligatoria' })
  targetDate: string;

  @IsNumber({}, { message: 'El monto inicial debe ser un número' })
  @Min(0, { message: 'El monto inicial no puede ser negativo' })
  @IsOptional()
  initialAmount?: number;

  @IsString({ message: 'El color debe ser un texto hexadecimal' })
  @IsOptional()
  color?: string;

  @IsString({ message: 'El icono debe ser un texto identificador' })
  @IsOptional()
  icon?: string;
}
