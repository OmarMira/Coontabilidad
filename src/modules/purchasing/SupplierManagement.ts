import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { SupplierSchema, type Supplier } from './Purchasing.types';

export class SupplierManagement {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async createSupplier(supplier: Supplier): Promise<number> {
        const valid = SupplierSchema.parse(supplier);
        const query = `
            INSERT INTO suppliers (name, business_name, email, phone, tax_id, payment_terms, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        if ('run' in this.engine) {
            const result = await (this.engine as any).run(query, [
                valid.name,
                valid.business_name,
                valid.email,
                valid.phone,
                valid.tax_id,
                valid.payment_terms,
                valid.active ? 'active' : 'inactive'
            ]);
            return result.lastID;
        }
        return 0;
    }

    async getAllSuppliers(): Promise<Supplier[]> {
        const query = `SELECT id, name, business_name, email, phone, tax_id, payment_terms, CASE WHEN status='active' THEN 1 ELSE 0 END as active FROM suppliers`;
        const rows = await this.engine.select(query);
        // Map active boolean properly if SQLite returns 1/0
        return rows.map((r: any) => ({
            ...r,
            active: Boolean(r.active)
        }));
    }

    async getSupplierById(id: number): Promise<Supplier | null> {
        const query = `SELECT id, name, business_name, email, phone, tax_id, payment_terms, CASE WHEN status='active' THEN 1 ELSE 0 END as active FROM suppliers WHERE id = ?`;
        const rows = await this.engine.select(query, [id]);
        if (rows.length === 0) return null;
        return {
            ...rows[0],
            active: Boolean(rows[0].active)
        };
    }
}
