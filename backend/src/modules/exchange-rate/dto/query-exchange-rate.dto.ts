import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryExchangeRateDto {
  @IsString()
  @IsIn(['USD', 'CLP'], { message: 'Moneda de origen debe ser USD o CLP' })
  @IsOptional()
  from?: string = 'USD';

  @IsString()
  @IsIn(['USD', 'CLP'], { message: 'Moneda de destino debe ser USD o CLP' })
  @IsOptional()
  to?: string = 'CLP';
}
