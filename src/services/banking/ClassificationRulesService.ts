import { db, ChartOfAccount, getChartOfAccounts } from '../../database/simple-db';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

export interface ClassificationRule {
    id: number;
    pattern: string;
    match_type: 'CONTAINS' | 'STARTS_WITH' | 'EXACT';
    account_code: string;
    account_name: string;
    account_type: string;
    priority: number;
    is_active: boolean;
}

export class ClassificationRulesService {

    /**
     * Obtiene todas las reglas activas ordenadas por prioridad
     */
    static async getRules(): Promise<ClassificationRule[]> {
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);
            const res = await engine.select(`
                SELECT * FROM classification_rules 
                WHERE is_active = 1 
                ORDER BY priority DESC, id ASC
            `);
            return res.map((row: any) => ({
                ...row,
                is_active: row.is_active === 1
            })) as ClassificationRule[];
        } catch (e) {
            console.error('Error fetching classification rules:', e);
            return [];
        }
    }

    /**
     * Evalúa una descripción contra las reglas
     */
    static async evaluateTransaction(description: string): Promise<ChartOfAccount | null> {
        const rules = await this.getRules();
        const descNormalize = description.trim().toUpperCase();
        const allAccounts = getChartOfAccounts();

        for (const rule of rules) {
            const pattern = rule.pattern.trim().toUpperCase();
            let matched = false;

            switch (rule.match_type) {
                case 'EXACT':
                    matched = descNormalize === pattern;
                    break;
                case 'STARTS_WITH':
                    matched = descNormalize.startsWith(pattern);
                    break;
                case 'CONTAINS':
                    matched = descNormalize.includes(pattern);
                    break;
            }

            if (matched) {
                // Buscamos el ID real en el chart of accounts
                const realAcc = allAccounts.find(a => a.account_code === rule.account_code);

                if (!realAcc) return null; // Si no existe la cuenta en el chart, ignoramos

                return {
                    id: realAcc.id,
                    account_code: rule.account_code,
                    account_name: rule.account_name,
                    account_type: rule.account_type || 'Expense',
                    is_active: 1
                } as ChartOfAccount;
            }
        }

        return null;
    }

    /**
     * Guarda una nueva regla
     */
    static async saveRule(rule: Omit<ClassificationRule, 'id'>, userId: number): Promise<boolean> {
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);
            await engine.run(`
                INSERT INTO classification_rules (
                    pattern, match_type, account_code, account_name, account_type, priority, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                rule.pattern,
                rule.match_type,
                rule.account_code,
                rule.account_name,
                rule.account_type || 'Expense',
                rule.priority,
                rule.is_active ? 1 : 0,
                userId
            ]);
            return true;
        } catch (e) {
            console.error('Error saving rule:', e);
            return false;
        }
    }

    /**
     * Elimina una regla
     */
    static async deleteRule(id: number): Promise<boolean> {
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);
            await engine.run(`DELETE FROM classification_rules WHERE id = ?`, [id]);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Activa/Desactiva una regla
     */
    static async toggleRule(id: number, active: boolean): Promise<boolean> {
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);
            await engine.run(`UPDATE classification_rules SET is_active = ? WHERE id = ?`, [active ? 1 : 0, id]);
            return true;
        } catch (e) {
            return false;
        }
    }
}
