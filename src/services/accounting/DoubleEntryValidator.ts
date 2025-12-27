/**
 * VALIDADOR DE PARTIDA DOBLE
 * 
 * Validación automática de integridad contable
 */

export interface JournalEntry {
  id: number;
  date: string;
  description: string;
  reference: string;
  details: JournalEntryDetail[];
}

export interface JournalEntryDetail {
  account_id: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

export class DoubleEntryValidator {
  static validateJournalEntry(entry: JournalEntry): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 1. Verificar que hay al menos 2 líneas
    if (entry.details.length < 2) {
      errors.push('Un asiento contable debe tener al menos 2 líneas');
    }
    
    // 2. Calcular totales
    const totalDebits = entry.details.reduce((sum, detail) => sum + (detail.debit || 0), 0);
    const totalCredits = entry.details.reduce((sum, detail) => sum + (detail.credit || 0), 0);
    
    // 3. Verificar balance (permitir diferencia de centavos por redondeo)
    const difference = Math.abs(totalDebits - totalCredits);
    if (difference > 0.01) {
      errors.push(`Los débitos (${totalDebits.toFixed(2)}) no igualan los créditos (${totalCredits.toFixed(2)}). Diferencia: ${difference.toFixed(2)}`);
    }
    
    // 4. Verificar que cada línea tenga débito O crédito (no ambos)
    for (const detail of entry.details) {
      const hasDebit = (detail.debit || 0) > 0;
      const hasCredit = (detail.credit || 0) > 0;
      
      if (hasDebit && hasCredit) {
        errors.push(`La cuenta ${detail.account_code} no puede tener débito Y crédito en la misma línea`);
      }
      
      if (!hasDebit && !hasCredit) {
        errors.push(`La cuenta ${detail.account_code} debe tener débito O crédito`);
      }
    }
    
    // 5. Verificar cuentas duplicadas
    const accountCodes = entry.details.map(d => d.account_code);
    const duplicates = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Cuentas duplicadas detectadas: ${duplicates.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totals: {
        debits: totalDebits,
        credits: totalCredits,
        difference
      }
    };
  }
  
  static generateBalanceSheet(entries: JournalEntry[]): BalanceSheet {
    const accounts = new Map<string, AccountBalance>();
    
    // Procesar todos los asientos
    for (const entry of entries) {
      for (const detail of entry.details) {
        if (!accounts.has(detail.account_code)) {
          accounts.set(detail.account_code, {
            code: detail.account_code,
            name: detail.account_name,
            debits: 0,
            credits: 0,
            balance: 0
          });
        }
        
        const account = accounts.get(detail.account_code)!;
        account.debits += detail.debit || 0;
        account.credits += detail.credit || 0;
        account.balance = account.debits - account.credits;
      }
    }
    
    // Clasificar cuentas
    const assets = Array.from(accounts.values()).filter(acc => acc.code.startsWith('1'));
    const liabilities = Array.from(accounts.values()).filter(acc => acc.code.startsWith('2'));
    const equity = Array.from(accounts.values()).filter(acc => acc.code.startsWith('3'));
    
    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    
    return {
      date: new Date().toISOString(),
      assets,
      liabilities,
      equity,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    };
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totals: {
    debits: number;
    credits: number;
    difference: number;
  };
}

export interface AccountBalance {
  code: string;
  name: string;
  debits: number;
  credits: number;
  balance: number;
}

export interface BalanceSheet {
  date: string;
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    balanced: boolean;
  };
}
