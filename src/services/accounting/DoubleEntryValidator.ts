/**
 * VALIDADOR DE PARTIDA DOBLE
 *
 * ValidaciÃ³n automÃ¡tica de integridad contable + validaciones preventivas de clasificaciÃ³n (Fase 4).
 */

import { logger } from '../../core/logging/SystemLogger';
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

    // 1. Verificar que hay al menos 2 lÃ­neas
    if (entry.details.length < 2) {
      errors.push('Un asiento contable debe tener al menos 2 lÃ­neas');
    }

    // 2. Calcular totales
    const totalDebits = entry.details.reduce((sum, detail) => sum + (detail.debit || 0), 0);
    const totalCredits = entry.details.reduce((sum, detail) => sum + (detail.credit || 0), 0);

    // 3. Verificar balance (permitir diferencia de centavos por redondeo)
    const difference = Math.abs(totalDebits - totalCredits);
    if (difference > 0.01) {
      errors.push(`Los dÃ©bitos (${totalDebits.toFixed(2)}) no igualan los crÃ©ditos (${totalCredits.toFixed(2)}). Diferencia: ${difference.toFixed(2)}`);
    }

    // 4. Verificar que cada lÃ­nea tenga dÃ©bito O crÃ©dito (no ambos)
    for (const detail of entry.details) {
      const hasDebit = (detail.debit || 0) > 0;
      const hasCredit = (detail.credit || 0) > 0;

      if (hasDebit && hasCredit) {
        errors.push(`La cuenta ${detail.account_code} no puede tener dÃ©bito Y crÃ©dito en la misma lÃ­nea`);
      }

      if (!hasDebit && !hasCredit) {
        errors.push(`La cuenta ${detail.account_code} debe tener dÃ©bito O crÃ©dito`);
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VALIDACIONES PREVENTIVAS â€” Fase 4 Copiloto
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Infiere el tipo de cuenta segÃºn el prefijo del cÃ³digo (US GAAP estÃ¡ndar).
   * 1xxx â†’ asset | 2xxx â†’ liability | 3xxx â†’ equity
   * 4xxx â†’ revenue | 5xxx-6xxx â†’ expense
   */
  static inferAccountType(accountCode: string): string {
    if (!accountCode) return 'unknown';
    const prefix = accountCode.trim().charAt(0);
    if (prefix === '1') return 'asset';
    if (prefix === '2') return 'liability';
    if (prefix === '3') return 'equity';
    if (prefix === '4') return 'revenue';
    if (prefix === '5' || prefix === '6') return 'expense';
    return 'unknown';
  }

  /**
   * Valida la consistencia de clasificaciÃ³n en las lÃ­neas de un asiento.
   * Detecta combinaciones contablemente invÃ¡lidas antes de persistir.
   */
  static validateAccountTypeConsistency(
    lines: Array<{
      account_code: string;
      account_type?: string;
      detail_type?: string;
      debit: number;
      credit: number;
      description?: string;
    }>
  ): ClassificationResult {
    const warnings: ClassificationWarning[] = [];

    const PAYROLL_KEYWORDS = ['payroll', 'wages', 'nomina', 'nÃ³mina', 'salario'];

    lines.forEach((line, idx) => {
      const code = (line.account_code || '').trim();
      if (!code) return;

      const inferredType = line.account_type || DoubleEntryValidator.inferAccountType(code);
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const detailType = (line.detail_type || '').toLowerCase();
      const lineLabel = `cuenta ${code}`;

      // Regla 1: Gastos no deben recibir crÃ©dito directo
      if (inferredType === 'expense' && credit > 0) {
        const reason = `ClasificaciÃ³n invÃ¡lida: Los Gastos (${lineLabel}) normalmente reciben DÃ©bito, no CrÃ©dito. Verifique si corresponde a una reversiÃ³n.`;
        logger.warn('DoubleEntryValidator', 'preventive_validation', '[WARN] Validacion preventiva fallida');
        warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'warning' });
      }

      // Regla 2: Ingresos no deben recibir dÃ©bito directo
      if (inferredType === 'revenue' && debit > 0) {
        const reason = `ClasificaciÃ³n invÃ¡lida: Los Ingresos (${lineLabel}) normalmente reciben CrÃ©dito, no DÃ©bito. Verifique si corresponde a una devoluciÃ³n.`;
        logger.warn('DoubleEntryValidator', 'preventive_validation', '[WARN] Validacion preventiva fallida');
        warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'warning' });
      }

      // Regla 3: Payroll/Wages NO puede registrarse en Activos o Patrimonio
      const isPayrollDetail = PAYROLL_KEYWORDS.some(kw => detailType.includes(kw));
      const isPayrollDesc = PAYROLL_KEYWORDS.some(kw =>
        (line.description || '').toLowerCase().includes(kw)
      );
      if ((isPayrollDetail || isPayrollDesc) && (inferredType === 'asset' || inferredType === 'equity')) {
        const typeName = inferredType === 'asset' ? 'Activo' : 'Patrimonio';
        const reason = `ClasificaciÃ³n invÃ¡lida: Gastos de nÃ³mina/salarios (${lineLabel}) no deben registrarse en cuentas de ${typeName}. Use una cuenta de Gasto (6xxx).`;
        logger.warn('DoubleEntryValidator', 'preventive_validation', '[WARN] Validacion preventiva fallida');
        warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'error' });
      }

      // Regla 4: Patrimonio no debe recibir gastos operativos directos
      if (inferredType === 'equity' && debit > 0 && !isPayrollDetail) {
        const desc = (line.description || '').toLowerCase();
        const isOpEx = ['gasto', 'expense', 'suministro', 'alquiler', 'servicio'].some(kw => desc.includes(kw));
        if (isOpEx) {
          const reason = `ClasificaciÃ³n invÃ¡lida: Gastos operativos en ${lineLabel} (Patrimonio/3xxx). Los gastos deben ir en cuentas 5xxx-6xxx.`;
          logger.warn('DoubleEntryValidator', 'preventive_validation', '[WARN] Validacion preventiva fallida');
          warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'warning' });
        }
      }
    });

    return {
      valid: !warnings.some(w => w.severity === 'error'),
      warnings
    };
  }

  /**
   * Valida la combinaciÃ³n account_type + detail_type al crear o editar una cuenta.
   * Retorna un ClassificationWarning si hay problema, o null si todo estÃ¡ correcto.
   */
  static validateAccountDefinition(
    accountType: string,
    detailType: string
  ): ClassificationWarning | null {
    if (!detailType) return null;

    const PAYROLL_KEYWORDS = ['payroll', 'wages', 'nomina', 'nÃ³mina', 'salario'];
    const dt = detailType.toLowerCase();
    const isPayroll = PAYROLL_KEYWORDS.some(kw => dt.includes(kw));

    if (isPayroll && (accountType === 'asset' || accountType === 'equity')) {
      const typeName = accountType === 'asset' ? 'Activo' : 'Patrimonio';
      const reason = `Â¡AtenciÃ³n! "${detailType}" es un gasto de nÃ³mina y no deberÃ­a clasificarse como ${typeName}. Considere usar tipo Gasto (Expense).`;
      logger.warn('DoubleEntryValidator', 'preventive_validation', '[WARN] Validacion preventiva fallida');
      return { lineIndex: -1, account_code: '', reason, severity: 'warning' };
    }

    const INCOME_DETAILS = ['sales', 'service income', 'revenue'];
    const isIncome = INCOME_DETAILS.some(kw => dt.includes(kw));
    if (isIncome && (accountType === 'expense' || accountType === 'asset')) {
      const typeName = accountType === 'expense' ? 'Gasto' : 'Activo';
      const reason = `Â¡AtenciÃ³n! "${detailType}" es un tipo de ingreso y no deberÃ­a clasificarse como ${typeName}. Use tipo Ingreso (Revenue).`;
      logger.warn('DoubleEntryValidator', 'preventive_validation', '[WARN] Validacion preventiva fallida');
      return { lineIndex: -1, account_code: '', reason, severity: 'warning' };
    }

    return null;
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

export interface ClassificationWarning {
  lineIndex: number;
  account_code: string;
  reason: string;
  severity: 'warning' | 'error';
}

export interface ClassificationResult {
  valid: boolean;
  warnings: ClassificationWarning[];
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

