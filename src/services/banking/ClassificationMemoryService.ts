import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { db } from '../../database/simple-db';

export interface MemorySuggestion {
    accountCode: string;
    accountName: string;
    useCount: number;
    source: 'memory';
}

export interface AccountSuggestion {
    accountCode: string;
    accountName: string;
    useCount: number;
}

export class ClassificationMemoryService {
    private static engine: SQLiteEngine;

    private static getEngine() {
        if (!this.engine) {
            this.engine = new SQLiteEngine();
            this.engine.setDB(db);
        }
        return this.engine;
    }

    /**
     * Busca coincidencias previas para un descriptor dado
     */
    static async getSuggestions(descriptor: string): Promise<MemorySuggestion[]> {
        const engine = this.getEngine();

        // Exact match first
        let rows = await engine.select(`
            SELECT account_code as accountCode, account_name as accountName, use_count as useCount
            FROM transaction_classification_memory
            WHERE descriptor_pattern = ?
            ORDER BY use_count DESC
        `, [descriptor]);

        if (rows.length === 0) {
            // Partial match using first 3 words as keyword
            const firstThreeWords = descriptor.split(' ').slice(0, 3).join(' ');
            if (firstThreeWords.trim()) {
                rows = await engine.select(`
                    SELECT account_code as accountCode, account_name as accountName, use_count as useCount
                    FROM transaction_classification_memory
                    WHERE descriptor_pattern LIKE ?
                    ORDER BY use_count DESC
                    LIMIT 3
                `, [`%${firstThreeWords}%`]);
            }
        }

        return rows.map((r: any) => ({
            accountCode: r.accountCode,
            accountName: r.accountName,
            useCount: r.useCount,
            source: 'memory'
        })) as MemorySuggestion[];
    }

    /**
     * Guarda o incrementa use_count si ya existe el patrón + cuenta
     */
    static async saveConfirmation(descriptor: string, accountCode: string, accountName: string, userId: number): Promise<void> {
        const engine = this.getEngine();

        const existing = await engine.select(`
            SELECT id, use_count FROM transaction_classification_memory 
            WHERE descriptor_pattern = ? AND account_code = ?
        `, [descriptor, accountCode]);

        if (existing.length > 0) {
            await engine.run(`
                UPDATE transaction_classification_memory 
                SET use_count = use_count + 1, 
                    last_used_at = CURRENT_TIMESTAMP,
                    confirmed_by = ?
                WHERE id = ?
            `, [userId, existing[0].id]);
        } else {
            await engine.run(`
                INSERT INTO transaction_classification_memory 
                (descriptor_pattern, account_code, account_name, confirmed_by, confirmed_at, last_used_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [descriptor, accountCode, accountName, userId]);
        }
    }

    /**
     * Retorna las N cuentas más usadas globalmente (para el buscador libre)
     */
    static async getTopAccounts(limit: number = 5): Promise<AccountSuggestion[]> {
        const engine = this.getEngine();
        const rows = await engine.select(`
            SELECT account_code as accountCode, account_name as accountName, SUM(use_count) as useCount
            FROM transaction_classification_memory
            GROUP BY account_code
            ORDER BY useCount DESC
            LIMIT ?
        `, [limit]);

        return rows.map((r: any) => ({
            accountCode: r.accountCode,
            accountName: r.accountName,
            useCount: r.useCount
        }));
    }
}
