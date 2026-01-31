import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * AccountingService - Double-Entry Bookkeeping Engine
 * 
 * Implements US GAAP double-entry accounting with:
 * - Accounting equation validation: Σ Debits = Σ Credits
 * - Immutability enforcement (once posted, cannot modify)
 * - Logic clock integration for audit trail
 * - Automatic journal entry creation from business events
 * 
 * HARD CONSTRAINTS:
 * - REJECT any transaction where debits ≠ credits
 * - PROHIBIT deletion/modification of posted entries
 * - REQUIRE reversal entries for corrections (Storno method)
 * - ALL amounts must be INTEGER cents
 */
export class AccountingService {
    constructor(private db: SQLiteEngine) { }

    /**
     * Create a journal entry with automatic validation
     * 
     * @param entry - Journal entry data
     * @returns Journal entry ID (UUID)
     * @throws Error if debits ≠ credits or validation fails
     */
    public async createJournalEntry(entry: CreateJournalEntryDTO): Promise<string> {
        return this.db.executeTransaction(async () => {
            // 1. Validate accounting equation
            const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredits = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

            if (totalDebits !== totalCredits) {
                throw new Error(
                    `Accounting equation violated: Debits (${totalDebits}) ≠ Credits (${totalCredits}). ` +
                    `Difference: ${Math.abs(totalDebits - totalCredits)} cents`
                );
            }

            if (totalDebits === 0) {
                throw new Error('Cannot create journal entry with zero amounts');
            }

            // 2. Validate all accounts exist
            for (const line of entry.lines) {
                const account = this.db.select(
                    'SELECT code, is_active FROM chart_of_accounts WHERE code = ?',
                    [line.accountCode]
                );

                if (account.length === 0) {
                    throw new Error(`Account ${line.accountCode} not found in chart of accounts`);
                }

                if (!account[0].is_active) {
                    throw new Error(`Account ${line.accountCode} is inactive`);
                }
            }

            // 3. Increment logic_clock
            const logicClock = this.incrementLogicClock();

            // 4. Generate UUID for journal entry
            const entryId = uuidv4();

            // 5. Insert journal entry
            this.db.run(`
                INSERT INTO journal_entries (
                    id, entry_date, description, reference_type, reference_id,
                    logic_clock, status, created_by, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                entryId,
                entry.entryDate || new Date().toISOString().split('T')[0],
                entry.description,
                entry.referenceType || null,
                entry.referenceId || null,
                logicClock,
                entry.autoPost ? 'POSTED' : 'DRAFT',
                entry.createdBy || 'system',
                entry.notes || null
            ]);

            // 6. Insert ledger lines
            for (const line of entry.lines) {
                this.db.run(`
                    INSERT INTO ledger_lines (
                        journal_entry_id, account_code, debit, credit, description, logic_clock
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    entryId,
                    line.accountCode,
                    line.debit || 0,
                    line.credit || 0,
                    line.description || entry.description,
                    logicClock
                ]);
            }

            // 7. If auto-post, update posted_at
            if (entry.autoPost) {
                this.db.run(`
                    UPDATE journal_entries 
                    SET posted_at = CURRENT_TIMESTAMP, posted_by = ?
                    WHERE id = ?
                `, [entry.createdBy || 'system', entryId]);
            }

            return entryId;
        });
    }

    /**
     * Post a draft journal entry (make it immutable)
     * 
     * @param entryId - Journal entry ID
     * @param postedBy - User posting the entry
     * @throws Error if entry not found or already posted
     */
    public postJournalEntry(entryId: string, postedBy: string): void {
        const entry = this.db.select(
            'SELECT status FROM journal_entries WHERE id = ?',
            [entryId]
        );

        if (entry.length === 0) {
            throw new Error(`Journal entry ${entryId} not found`);
        }

        if (entry[0].status === 'POSTED') {
            throw new Error(`Journal entry ${entryId} is already posted`);
        }

        this.db.run(`
            UPDATE journal_entries 
            SET status = 'POSTED', posted_at = CURRENT_TIMESTAMP, posted_by = ?
            WHERE id = ?
        `, [postedBy, entryId]);
    }

    /**
     * Create a reversal entry (Storno method)
     * 
     * Used to correct errors in posted entries without violating immutability
     * 
     * @param originalEntryId - ID of entry to reverse
     * @param reason - Reason for reversal
     * @param createdBy - User creating reversal
     * @returns New reversal entry ID
     */
    public async createReversalEntry(
        originalEntryId: string,
        reason: string,
        createdBy: string
    ): Promise<string> {
        // Get original entry
        const original = this.db.select(
            'SELECT * FROM journal_entries WHERE id = ?',
            [originalEntryId]
        );

        if (original.length === 0) {
            throw new Error(`Original entry ${originalEntryId} not found`);
        }

        // Get original lines
        const originalLines = this.db.select(
            'SELECT * FROM ledger_lines WHERE journal_entry_id = ?',
            [originalEntryId]
        );

        // Create reversal with swapped debits/credits
        const reversalLines: JournalLine[] = originalLines.map(line => ({
            accountCode: line.account_code,
            debit: line.credit,  // Swap
            credit: line.debit,  // Swap
            description: `REVERSAL: ${line.description}`
        }));

        return this.createJournalEntry({
            description: `REVERSAL: ${original[0].description} - ${reason}`,
            lines: reversalLines,
            referenceType: 'REVERSAL',
            referenceId: originalEntryId,
            autoPost: true,
            createdBy,
            notes: `Reversal of entry ${originalEntryId}`
        });
    }

    /**
     * Create journal entry for invoice sale (automatic integration)
     * 
     * @param invoiceData - Invoice data
     * @returns Journal entry ID
     */
    public async createInvoiceSaleEntry(invoiceData: {
        invoiceId: number;
        invoiceNumber: string;
        customerId: number;
        subtotalCents: number;
        taxCents: number;
        totalCents: number;
        items: Array<{ productId: number; quantity: number; costCents: number }>;
    }): Promise<string> {
        // Calculate COGS
        const cogsCents = invoiceData.items.reduce(
            (sum, item) => sum + (item.costCents * item.quantity),
            0
        );

        const lines: JournalLine[] = [
            // Debit: Accounts Receivable (increase asset)
            {
                accountCode: '1020',
                debit: invoiceData.totalCents,
                credit: 0,
                description: `Invoice ${invoiceData.invoiceNumber} - Customer ${invoiceData.customerId}`
            },
            // Credit: Sales Revenue (increase revenue)
            {
                accountCode: '4010',
                debit: 0,
                credit: invoiceData.subtotalCents,
                description: `Sales Revenue - Invoice ${invoiceData.invoiceNumber}`
            },
            // Credit: Sales Tax Payable (increase liability)
            {
                accountCode: '2020',
                debit: 0,
                credit: invoiceData.taxCents,
                description: `Sales Tax - Invoice ${invoiceData.invoiceNumber}`
            },
            // Debit: Cost of Goods Sold (increase expense)
            {
                accountCode: '5010',
                debit: cogsCents,
                credit: 0,
                description: `COGS - Invoice ${invoiceData.invoiceNumber}`
            },
            // Credit: Inventory (decrease asset)
            {
                accountCode: '1030',
                debit: 0,
                credit: cogsCents,
                description: `Inventory Reduction - Invoice ${invoiceData.invoiceNumber}`
            }
        ];

        return this.createJournalEntry({
            description: `Sale - Invoice ${invoiceData.invoiceNumber}`,
            lines,
            referenceType: 'INVOICE',
            referenceId: invoiceData.invoiceId.toString(),
            autoPost: true,
            createdBy: 'system'
        });
    }

    /**
     * Get account balance
     * 
     * @param accountCode - Account code
     * @returns Balance in cents (positive = normal balance, negative = opposite)
     */
    public getAccountBalance(accountCode: string): number {
        const result = this.db.select(`
            SELECT 
                COALESCE(SUM(debit), 0) as total_debits,
                COALESCE(SUM(credit), 0) as total_credits
            FROM ledger_lines
            WHERE account_code = ?
            AND journal_entry_id IN (SELECT id FROM journal_entries WHERE status = 'POSTED')
        `, [accountCode]);

        if (result.length === 0) {
            return 0;
        }

        const { total_debits, total_credits } = result[0];

        // Get account's normal balance
        const account = this.db.select(
            'SELECT normal_balance FROM chart_of_accounts WHERE code = ?',
            [accountCode]
        );

        if (account.length === 0) {
            throw new Error(`Account ${accountCode} not found`);
        }

        const normalBalance = account[0].normal_balance;

        // Return balance according to normal balance convention
        if (normalBalance === 'DEBIT') {
            return total_debits - total_credits;
        } else {
            return total_credits - total_debits;
        }
    }

    /**
     * Get trial balance (all accounts with balances)
     * 
     * @returns Array of accounts with balances
     */
    public getTrialBalance(): TrialBalanceEntry[] {
        const accounts = this.db.select(`
            SELECT code, name, type, normal_balance
            FROM chart_of_accounts
            WHERE is_active = 1
            ORDER BY code
        `);

        const trialBalance: TrialBalanceEntry[] = [];
        let totalDebits = 0;
        let totalCredits = 0;

        for (const account of accounts) {
            const balance = this.getAccountBalance(account.code);

            if (balance !== 0) {
                const entry: TrialBalanceEntry = {
                    accountCode: account.code,
                    accountName: account.name,
                    accountType: account.type,
                    debit: account.normal_balance === 'DEBIT' && balance > 0 ? balance : 0,
                    credit: account.normal_balance === 'CREDIT' && balance > 0 ? balance : 0
                };

                trialBalance.push(entry);
                totalDebits += entry.debit;
                totalCredits += entry.credit;
            }
        }

        // Verify trial balance
        if (totalDebits !== totalCredits) {
            console.error(`⚠️ TRIAL BALANCE OUT OF BALANCE: Debits=${totalDebits}, Credits=${totalCredits}`);
        }

        return trialBalance;
    }

    /**
     * Increment logic_clock
     * @private
     */
    private incrementLogicClock(): number {
        const current = this.db.select(
            'SELECT value FROM system_config WHERE key = ?',
            ['logic_clock']
        );

        if (current.length === 0) {
            throw new Error('logic_clock not initialized');
        }

        const newClock = parseInt(current[0].value) + 1;

        this.db.run(
            'UPDATE system_config SET value = ? WHERE key = ?',
            [newClock.toString(), 'logic_clock']
        );

        return newClock;
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateJournalEntryDTO {
    entryDate?: string;
    description: string;
    lines: JournalLine[];
    referenceType?: string;
    referenceId?: string;
    autoPost?: boolean;
    createdBy?: string;
    notes?: string;
}

export interface JournalLine {
    accountCode: string;
    debit?: number;  // INTEGER cents
    credit?: number;  // INTEGER cents
    description?: string;
}

export interface TrialBalanceEntry {
    accountCode: string;
    accountName: string;
    accountType: string;
    debit: number;  // INTEGER cents
    credit: number;  // INTEGER cents
}
