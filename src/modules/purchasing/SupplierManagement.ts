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
        const query = `
            SELECT id, name, business_name, document_type, document_number,
                   email, email_secondary, phone, phone_secondary,
                   address_line1, address_line2, city, state, zip_code,
                   florida_county, credit_limit, payment_terms, tax_exempt,
                   tax_id, assigned_buyer, status, notes,
                   created_at, updated_at, created_by, updated_by
            FROM suppliers 
            WHERE status = 'active'
            ORDER BY name ASC
        `;
        const rows = await this.engine.select(query);
        return rows as Supplier[];
    }

    async getSupplierById(id: number): Promise<Supplier | null> {
        const query = `
            SELECT id, name, business_name, document_type, document_number,
                   email, email_secondary, phone, phone_secondary,
                   address_line1, address_line2, city, state, zip_code,
                   florida_county, credit_limit, payment_terms, tax_exempt,
                   tax_id, assigned_buyer, status, notes,
                   created_at, updated_at, created_by, updated_by
            FROM suppliers 
            WHERE id = ?
        `;
        const rows = await this.engine.select(query, [id]);
        if (rows.length === 0) return null;
        return rows[0] as Supplier;
    }
}
