
import { QueryAnalysis } from './SemanticQueryAnalyzer';

export class IntelligentSQLGenerator {
    private static readonly TABLE_MAP: Record<string, string> = {
        'CUSTOMER': 'customers',
        'SUPPLIER': 'suppliers',
        'PRODUCT': 'products',
        'INVOICE': 'invoices',
        'ACCOUNT': 'chart_of_accounts',
        'ASSET': 'assets',
        'EXPENSE': 'expenses',
        'REVENUE': 'invoices' // En este sistema, revenue viene de invoices o tax_ledger
    };

    private static readonly COLUMN_MAP: Record<string, string> = {
        'customers': 'credit_limit',
        'suppliers': 'credit_limit',
        'products': 'price',
        'invoices': 'total_amount',
        'chart_of_accounts': 'balance',
        'assets': 'value',
        'expenses': 'amount'
    };

    generateSQL(analysis: QueryAnalysis): { sql: string, type: 'COUNT' | 'SUM' | 'SELECT' | 'VALUATION' } {
        const table = IntelligentSQLGenerator.TABLE_MAP[analysis.entity.key];

        if (!table) {
            throw new Error(`Entidad semántica '${analysis.entity.key}' no mapeada a tabla real.`);
        }

        const whereClause = this.buildWhereClause(analysis.parameters, table);

        switch (analysis.intent.key) {
            case 'COUNT':
                return {
                    sql: `SELECT COUNT(*) as count FROM ${table} ${whereClause}`.trim(),
                    type: 'COUNT'
                };

            case 'SUM':
                const sumCol = IntelligentSQLGenerator.COLUMN_MAP[table] || 'amount';
                return {
                    sql: `SELECT SUM(${sumCol}) as total FROM ${table} ${whereClause}`.trim(),
                    type: 'SUM'
                };

            case 'FIND_MAX':
                if (table === 'customers') {
                    return {
                        sql: `SELECT c.name, SUM(i.total_amount) as total_metric, COUNT(i.id) as count_metric 
                              FROM customers c 
                              LEFT JOIN invoices i ON c.id = i.customer_id 
                              GROUP BY c.id ORDER BY total_metric DESC LIMIT 1`.trim(),
                        type: 'SELECT'
                    };
                }
                if (table === 'suppliers') {
                    return {
                        sql: `SELECT s.name, SUM(e.amount) as total_metric, COUNT(e.id) as count_metric 
                              FROM suppliers s 
                              LEFT JOIN expenses e ON s.id = e.supplier_id 
                              GROUP BY s.id ORDER BY total_metric DESC LIMIT 1`.trim(),
                        type: 'SELECT'
                    };
                }
                const maxCol = IntelligentSQLGenerator.COLUMN_MAP[table] || 'id';
                return {
                    sql: `SELECT * FROM ${table} ${whereClause} ORDER BY ${maxCol} DESC LIMIT 1`.trim(),
                    type: 'SELECT'
                };

            case 'LIST':
            default:
                if (analysis.entity.key === 'PRODUCT' && (analysis.intent.key === 'SUM' || analysis.intent.key === 'UNKNOWN')) {
                    // Caso especial para valuación de inventario si no fue detectada explícitamente pero suena a total
                    return {
                        sql: `SELECT SUM(price * stock_quantity) as total FROM products ${whereClause}`.trim(),
                        type: 'SUM'
                    };
                }
                return {
                    sql: `SELECT * FROM ${table} ${whereClause} LIMIT 50`.trim(),
                    type: 'SELECT'
                };
        }
    }

    private buildWhereClause(params: Record<string, any>, table: string): string {
        const conditions: string[] = [];

        if (params.county) {
            if (table === 'customers') conditions.push(`florida_county LIKE '%${params.county}%'`);
            if (table === 'tax_ledger') conditions.push(`county LIKE '%${params.county}%'`);
        }

        if (params.status && (table === 'invoices' || table === 'customers')) {
            conditions.push(`status = '${params.status}'`);
        }

        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }
}
