import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import Big from 'big.js';

interface JournalEntryDetail {
    accountCode: string;
    description?: string;
    debit: Big;
    credit: Big;
}

export interface JournalEntryRequest {
    date: string; // ISO Date String
    description: string;
    reference: string;
    details: JournalEntryDetail[];
}

export class JournalManager {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    /**
     * Create a Journal Entry. 
     * MUST be called inside a Transaction usually, but capable of running standalone (e.g. Manual Entry).
     * If running standalone, call within engine.executeTransaction externally.
     */
    async createJournalEntry(entry: JournalEntryRequest): Promise<void> {
        // 1. Verify Period is Open
        const periodOpen = await this.isPeriodOpen(entry.date);
        if (!periodOpen) {
            throw new Error(`ACCOUNTING_ERROR: Period for date ${entry.date} is CLOSED or not defined.`);
        }

        // 2. Validate Balance (Double Entry Rule)
        this.validateBalance(entry.details);

        // 3. Calculated Total
        const totalAmount = entry.details.reduce((sum, d) => sum.plus(d.debit), Big(0));

        // 4. Insert Header
        await this.engine.run(`
            INSERT INTO journal_entries (entry_date, description, reference, total, status)
            VALUES (?, ?, ?, ?, 'posted')
        `, [entry.date, entry.description, entry.reference, totalAmount.toFixed(2)]);

        const jeIdResult = await this.engine.select("SELECT last_insert_rowid() as id");
        const jeId = jeIdResult[0].id;

        // 5. Insert Details
        for (const detail of entry.details) {
            await this.engine.run(`
                INSERT INTO journal_details (journal_id, account_code, debit, credit, description)
                VALUES (?, ?, ?, ?, ?)
            `, [
                jeId,
                detail.accountCode,
                detail.debit.toFixed(2),
                detail.credit.toFixed(2),
                detail.description || ''
            ]);
        }

        console.log(`[Journal] Posted JE #${jeId}: ${entry.description}`);
    }

    private validateBalance(details: JournalEntryDetail[]) {
        let totalDebit = Big(0);
        let totalCredit = Big(0);

        for (const d of details) {
            totalDebit = totalDebit.plus(d.debit);
            totalCredit = totalCredit.plus(d.credit);
        }

        // Allow tiny epsilon? No, Accounting must be EXACT. 
        // Big.js handles exact decimals.
        if (!totalDebit.eq(totalCredit)) {
            throw new Error(`ACCOUNTING_IMBALANCE: Debits (${totalDebit.toFixed(2)}) != Credits (${totalCredit.toFixed(2)})`);
        }
    }

    private async isPeriodOpen(date: string): Promise<boolean> {
        // Find logic for open periods
        const results = await this.engine.select(`
            SELECT status FROM accounting_periods 
            WHERE ? BETWEEN start_date AND end_date
        `, [date]);

        if (results.length === 0) {
            // If no period defined, strict mode says NO. 
            // Or auto-create? Strict mode means system must be configured.
            // For MVP/First run, we might want to return true if no periods exist at all?
            // "No puedes permitir que el sistema cree asientos contables en un mes que ya ha sido cerrado fiscalmente."
            // Implicitly, if no period exists, it's not "closed", but it's risky. 
            // Let's check if ANY periods exist. If none, allow. If some exist, enforce.
            const count = await this.engine.select("SELECT COUNT(*) as c FROM accounting_periods");
            if ((count[0]?.c || 0) === 0) return true; // Greenfield

            return false; // Period doesn't exist so can't be open
        }

        return results[0].status === 'open';
    }
}
