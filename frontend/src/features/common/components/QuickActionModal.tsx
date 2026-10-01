import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Target,
  HandCoins,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickActionModal = ({ isOpen, onClose }: QuickActionModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Registrar Gasto',
      description: 'Compra, pago de servicio o egreso',
      icon: ArrowDownLeft,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      onClick: () => {
        onClose();
        navigate('/transactions?action=new_expense');
      },
    },
    {
      title: 'Registrar Ingreso',
      description: 'Sueldo, honorarios o venta',
      icon: ArrowUpRight,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      onClick: () => {
        onClose();
        navigate('/transactions?action=new_income');
      },
    },
    {
      title: 'Transferir entre Cuentas',
      description: 'Mover dinero entre tus cuentas propias',
      icon: ArrowLeftRight,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      onClick: () => {
        onClose();
        navigate('/transactions?action=new_transfer');
      },
    },
    {
      title: 'Aporte a Meta de Ahorro',
      description: 'Destinar fondos para tus objetivos',
      icon: Target,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
      onClick: () => {
        onClose();
        navigate('/savings');
      },
    },
    {
      title: 'Nuevo Préstamo o Deuda',
      description: 'Registrar dinero prestado o por pagar',
      icon: HandCoins,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      onClick: () => {
        onClose();
        navigate('/debts');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ¿Qué deseas registrar?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona una acción financiera rápida
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={act.onClick}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${act.bgColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {act.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {act.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
