import { type JournalEntry, type JournalLine, type TrialBalanceRow } from './Accounting.types';
import { translationEngine } from '../../core/i18n/TranslationEngine';

/**
 * ACCOUNTING ENGINE (CORE LAYER 1)
 * 
 * Centralización de la lógica de partida doble, cálculos de saldo
 * y validación de la ecuación contable.
 */
export class AccountingEngine {

    /**
     * Valida la integridad de un asiento contable.
     * Regla de Oro: Débitos = Créditos.
     */
    static validateDoubleEntry(details: JournalLine[]): { isValid: boolean; difference: number; totalDebit: number; totalCredit: number } {
        let totalDebit = 0;
        let totalCredit = 0;

        for (const line of details) {
            totalDebit += Number(line.debit) || 0;
            totalCredit += Number(line.credit) || 0;
        }

        const difference = Math.abs(totalDebit - totalCredit);
        // Tolerancia de 0.009 para evitar errores de coma flotante en centavos
        const isValid = difference < 0.009 && details.length >= 2;

        return {
            isValid,
            difference,
            totalDebit,
            totalCredit
        };
    }

    /**
     * Calcula el saldo de una cuenta basado en su naturaleza.
     * Naturaleza Deudora (Debit): Saldo = Débitos - Créditos
     * Naturaleza Acreedora (Credit): Saldo = Créditos - Débitos
     */
    static calculateAccountBalance(debits: number, credits: number, normalBalance: 'debit' | 'credit'): number {
        if (normalBalance === 'debit') {
            return debits - credits;
        }
        return credits - debits;
    }

    /**
     * Verifica la Ecuación Contable: Activo = Pasivo + Patrimonio
     * O en términos de sumatoria: Total Débitos = Total Créditos
     */
    static verifyAccountingEquation(rows: TrialBalanceRow[]): { isBalanced: boolean; difference: number } {
        const sumDebit = rows.reduce((acc, row) => acc + (row.period_debit || 0), 0);
        const sumCredit = rows.reduce((acc, row) => acc + (row.period_credit || 0), 0);

        const difference = Math.abs(sumDebit - sumCredit);
        return {
            isBalanced: difference < 0.009,
            difference
        };
    }

    /**
     * Procesa los resultados brutos de la base de datos para generar filas de Trial Balance.
     */
    static mapTrialBalanceResults(results: any[]): TrialBalanceRow[] {
        return results.map((row: any) => {
            const prevDebit = Number(row.previous_debit) || 0;
            const prevCredit = Number(row.previous_credit) || 0;
            const perDebit = Number(row.period_debit) || 0;
            const perCredit = Number(row.period_credit) || 0;

            const total_debit = prevDebit + perDebit;
            const total_credit = prevCredit + perCredit;
            const normal_balance = (row.normal_balance as 'debit' | 'credit') || 'debit';

            const initial_balance = this.calculateAccountBalance(prevDebit, prevCredit, normal_balance);
            const final_balance = this.calculateAccountBalance(total_debit, total_credit, normal_balance);

            return {
                account_code: row.account_code,
                account_name: row.account_name, // Nota: El nombre en DB suele ser fijo, pero el tipo sí lo traducimos
                account_type: translationEngine.t(row.account_type || 'account'),
                normal_balance, // Mantener valor crudo para cumplir contrato de interfaz
                previous_debit: prevDebit,
                previous_credit: prevCredit,
                period_debit: perDebit,
                period_credit: perCredit,
                total_debit,
                total_credit,
                initial_balance,
                final_balance
            };
        });
    }
}
