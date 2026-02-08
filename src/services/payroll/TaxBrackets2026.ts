/**
 * Tax Brackets and Rates for 2026
 * 
 * Fuente: IRS Publication 15 (Circular E) - 2026
 * https://www.irs.gov/pub/irs-pdf/p15.pdf
 * 
 * NOTA: Estos valores son proyecciones basadas en ajustes de inflación.
 * Deben actualizarse cuando el IRS publique las tablas oficiales de 2026.
 */

// ============================================================================
// TYPES
// ============================================================================

export type FilingStatus = 'single' | 'married' | 'married_separate' | 'head_of_household';

export interface TaxBracket {
  min: number;
  max: number | null; // null = sin límite superior
  rate: number; // decimal (ej: 0.10 = 10%)
}

// ============================================================================
// FICA TAX RATES 2026
// ============================================================================

export const TaxBrackets2026 = {
  // Social Security (OASDI)
  SOCIAL_SECURITY_RATE: 0.062, // 6.2%
  SOCIAL_SECURITY_WAGE_BASE: 168600, // Límite de salario para SS en 2026
  
  // Medicare
  MEDICARE_RATE: 0.0145, // 1.45%
  ADDITIONAL_MEDICARE_RATE: 0.009, // 0.9% adicional
  ADDITIONAL_MEDICARE_THRESHOLD: {
    single: 200000,
    married: 250000,
    married_separate: 125000,
    head_of_household: 200000
  },
  
  // Standard Deductions 2026
  STANDARD_DEDUCTION: {
    single: 14600,
    married: 29200,
    married_separate: 14600,
    head_of_household: 21900
  },
  
  // Withholding Allowances
  ALLOWANCE_AMOUNT: 4800, // Valor por allowance en 2026
  
  // Federal Income Tax Brackets 2026
  TAX_BRACKETS: {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: null, rate: 0.37 }
    ] as TaxBracket[],
    
    married: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: null, rate: 0.37 }
    ] as TaxBracket[],
    
    married_separate: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 365600, rate: 0.35 },
      { min: 365600, max: null, rate: 0.37 }
    ] as TaxBracket[],
    
    head_of_household: [
      { min: 0, max: 16550, rate: 0.10 },
      { min: 16550, max: 63100, rate: 0.12 },
      { min: 63100, max: 100500, rate: 0.22 },
      { min: 100500, max: 191950, rate: 0.24 },
      { min: 191950, max: 243700, rate: 0.32 },
      { min: 243700, max: 609350, rate: 0.35 },
      { min: 609350, max: null, rate: 0.37 }
    ] as TaxBracket[]
  }
};

// ============================================================================
// FLORIDA STATE TAX
// ============================================================================

// Florida NO tiene impuesto estatal sobre la renta
export const FLORIDA_STATE_TAX_RATE = 0;

// ============================================================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================================================

export const FEDERAL_TAX_BRACKETS_SINGLE = TaxBrackets2026.TAX_BRACKETS.single;
export const FEDERAL_TAX_BRACKETS_MARRIED = TaxBrackets2026.TAX_BRACKETS.married;
export const FEDERAL_TAX_BRACKETS_HEAD = TaxBrackets2026.TAX_BRACKETS.head_of_household;

export const FICA_RATES = {
  SOCIAL_SECURITY_RATE: TaxBrackets2026.SOCIAL_SECURITY_RATE * 100,
  SOCIAL_SECURITY_WAGE_BASE: TaxBrackets2026.SOCIAL_SECURITY_WAGE_BASE,
  MEDICARE_RATE: TaxBrackets2026.MEDICARE_RATE * 100,
  MEDICARE_ADDITIONAL_RATE: TaxBrackets2026.ADDITIONAL_MEDICARE_RATE * 100,
  MEDICARE_ADDITIONAL_THRESHOLD_SINGLE: TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.single,
  MEDICARE_ADDITIONAL_THRESHOLD_MARRIED: TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.married,
  MEDICARE_ADDITIONAL_THRESHOLD_MARRIED_SEPARATE: TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.married_separate
};

export const STANDARD_DEDUCTIONS = {
  SINGLE: TaxBrackets2026.STANDARD_DEDUCTION.single,
  MARRIED_JOINT: TaxBrackets2026.STANDARD_DEDUCTION.married,
  MARRIED_SEPARATE: TaxBrackets2026.STANDARD_DEDUCTION.married_separate,
  HEAD_OF_HOUSEHOLD: TaxBrackets2026.STANDARD_DEDUCTION.head_of_household
};

export const WITHHOLDING_ALLOWANCE_VALUE = TaxBrackets2026.ALLOWANCE_AMOUNT;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTaxBrackets(filingStatus: FilingStatus): TaxBracket[] {
  return TaxBrackets2026.TAX_BRACKETS[filingStatus];
}

export function getStandardDeduction(filingStatus: FilingStatus): number {
  return TaxBrackets2026.STANDARD_DEDUCTION[filingStatus];
}

export function getMedicareAdditionalThreshold(filingStatus: FilingStatus): number {
  return TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
}
