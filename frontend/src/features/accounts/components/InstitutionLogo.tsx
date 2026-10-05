import React from 'react';
import type { Institution } from '../constants/institutions';

interface InstitutionLogoProps {
  institution: Institution;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<InstitutionLogoProps['size']>, string> = {
  xs: 'w-5 h-5 text-[8px] rounded-md',
  sm: 'w-7 h-7 text-[10px] rounded-lg',
  md: 'w-10 h-10 text-xs rounded-2xl',
};

/** Isotipo simplificado: monograma sobre el color corporativo de la institución */
export const InstitutionLogo: React.FC<InstitutionLogoProps> = ({
  institution,
  size = 'sm',
  className = '',
}) => (
  <span
    aria-hidden="true"
    data-testid={`institution-logo-${institution.code}`}
    className={`inline-flex items-center justify-center shrink-0 font-extrabold tracking-tight text-white shadow-xs select-none ${SIZE_CLASSES[size]} ${className}`}
    style={{ backgroundColor: institution.color }}
  >
    {institution.monogram}
  </span>
);
