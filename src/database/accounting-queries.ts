import { db } from './simple-db';
import initSqlJs from 'sql.js';

export interface AccountBalance {
    account_code: string;
    account_name: string;
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    balance: number;
}

export interface IncomeStatement {
    revenue: number;
    expenses: number;
    net_income: number;
}

export interface TaxSummary {
    total_tax: number;
    dr15_status: 'pending' | 'filed';
}

export interface InventoryValuation {
    total_value: number;
    item_count: number;
}

/**
 * Obtiene los saldos de todas las cuentas del catálogo
 */
export async function getAccountBalances(): Promise<AccountBalance[]> {
    if (!db) return [];

    const query = `
    SELECT 
      ca.account_code,
      ca.account_name,
      ca.account_type,
      SUM(CASE WHEN ca.normal_balance = 'debit' THEN jd.debit_amount - jd.credit_amount ELSE jd.credit_amount - jd.debit_amount END) as balance
    FROM chart_of_accounts ca
    LEFT JOIN journal_details jd ON ca.account_code = jd.account_code
    WHERE ca.is_active = 1
    GROUP BY ca.account_code, ca.account_name, ca.account_type
  `;

    try {
        const res = db.exec(query);
        if (!res.length) return [];

        return res[0].values.map(row => ({
            account_code: row[0] as string,
            account_name: row[1] as string,
            account_type: (row[2] as string).toLowerCase() as any,
            balance: Number(row[3]) || 0
        }));
    } catch (error) {
        console.error('Error fetching account balances:', error);
        return [];
    }
}

/**
 * Obtiene el estado de resultados desde el libro mayor (Ledger)
 */
export async function getIncomeStatement(): Promise<IncomeStatement> {
    if (!db) return { revenue: 0, expenses: 0, net_income: 0 };

    try {
        const query = `
      SELECT 
        ca.account_type,
        SUM(CASE WHEN ca.normal_balance = 'credit' THEN jd.credit_amount - jd.debit_amount ELSE jd.debit_amount - jd.credit_amount END) as balance
      FROM chart_of_accounts ca
      JOIN journal_details jd ON ca.account_code = jd.account_code
      WHERE ca.account_type IN ('revenue', 'expense')
      GROUP BY ca.account_type
    `;

        const res = db.exec(query);
        let revenue = 0;
        let expenses = 0;

        if (res.length) {
            res[0].values.forEach(row => {
                const type = row[0] as string;
                const amount = Number(row[1]) || 0;
                if (type === 'revenue') revenue = amount;
                if (type === 'expense') expenses = amount;
            });
        }

        // Si los asientos están incompletos, complementar con facturas como fallback para demostración
        if (revenue === 0) {
            const revRes = db.exec("SELECT SUM(total_amount) FROM invoices WHERE status != 'draft'");
            revenue = revRes.length && revRes[0].values[0][0] ? Number(revRes[0].values[0][0]) : 0;
        }
        if (expenses === 0) {
            const expRes = db.exec("SELECT SUM(total_amount) FROM bills WHERE status != 'draft'");
            expenses = expRes.length && expRes[0].values[0][0] ? Number(expRes[0].values[0][0]) : 0;
        }

        return {
            revenue,
            expenses,
            net_income: revenue - expenses
        };
    } catch (error) {
        console.error('Error in getIncomeStatement:', error);
        return { revenue: 0, expenses: 0, net_income: 0 };
    }
}

/**
 * Obtiene el total de ventas acumulado
 */
export async function getTotalSales(): Promise<{ total: number; count: number }> {
    if (!db) return { total: 0, count: 0 };
    const res = db.exec("SELECT SUM(total_amount), COUNT(*) FROM invoices WHERE status != 'draft'");
    return {
        total: res.length && res[0].values[0][0] ? Number(res[0].values[0][0]) : 0,
        count: res.length && res[0].values[0][1] ? Number(res[0].values[0][1]) : 0
    };
}

/**
 * Obtiene el total de compras acumulado
 */
export async function getTotalPurchases(): Promise<{ total: number; count: number }> {
    if (!db) return { total: 0, count: 0 };
    const res = db.exec("SELECT SUM(total_amount), COUNT(*) FROM bills WHERE status != 'draft'");
    return {
        total: res.length && res[0].values[0][0] ? Number(res[0].values[0][0]) : 0,
        count: res.length && res[0].values[0][1] ? Number(res[0].values[0][1]) : 0
    };
}

/**
 * Obtiene el resumen de impuestos de Florida
 */
export async function getFloridaTaxSummary(): Promise<TaxSummary> {
    if (!db) return { total_tax: 0, dr15_status: 'pending' };

    try {
        const res = db.exec("SELECT SUM(tax_amount) FROM invoices WHERE status != 'draft'");
        const total_tax = res.length && res[0].values[0][0] ? Number(res[0].values[0][0]) : 0;

        // Simplificación: si hay algún reporte DR-15 presentado este mes
        const month = new Date().toISOString().substring(0, 7);
        const drRes = db.exec(`SELECT status FROM dr15_reports WHERE period = ?`, [month]);
        const dr15_status = drRes.length && drRes[0].values[0][0] === 'filed' ? 'filed' : 'pending';

        return { total_tax, dr15_status };
    } catch (error) {
        console.error('Error fetching tax summary:', error);
        return { total_tax: 0, dr15_status: 'pending' };
    }
}

/**
 * Obtiene la valoración total del inventario (Precio de costo * Stock)
 */
export async function getInventoryValuation(): Promise<InventoryValuation> {
    if (!db) return { total_value: 0, item_count: 0 };

    try {
        const res = db.exec("SELECT SUM(cost * stock_quantity), COUNT(*) FROM products WHERE active = 1 AND is_service = 0");
        const total_value = res.length && res[0].values[0][0] ? Number(res[0].values[0][0]) : 0;
        const item_count = res.length && res[0].values[0][1] ? Number(res[0].values[0][1]) : 0;

        return { total_value, item_count };
    } catch (error) {
        console.error('Error fetching inventory valuation:', error);
        return { total_value: 0, item_count: 0 };
    }
}

/**
 * Obtiene el mejor cliente (por volumen de compras)
 */
export async function getTopCustomer(): Promise<{ name: string; total: number } | null> {
    if (!db) return null;
    const query = `
    SELECT c.name, SUM(i.total_amount) as total
    FROM customers c
    JOIN invoices i ON c.id = i.customer_id
    WHERE i.status != 'draft'
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT 1
  `;
    try {
        const res = db.exec(query);
        if (!res.length || !res[0].values.length) return null;
        return { name: res[0].values[0][0] as string, total: Number(res[0].values[0][1]) };
    } catch (error) {
        console.error('Error in getTopCustomer:', error);
        return null;
    }
}

/**
 * Obtiene el producto más vendido (por cantidad)
 */
export async function getTopProduct(): Promise<{ name: string; quantity: number } | null> {
    if (!db) return null;
    const query = `
    SELECT p.name, SUM(il.quantity) as total_qty
    FROM products p
    JOIN invoice_lines il ON p.id = il.product_id
    JOIN invoices i ON il.invoice_id = i.id
    WHERE i.status != 'draft'
    GROUP BY p.id
    ORDER BY total_qty DESC
    LIMIT 1
  `;
    try {
        const res = db.exec(query);
        if (!res.length || !res[0].values.length) return null;
        return { name: res[0].values[0][0] as string, quantity: Number(res[0].values[0][1]) };
    } catch (error) {
        console.error('Error in getTopProduct:', error);
        return null;
    }
}

/**
 * Obtiene productos con stock bajo (menor al mínimo)
 */
export async function getLowStockProducts(): Promise<{ name: string; stock: number; min: number }[]> {
    if (!db) return [];
    const query = `SELECT name, stock_quantity, min_stock_level FROM products WHERE stock_quantity <= min_stock_level AND active = 1 AND is_service = 0`;
    try {
        const res = db.exec(query);
        if (!res.length) return [];
        return res[0].values.map(row => ({ name: row[0] as string, stock: Number(row[1]), min: Number(row[2]) }));
    } catch (error) {
        return [];
    }
}

/**
 * Obtiene el producto más caro del inventario
 */
export async function getMostExpensiveProduct(): Promise<{ name: string; price: number } | null> {
    if (!db) return null;
    const res = db.exec("SELECT name, price FROM products WHERE active = 1 ORDER BY price DESC LIMIT 1");
    if (!res.length || !res[0].values.length) return null;
    return { name: res[0].values[0][0] as string, price: Number(res[0].values[0][1]) };
}

/**
 * Obtiene el resumen de impuestos por condado
 */
export async function getTaxByCounty(): Promise<{ county: string; total: number }[]> {
    if (!db) return [];
    const query = `
    SELECT c.florida_county, SUM(i.tax_amount) as total_tax
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.status != 'draft'
    GROUP BY c.florida_county
    ORDER BY total_tax DESC
  `;
    try {
        const res = db.exec(query);
        if (!res.length) return [];
        return res[0].values.map(row => ({ county: row[0] as string, total: Number(row[1]) }));
    } catch (error) {
        return [];
    }
}

/**
 * Obtiene el saldo total en cuentas por cobrar (AR)
 */
export async function getAccountsReceivable(): Promise<number> {
    if (!db) return 0;
    const res = db.exec("SELECT SUM(total_amount) FROM invoices WHERE status NOT IN ('draft', 'paid', 'void')");
    return res.length && res[0].values[0][0] ? Number(res[0].values[0][0]) : 0;
}

/**
 * Obtiene la última factura emitida
 */
export async function getLatestInvoice(): Promise<{ number: string; total: number; date: string } | null> {
    if (!db) return null;
    const res = db.exec("SELECT invoice_number, total_amount, issue_date FROM invoices ORDER BY id DESC LIMIT 1");
    if (!res.length || !res[0].values.length) return null;
    return {
        number: res[0].values[0][0] as string,
        total: Number(res[0].values[0][1]),
        date: res[0].values[0][2] as string
    };
}

/**
 * Obtiene la factura de mayor monto
 */
export async function getHighestInvoice(): Promise<{ number: string; total: number } | null> {
    if (!db) return null;
    const res = db.exec("SELECT invoice_number, total_amount FROM invoices WHERE status != 'draft' ORDER BY total_amount DESC LIMIT 1");
    if (!res.length || !res[0].values.length) return null;
    return { number: res[0].values[0][0] as string, total: Number(res[0].values[0][1]) };
}

/**
 * Obtiene el cliente que más ha PAGADO (Invoices con status 'paid')
 */
export async function getTopPayingCustomer(): Promise<{ name: string; total: number; count: number } | null> {
    if (!db) return null;
    const query = `
    SELECT c.name, SUM(i.total_amount) as total, COUNT(i.id) as count
    FROM customers c
    JOIN invoices i ON c.id = i.customer_id
    WHERE i.status = 'paid'
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT 1
  `;
    try {
        const res = db.exec(query);
        if (!res.length || !res[0].values.length) return null;
        return {
            name: res[0].values[0][0] as string,
            total: Number(res[0].values[0][1]),
            count: Number(res[0].values[0][2])
        };
    } catch (error) {
        console.error('Error in getTopPayingCustomer:', error);
        return null;
    }
}

/**
 * Obtiene el mejor proveedor (mayor volumen de transacciones en bills)
 */
export async function getTopSupplier(): Promise<{ name: string; total: number; count: number } | null> {
    if (!db) return null;
    const query = `
    SELECT s.name, SUM(b.total_amount) as total, COUNT(b.id) as count
    FROM suppliers s
    JOIN bills b ON s.id = b.supplier_id
    WHERE b.status != 'draft'
    GROUP BY s.id
    ORDER BY total DESC
    LIMIT 1
  `;
    try {
        const res = db.exec(query);
        if (!res.length || !res[0].values.length) return null;
        return {
            name: res[0].values[0][0] as string,
            total: Number(res[0].values[0][1]),
            count: Number(res[0].values[0][2])
        };
    } catch (error) {
        console.error('Error in getTopSupplier:', error);
        return null;
    }
}

/**
 * Obtiene alertas de auditoría crítica (Ej. descuadres)
 */
export async function getAuditAlerts(): Promise<string[]> {
    if (!db) return [];
    const alerts: string[] = [];

    // 1. Asientos descuadrados
    const unRes = db.exec("SELECT COUNT(*) FROM journal_entries WHERE total_debit != total_credit");
    if (unRes.length && Number(unRes[0].values[0][0]) > 0) {
        alerts.push(`Hay ${unRes[0].values[0][0]} asientos contables descuadrados.`);
    }

    // 2. Facturas vencidas
    const ovRes = db.exec("SELECT COUNT(*) FROM invoices WHERE status = 'overdue' OR (status != 'paid' AND due_date < date('now'))");
    if (ovRes.length && Number(ovRes[0].values[0][0]) > 0) {
        alerts.push(`Hay ${ovRes[0].values[0][0]} facturas vencidas.`);
    }

    return alerts;
}
