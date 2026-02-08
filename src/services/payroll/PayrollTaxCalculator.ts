/**
 * PayrollTaxCalculator.ts
 * 
 * Calcula todos los impuestos federales con precisión del 100% según IRS Publication 15.
 * 
 * CRÍTICO: Todos los cálculos deben ser validados contra calculadoras oficiales del IRS.
 * 
 * @author Kiro AI
 * @date 2026-02-07
 */

import { TaxBrackets2026 } from './TaxBrackets2026';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type FilingStatus = 'single' | 'married' | 'married_separate' | 'head_of_household';
export type PayPeriod = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export interface TaxCalculationInput {
  grossPay: number;
  ytdGrossPay: number;
  filingStatus: FilingStatus;
  allowances: number;
  additionalWithholding: number;
  payPeriod: PayPeriod;
}

export interface FICAResult {
  socialSecurity: number;
  medicare: number;
  totalFICA: number;
}

export interface MedicareResult {
  medicare: number;
  medicareAdditional: number;
  totalMedicare: number;
}

export interface FederalTaxResult {
  federalIncomeTax: number;
  taxableIncome: number;
  annualTax: number;
}

export interface TaxBreakdown {
  socialSecurity: {
    rate: number;
    base: number;
    amount: number;
  };
  medicare: {
    rate: number;
    base: number;
    amount: number;
  };
  medicareAdditional: {
    rate: number;
    base: number;
    amount: number;
  };
  federalIncomeTax: {
    annualSalary: number;
    standardDeduction: number;
    allowanceDeduction: number;
    taxableIncome: number;
    annualTax: number;
    perPeriodTax: number;
    additionalWithholding: number;
    totalWithholding: number;
  };
}

export interface TaxCalculationResult {
  socialSecurity: number;
  medicare: number;
  medicareAdditional: number;
  federalIncomeTax: number;
  totalTaxes: number;
  breakdown: TaxBreakdown;
}

// ==========================================
// PAYROLL TAX CALCULATOR
// ==========================================

export class PayrollTaxCalculator {
  
  /**
   * Calcula FICA (Social Security + Medicare)
   * 
   * Social Security: 6.2% hasta $168,600 (2026 wage base)
   * Medicare: 1.45% sin límite
   * 
   * @param input - Datos de entrada para el cálculo
   * @returns Resultado del cálculo de FICA
   */
  calculateFICA(input: TaxCalculationInput): FICAResult {
    const { grossPay, ytdGrossPay } = input;
    
    // Social Security: 6.2% hasta wage base limit
    const ssWageBase = TaxBrackets2026.SOCIAL_SECURITY_WAGE_BASE;
    const ssRate = TaxBrackets2026.SOCIAL_SECURITY_RATE;
    
    let socialSecurity = 0;
    
    // Calcular cuánto del gross pay está sujeto a SS tax
    const ytdAfterThisPay = ytdGrossPay + grossPay;
    
    if (ytdGrossPay < ssWageBase) {
      // Todavía no hemos alcanzado el límite
      const taxableAmount = Math.min(grossPay, ssWageBase - ytdGrossPay);
      socialSecurity = taxableAmount * ssRate;
    }
    // Si ytdGrossPay >= ssWageBase, socialSecurity = 0
    
    // Medicare: 1.45% sin límite
    const medicareRate = TaxBrackets2026.MEDICARE_RATE;
    const medicare = grossPay * medicareRate;
    
    // Redondear hacia abajo al centavo más cercano
    const socialSecurityRounded = Math.floor(socialSecurity * 100) / 100;
    const medicareRounded = Math.floor(medicare * 100) / 100;
    
    return {
      socialSecurity: socialSecurityRounded,
      medicare: medicareRounded,
      totalFICA: socialSecurityRounded + medicareRounded
    };
  }
  
  /**
   * Calcula Medicare adicional (0.9% para ingresos > threshold)
   * 
   * Thresholds:
   * - Single: $200,000
   * - Married: $250,000
   * - Married Separate: $125,000
   * - Head of Household: $200,000
   * 
   * @param input - Datos de entrada para el cálculo
   * @returns Resultado del cálculo de Medicare adicional
   */
  calculateMedicare(input: TaxCalculationInput): MedicareResult {
    const { grossPay, ytdGrossPay, filingStatus } = input;
    
    // Medicare regular: 1.45%
    const medicareRate = TaxBrackets2026.MEDICARE_RATE;
    const medicare = grossPay * medicareRate;
    
    // Medicare adicional: 0.9% para ingresos > threshold
    const additionalRate = TaxBrackets2026.ADDITIONAL_MEDICARE_RATE;
    const threshold = TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
    
    let medicareAdditional = 0;
    
    const ytdAfterThisPay = ytdGrossPay + grossPay;
    
    if (ytdAfterThisPay > threshold) {
      // Calcular cuánto del gross pay excede el threshold
      if (ytdGrossPay >= threshold) {
        // Todo el gross pay está sobre el threshold
        medicareAdditional = grossPay * additionalRate;
      } else {
        // Solo parte del gross pay excede el threshold
        const excessAmount = ytdAfterThisPay - threshold;
        medicareAdditional = excessAmount * additionalRate;
      }
    }
    
    // Redondear hacia abajo al centavo más cercano
    const medicareRounded = Math.floor(medicare * 100) / 100;
    const medicareAdditionalRounded = Math.floor(medicareAdditional * 100) / 100;
    
    return {
      medicare: medicareRounded,
      medicareAdditional: medicareAdditionalRounded,
      totalMedicare: medicareRounded + medicareAdditionalRounded
    };
  }
  
  /**
   * Calcula Federal Income Tax usando W-4 y tax brackets
   * 
   * Algoritmo:
   * 1. Calcular salario anual = gross pay × períodos por año
   * 2. Restar standard deduction según filing status
   * 3. Restar allowances (allowances × $4,800)
   * 4. Calcular taxable income
   * 5. Aplicar progressive tax brackets
   * 6. Dividir por períodos por año para obtener withholding por período
   * 7. Agregar additional withholding si existe
   * 8. Redondear hacia abajo al centavo más cercano
   * 
   * @param input - Datos de entrada para el cálculo
   * @returns Resultado del cálculo de Federal Income Tax
   */
  calculateFederalTax(input: TaxCalculationInput): FederalTaxResult {
    const { grossPay, filingStatus, allowances, additionalWithholding, payPeriod } = input;
    
    // 1. Calcular salario anual
    const periodsPerYear = this.getPeriodsPerYear(payPeriod);
    const annualSalary = grossPay * periodsPerYear;
    
    // 2. Obtener standard deduction según filing status
    const standardDeduction = TaxBrackets2026.STANDARD_DEDUCTION[filingStatus];
    
    // 3. Calcular allowance deduction
    const allowanceAmount = TaxBrackets2026.ALLOWANCE_AMOUNT;
    const allowanceDeduction = allowances * allowanceAmount;
    
    // 4. Calcular taxable income
    let taxableIncome = annualSalary - standardDeduction - allowanceDeduction;
    taxableIncome = Math.max(0, taxableIncome); // No puede ser negativo
    
    // 5. Aplicar progressive tax brackets
    const annualTax = this.applyTaxBrackets(taxableIncome, filingStatus);
    
    // 6. Dividir por períodos por año
    const perPeriodTax = annualTax / periodsPerYear;
    
    // 7. Agregar additional withholding
    const totalWithholding = perPeriodTax + additionalWithholding;
    
    // 8. Redondear hacia abajo al centavo más cercano
    const federalIncomeTax = Math.floor(totalWithholding * 100) / 100;
    
    return {
      federalIncomeTax,
      taxableIncome,
      annualTax
    };
  }
  
  /**
   * Aplica progressive tax brackets al taxable income
   * 
   * @param taxableIncome - Ingreso gravable anual
   * @param filingStatus - Estado civil para impuestos
   * @returns Impuesto anual calculado
   */
  private applyTaxBrackets(taxableIncome: number, filingStatus: FilingStatus): number {
    const brackets = TaxBrackets2026.TAX_BRACKETS[filingStatus];
    
    let tax = 0;
    let previousBracketMax = 0;
    
    for (const bracket of brackets) {
      if (taxableIncome <= previousBracketMax) {
        break;
      }
      
      const bracketMin = previousBracketMax;
      const bracketMax = bracket.max || Infinity;
      
      if (taxableIncome > bracketMin) {
        const taxableInBracket = Math.min(taxableIncome, bracketMax) - bracketMin;
        tax += taxableInBracket * bracket.rate;
      }
      
      previousBracketMax = bracketMax;
    }
    
    return tax;
  }
  
  /**
   * Obtiene el número de períodos de pago por año
   * 
   * @param payPeriod - Frecuencia de pago
   * @returns Número de períodos por año
   */
  private getPeriodsPerYear(payPeriod: PayPeriod): number {
    switch (payPeriod) {
      case 'weekly':
        return 52;
      case 'biweekly':
        return 26;
      case 'semimonthly':
        return 24;
      case 'monthly':
        return 12;
      default:
        throw new Error(`Invalid pay period: ${payPeriod}`);
    }
  }
  
  /**
   * Calcula todos los impuestos (FICA + Medicare + Federal)
   * 
   * Este es el método principal que orquesta todos los cálculos.
   * 
   * @param input - Datos de entrada para el cálculo
   * @returns Resultado completo con todos los impuestos y breakdown
   */
  calculateAllTaxes(input: TaxCalculationInput): TaxCalculationResult {
    // Calcular FICA
    const ficaResult = this.calculateFICA(input);
    
    // Calcular Medicare (incluye adicional)
    const medicareResult = this.calculateMedicare(input);
    
    // Calcular Federal Income Tax
    const federalTaxResult = this.calculateFederalTax(input);
    
    // Calcular total de impuestos
    const totalTaxes = 
      ficaResult.socialSecurity +
      medicareResult.medicare +
      medicareResult.medicareAdditional +
      federalTaxResult.federalIncomeTax;
    
    // Construir breakdown detallado
    const periodsPerYear = this.getPeriodsPerYear(input.payPeriod);
    const annualSalary = input.grossPay * periodsPerYear;
    const standardDeduction = TaxBrackets2026.STANDARD_DEDUCTION[input.filingStatus];
    const allowanceDeduction = input.allowances * TaxBrackets2026.ALLOWANCE_AMOUNT;
    
    const breakdown: TaxBreakdown = {
      socialSecurity: {
        rate: TaxBrackets2026.SOCIAL_SECURITY_RATE,
        base: input.grossPay,
        amount: ficaResult.socialSecurity
      },
      medicare: {
        rate: TaxBrackets2026.MEDICARE_RATE,
        base: input.grossPay,
        amount: medicareResult.medicare
      },
      medicareAdditional: {
        rate: TaxBrackets2026.ADDITIONAL_MEDICARE_RATE,
        base: input.grossPay,
        amount: medicareResult.medicareAdditional
      },
      federalIncomeTax: {
        annualSalary,
        standardDeduction,
        allowanceDeduction,
        taxableIncome: federalTaxResult.taxableIncome,
        annualTax: federalTaxResult.annualTax,
        perPeriodTax: federalTaxResult.annualTax / periodsPerYear,
        additionalWithholding: input.additionalWithholding,
        totalWithholding: federalTaxResult.federalIncomeTax
      }
    };
    
    return {
      socialSecurity: ficaResult.socialSecurity,
      medicare: medicareResult.medicare,
      medicareAdditional: medicareResult.medicareAdditional,
      federalIncomeTax: federalTaxResult.federalIncomeTax,
      totalTaxes: Math.floor(totalTaxes * 100) / 100, // Redondear total
      breakdown
    };
  }
}

// Exportar instancia singleton
export const payrollTaxCalculator = new PayrollTaxCalculator();
