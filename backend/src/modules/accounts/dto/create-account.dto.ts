import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AccountType, Currency } from '@prisma/client';

export class CreateAccountDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la cuenta es obligatorio' })
  name!: string;

  @IsString({ message: 'La institución o banco debe ser texto' })
  @IsOptional()
  institution?: string;

  @IsString({ message: 'El número de cuenta o últimos dígitos debe ser texto' })
  @IsOptional()
  accountNumber?: string;

  @IsEnum(AccountType, { message: 'Tipo de cuenta no válido' })
  type!: AccountType;

  @IsEnum(Currency, { message: 'Moneda no válida' })
  @IsOptional()
  currency?: Currency;

  @IsNumber({}, { message: 'El saldo inicial debe ser numérico' })
  @IsOptional()
  balance?: number;

  @IsNumber({}, { message: 'El límite de crédito debe ser numérico' })
  @IsOptional()
  creditLimit?: number;

  @IsInt({ message: 'El día de corte debe ser un número entero' })
  @Min(1)
  @Max(31)
  @IsOptional()
  billingCloseDay?: number;

  @IsInt({ message: 'El día de pago debe ser un número entero' })
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
}
