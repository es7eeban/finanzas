import {
  Tv,
  Lightbulb,
  Wifi,
  Home,
  GraduationCap,
  Shield,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import type {
  BillCategory,
  BillExecutionType,
  BillFrequency,
} from '../../../types';

export interface BillCategoryMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bgLight: string;
  textLight: string;
  bgDark: string;
  textDark: string;
}

export const BILL_CATEGORIES: Record<BillCategory, BillCategoryMeta> = {
  SUBSCRIPTION: {
    label: 'Suscripción Digital',
    icon: Tv,
    color: '#8B5CF6',
    bgLight: 'bg-purple-50',
    textLight: 'text-purple-700',
    bgDark: 'dark:bg-purple-950/40',
    textDark: 'dark:text-purple-300',
  },
  UTILITIES: {
    label: 'Servicios Básicos (Luz/Agua/Gas)',
    icon: Lightbulb,
    color: '#F59E0B',
    bgLight: 'bg-amber-50',
    textLight: 'text-amber-800',
    bgDark: 'dark:bg-amber-950/40',
    textDark: 'dark:text-amber-300',
  },
  TELECOM: {
    label: 'Internet y Telefonía',
    icon: Wifi,
    color: '#06B6D4',
    bgLight: 'bg-cyan-50',
    textLight: 'text-cyan-800',
    bgDark: 'dark:bg-cyan-950/40',
    textDark: 'dark:text-cyan-300',
  },
  HOUSING: {
    label: 'Vivienda y Gastos Comunes',
    icon: Home,
    color: '#10B981',
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-800',
    bgDark: 'dark:bg-emerald-950/40',
    textDark: 'dark:text-emerald-300',
  },
  EDUCATION: {
    label: 'Educación y Cursos',
    icon: GraduationCap,
    color: '#3B82F6',
    bgLight: 'bg-blue-50',
    textLight: 'text-blue-800',
    bgDark: 'dark:bg-blue-950/40',
    textDark: 'dark:text-blue-300',
  },
  INSURANCE: {
    label: 'Seguros',
    icon: Shield,
    color: '#EF4444',
    bgLight: 'bg-rose-50',
    textLight: 'text-rose-800',
    bgDark: 'dark:bg-rose-950/40',
    textDark: 'dark:text-rose-300',
  },
  OTHER: {
    label: 'Otros Servicios',
    icon: Receipt,
    color: '#6B7280',
    bgLight: 'bg-slate-100',
    textLight: 'text-slate-800',
    bgDark: 'dark:bg-slate-800',
    textDark: 'dark:text-slate-200',
  },
};

export const BILL_EXECUTION_TYPES: Record<
  BillExecutionType,
  { label: string; shortLabel: string; description: string }
> = {
  AUTOMATIC: {
    label: 'Débito Automático (PAT / TC)',
    shortLabel: 'Automático (PAT)',
    description: 'Cargo recurrente domiciliado en tarjeta o cuenta',
  },
  MANUAL_CHECK: {
    label: 'Pago Manual con Confirmación',
    shortLabel: 'Manual (Check)',
    description: 'Boleta con botón "Marcar como pagado"',
  },
};

export const BILL_FREQUENCIES: Record<BillFrequency, string> = {
  MONTHLY: 'Mensual',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  ANNUAL: 'Anual',
};
