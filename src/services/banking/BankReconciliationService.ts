/**
 * Bank Reconciliation Service
 * 
 * Servicio para conciliación bancaria automática y manual.
 * Implementa algoritmos de matching entre transacciones bancarias
 * y asientos contables.
 */

export interface BankTransaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  reference?: string;
  type: 'debit' | 'credit';
  balance?: number;
}

export interface AccountingTransaction {
  id: number;
  entry_date: string;
  amount: number;
  description: string;
  reference?: string;
  account_code: string;
  type: 'debit' | 'credit';
}

export interface Match {
  bankTxId: number;
  accountingTxId: number;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'manual';
  reason: string;
}

export interface Discrepancy {
  type: 'missing_in_bank' | 'missing_in_accounting' | 'amount_difference' | 'duplicate';
  bankTx?: BankTransaction;
  accountingTx?: AccountingTransaction;
  difference?: number;
  description: string;
}

export interface ReconciliationResult {
  matches: Match[];
  discrepancies: Discrepancy[];
  unmatchedBankTxs: BankTransaction[];
  unmatchedAccountingTxs: AccountingTransaction[];
  summary: {
    totalBankTransactions: number;
    totalAccountingTransactions: number;
    matchedCount: number;
    unmatchedCount: number;
    discrepancyCount: number;
    matchRate: number; // percentage
  };
}

export class BankReconciliationService {
  /**
   * Realiza conciliación automática entre transacciones bancarias y contables
   */
  public reconcile(
    bankTxs: BankTransaction[],
    accountingTxs: AccountingTransaction[]
  ): ReconciliationResult {
    const matches: Match[] = [];
    const discrepancies: Discrepancy[] = [];
    const matchedBankIds = new Set<number>();
    const matchedAccountingIds = new Set<number>();

    // Paso 1: Exact Matching (mismo monto + misma fecha + misma referencia)
    const exactMatches = this.findExactMatches(bankTxs, accountingTxs);
    exactMatches.forEach(match => {
      matches.push(match);
      matchedBankIds.add(match.bankTxId);
      matchedAccountingIds.add(match.accountingTxId);
    });

    // Paso 2: Fuzzy Matching (mismo monto + fecha ±3 días)
    const unmatchedBank = bankTxs.filter(tx => !matchedBankIds.has(tx.id));
    const unmatchedAccounting = accountingTxs.filter(tx => !matchedAccountingIds.has(tx.id));
    
    const fuzzyMatches = this.findFuzzyMatches(unmatchedBank, unmatchedAccounting);
    fuzzyMatches.forEach(match => {
      matches.push(match);
      matchedBankIds.add(match.bankTxId);
      matchedAccountingIds.add(match.accountingTxId);
    });

    // Paso 3: Detectar discrepancias
    const finalUnmatchedBank = bankTxs.filter(tx => !matchedBankIds.has(tx.id));
    const finalUnmatchedAccounting = accountingTxs.filter(tx => !matchedAccountingIds.has(tx.id));

    // Detectar transacciones faltantes
    finalUnmatchedBank.forEach(tx => {
      discrepancies.push({
        type: 'missing_in_accounting',
        bankTx: tx,
        description: `Transacción bancaria sin registro contable: ${tx.description}`
      });
    });

    finalUnmatchedAccounting.forEach(tx => {
      discrepancies.push({
        type: 'missing_in_bank',
        accountingTx: tx,
        description: `Registro contable sin transacción bancaria: ${tx.description}`
      });
    });

    // Calcular resumen
    const summary = {
      totalBankTransactions: bankTxs.length,
      totalAccountingTransactions: accountingTxs.length,
      matchedCount: matches.length,
      unmatchedCount: finalUnmatchedBank.length + finalUnmatchedAccounting.length,
      discrepancyCount: discrepancies.length,
      matchRate: bankTxs.length > 0 ? (matches.length / bankTxs.length) * 100 : 0
    };

    return {
      matches,
      discrepancies,
      unmatchedBankTxs: finalUnmatchedBank,
      unmatchedAccountingTxs: finalUnmatchedAccounting,
      summary
    };
  }

  /**
   * Encuentra matches exactos: mismo monto, misma fecha, misma referencia
   */
  private findExactMatches(
    bankTxs: BankTransaction[],
    accountingTxs: AccountingTransaction[]
  ): Match[] {
    const matches: Match[] = [];

    bankTxs.forEach(bankTx => {
      accountingTxs.forEach(accTx => {
        // Comparar monto (considerar signo según tipo)
        const bankAmount = bankTx.type === 'debit' ? -bankTx.amount : bankTx.amount;
        const accAmount = accTx.type === 'debit' ? -accTx.amount : accTx.amount;
        
        if (Math.abs(bankAmount - accAmount) < 0.01) { // Tolerancia de 1 centavo
          // Comparar fecha
          if (bankTx.date === accTx.entry_date) {
            // Comparar referencia si existe
            if (bankTx.reference && accTx.reference && bankTx.reference === accTx.reference) {
              matches.push({
                bankTxId: bankTx.id,
                accountingTxId: accTx.id,
                confidence: 100,
                matchType: 'exact',
                reason: 'Monto, fecha y referencia coinciden exactamente'
              });
            } else if (!bankTx.reference && !accTx.reference) {
              // Si ninguno tiene referencia, es match exacto por monto y fecha
              matches.push({
                bankTxId: bankTx.id,
                accountingTxId: accTx.id,
                confidence: 95,
                matchType: 'exact',
                reason: 'Monto y fecha coinciden exactamente'
              });
            }
          }
        }
      });
    });

    return matches;
  }

  /**
   * Encuentra matches fuzzy: mismo monto, fecha ±3 días, descripción similar
   */
  private findFuzzyMatches(
    bankTxs: BankTransaction[],
    accountingTxs: AccountingTransaction[]
  ): Match[] {
    const matches: Match[] = [];
    const matchedAccounting = new Set<number>();

    for (const bankTx of bankTxs) {
      let bestMatchAccTx: AccountingTransaction | null = null;
      let bestMatchScore = 0;

      for (const accTx of accountingTxs) {
        if (matchedAccounting.has(accTx.id)) continue;

        // Comparar monto
        const bankAmount = bankTx.type === 'debit' ? -bankTx.amount : bankTx.amount;
        const accAmount = accTx.type === 'debit' ? -accTx.amount : accTx.amount;
        
        if (Math.abs(bankAmount - accAmount) < 0.01) {
          // Comparar fecha (±3 días)
          const bankDate = new Date(bankTx.date);
          const accDate = new Date(accTx.entry_date);
          const daysDiff = Math.abs((bankDate.getTime() - accDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 3) {
            // Calcular similitud de descripción
            const similarity = this.calculateStringSimilarity(
              bankTx.description.toLowerCase(),
              accTx.description.toLowerCase()
            );

            // Calcular score total
            const dateScore = (3 - daysDiff) / 3 * 30; // Max 30 puntos
            const descScore = similarity * 20; // Max 20 puntos
            const amountScore = 50; // 50 puntos por monto exacto
            const totalScore = dateScore + descScore + amountScore;

            if (totalScore > 70 && totalScore > bestMatchScore) {
              bestMatchAccTx = accTx;
              bestMatchScore = totalScore;
            }
          }
        }
      }

      if (bestMatchAccTx !== null) {
        const bankDate = new Date(bankTx.date);
        const accDate = new Date(bestMatchAccTx.entry_date);
        const daysDiff = Math.abs((bankDate.getTime() - accDate.getTime()) / (1000 * 60 * 60 * 24));
        
        matches.push({
          bankTxId: bankTx.id,
          accountingTxId: bestMatchAccTx.id,
          confidence: Math.round(bestMatchScore),
          matchType: 'fuzzy',
          reason: `Monto coincide, fecha ±${daysDiff.toFixed(0)} días`
        });
        matchedAccounting.add(bestMatchAccTx.id);
      }
    }

    return matches;
  }

  /**
   * Calcula similitud entre dos strings usando algoritmo de Levenshtein simplificado
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Simplificado: contar palabras en común
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return commonWords / totalWords;
  }

  /**
   * Crea un match manual entre una transacción bancaria y una contable
   */
  public createManualMatch(
    bankTxId: number,
    accountingTxId: number,
    reason: string
  ): Match {
    return {
      bankTxId,
      accountingTxId,
      confidence: 100,
      matchType: 'manual',
      reason: `Match manual: ${reason}`
    };
  }

  /**
   * Genera reporte de conciliación
   */
  public generateReport(result: ReconciliationResult, periodName: string): string {
    const { summary, matches, discrepancies } = result;
    
    let report = `REPORTE DE CONCILIACIÓN BANCARIA\n`;
    report += `Período: ${periodName}\n`;
    report += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
    report += `\n`;
    report += `RESUMEN:\n`;
    report += `- Transacciones bancarias: ${summary.totalBankTransactions}\n`;
    report += `- Registros contables: ${summary.totalAccountingTransactions}\n`;
    report += `- Coincidencias: ${summary.matchedCount}\n`;
    report += `- Sin coincidencia: ${summary.unmatchedCount}\n`;
    report += `- Discrepancias: ${summary.discrepancyCount}\n`;
    report += `- Tasa de coincidencia: ${summary.matchRate.toFixed(1)}%\n`;
    report += `\n`;

    if (matches.length > 0) {
      report += `COINCIDENCIAS:\n`;
      matches.forEach((match, i) => {
        report += `${i + 1}. ${match.matchType.toUpperCase()} (${match.confidence}%) - ${match.reason}\n`;
      });
      report += `\n`;
    }

    if (discrepancies.length > 0) {
      report += `DISCREPANCIAS:\n`;
      discrepancies.forEach((disc, i) => {
        report += `${i + 1}. ${disc.type}: ${disc.description}\n`;
      });
      report += `\n`;
    }

    return report;
  }
}

// Singleton instance
export const bankReconciliationService = new BankReconciliationService();
