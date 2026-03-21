import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { type TrialBalanceRow } from './Accounting.types';
import { AccountingEngine } from './AccountingEngine';

export class TrialBalanceService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    /**
     * Genera el Balance de Comprobación para un período específico
     * @param periodStart Fecha inicial YYYY-MM-DD
     * @param periodEnd Fecha final YYYY-MM-DD
     */
    async generateTrialBalance(periodStart: string, periodEnd: string): Promise<TrialBalanceRow[]> {
        const query = `
            SELECT 
                a.account_code,
                a.account_name,
                a.account_type,
                a.normal_balance,
                -- Saldo anterior (suma de todo lo previo al inicio del período)
                COALESCE(SUM(CASE WHEN je.entry_date < ? THEN jd.debit_amount ELSE 0 END), 0) as previous_debit,
                COALESCE(SUM(CASE WHEN je.entry_date < ? THEN jd.credit_amount ELSE 0 END), 0) as previous_credit,
                -- Movimientos del período
                COALESCE(SUM(CASE WHEN je.entry_date BETWEEN ? AND ? THEN jd.debit_amount ELSE 0 END), 0) as period_debit,
                COALESCE(SUM(CASE WHEN je.entry_date BETWEEN ? AND ? THEN jd.credit_amount ELSE 0 END), 0) as period_credit
            FROM chart_of_accounts a
            LEFT JOIN journal_details jd ON a.account_code = jd.account_code
            LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
            WHERE a.is_active = 1
            GROUP BY a.account_code, a.account_name, a.account_type, a.normal_balance
            ORDER BY a.account_code;
        `;

        const results = await this.engine.select(query, [
            periodStart, periodStart, // Para previous_debit/credit
            periodStart, periodEnd,   // Para period_debit
            periodStart, periodEnd    // Para period_credit
        ]);

        return AccountingEngine.mapTrialBalanceResults(results);
    }

    /**
     * Valida que la ecuación contable se cumpla (Débitos = Créditos)
     */
    validateAccountingEquation(data: TrialBalanceRow[]): { isValid: boolean; difference: number; errors: string[] } {
        const check = AccountingEngine.verifyAccountingEquation(data);
        const errors: string[] = [];

        if (!check.isBalanced) {
            errors.push(`Desbalance detectado en movimientos del período. Diferencia: ${check.difference}`);
        }

        return { isValid: check.isBalanced, difference: check.difference, errors };
    }

    /**
     * Obtiene el detalle de movimientos de una cuenta para drill-down
     */
    async getAccountMovements(accountCode: string, start: string, end: string): Promise<any[]> {
        const query = `
            SELECT 
                je.entry_date as date,
                je.reference,
                je.description as entry_desc,
                jd.description as line_desc,
                jd.debit_amount as debit,
                jd.credit_amount as credit
            FROM journal_details jd
            JOIN journal_entries je ON jd.journal_entry_id = je.id
            WHERE jd.account_code = ? AND je.entry_date BETWEEN ? AND ?
            ORDER BY je.entry_date ASC, je.id ASC
        `;
        return await this.engine.select(query, [accountCode, start, end]);
    }
}
