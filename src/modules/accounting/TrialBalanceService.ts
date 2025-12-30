import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { type TrialBalanceRow } from './Accounting.types';

export class TrialBalanceService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async getTrialBalance(): Promise<TrialBalanceRow[]> {
        // Query the live view
        // Fallback query if view not available in test mocks?
        const sql = `SELECT * FROM v_trial_balance_live ORDER BY account_code ASC`;
        try {
            const rows = await this.engine.select(sql);
            return rows.map((r: any) => ({
                account_code: r.account_code,
                account_name: r.account_name,
                debit: r.total_debit || 0,
                credit: r.total_credit || 0,
                net: r.net_balance || 0
            }));
        } catch (e) {
            console.error("View v_trial_balance_live might not exist, falling back to manual query");
            // Fallback for resilience
            const manualSql = `
                SELECT 
                    jd.account_code,
                    MAX(ca.name) as account_name,
                    SUM(jd.debit) as total_debit,
                    SUM(jd.credit) as total_credit,
                    SUM(jd.debit) - SUM(jd.credit) as net_balance
                FROM journal_details jd
                LEFT JOIN chart_of_accounts ca ON jd.account_code = ca.code
                GROUP BY jd.account_code
                ORDER BY jd.account_code ASC
            `;
            const rows = await this.engine.select(manualSql);
            return rows.map((r: any) => ({
                account_code: r.account_code,
                account_name: r.account_name || 'Unknown',
                debit: r.total_debit || 0,
                credit: r.total_credit || 0,
                net: r.net_balance || 0
            }));
        }
    }
}
