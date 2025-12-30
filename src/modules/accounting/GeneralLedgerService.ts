import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { JournalEntrySchema, type JournalEntry, type JournalLine } from './Accounting.types';

export class GeneralLedgerService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    /**
     * Posts a journal entry. Enforces Double-Entry Principle (Debits = Credits).
     */
    async postJournalEntry(entry: JournalEntry): Promise<number> {
        // 1. Validation
        const validEntry = JournalEntrySchema.parse(entry);

        // 2. Check Balance
        let totalDebit = 0;
        let totalCredit = 0;
        for (const line of validEntry.details) {
            totalDebit += line.debit;
            totalCredit += line.credit;
        }

        // Allow small float precision diff (e.g. 0.001)
        if (Math.abs(totalDebit - totalCredit) > 0.009) {
            throw new Error(`Unbalanced Entry: Debits (${totalDebit}) !== Credits (${totalCredit})`);
        }

        const entryTotal = totalDebit; // Or credit, they are equal

        // 3. Persist Header
        const headQuery = `
            INSERT INTO journal_entries (entry_date, description, reference, total, status)
            VALUES (?, ?, ?, ?, ?)
        `;

        let entryId = 0;
        if ('run' in this.engine) {
            const result = await (this.engine as any).run(headQuery, [
                validEntry.entry_date,
                validEntry.description,
                validEntry.reference,
                entryTotal,
                validEntry.status
            ]);
            entryId = result.lastID;
        }

        if (entryId > 0) {
            // 4. Persist Lines
            for (const line of validEntry.details) {
                const lineQuery = `
                    INSERT INTO journal_details (journal_id, account_code, debit, credit, description)
                    VALUES (?, ?, ?, ?, ?)
                `;
                await (this.engine as any).run(lineQuery, [
                    entryId,
                    line.account_code,
                    line.debit,
                    line.credit,
                    line.description || validEntry.description
                ]);
            }
        }

        return entryId;
    }

    async getJournalEntry(id: number): Promise<JournalEntry | null> {
        const head = await this.engine.select('SELECT * FROM journal_entries WHERE id = ?', [id]);
        if (!head || head.length === 0) return null;

        const lines = await this.engine.select('SELECT * FROM journal_details WHERE journal_id = ?', [id]);

        return {
            ...head[0],
            details: lines as JournalLine[]
        } as JournalEntry;
    }

    /**
     * Helper for Automated Entries (e.g., from Invoice)
     */
    async createAutoEntry(
        description: string,
        reference: string,
        date: string,
        lines: JournalLine[]
    ): Promise<number> {
        return this.postJournalEntry({
            entry_date: date,
            description,
            reference,
            details: lines,
            status: 'posted'
        });
    }
}
