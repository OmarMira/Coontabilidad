import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { type TrialBalanceRow } from './Accounting.types';

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

        return results.map((row: any) => {
            const prevDebit = Number(row.previous_debit) || 0;
            const prevCredit = Number(row.previous_credit) || 0;
            const perDebit = Number(row.period_debit) || 0;
            const perCredit = Number(row.period_credit) || 0;

            // Saldo inicial (Anterior)
            let initial_balance = 0;
            if (row.normal_balance === 'debit') {
                initial_balance = prevDebit - prevCredit;
            } else {
                initial_balance = prevCredit - prevDebit;
            }

            // Totales acumulados
            const total_debit = prevDebit + perDebit;
            const total_credit = prevCredit + perCredit;

            // Saldo final
            let final_balance = 0;
            if (row.normal_balance === 'debit') {
                final_balance = total_debit - total_credit;
            } else {
                final_balance = total_credit - total_debit;
            }

            return {
                account_code: row.account_code,
                account_name: row.account_name,
                account_type: row.account_type,
                normal_balance: row.normal_balance as 'debit' | 'credit',
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

    /**
     * Valida que la ecuación contable se cumpla (Débitos = Créditos)
     */
    validateAccountingEquation(data: TrialBalanceRow[]): { isValid: boolean; difference: number; errors: string[] } {
        const sumDebit = data.reduce((acc, row) => acc + row.period_debit, 0);
        const sumCredit = data.reduce((acc, row) => acc + row.period_credit, 0);
        const difference = Math.abs(sumDebit - sumCredit);
        const isValid = difference < 0.001; // Tolerancia estricta para asegurar balance exacto

        const errors: string[] = [];
        if (!isValid) {
            errors.push(`Desbalance detectado en movimientos del período: Débitos ($${sumDebit.toLocaleString()}) != Créditos ($${sumCredit.toLocaleString()})`);
        }

        return { isValid, difference, errors };
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
