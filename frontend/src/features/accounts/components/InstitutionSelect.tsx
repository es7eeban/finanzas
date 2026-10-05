import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronsUpDown, Search, X } from 'lucide-react';
import {
  INSTITUTIONS,
  INSTITUTION_CATEGORY_LABELS,
  normalizeSearch,
  type Institution,
  type InstitutionCategory,
} from '../constants/institutions';
import { InstitutionLogo } from './InstitutionLogo';

interface InstitutionSelectProps {
  value: string | null;
  onChange: (institution: Institution | null) => void;
}

const CATEGORY_ORDER: readonly InstitutionCategory[] = ['traditional', 'retail', 'fintech', 'other'];

export const InstitutionSelect: React.FC<InstitutionSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = useMemo(
    () => INSTITUTIONS.find((inst) => inst.code === value) ?? null,
    [value],
  );

  const grouped = useMemo(() => {
    const needle = normalizeSearch(query);
    const filtered = needle
      ? INSTITUTIONS.filter((inst) => normalizeSearch(inst.name).includes(needle))
      : INSTITUTIONS;
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered.filter((inst) => inst.category === category),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const handleSelect = (institution: Institution | null) => {
    onChange(institution);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-left text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {selected ? (
          <>
            <InstitutionLogo institution={selected} size="xs" />
            <span className="flex-1 truncate font-medium text-slate-900 dark:text-white">
              {selected.name}
            </span>
          </>
        ) : (
          <>
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 truncate text-slate-400">Selecciona banco o institución</span>
          </>
        )}
        <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1.5 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar banco..."
              aria-label="Buscar banco"
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <ul id={listboxId} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {selected && !query && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <X className="w-4 h-4" />
                  <span>Sin institución</span>
                </button>
              </li>
            )}

            {grouped.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">
                Sin resultados. Usa “Otro / Efectivo” para una entidad no listada.
              </li>
            )}

            {grouped.map((group) => (
              <li key={group.category}>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {INSTITUTION_CATEGORY_LABELS[group.category]}
                </div>
                <ul>
                  {group.items.map((inst) => {
                    const isSelected = inst.code === value;
                    return (
                      <li key={inst.code} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => handleSelect(inst)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <InstitutionLogo institution={inst} size="xs" />
                          <span className="flex-1 text-left font-medium">{inst.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
