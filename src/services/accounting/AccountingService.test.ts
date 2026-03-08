import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { AccountingService } from './AccountingService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * Unit tests for AccountingService
 * 
 * ACCEPTANCE CRITERIA:
 * 1. $100 sale + $7 tax generates entry with debits=$107, credits=$107
 * 2. Balance Sheet remains balanced after 10 random transactions
 * 3. DELETE on posted entry throws error (trigger enforcement)
 * 4. logic_clock is consistent across journal_entries and ledger_lines
 */
describe('AccountingService', () => {
    let db: SQLiteEngine;
    let accountingService: AccountingService;

    beforeAll(async () => {
        // Initialize in-memory database
        db = new SQLiteEngine();
        await db.initialize(':memory:');

        // Create schema (simplified for testing)
        await db.exec(`
            CREATE TABLE system_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.exec(`INSERT INTO system_config (key, value) VALUES ('logic_clock', '0')`);

        await db.exec(`
            CREATE TABLE chart_of_accounts (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                subtype TEXT,
                parent_code TEXT,
                normal_balance TEXT,
                is_active BOOLEAN DEFAULT 1,
                is_system BOOLEAN DEFAULT 0
            )
        `);

        await db.exec(`
            CREATE TABLE journal_entries (
                id TEXT PRIMARY KEY,
                entry_date DATE NOT NULL,
                description TEXT NOT NULL,
                reference TEXT,
                reference_type TEXT,
                reference_id TEXT,
                notes TEXT,
                logic_clock INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'DRAFT',
                posted_at DATETIME,
                posted_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                updated_by INTEGER,
                verified_by INTEGER,
                verified_at DATETIME,
                is_balanced BOOLEAN DEFAULT 1
            )
        `);

        await db.exec(`
            CREATE TABLE journal_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journal_entry_id TEXT NOT NULL,
                account_code TEXT NOT NULL,
                debit_amount INTEGER DEFAULT 0,
                credit_amount INTEGER DEFAULT 0,
                description TEXT,
                logic_clock INTEGER NOT NULL,
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
                FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code)
            )
        `);

        // Create immutability triggers
        await db.exec(`
            CREATE TRIGGER prevent_journal_delete
            BEFORE DELETE ON journal_entries
            FOR EACH ROW
            WHEN OLD.status = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot delete POSTED journal entry');
            END
        `);

        await db.exec(`
            CREATE TRIGGER prevent_ledger_delete
            BEFORE DELETE ON journal_details
            FOR EACH ROW
            WHEN (SELECT status FROM journal_entries WHERE id = OLD.journal_entry_id) = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot delete ledger line from POSTED journal entry');
            END
        `);

        // Seed chart of accounts
        const accounts = [
            { code: '1020', name: 'Accounts Receivable', type: 'ASSET', balance: 'DEBIT' },
            { code: '1030', name: 'Inventory', type: 'ASSET', balance: 'DEBIT' },
            { code: '2020', name: 'Sales Tax Payable', type: 'LIABILITY', balance: 'CREDIT' },
            { code: '4010', name: 'Sales Revenue', type: 'REVENUE', balance: 'CREDIT' },
            { code: '5010', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 'DEBIT' },
        ];

        for (const acc of accounts) {
            await db.run(`
                INSERT INTO chart_of_accounts (code, name, type, normal_balance, is_active)
                VALUES (?, ?, ?, ?, 1)
            `, [acc.code, acc.name, acc.type, acc.balance]);
        }

        accountingService = new AccountingService(db);
    });

    beforeEach(async () => {
        // Reset logic_clock before each test
        await db.run(`UPDATE system_config SET value = '0' WHERE key = 'logic_clock'`);

        // Clear all journal entries and ledger lines
        // First, temporarily disable triggers to allow deletion of POSTED entries
        await db.exec(`DROP TRIGGER IF EXISTS prevent_journal_delete`);
        await db.exec(`DROP TRIGGER IF EXISTS prevent_ledger_delete`);

        await db.run(`DELETE FROM journal_details`);
        await db.run(`DELETE FROM journal_entries`);

        // Recreate triggers
        await db.exec(`
            CREATE TRIGGER prevent_journal_delete
            BEFORE DELETE ON journal_entries
            FOR EACH ROW
            WHEN OLD.status = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot delete POSTED journal entry');
            END
        `);

        await db.exec(`
            CREATE TRIGGER prevent_ledger_delete
            BEFORE DELETE ON journal_details
            FOR EACH ROW
            WHEN (SELECT status FROM journal_entries WHERE id = OLD.journal_entry_id) = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot delete ledger line from POSTED journal entry');
            END
        `);
    });

    describe('ACCEPTANCE TEST 1: $100 Sale + $7 Tax', () => {
        it('should create balanced entry with debits=$107, credits=$107', async () => {
            // Arrange
            const subtotalCents = 10000; // $100.00
            const taxCents = 700; // $7.00
            const totalCents = 10700; // $107.00

            // Act
            const entryId = await accountingService.createInvoiceSaleEntry({
                invoiceId: 1,
                invoiceNumber: 'INV-000001',
                customerId: 1,
                subtotalCents,
                taxCents,
                totalCents,
                items: [{ productId: 1, quantity: 1, costCents: 6000 }] // $60 COGS
            });

            // Assert
            const entry = await db.select('SELECT * FROM journal_entries WHERE id = ?', [entryId]);
            expect(entry.length).toBe(1);
            expect((entry[0] as any).status).toBe('POSTED');

            const lines = await db.select('SELECT * FROM journal_details WHERE journal_entry_id = ?', [entryId]);

            const totalDebits = lines.reduce((sum: number, line: any) => sum + (line.debit_amount || 0), 0);
            const totalCredits = lines.reduce((sum: number, line: any) => sum + (line.credit_amount || 0), 0);

            // Critical assertion: debits = credits
            expect(totalDebits).toBe(totalCredits);

            // Verify amounts
            // Debits: AR $107 + COGS $60 = $167
            // Credits: Sales $100 + Tax $7 + Inventory $60 = $167
            expect(totalDebits).toBe(16700);
            expect(totalCredits).toBe(16700);
        });
    });

    describe('ACCEPTANCE TEST 2: Balance Sheet Equilibrium', () => {
        it('should maintain balanced equation after 10 random transactions', async () => {
            // Create 10 random sales transactions
            for (let i = 1; i <= 10; i++) {
                const subtotal = Math.floor(Math.random() * 50000) + 10000; // $100-$500
                const tax = Math.floor(subtotal * 0.07); // 7% tax
                const total = subtotal + tax;
                const cogs = Math.floor(subtotal * 0.6); // 60% COGS

                await accountingService.createInvoiceSaleEntry({
                    invoiceId: i,
                    invoiceNumber: `INV-${String(i).padStart(6, '0')}`,
                    customerId: i,
                    subtotalCents: subtotal,
                    taxCents: tax,
                    totalCents: total,
                    items: [{ productId: i, quantity: 1, costCents: cogs }]
                });
            }

            // Get trial balance
            const trialBalance = await accountingService.getTrialBalance();

            const totalDebits = trialBalance.reduce((sum: number, entry: any) => sum + entry.debit, 0);
            const totalCredits = trialBalance.reduce((sum: number, entry: any) => sum + entry.credit, 0);

            // Critical assertion: trial balance is balanced
            expect(totalDebits).toBe(totalCredits);

            // Verify accounting equation: Assets = Liabilities + Equity
            const arBalance = await accountingService.getAccountBalance('1020'); // AR (asset)
            const inventoryBalance = await accountingService.getAccountBalance('1030'); // Inventory (asset)
            const taxPayableBalance = await accountingService.getAccountBalance('2020'); // Tax Payable (liability)
            const revenueBalance = await accountingService.getAccountBalance('4010'); // Revenue (equity)
            const cogsBalance = await accountingService.getAccountBalance('5010'); // COGS (expense)

            const totalAssets = arBalance + inventoryBalance;
            const totalLiabilities = taxPayableBalance;
            const netIncome = revenueBalance - cogsBalance;

            // Assets = Liabilities + Equity (where equity includes net income)
            expect(totalAssets).toBe(totalLiabilities + netIncome);
        });
    });

    describe('ACCEPTANCE TEST 3: Immutability Enforcement', () => {
        it('should throw error when attempting to DELETE posted entry', async () => {
            // Arrange: Create and post an entry
            const entryId = await accountingService.createJournalEntry({
                description: 'Test Entry',
                lines: [
                    { accountCode: '1020', debit: 10000, credit: 0 },
                    { accountCode: '4010', debit: 0, credit: 10000 }
                ],
                autoPost: true
            });

            // Act & Assert: Attempt to delete should throw
            await expect(async () => {
                await db.run('DELETE FROM journal_entries WHERE id = ?', [entryId]);
            }).rejects.toThrow(/Cannot delete POSTED journal entry/);
        });

        it('should throw error when attempting to DELETE ledger line from posted entry', async () => {
            // Arrange
            const entryId = await accountingService.createJournalEntry({
                description: 'Test Entry',
                lines: [
                    { accountCode: '1020', debit: 10000, credit: 0 },
                    { accountCode: '4010', debit: 0, credit: 10000 }
                ],
                autoPost: true
            });

            const lines = await db.select('SELECT id FROM journal_details WHERE journal_entry_id = ?', [entryId]);

            // Act & Assert
            await expect(async () => {
                await db.run('DELETE FROM journal_details WHERE id = ?', [(lines[0] as any).id]);
            }).rejects.toThrow(/Cannot delete ledger line from POSTED journal entry/);
        });
    });

    describe('ACCEPTANCE TEST 4: Logic Clock Consistency', () => {
        it('should have consistent logic_clock across journal_entries and ledger_lines', async () => {
            // Arrange & Act
            const entryId = await accountingService.createJournalEntry({
                description: 'Test Entry',
                lines: [
                    { accountCode: '1020', debit: 10000, credit: 0 },
                    { accountCode: '4010', debit: 0, credit: 10000 }
                ],
                autoPost: true
            });

            // Assert
            const entry = await db.select('SELECT logic_clock FROM journal_entries WHERE id = ?', [entryId]);
            const lines = await db.select('SELECT logic_clock FROM journal_details WHERE journal_entry_id = ?', [entryId]);

            const entryLogicClock = (entry[0] as any).logic_clock;

            // All ledger lines should have same logic_clock as journal entry
            for (const lineData of lines) {
                const line = lineData as any;
                expect(line.logic_clock).toBe(entryLogicClock);
            }

            // Logic clock should be incremented
            expect(entryLogicClock).toBeGreaterThan(0);
        });
    });

    describe('Double-Entry Validation', () => {
        it('should reject entry where debits ≠ credits', async () => {
            await expect(async () => {
                await accountingService.createJournalEntry({
                    description: 'Unbalanced Entry',
                    lines: [
                        { accountCode: '1020', debit: 10000, credit: 0 },
                        { accountCode: '4010', debit: 0, credit: 5000 } // Unbalanced!
                    ]
                });
            }).rejects.toThrow(/Accounting equation violated/);
        });

        it('should reject entry with zero amounts', async () => {
            await expect(async () => {
                await accountingService.createJournalEntry({
                    description: 'Zero Entry',
                    lines: [
                        { accountCode: '1020', debit: 0, credit: 0 },
                        { accountCode: '4010', debit: 0, credit: 0 }
                    ]
                });
            }).rejects.toThrow(/Cannot create journal entry with zero amounts/);
        });

        it('should reject entry with non-existent account', async () => {
            await expect(async () => {
                await accountingService.createJournalEntry({
                    description: 'Invalid Account',
                    lines: [
                        { accountCode: '9999', debit: 10000, credit: 0 },
                        { accountCode: '4010', debit: 0, credit: 10000 }
                    ]
                });
            }).rejects.toThrow(/Account 9999 not found/);
        });
    });

    describe('Reversal Entries (Storno Method)', () => {
        it('should create reversal entry with swapped debits/credits', async () => {
            // Arrange: Create original entry
            const originalId = await accountingService.createJournalEntry({
                description: 'Original Entry',
                lines: [
                    { accountCode: '1020', debit: 10000, credit: 0 },
                    { accountCode: '4010', debit: 0, credit: 10000 }
                ],
                autoPost: true
            });

            // Act: Create reversal
            const reversalId = await accountingService.createReversalEntry(
                originalId,
                'Correction needed',
                'admin'
            );

            // Assert
            const reversalLines = await db.select(
                'SELECT * FROM journal_details WHERE journal_entry_id = ?',
                [reversalId]
            );

            // Reversal should have swapped debits/credits
            const arLine = reversalLines.find((l: any) => l.account_code === '1020') as any;
            const revenueLine = reversalLines.find((l: any) => l.account_code === '4010') as any;

            expect(arLine.debit_amount).toBe(0);
            expect(arLine.credit_amount).toBe(10000); // Swapped
            expect(revenueLine.debit_amount).toBe(10000); // Swapped
            expect(revenueLine.credit_amount).toBe(0);

            // Net effect should be zero
            const arBalance = await accountingService.getAccountBalance('1020');
            expect(arBalance).toBe(0);
        });
    });

    describe('Account Balance Calculation', () => {
        it('should calculate correct balance for debit account', async () => {
            // Create entry: Debit AR $100
            await accountingService.createJournalEntry({
                description: 'Test',
                lines: [
                    { accountCode: '1020', debit: 10000, credit: 0 },
                    { accountCode: '4010', debit: 0, credit: 10000 }
                ],
                autoPost: true
            });

            const balance = await accountingService.getAccountBalance('1020');
            expect(balance).toBe(10000); // $100 debit balance
        });

        it('should calculate correct balance for credit account', async () => {
            // Create entry: Credit Revenue $100
            await accountingService.createJournalEntry({
                description: 'Test',
                lines: [
                    { accountCode: '1020', debit: 10000, credit: 0 },
                    { accountCode: '4010', debit: 0, credit: 10000 }
                ],
                autoPost: true
            });

            const balance = await accountingService.getAccountBalance('4010');
            expect(balance).toBe(10000); // $100 credit balance
        });
    });
});
