import type { AccountType } from '../../../types';
import { resolveInstitution } from './institutions';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Cuenta Corriente',
  SIGHT_ACCOUNT: 'Cuenta Vista / CuentaRUT',
  SAVINGS: 'Cuenta de Ahorro',
  CREDIT_CARD: 'Tarjeta de Crédito',
  CASH: 'Efectivo / Billetera',
  INVESTMENT: 'Inversiones',
  LOAN_ACCOUNT: 'Préstamo / Pasivo',
};

/** Orden de aparición en los selectores de tipo */
export const ACCOUNT_TYPE_OPTIONS: readonly AccountType[] = [
  'CHECKING',
  'SIGHT_ACCOUNT',
  'SAVINGS',
  'CREDIT_CARD',
  'CASH',
  'INVESTMENT',
  'LOAN_ACCOUNT',
];

/** Tipos cuyo saldo representa deuda (pasivo) */
export const LIABILITY_ACCOUNT_TYPES: readonly AccountType[] = ['CREDIT_CARD', 'LOAN_ACCOUNT'];

export const isLiabilityAccountType = (type: AccountType): boolean =>
  LIABILITY_ACCOUNT_TYPES.includes(type);

/**
 * Etiqueta corta para la insignia de Cuenta Vista: en BancoEstado se muestra
 * "CuentaRUT" (producto característico), en el resto "Cuenta Vista".
 */
export const getSightAccountLabel = (account: {
  type: AccountType;
  institutionCode?: string | null;
  institution?: string | null;
}): string | null => {
  if (account.type !== 'SIGHT_ACCOUNT') return null;
  return resolveInstitution(account)?.code === 'banco_estado' ? 'CuentaRUT' : 'Cuenta Vista';
};
