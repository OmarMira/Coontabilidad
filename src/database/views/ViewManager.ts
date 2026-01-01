// ViewManager.ts - Gestor de vistas de solo lectura para IA
import initSqlJs from 'sql.js';
import { logger } from '@/utils/logger';

export interface DatabaseView {
    name: string;
    sql: string;
    description: string;
    accessLevel: 'ai_readonly' | 'user_readonly' | 'system';
}

export class ViewManager {
    private db: initSqlJs.Database;
    private views: DatabaseView[] = [];

    constructor(database: initSqlJs.Database) {
        this.db = database;
        this.initializeViews();
    }

    private initializeViews(): void {
        this.views = [
            {
                name: 'v_invoice_summary',
                sql: `
          CREATE VIEW IF NOT EXISTS v_invoice_summary AS
          SELECT 
              i.id, i.invoice_number as number, i.issue_date as date, 'sale' as type,
              c.name as customer_name, c.florida_county as county,
              i.subtotal, i.tax_amount, i.total_amount as total,
              COUNT(il.id) as line_count
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          LEFT JOIN invoice_lines il ON i.id = il.invoice_id
          WHERE i.issue_date >= date('now', '-90 days')
          GROUP BY i.id ORDER BY i.issue_date DESC;
        `,
                description: 'Resumen de facturas de últimos 90 días para análisis de ventas',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_tax_alerts',
                sql: `
          CREATE VIEW IF NOT EXISTS v_tax_alerts AS
          SELECT 
              'TAX_DISCREPANCY' as alert_type, i.id as invoice_id, c.florida_county as county,
              i.subtotal as taxable_base, i.tax_amount, tr.total_rate as expected_rate,
              ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) as calculated_rate,
              ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) as discrepancy_percentage,
              CASE 
                  WHEN ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) > 0.01 THEN 'HIGH'
                  WHEN ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) > 0.001 THEN 'MEDIUM'
                  ELSE 'LOW'
              END as severity
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          JOIN florida_tax_rates tr ON c.florida_county = tr.county_name
          WHERE ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) > 0.0001
          UNION ALL
          SELECT 
              'MISSING_COUNTY' as alert_type, i.id as invoice_id, NULL as county,
              i.subtotal as taxable_base, i.tax_amount, NULL as expected_rate,
              NULL as calculated_rate, 100 as discrepancy_percentage, 'HIGH' as severity
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          WHERE (c.florida_county IS NULL OR c.florida_county = '')
              AND i.issue_date >= date('now', '-30 days');
        `,
                description: 'Alertas de discrepancias fiscales y datos faltantes',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_audit_kpi',
                sql: `
          CREATE VIEW IF NOT EXISTS v_audit_kpi AS
          SELECT
              'HASH_CHAIN_INTEGRITY' as kpi_name, COUNT(*) as total_events,
              MIN(timestamp) as first_event, MAX(timestamp) as last_event,
              COUNT(DISTINCT table_name) as entities_monitored,
              SUM(CASE WHEN audit_hash IS NULL THEN 1 ELSE 0 END) as non_hashed_blocks,
              SUM(CASE WHEN audit_hash IS NOT NULL THEN 1 ELSE 0 END) as hashed_blocks,
              SUM(CASE WHEN timestamp >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as events_last_24h
          FROM audit_log;
        `,
                description: 'KPIs de integridad de la cadena de auditoría',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_florida_tax_summary',
                sql: `
          CREATE VIEW IF NOT EXISTS v_florida_tax_summary AS
          SELECT
              c.florida_county as county, tr.total_rate as current_rate,
              COUNT(DISTINCT i.id) as invoice_count, SUM(i.subtotal) as total_taxable_base,
              SUM(i.tax_amount) as total_tax_collected, MIN(i.issue_date) as first_calculation,
              MAX(i.issue_date) as last_calculation,
              strftime('%Y', i.issue_date) as report_year, strftime('%m', i.issue_date) as report_month
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          JOIN florida_tax_rates tr ON c.florida_county = tr.county_name
          GROUP BY c.florida_county, report_year, report_month
          ORDER BY report_year DESC, report_month DESC, c.florida_county;
        `,
                description: 'Resumen de impuestos Florida para explicaciones DR-15',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_financial_health',
                sql: `
          CREATE VIEW IF NOT EXISTS v_financial_health AS
          SELECT
              'LIQUIDITY' as metric_category, COUNT(DISTINCT je.id) as total_journal_entries,
              SUM(jd.debit_amount) as cash_inflows, SUM(jd.credit_amount) as cash_outflows,
              strftime('%Y-%m', je.entry_date) as period
          FROM journal_entries je
          JOIN journal_details jd ON je.id = jd.journal_entry_id
          WHERE jd.account_code LIKE '11%' 
            AND je.entry_date >= date('now', '-180 days')
          GROUP BY period
          UNION ALL
          SELECT
              'TAX_BURDEN' as metric_category, COUNT(DISTINCT i.id) as invoice_count,
              SUM(i.subtotal) as taxable_sales, SUM(i.tax_amount) as tax_collected,
              strftime('%Y-%m', i.issue_date) as period
          FROM invoices i
          WHERE i.issue_date >= date('now', '-180 days')
          GROUP BY period;
        `,
                description: 'Métricas de salud financiera para análisis de patrones',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_customers_summary',
                sql: `
          CREATE VIEW IF NOT EXISTS v_customers_summary AS
          SELECT COUNT(DISTINCT id) as total_customers, COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_customers,
                 COUNT(DISTINCT florida_county) as counties_covered, GROUP_CONCAT(DISTINCT florida_county) as counties_list,
                 MAX(created_at) as latest_customer_added FROM customers;
        `,
                description: 'Resumen completo de clientes',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_customers_purchase_ranking',
                sql: `
          CREATE VIEW IF NOT EXISTS v_customers_purchase_ranking AS
          SELECT c.id, c.name, c.florida_county as county, COUNT(DISTINCT i.id) as purchase_count,
                 SUM(i.total_amount) as total_purchased, MAX(i.issue_date) as last_purchase_date,
                 RANK() OVER (ORDER BY SUM(i.total_amount) DESC) as purchase_rank
          FROM customers c LEFT JOIN invoices i ON c.id = i.customer_id
          GROUP BY c.id ORDER BY total_purchased DESC NULLS LAST;
        `,
                description: 'Ranking de clientes por volumen de compra',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_suppliers_summary',
                sql: `
          CREATE VIEW IF NOT EXISTS v_suppliers_summary AS
          SELECT s.id, s.name as supplier_name, COUNT(DISTINCT b.id) as invoice_count,
                 SUM(b.total_amount) as total_amount, AVG(b.total_amount) as average_invoice,
                 MIN(b.issue_date) as first_purchase, MAX(b.issue_date) as last_purchase,
                 RANK() OVER (ORDER BY SUM(b.total_amount) DESC) as supplier_rank
          FROM suppliers s JOIN bills b ON s.id = b.supplier_id
          GROUP BY s.id ORDER BY total_amount DESC;
        `,
                description: 'Resumen de facturación por proveedor',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_invoice_type_summary',
                sql: `
          CREATE VIEW IF NOT EXISTS v_invoice_type_summary AS
          SELECT 'Venta' as type, COUNT(*) as count, SUM(total_amount) as total_amount,
                 AVG(total_amount) as average_amount, MAX(issue_date) as last_date FROM invoices
          UNION ALL
          SELECT 'Compra' as type, COUNT(*) as count, SUM(total_amount) as total_amount,
                 AVG(total_amount) as average_amount, MAX(issue_date) as last_date FROM bills;
        `,
                description: 'Comparativa global ventas vs compras',
                accessLevel: 'ai_readonly'
            },
            {
                name: 'v_top_selling_products',
                sql: `
          CREATE VIEW IF NOT EXISTS v_top_selling_products AS
          SELECT p.id, p.sku, p.name, pc.name as category, COUNT(DISTINCT il.invoice_id) as times_sold,
                 SUM(il.quantity) as total_quantity, SUM(il.line_total) as total_revenue,
                 RANK() OVER (ORDER BY SUM(il.line_total) DESC) as rank
          FROM products p JOIN product_categories pc ON p.category_id = pc.id
          JOIN invoice_lines il ON p.id = il.product_id JOIN invoices i ON il.invoice_id = i.id
          GROUP BY p.id HAVING total_revenue > 0 ORDER BY total_revenue DESC LIMIT 20;
        `,
                description: 'Ranking de productos más vendidos por recaudación',
                accessLevel: 'ai_readonly'
            }
        ];
    }

    /**
     * Crea todas las vistas de solo lectura
     */
    public async createAllViews(): Promise<void> {
        try {
            for (const view of this.views) {
                await this.createView(view);
                logger.info(`Vista creada: ${view.name}`, { module: 'ViewManager' });
            }
            logger.success('Todas las vistas de solo lectura creadas exitosamente');
        } catch (error: any) {
            logger.error('Error creando vistas', { error, module: 'ViewManager' });
            throw new Error(`Failed to create views: ${error.message}`);
        }
    }

    /**
     * Crea una vista individual
     */
    private async createView(view: DatabaseView): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Primero eliminamos la vista si existe (para actualizaciones)
                this.db.exec(`DROP VIEW IF EXISTS ${view.name};`);

                // Creamos la vista
                this.db.exec(view.sql);

                // Verificamos que se creó correctamente
                const testQuery = this.db.exec(`SELECT COUNT(*) as count FROM ${view.name} LIMIT 1;`);

                if (testQuery && testQuery.length > 0) {
                    resolve();
                } else {
                    reject(new Error(`Failed to verify view creation: ${view.name}`));
                }
            } catch (error: any) {
                reject(new Error(`Error creating view ${view.name}: ${error.message}`));
            }
        });
    }

    /**
     * Obtiene lista de vistas disponibles para IA
     */
    public getAIReadOnlyViews(): string[] {
        return this.views
            .filter(view => view.accessLevel === 'ai_readonly')
            .map(view => view.name);
    }

    /**
     * Verifica si una tabla/vista es accesible por IA
     */
    public isViewAccessibleByAI(viewName: string): boolean {
        return this.views.some(
            view => view.name === viewName && view.accessLevel === 'ai_readonly'
        );
    }

    /**
     * Ejecuta consulta segura en vista (solo para vistas autorizadas)
     */
    public queryView(viewName: string, query: string = 'SELECT * FROM {view} LIMIT 100'): any[] {
        if (!this.isViewAccessibleByAI(viewName)) {
            throw new Error(`Access denied: View ${viewName} is not accessible by AI`);
        }

        // Reemplaza placeholder y sanitiza
        const safeQuery = query.replace('{view}', viewName)
            .replace(/;.*$/, '') // Elimina múltiples statements
            .trim();

        // Valida que sea solo SELECT
        if (!safeQuery.toUpperCase().startsWith('SELECT')) {
            throw new Error('Only SELECT queries are allowed on AI views');
        }

        try {
            const result = this.db.exec(safeQuery);
            if (!result || result.length === 0) return [];

            const columns = result[0].columns;
            const values = result[0].values;

            return values.map((row: any[]) => {
                const obj: any = {};
                columns.forEach((col: string, i: number) => obj[col] = row[i]);
                return obj;
            });
        } catch (error: any) {
            logger.error(`Error querying view ${viewName}`, { error, query: safeQuery });
            throw new Error(`Query failed: ${error.message}`);
        }
    }
}
