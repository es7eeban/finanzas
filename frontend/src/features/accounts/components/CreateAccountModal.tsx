import React, { useState, useEffect } from 'react';
import type {
  AccountWithSavings,
  CreateAccountInput,
  UpdateAccountInput,
} from '../hooks/useAccounts';
import type { AccountType, Currency } from '../../../types';
import { X } from 'lucide-react';
import { InstitutionSelect } from './InstitutionSelect';
import {
  OTHER_INSTITUTION_CODE,
  resolveInstitution,
  type Institution,
} from '../constants/institutions';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_OPTIONS } from '../constants/accountTypes';

const DESCRIPTION_MAX_LENGTH = 255;
const DEFAULT_COLOR = '#2563EB';
const BASE_COLORS = ['#2563EB', '#4F46E5', '#10B981', '#F59E0B', '#DC2626', '#8B5CF6', '#0D9488'];

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAccountInput) => Promise<void>;
  /** Si se entrega, el modal funciona en modo edición */
  account?: AccountWithSavings | null;
  onUpdate?: (id: string, input: UpdateAccountInput) => Promise<void>;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  account = null,
  onUpdate,
}) => {
  const isEditMode = account !== null;

  const [name, setName] = useState('');
  const [institutionCode, setInstitutionCode] = useState<string | null>(null);
  const [customInstitution, setCustomInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [balance, setBalance] = useState<string>('0');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [billingCloseDay, setBillingCloseDay] = useState<string>('');
  const [paymentDueDay, setPaymentDueDay] = useState<string>('');
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInstitution = resolveInstitution({ institutionCode });
  const isOtherInstitution = institutionCode === OTHER_INSTITUTION_CODE;

  // Inicializar el formulario cada vez que se abre (vacío o con la cuenta a editar)
  useEffect(() => {
    if (!isOpen) return;

    if (account) {
      const resolved = resolveInstitution(account);
      setName(account.name);
      setInstitutionCode(resolved?.code ?? (account.institution ? OTHER_INSTITUTION_CODE : null));
      setCustomInstitution(resolved ? '' : (account.institution ?? ''));
      setDescription(account.description ?? '');
      setAccountNumber(account.accountNumber ?? '');
      setType(account.type);
      setCurrency(account.currency);
      setBalance(String(account.balance));
      setCreditLimit(account.creditLimit != null ? String(account.creditLimit) : '');
      setBillingCloseDay(account.billingCloseDay != null ? String(account.billingCloseDay) : '');
      setPaymentDueDay(account.paymentDueDay != null ? String(account.paymentDueDay) : '');
      setColor(account.color);
    } else {
      setName('');
      setInstitutionCode(null);
      setCustomInstitution('');
      setDescription('');
      setAccountNumber('');
      setType('CHECKING');
      setCurrency('CLP');
      setBalance('0');
      setCreditLimit('');
      setBillingCloseDay('');
      setPaymentDueDay('');
      setColor(DEFAULT_COLOR);
    }
    setError(null);
  }, [isOpen, account]);

  if (!isOpen) return null;

  const handleInstitutionChange = (institution: Institution | null) => {
    setInstitutionCode(institution?.code ?? null);
    if (institution && institution.code !== OTHER_INSTITUTION_CODE) {
      setCustomInstitution('');
      setColor(institution.color);
    }
    if (error) setError(null);
  };

  const resolveInstitutionName = (): string => {
    if (!institutionCode) return '';
    if (isOtherInstitution) return customInstitution.trim();
    return selectedInstitution?.name ?? '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la cuenta o tarjeta');
      return;
    }

    const institutionName = resolveInstitutionName();
    const isCreditCard = type === 'CREDIT_CARD';

    setSubmitting(true);
    setError(null);
    try {
      if (isEditMode && account && onUpdate) {
        // Cadenas vacías / null limpian el valor en el backend
        await onUpdate(account.id, {
          name: name.trim(),
          institution: institutionName,
          institutionCode: institutionCode ?? '',
          description: description.trim(),
          accountNumber: accountNumber.trim(),
          type,
          creditLimit: isCreditCard && creditLimit ? parseFloat(creditLimit) : null,
          billingCloseDay:
            isCreditCard && billingCloseDay ? parseInt(billingCloseDay, 10) : null,
          paymentDueDay: isCreditCard && paymentDueDay ? parseInt(paymentDueDay, 10) : null,
          color,
        });
      } else {
        await onSubmit({
          name: name.trim(),
          institution: institutionName || undefined,
          institutionCode: institutionCode ?? undefined,
          description: description.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          type,
          currency,
          balance: parseFloat(balance) || 0,
          creditLimit: isCreditCard && creditLimit ? parseFloat(creditLimit) : undefined,
          billingCloseDay:
            isCreditCard && billingCloseDay ? parseInt(billingCloseDay, 10) : undefined,
          paymentDueDay: isCreditCard && paymentDueDay ? parseInt(paymentDueDay, 10) : undefined,
          color,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? 'Error al actualizar la cuenta'
            : 'Error al crear cuenta',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const colors =
    selectedInstitution && !BASE_COLORS.includes(selectedInstitution.color)
      ? [selectedInstitution.color, ...BASE_COLORS]
      : BASE_COLORS;

  const typicalTypes =
    selectedInstitution && !isOtherInstitution ? selectedInstitution.typicalTypes : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Editar Cuenta' : 'Nueva Cuenta o Tarjeta'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditMode
                ? 'Actualiza la institución, tipo y notas de la cuenta'
                : 'Registra un nuevo método de pago'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Banco / Institución */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Banco / Institución
            </label>
            <InstitutionSelect value={institutionCode} onChange={handleInstitutionChange} />
            {isOtherInstitution && (
              <input
                type="text"
                placeholder="Nombre de la entidad (opcional), ej. Caja Los Andes"
                value={customInstitution}
                onChange={(e) => setCustomInstitution(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre de la Cuenta *
            </label>
            <input
              type="text"
              placeholder="Ej. CuentaRUT, Cuenta Corriente Principal, Visa Signature"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Tipo & Últimos dígitos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {ACCOUNT_TYPE_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Últimos 4 Dígitos
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="Ej. 4589"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tipos típicos sugeridos por la institución */}
          {typicalTypes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 -mt-1">
              <span className="text-[11px] text-slate-400">Típicos:</span>
              {typicalTypes.map((suggested) => (
                <button
                  type="button"
                  key={suggested}
                  onClick={() => setType(suggested)}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                    type === suggested
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {suggested === 'SIGHT_ACCOUNT' && selectedInstitution?.code === 'banco_estado'
                    ? 'CuentaRUT'
                    : ACCOUNT_TYPE_LABELS[suggested]}
                </button>
              ))}
            </div>
          )}

          {/* Moneda & Saldo Inicial (solo creación: se gestionan vía transacciones) */}
          {!isEditMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Moneda
                </label>
                <div className="flex gap-2">
                  {(['CLP', 'USD'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        currency === curr
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {curr === 'USD' ? 'USD ($)' : 'CLP'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Saldo Inicial
                </label>
                <input
                  type="number"
                  step={currency === 'USD' ? '0.01' : '1'}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Campos específicos de Tarjeta de Crédito */}
          {type === 'CREDIT_CARD' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cupo Total de Crédito</label>
                <input
                  type="number"
                  placeholder="Ej. 2500000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Día de Corte</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej. 20"
                    value={billingCloseDay}
                    onChange={(e) => setBillingCloseDay(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Día de Pago</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej. 5"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label
                htmlFor="account-description"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Descripción / Notas
              </label>
              <span
                className={`text-[10px] tabular-nums ${
                  description.length >= DESCRIPTION_MAX_LENGTH ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="account-description"
              rows={2}
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder="Ej. Fondo para imprevistos médicos, tarjeta para suscripciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Color Distintivo
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  title={c === selectedInstitution?.color ? `Color de ${selectedInstitution.name}` : c}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
