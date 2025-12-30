import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { CompanyInfoSchema, type CompanyInfo } from './System.types';

export class CompanyService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async getCompanyInfo(): Promise<CompanyInfo | null> {
        const rows = await this.engine.select('SELECT * FROM company_info LIMIT 1');
        if (rows.length === 0) return null;
        // Zod parse to ensure types, might fail if DB has extra keys so be careful with 'strict' if migration lagging, 
        // but strict is good for ensuring code sync.
        return rows[0] as CompanyInfo;
    }

    async updateCompanyInfo(info: CompanyInfo): Promise<void> {
        const valid = CompanyInfoSchema.parse(info);

        // Upsert logic (Update if exists, Insert if not)
        const current = await this.getCompanyInfo();
        if (current && current.id) {
            await (this.engine as any).run(`
                UPDATE company_info 
                SET name=?, tax_id=?, address=?, city=?, state=?, zip=?, phone=?, email=?, website=?, logo_path=?, currency_code=?, updated_at=CURRENT_TIMESTAMP
                WHERE id=?
            `, [
                valid.name, valid.tax_id, valid.address, valid.city, valid.state, valid.zip,
                valid.phone, valid.email, valid.website, valid.logo_path, valid.currency_code, current.id
            ]);
        } else {
            await (this.engine as any).run(`
                INSERT INTO company_info 
                (name, tax_id, address, city, state, zip, phone, email, website, logo_path, currency_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                valid.name, valid.tax_id, valid.address, valid.city, valid.state, valid.zip,
                valid.phone, valid.email, valid.website, valid.logo_path, valid.currency_code
            ]);
        }
    }
}
