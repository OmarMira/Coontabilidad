import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { type SystemConfig, type UserRole, type FiscalSettings } from './System.types';

export class SystemService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    // --- Config ---
    async setConfig(key: string, value: string, category: string = 'general'): Promise<void> {
        await (this.engine as any).run(`
            INSERT INTO system_config (key, value, category) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
        `, [key, value, category]);
    }

    async getConfig(key: string): Promise<string | null> {
        const row = await this.engine.select('SELECT value FROM system_config WHERE key = ?', [key]);
        return row.length > 0 ? row[0].value : null;
    }

    // --- Roles ---
    async createRole(role: UserRole): Promise<number> {
        const permsJson = JSON.stringify(role.permissions);
        const res = await (this.engine as any).run(`
            INSERT INTO user_roles (name, description, permissions) VALUES (?, ?, ?)
        `, [role.name, role.description, permsJson]);
        return res.lastID;
    }

    async getRoles(): Promise<UserRole[]> {
        const rows = await this.engine.select('SELECT * FROM user_roles');
        return rows.map((r: any) => ({
            ...r,
            permissions: JSON.parse(r.permissions || '[]')
        }));
    }

    // --- Fiscal ---
    async getFiscalSettings(): Promise<FiscalSettings | null> {
        const rows = await this.engine.select('SELECT * FROM fiscal_settings ORDER BY id DESC LIMIT 1');
        if (rows.length === 0) return null;
        return {
            ...rows[0],
            active: Boolean(rows[0].active)
        };
    }

    async updateFiscalSettings(settings: FiscalSettings): Promise<void> {
        // Simple singleton strategy: Insert new row for history, or update latest.
        // Let's update if exists.
        const current = await this.getFiscalSettings();
        if (current && current.id) {
            await (this.engine as any).run(`
                UPDATE fiscal_settings 
                SET tax_year_start=?, tax_frequency=?, sales_tax_method=?, default_tax_rate=?, dr15_filing_day=?, active=?
                WHERE id=?
            `, [settings.tax_year_start, settings.tax_frequency, settings.sales_tax_method, settings.default_tax_rate, settings.dr15_filing_day, settings.active, current.id]);
        } else {
            await (this.engine as any).run(`
                INSERT INTO fiscal_settings (tax_year_start, tax_frequency, sales_tax_method, default_tax_rate, dr15_filing_day, active)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [settings.tax_year_start, settings.tax_frequency, settings.sales_tax_method, settings.default_tax_rate, settings.dr15_filing_day, settings.active]);
        }
    }
}
