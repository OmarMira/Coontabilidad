import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export const AddAccountNumberMigration: Migration = {
    version: 28,
    name: 'Add account number to chart_of_accounts',

    up: async (db: SQLiteEngine) => {
        // Checking if 'number' already exists in 'chart_of_accounts'
        const tableInfo = await db.select("PRAGMA table_info(chart_of_accounts)");
        const hasColumn = tableInfo.some((col: any) => col.name === 'number');

        if (!hasColumn) {
            await db.run("ALTER TABLE chart_of_accounts ADD COLUMN number TEXT");

            // Create index on the new column
            await db.run("CREATE INDEX idx_chart_accounts_number ON chart_of_accounts(number)");

            // Auto-populate old legacy accounts without number using GAAP 5 digit suggestions
            const accounts = await db.select('SELECT id, account_type FROM chart_of_accounts WHERE number IS NULL OR number = ""');
            for (const acc of accounts) {
                const suggestedNum = suggestAccountNumber(acc.account_type);
                await db.run('UPDATE chart_of_accounts SET number = ? WHERE id = ?', [suggestedNum, acc.id]);
            }
        }
    },

    down: async (db: SQLiteEngine) => { }
};

// Helper: Sugerir número basado en tipo (GAAP ranges) 5 digits
function suggestAccountNumber(type: string): string {
    const ranges: Record<string, string> = {
        'asset': '1xxxx',     // Ej. 10000
        'liability': '2xxxx', // Ej. 20000
        'equity': '3xxxx',    // Ej. 30000
        'revenue': '4xxxx',   // Ej. 40000
        'income': '4xxxx',
        'cogs': '5xxxx',      // Ej. 50000
        'expense': '6xxxx',   // Ej. 60000
        'otherIncome': '7xxxx',
        'otherExpense': '8xxxx'
    };
    const base = ranges[type.toLowerCase()] || '0xxxx';
    return base.replace('xxxx', Math.floor(Math.random() * 9000 + 1000).toString()); // Número único aleatorio
}
