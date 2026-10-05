import type { AccountType } from '../../../types';

export type InstitutionCategory = 'traditional' | 'retail' | 'fintech' | 'other';

export interface Institution {
  /** Código persistido en `accounts.institutionCode` */
  code: string;
  /** Nombre visible y persistido en `accounts.institution` */
  name: string;
  /** Isotipo simplificado (2-3 caracteres) */
  monogram: string;
  /** Color corporativo primario */
  color: string;
  /** Clases Tailwind del badge (light + dark) */
  badgeClass: string;
  category: InstitutionCategory;
  /** Tipos de cuenta característicos de la institución */
  typicalTypes: AccountType[];
  /** Nombres alternativos (ej. valores libres usados en v1) */
  aliases?: string[];
}

export const OTHER_INSTITUTION_CODE = 'other';

export const INSTITUTIONS: readonly Institution[] = [
  // Bancos tradicionales
  {
    code: 'banco_estado',
    name: 'BancoEstado',
    monogram: 'BE',
    color: '#F26822',
    badgeClass:
      'bg-amber-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
    category: 'traditional',
    typicalTypes: ['SIGHT_ACCOUNT', 'CHECKING', 'SAVINGS'],
  },
  {
    code: 'santander',
    name: 'Banco Santander',
    monogram: 'S',
    color: '#EC0000',
    badgeClass:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'SIGHT_ACCOUNT', 'CREDIT_CARD'],
  },
  {
    code: 'banco_chile',
    name: 'Banco de Chile',
    monogram: 'BCh',
    color: '#002B49',
    badgeClass:
      'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'SIGHT_ACCOUNT', 'CREDIT_CARD'],
  },
  {
    code: 'bci',
    name: 'BCI',
    monogram: 'Bci',
    color: '#007A87',
    badgeClass:
      'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'SAVINGS', 'CREDIT_CARD'],
  },
  {
    code: 'scotiabank',
    name: 'Scotiabank',
    monogram: 'SB',
    color: '#ED0722',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'CREDIT_CARD'],
  },
  {
    code: 'itau',
    name: 'Banco Itaú',
    monogram: 'It',
    color: '#EC7000',
    badgeClass:
      'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'CREDIT_CARD'],
    aliases: ['Itaú', 'Itau'],
  },
  {
    code: 'bice',
    name: 'Banco BICE',
    monogram: 'Bi',
    color: '#00205B',
    badgeClass:
      'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'INVESTMENT'],
  },
  {
    code: 'security',
    name: 'Banco Security',
    monogram: 'Se',
    color: '#5B2C83',
    badgeClass:
      'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900',
    category: 'traditional',
    typicalTypes: ['CHECKING', 'INVESTMENT'],
  },
  {
    code: 'consorcio',
    name: 'Banco Consorcio',
    monogram: 'Co',
    color: '#0072CE',
    badgeClass:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    category: 'traditional',
    typicalTypes: ['SIGHT_ACCOUNT', 'SAVINGS', 'INVESTMENT'],
  },
  {
    code: 'coopeuch',
    name: 'Coopeuch',
    monogram: 'Cp',
    color: '#00A651',
    badgeClass:
      'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900',
    category: 'traditional',
    typicalTypes: ['SIGHT_ACCOUNT', 'SAVINGS', 'LOAN_ACCOUNT'],
  },
  // Banca retail
  {
    code: 'falabella',
    name: 'Banco Falabella',
    monogram: 'F',
    color: '#00843D',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    category: 'retail',
    typicalTypes: ['CREDIT_CARD', 'CHECKING'],
  },
  {
    code: 'ripley',
    name: 'Banco Ripley',
    monogram: 'R',
    color: '#592C82',
    badgeClass:
      'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
    category: 'retail',
    typicalTypes: ['CREDIT_CARD', 'SIGHT_ACCOUNT'],
  },
  {
    code: 'cencosud_scotiabank',
    name: 'Cencosud Scotiabank',
    monogram: 'CS',
    color: '#0057A8',
    badgeClass:
      'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    category: 'retail',
    typicalTypes: ['CREDIT_CARD'],
  },
  // Cuentas digitales / fintech
  {
    code: 'tenpo',
    name: 'Tenpo',
    monogram: 'Tp',
    color: '#00D2C4',
    badgeClass:
      'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
    category: 'fintech',
    typicalTypes: ['SIGHT_ACCOUNT', 'CREDIT_CARD'],
  },
  {
    code: 'mach',
    name: 'Mach',
    monogram: 'M',
    color: '#00D2C4',
    badgeClass:
      'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
    category: 'fintech',
    typicalTypes: ['SIGHT_ACCOUNT', 'CREDIT_CARD'],
  },
  {
    code: 'mercado_pago',
    name: 'Mercado Pago',
    monogram: 'MP',
    color: '#009EE3',
    badgeClass:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    category: 'fintech',
    typicalTypes: ['SIGHT_ACCOUNT', 'INVESTMENT'],
  },
  // Otro / Efectivo
  {
    code: OTHER_INSTITUTION_CODE,
    name: 'Otro / Efectivo',
    monogram: '•••',
    color: '#64748B',
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    category: 'other',
    typicalTypes: ['CASH'],
    aliases: ['Efectivo / Billetera', 'Efectivo', 'Otro'],
  },
];

export const INSTITUTION_CATEGORY_LABELS: Record<InstitutionCategory, string> = {
  traditional: 'Bancos Tradicionales',
  retail: 'Banca Retail',
  fintech: 'Cuentas Digitales / Fintech',
  other: 'Otro',
};

export const getInstitutionByCode = (code?: string | null): Institution | undefined =>
  code ? INSTITUTIONS.find((inst) => inst.code === code) : undefined;

/** Normaliza texto para búsquedas sin tildes ni mayúsculas */
export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Intenta resolver una institución a partir de un nombre libre (cuentas creadas en v1
 * antes de existir `institutionCode`).
 */
export const findInstitutionByName = (name?: string | null): Institution | undefined => {
  if (!name) return undefined;
  const needle = normalizeSearch(name);
  return INSTITUTIONS.find(
    (inst) =>
      (inst.code !== OTHER_INSTITUTION_CODE && normalizeSearch(inst.name) === needle) ||
      (inst.aliases ?? []).some((alias) => normalizeSearch(alias) === needle),
  );
};

/** Resuelve la institución de una cuenta priorizando el código y luego el nombre (legacy v1) */
export const resolveInstitution = (account: {
  institutionCode?: string | null;
  institution?: string | null;
}): Institution | undefined =>
  getInstitutionByCode(account.institutionCode) ?? findInstitutionByName(account.institution);
