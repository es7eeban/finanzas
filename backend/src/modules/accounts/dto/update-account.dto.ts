import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AccountType, Currency } from '@prisma/client';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  institution?: string;

  // Cadena vacía permite desvincular la institución del catálogo
  @IsString()
  @Matches(/^([a-z0-9_]{1,40})?$/, { message: 'Código de institución no válido' })
  @IsOptional()
  institutionCode?: string;

  @IsString()
  @MaxLength(255, { message: 'La descripción no puede superar los 255 caracteres' })
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  billingCloseDay?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  paymentDueDay?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
