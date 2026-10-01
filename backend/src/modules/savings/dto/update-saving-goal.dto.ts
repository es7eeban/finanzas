import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class UpdateSavingGoalDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @IsOptional()
  name?: string;

  @IsNumber({}, { message: 'El monto objetivo debe ser un número' })
  @Min(1, { message: 'El monto objetivo debe ser al menos 1' })
  @IsOptional()
  targetAmount?: number;

  @IsUUID('4', { message: 'El id de la cuenta de resguardo debe ser un UUID válido' })
  @IsOptional()
  targetAccountId?: string;

  @IsDateString({}, { message: 'La fecha límite debe ser una fecha ISO válida' })
  @IsOptional()
  targetDate?: string;

  @IsString({ message: 'El color debe ser un texto' })
  @IsOptional()
  color?: string;

  @IsString({ message: 'El icono debe ser un texto' })
  @IsOptional()
  icon?: string;

  @IsEnum(GoalStatus, { message: 'El estado debe ser ACTIVE, COMPLETED o PAUSED' })
  @IsOptional()
  status?: GoalStatus;
}
