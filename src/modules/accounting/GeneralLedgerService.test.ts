import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeneralLedgerService } from './GeneralLedgerService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

// Mock DB
const mockRun = vi.fn();
const mockSelect = vi.fn();

vi.mock('../../core/database/SQLiteEngine', () => ({
    SQLiteEngine: class {
        async run(sql: string, params: any[]) { return mockRun(sql, params); }
        async select(sql: string, params: any[]) { return mockSelect(sql, params); }
    }
}));

describe('GeneralLedgerService', () => {
    let service: GeneralLedgerService;
    let engine: SQLiteEngine;

    beforeEach(() => {
        vi.clearAllMocks();
        engine = new SQLiteEngine();
        service = new GeneralLedgerService(engine);
    });

    it('should post balanced journal entry', async () => {
        mockRun.mockResolvedValue({ lastID: 200 });

        const entryId = await service.postJournalEntry({
            entry_date: '2023-12-30',
            description: 'Sales Invoice #101',
            status: 'posted',
            details: [
                { account_code: '1100', debit: 1000, credit: 0 }, // AR
                { account_code: '4000', debit: 0, credit: 1000 }  // Revenue
            ]
        });

        expect(entryId).toBe(200);
        // Header Insert
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO journal_entries'),
            expect.arrayContaining(['Sales Invoice #101', 1000]) // Description, Total
        );
        // Lines Insert
        expect(mockRun).toHaveBeenCalledTimes(3); // 1 Header + 2 Lines
    });

    it('should reject unbalanced entry', async () => {
        await expect(service.postJournalEntry({
            entry_date: '2023-12-30',
            description: 'Bad Entry',
            status: 'posted',
            details: [
                { account_code: '1100', debit: 1000, credit: 0 },
                { account_code: '4000', debit: 0, credit: 900 } // Unbalanced by 100
            ]
        })).rejects.toThrow(/Unbalanced Entry/);
    });

    it('should reject entry with only 1 line', async () => {
        await expect(service.postJournalEntry({
            entry_date: '2023-12-30',
            description: 'One Line',
            status: 'posted',
            details: [
                { account_code: '1100', debit: 1000, credit: 0 }
            ]
        })).rejects.toThrow(); // Zod validation error
    });
});
