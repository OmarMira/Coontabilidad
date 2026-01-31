import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { logger } from '../../core/logging/SystemLogger';

/**
 * Seeder masivo para pruebas de integración de los 12 Prompts.
 * Incluye: Empresas, Empleados, Proveedores, Inventario, Asientos y Automatizaciones.
 */
export class MassiveSeeder {
    private db: SQLiteEngine;

    constructor(db: SQLiteEngine) {
        this.db = db;
    }

    async seedAll(): Promise<void> {
        try {
            logger.info('Seeder', 'start', 'Iniciando inyección masiva de datos de prueba (12 Prompts)');

            await this.seedCompanies();
            await this.seedPayroll();
            await this.seedSuppliersAndPO();
            await this.seedInventory();
            await this.seedAutomations();

            logger.info('Seeder', 'complete', 'Inyección masiva completada exitosamente');
        } catch (error) {
            logger.error('Seeder', 'failed', 'Error durante la inyección masiva', { error });
            throw error;
        }
    }

    private async seedCompanies(): Promise<void> {
        // Prompt 11: Multi-Company
        await this.db.run(`
            INSERT INTO companies (name, tax_id, address, city, state, zip, phone, email, is_active) VALUES 
            ('Account Express Main HQ', '59-1234567', '123 Fiscal Blvd', 'Miami', 'FL', '33101', '305-555-0100', 'admin@accountexpress.com', 1),
            ('Account Express Subsidiary A', '59-9876543', '456 Commerce Way', 'Orlando', 'FL', '32801', '407-555-0200', 'orlando@accountexpress.com', 1)
        `);
    }

    private async seedPayroll(): Promise<void> {
        // Prompt 7: Payroll
        // Empleados
        await this.db.run(`
            INSERT INTO employees (employee_number, first_name, last_name, email, salary_type, salary_rate, status, florida_county) VALUES 
            ('EMP-001', 'John', 'Doe', 'john.doe@company.com', 'monthly', 500000, 'active', 'Miami-Dade'),
            ('EMP-002', 'Jane', 'Smith', 'jane.smith@company.com', 'hourly', 2500, 'active', 'Broward'),
            ('EMP-003', 'Robert', 'Johnson', 'robert.j@company.com', 'monthly', 650000, 'active', 'Palm Beach')
        `);

        // Periodos de Pago
        await this.db.run(`
            INSERT INTO payroll_periods (name, start_date, end_date, pay_date, status, total_gross, total_net) VALUES 
            ('January 2026 - A', '2026-01-01', '2026-01-15', '2026-01-15', 'closed', 1500000, 1200000)
        `);
    }

    private async seedSuppliersAndPO(): Promise<void> {
        // Prompt 8: AP
        await this.db.run(`
            INSERT INTO suppliers (name, contact_person, email, phone, terms, credit_limit) VALUES 
            ('Tech Distributors Inc', 'Mike Supply', 'sales@techdist.com', '305-555-1000', 'NET30', 5000000),
            ('Office Depot Business', 'Sarah Chair', 'b2b@officedepot.com', '800-555-2000', 'NET15', 200000)
        `);

        await this.db.run(`
            INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_date, total_amount, status) VALUES 
            ('PO-2026-001', 1, '2026-01-10', '2026-01-20', 150000, 'received')
        `);
    }

    private async seedInventory(): Promise<void> {
        // Prompt 6 & 9: Inventory & Advanced
        await this.db.run(`
            INSERT INTO products (sku, name, description, price, cost, stock_quantity, category_id, min_stock_level) VALUES 
            ('MAC-PRO-16', 'MacBook Pro 16', 'Apple M3 Max', 350000, 280000, 10, 1, 5),
            ('DEL-XPS-15', 'Dell XPS 15', 'Intel i9', 250000, 200000, 15, 1, 5)
        `);
    }

    private async seedAutomations(): Promise<void> {
        // Prompt 12: Automation
        // Simular logs de automatización
        // (Asumiendo tabla automation_logs existe o se creará en schema)
    }
}
