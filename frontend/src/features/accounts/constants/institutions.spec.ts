import { describe, it, expect } from 'vitest';
import {
  INSTITUTIONS,
  findInstitutionByName,
  getInstitutionByCode,
  resolveInstitution,
} from './institutions';
import { getSightAccountLabel, isLiabilityAccountType } from './accountTypes';

describe('Catálogo de instituciones chilenas (v2)', () => {
  it('debe tener códigos únicos y en formato snake_case', () => {
    const codes = INSTITUTIONS.map((inst) => inst.code);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((code) => expect(code).toMatch(/^[a-z0-9_]{1,40}$/));
  });

  it('debe incluir los bancos principales con su color corporativo', () => {
    expect(getInstitutionByCode('banco_estado')?.color).toBe('#F26822');
    expect(getInstitutionByCode('santander')?.color).toBe('#EC0000');
    expect(getInstitutionByCode('banco_chile')?.color).toBe('#002B49');
    expect(getInstitutionByCode('tenpo')).toBeDefined();
    expect(getInstitutionByCode('mach')).toBeDefined();
  });

  it('debe resolver nombres libres heredados de v1 (sin tildes ni mayúsculas)', () => {
    expect(findInstitutionByName('bancoestado')?.code).toBe('banco_estado');
    expect(findInstitutionByName('Itaú')?.code).toBe('itau');
    expect(findInstitutionByName('Efectivo / Billetera')?.code).toBe('other');
    expect(findInstitutionByName('Caja Los Andes')).toBeUndefined();
  });

  it('debe priorizar institutionCode sobre el nombre libre', () => {
    expect(
      resolveInstitution({ institutionCode: 'bci', institution: 'Banco Santander' })?.code,
    ).toBe('bci');
  });
});

describe('Helpers de tipo de cuenta (v2)', () => {
  it('debe etiquetar la Cuenta Vista de BancoEstado como CuentaRUT', () => {
    expect(getSightAccountLabel({ type: 'SIGHT_ACCOUNT', institutionCode: 'banco_estado' })).toBe(
      'CuentaRUT',
    );
    expect(getSightAccountLabel({ type: 'SIGHT_ACCOUNT', institutionCode: 'tenpo' })).toBe(
      'Cuenta Vista',
    );
    expect(getSightAccountLabel({ type: 'CHECKING', institutionCode: 'banco_estado' })).toBeNull();
  });

  it('debe identificar tarjetas y préstamos como pasivos', () => {
    expect(isLiabilityAccountType('CREDIT_CARD')).toBe(true);
    expect(isLiabilityAccountType('LOAN_ACCOUNT')).toBe(true);
    expect(isLiabilityAccountType('SIGHT_ACCOUNT')).toBe(false);
  });
});
