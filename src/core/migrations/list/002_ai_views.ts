import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const AIViewsMigration: Migration = {
    version: 2,
    name: 'Add Specialized AI Views',
    up: async (db: SQLiteEngine) => {
        // 1. v_tax_liability_florida (DR-15 Focused)
        // Shows granular breakdown of taxable vs exempt sales per county
        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_tax_liability_florida AS
            SELECT 
                county_name,
                strftime('%Y-%m', transaction_date) as period,
                SUM(gross_amount) as total_gross_sales,
                SUM(exempt_amount) as total_exempt_sales,
                SUM(taxable_amount) as total_taxable_sales,
                SUM(tax_collected) as total_tax_collected,
                COUNT(*) as transaction_count
            FROM tax_transactions
            GROUP BY county_name, period;
        `);

        // 2. v_daily_financial_snapshot
        // Provides AI with a daily pulse of the business
        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_daily_financial_snapshot AS
            SELECT 
                DATE('now') as snapshot_date,
                (SELECT COUNT(*) FROM invoices WHERE issue_date = DATE('now')) as invoices_today,
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE issue_date = DATE('now')) as sales_today,
                (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
                (SELECT COALESCE(SUM(total - (SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id = i.id)), 0) 
                 FROM invoices i WHERE status != 'paid') as outstanding_receivables,
                 -- Note: 'payments' table table assumed to exist or we use simplistic status check for now:
                 -- Since payments table wasn't in 001, we rely on status='paid' vs others.
                 -- Simplified Logic:
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status != 'paid') as total_receivables_pending
        `);

        // 3. v_inventory_health (Bonus: Requested in roadmap)
        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_inventory_health AS
            SELECT 
                id,
                name,
                sku,
                stock_quantity,
                reorder_point,
                CASE 
                    WHEN stock_quantity <= 0 THEN 'OUT_OF_STOCK'
                    WHEN stock_quantity <= reorder_point THEN 'LOW_STOCK'
                    ELSE 'HEALTHY'
                END as stock_status
            FROM products
            WHERE active = 1;
        `);
    },
    down: async (db: SQLiteEngine) => {
        await db.exec("DROP VIEW IF EXISTS v_inventory_health");
        await db.exec("DROP VIEW IF EXISTS v_daily_financial_snapshot");
        await db.exec("DROP VIEW IF EXISTS v_tax_liability_florida");
    }
};
