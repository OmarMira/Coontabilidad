/**
 * VALIDADOR DE PARTIDA DOBLE
 *
 * Validación automática de integridad contable + validaciones preventivas de clasificación (Fase 4).
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

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDACIONES PREVENTIVAS — Fase 4 Copiloto
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Infiere el tipo de cuenta según el prefijo del código (US GAAP estándar).
   * 1xxx → asset | 2xxx → liability | 3xxx → equity
   * 4xxx → revenue | 5xxx-6xxx → expense
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
   * Valida la consistencia de clasificación en las líneas de un asiento.
   * Detecta combinaciones contablemente inválidas antes de persistir.
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

    const PAYROLL_KEYWORDS = ['payroll', 'wages', 'nomina', 'nómina', 'salario'];

    lines.forEach((line, idx) => {
      const code = (line.account_code || '').trim();
      if (!code) return;

      const inferredType = line.account_type || DoubleEntryValidator.inferAccountType(code);
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const detailType = (line.detail_type || '').toLowerCase();
      const lineLabel = `cuenta ${code}`;

      // Regla 1: Gastos no deben recibir crédito directo
      if (inferredType === 'expense' && credit > 0) {
        const reason = `Clasificación inválida: Los Gastos (${lineLabel}) normalmente reciben Débito, no Crédito. Verifique si corresponde a una reversión.`;
        console.warn(`[WARN] Validación preventiva fallida: ${reason}`);
        warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'warning' });
      }

      // Regla 2: Ingresos no deben recibir débito directo
      if (inferredType === 'revenue' && debit > 0) {
        const reason = `Clasificación inválida: Los Ingresos (${lineLabel}) normalmente reciben Crédito, no Débito. Verifique si corresponde a una devolución.`;
        console.warn(`[WARN] Validación preventiva fallida: ${reason}`);
        warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'warning' });
      }

      // Regla 3: Payroll/Wages NO puede registrarse en Activos o Patrimonio
      const isPayrollDetail = PAYROLL_KEYWORDS.some(kw => detailType.includes(kw));
      const isPayrollDesc = PAYROLL_KEYWORDS.some(kw =>
        (line.description || '').toLowerCase().includes(kw)
      );
      if ((isPayrollDetail || isPayrollDesc) && (inferredType === 'asset' || inferredType === 'equity')) {
        const typeName = inferredType === 'asset' ? 'Activo' : 'Patrimonio';
        const reason = `Clasificación inválida: Gastos de nómina/salarios (${lineLabel}) no deben registrarse en cuentas de ${typeName}. Use una cuenta de Gasto (6xxx).`;
        console.warn(`[WARN] Validación preventiva fallida: ${reason}`);
        warnings.push({ lineIndex: idx, account_code: code, reason, severity: 'error' });
      }

      // Regla 4: Patrimonio no debe recibir gastos operativos directos
      if (inferredType === 'equity' && debit > 0 && !isPayrollDetail) {
        const desc = (line.description || '').toLowerCase();
        const isOpEx = ['gasto', 'expense', 'suministro', 'alquiler', 'servicio'].some(kw => desc.includes(kw));
        if (isOpEx) {
          const reason = `Clasificación inválida: Gastos operativos en ${lineLabel} (Patrimonio/3xxx). Los gastos deben ir en cuentas 5xxx-6xxx.`;
          console.warn(`[WARN] Validación preventiva fallida: ${reason}`);
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
   * Valida la combinación account_type + detail_type al crear o editar una cuenta.
   * Retorna un ClassificationWarning si hay problema, o null si todo está correcto.
   */
  static validateAccountDefinition(
    accountType: string,
    detailType: string
  ): ClassificationWarning | null {
    if (!detailType) return null;

    const PAYROLL_KEYWORDS = ['payroll', 'wages', 'nomina', 'nómina', 'salario'];
    const dt = detailType.toLowerCase();
    const isPayroll = PAYROLL_KEYWORDS.some(kw => dt.includes(kw));

    if (isPayroll && (accountType === 'asset' || accountType === 'equity')) {
      const typeName = accountType === 'asset' ? 'Activo' : 'Patrimonio';
      const reason = `¡Atención! "${detailType}" es un gasto de nómina y no debería clasificarse como ${typeName}. Considere usar tipo Gasto (Expense).`;
      console.warn(`[WARN] Validación preventiva fallida: ${reason}`);
      return { lineIndex: -1, account_code: '', reason, severity: 'warning' };
    }

    const INCOME_DETAILS = ['sales', 'service income', 'revenue'];
    const isIncome = INCOME_DETAILS.some(kw => dt.includes(kw));
    if (isIncome && (accountType === 'expense' || accountType === 'asset')) {
      const typeName = accountType === 'expense' ? 'Gasto' : 'Activo';
      const reason = `¡Atención! "${detailType}" es un tipo de ingreso y no debería clasificarse como ${typeName}. Use tipo Ingreso (Revenue).`;
      console.warn(`[WARN] Validación preventiva fallida: ${reason}`);
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
