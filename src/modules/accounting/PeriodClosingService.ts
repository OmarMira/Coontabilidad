import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { type AccountingPeriod } from './Accounting.types';

export class PeriodClosingService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async createPeriod(period: Omit<AccountingPeriod, 'id' | 'status'>): Promise<number> {
        const sql = `INSERT INTO accounting_periods (name, start_date, end_date) VALUES (?, ?, ?)`;
        if ('run' in this.engine) {
            const res = await (this.engine as any).run(sql, [period.name, period.start_date, period.end_date]);
            return res.lastID;
        }
        return 0;
    }

    async closePeriod(id: number): Promise<boolean> {
        // Validation: Check if all entries in date range are posted? (Optional)
        // For MVP, just mark closed.
        if ('run' in this.engine) {
            const res = await (this.engine as any).run(`UPDATE accounting_periods SET status = 'closed', locked_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
            // Trigger snapshot creation here?
            // Not strictly required for MVP, but good practice.
            return true;
        }
        return false;
    }

    async getAllPeriods(): Promise<AccountingPeriod[]> {
        return (await this.engine.select(`SELECT * FROM accounting_periods ORDER BY start_date DESC`)) as AccountingPeriod[];
    }
}
