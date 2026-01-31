import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { AccountingService } from './AccountingService';

/**
 * FinancialReportingService - US GAAP Financial Statements
 * 
 * Generates real-time financial reports:
 * - Balance Sheet (Assets = Liabilities + Equity)
 * - Income Statement (P&L)
 * - General Ledger
 * - Trial Balance
 * 
 * All reports use posted journal entries only.
 * All amounts in INTEGER cents.
 */
export class FinancialReportingService {
    private accountingService: AccountingService;

    constructor(private db: SQLiteEngine) {
        this.accountingService = new AccountingService(db);
    }

    /**
     * Generate Balance Sheet
     * 
     * Assets = Liabilities + Equity
     * 
     * @param asOfDate - Date for balance sheet (default: today)
     * @returns Balance sheet data
     */
    public async getBalanceSheet(asOfDate?: string): Promise<BalanceSheet> {
        const date = asOfDate || new Date().toISOString().split('T')[0];

        // Get all accounts by type
        const assets = await this.getAccountsByType('ASSET', date);
        const liabilities = await this.getAccountsByType('LIABILITY', date);
        const equity = await this.getAccountsByType('EQUITY', date);

        // Calculate totals
        const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
        const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

        // Verify accounting equation
        const isBalanced = totalAssets === (totalLiabilities + totalEquity);

        return {
            asOfDate: date,
            assets: {
                accounts: assets,
                total: totalAssets
            },
            liabilities: {
                accounts: liabilities,
                total: totalLiabilities
            },
            equity: {
                accounts: equity,
                total: totalEquity
            },
            isBalanced,
            balanceDifference: totalAssets - (totalLiabilities + totalEquity)
        };
    }

    /**
     * Generate Income Statement (Profit & Loss)
     * 
     * Net Income = Revenue - Expenses
     * 
     * @param startDate - Period start date
     * @param endDate - Period end date (default: today)
     * @returns Income statement data
     */
    public async getIncomeStatement(startDate: string, endDate?: string): Promise<IncomeStatement> {
        const end = endDate || new Date().toISOString().split('T')[0];

        // Get revenue and expense accounts for the period
        const revenue = await this.getAccountsByTypeForPeriod('REVENUE', startDate, end);
        const expenses = await this.getAccountsByTypeForPeriod('EXPENSE', startDate, end);

        // Calculate totals
        const totalRevenue = revenue.reduce((sum, acc) => sum + acc.balance, 0);
        const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            periodStart: startDate,
            periodEnd: end,
            revenue: {
                accounts: revenue,
                total: totalRevenue
            },
            expenses: {
                accounts: expenses,
                total: totalExpenses
            },
            netIncome,
            netIncomeMargin: totalRevenue > 0 ? (netIncome / totalRevenue) : 0
        };
    }

    /**
     * Get General Ledger for an account
     * 
     * @param accountCode - Account code
     * @param startDate - Start date (optional)
     * @param endDate - End date (optional)
     * @returns General ledger entries
     */
    public async getGeneralLedger(
        accountCode: string,
        startDate?: string,
        endDate?: string
    ): Promise<GeneralLedgerReport> {
        let query = `
            SELECT 
                ll.id,
                ll.journal_entry_id,
                je.entry_date,
                je.description,
                je.reference_type,
                je.reference_id,
                ll.debit,
                ll.credit,
                ll.logic_clock
            FROM ledger_lines ll
            JOIN journal_entries je ON ll.journal_entry_id = je.id
            WHERE ll.account_code = ?
            AND je.status = 'POSTED'
        `;

        const params: any[] = [accountCode];

        if (startDate) {
            query += ` AND je.entry_date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND je.entry_date <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY je.entry_date, ll.logic_clock`;

        const entries = await this.db.select(query, params);

        // Calculate running balance
        let runningBalance = 0;
        const ledgerEntries: GeneralLedgerEntry[] = entries.map((entry: any) => {
            const debit = entry.debit || 0;
            const credit = entry.credit || 0;
            runningBalance += (debit - credit);

            return {
                id: entry.id,
                journalEntryId: entry.journal_entry_id,
                date: entry.entry_date,
                description: entry.description,
                referenceType: entry.reference_type,
                referenceId: entry.reference_id,
                debit,
                credit,
                balance: runningBalance,
                logicClock: entry.logic_clock
            };
        });

        // Get account info
        const account = await this.db.select(
            'SELECT code, name, type FROM chart_of_accounts WHERE code = ?',
            [accountCode]
        );

        return {
            accountCode,
            accountName: account[0]?.name || 'Unknown',
            accountType: account[0]?.type || 'Unknown',
            startDate: startDate || 'Beginning',
            endDate: endDate || 'Current',
            entries: ledgerEntries,
            endingBalance: runningBalance
        };
    }

    /**
     * Get accounts by type (for Balance Sheet)
     * @private
     */
    private async getAccountsByType(type: string, asOfDate: string): Promise<AccountBalance[]> {
        const accounts = await this.db.select(`
            SELECT code, name, subtype
            FROM chart_of_accounts
            WHERE type = ? AND is_active = 1
            ORDER BY code
        `, [type]);

        const balances: AccountBalance[] = [];

        for (const accountData of accounts) {
            const account = accountData as any;
            const balance = await this.accountingService.getAccountBalance(account.code);

            if (balance !== 0) {
                balances.push({
                    code: account.code,
                    name: account.name,
                    subtype: account.subtype,
                    balance
                });
            }
        }

        return balances;
    }

    /**
     * Get accounts by type for a period (for Income Statement)
     * @private
     */
    private async getAccountsByTypeForPeriod(
        type: string,
        startDate: string,
        endDate: string
    ): Promise<AccountBalance[]> {
        const accounts = await this.db.select(`
            SELECT code, name, subtype
            FROM chart_of_accounts
            WHERE type = ? AND is_active = 1
            ORDER BY code
        `, [type]);

        const balances: AccountBalance[] = [];

        for (const accountData of accounts) {
            const account = accountData as any;
            // Get balance for period
            const result = await this.db.select(`
                SELECT 
                    COALESCE(SUM(ll.debit), 0) as total_debits,
                    COALESCE(SUM(ll.credit), 0) as total_credits
                FROM ledger_lines ll
                JOIN journal_entries je ON ll.journal_entry_id = je.id
                WHERE ll.account_code = ?
                AND je.status = 'POSTED'
                AND je.entry_date >= ?
                AND je.entry_date <= ?
            `, [account.code, startDate, endDate]);

            if (result.length > 0) {
                const { total_debits, total_credits } = result[0];

                // For revenue/expense, balance is credits - debits (normal balance is credit for revenue, debit for expense)
                const balance = type === 'REVENUE'
                    ? total_credits - total_debits
                    : total_debits - total_credits;

                if (balance !== 0) {
                    balances.push({
                        code: account.code,
                        name: account.name,
                        subtype: account.subtype,
                        balance
                    });
                }
            }
        }

        return balances;
    }

    /**
     * Get Trial Balance (delegates to AccountingService)
     */
    public getTrialBalance() {
        return this.accountingService.getTrialBalance();
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface BalanceSheet {
    asOfDate: string;
    assets: {
        accounts: AccountBalance[];
        total: number;
    };
    liabilities: {
        accounts: AccountBalance[];
        total: number;
    };
    equity: {
        accounts: AccountBalance[];
        total: number;
    };
    isBalanced: boolean;
    balanceDifference: number;
}

export interface IncomeStatement {
    periodStart: string;
    periodEnd: string;
    revenue: {
        accounts: AccountBalance[];
        total: number;
    };
    expenses: {
        accounts: AccountBalance[];
        total: number;
    };
    netIncome: number;
    netIncomeMargin: number;
}

export interface AccountBalance {
    code: string;
    name: string;
    subtype: string;
    balance: number;  // INTEGER cents
}

export interface GeneralLedgerReport {
    accountCode: string;
    accountName: string;
    accountType: string;
    startDate: string;
    endDate: string;
    entries: GeneralLedgerEntry[];
    endingBalance: number;
}

export interface GeneralLedgerEntry {
    id: number;
    journalEntryId: string;
    date: string;
    description: string;
    referenceType: string | null;
    referenceId: string | null;
    debit: number;
    credit: number;
    balance: number;  // Running balance
    logicClock: number;
}
