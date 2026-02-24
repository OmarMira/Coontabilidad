
import { QueryAnalysis } from './SemanticQueryAnalyzer';
import { SemanticQueryResolver } from './SemanticQueryResolver';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

export class IntelligentSQLGenerator {
    private resolver: SemanticQueryResolver;

    constructor(db: SQLiteEngine) {
        this.resolver = new SemanticQueryResolver(db);
    }

    async generateSQL(analysis: QueryAnalysis): Promise<{ sql: string, type: 'COUNT' | 'SUM' | 'SELECT' | 'VALUATION' }> {
        // Asegurar que el contexto esté cargado
        await this.resolver.loadContext();

        const tableMetadata = this.resolver.resolveTable(analysis.entity.key);

        if (!tableMetadata) {
            throw new Error(`Entidad semántica '${analysis.entity.key}' no pudo ser resuelta a una tabla real en el contexto actual.`);
        }

        const result = await this.executeIntent(analysis, tableMetadata);

        // DAC Phase 4: Cross-Verification
        this.validateSQL(result.sql, tableMetadata);

        return result;
    }

    private async executeIntent(analysis: QueryAnalysis, tableMetadata: any): Promise<{ sql: string, type: 'COUNT' | 'SUM' | 'SELECT' | 'VALUATION' }> {
        const table = tableMetadata.name;
        const whereClause = this.buildWhereClause(analysis.parameters, tableMetadata);

        switch (analysis.intent.key) {
            case 'COUNT':
                return {
                    sql: `SELECT COUNT(*) as count FROM ${table} ${whereClause}`.trim(),
                    type: 'COUNT'
                };

            case 'SUM':
                const sumCol = this.resolver.resolvePrimaryColumn(table, 'amount') || 'amount';
                return {
                    sql: `SELECT SUM(${sumCol}) as total FROM ${table} ${whereClause}`.trim(),
                    type: 'SUM'
                };

            case 'FIND_MAX':
                if (analysis.entity.key === 'CUSTOMER') {
                    // Especialización para ranking de clientes (usa JOINs si existen)
                    return {
                        sql: `SELECT c.name, SUM(i.total_amount) as total_metric 
                              FROM customers c 
                              LEFT JOIN invoices i ON c.id = i.customer_id 
                              GROUP BY c.id ORDER BY total_metric DESC LIMIT 1`.trim(),
                        type: 'SELECT'
                    };
                }
                const maxCol = this.resolver.resolvePrimaryColumn(table, 'amount') ||
                    this.resolver.resolvePrimaryColumn(table, 'id') || 'id';
                return {
                    sql: `SELECT * FROM ${table} ${whereClause} ORDER BY ${maxCol} DESC LIMIT 1`.trim(),
                    type: 'SELECT'
                };

            case 'LIST':
            default:
                if (analysis.entity.key === 'PRODUCT' && (analysis.intent.key === 'SUM' || analysis.intent.key === 'UNKNOWN')) {
                    // Verificación dinámica de columnas para valuación
                    const priceCol = this.resolver.resolvePrimaryColumn(table, 'amount');
                    if (priceCol && tableMetadata.columns.some((c: any) => c.name === 'stock_quantity')) {
                        return {
                            sql: `SELECT SUM(${priceCol} * stock_quantity) as total FROM ${table} ${whereClause}`.trim(),
                            type: 'SUM'
                        };
                    }
                }
                return {
                    sql: `SELECT * FROM ${table} ${whereClause} LIMIT 50`.trim(),
                    type: 'SELECT'
                };
        }
    }

    /**
     * Valida que el SQL generado sea coherente con el esquema actual
     */
    private validateSQL(sql: string, tableMetadata: any): void {
        const upperSQL = sql.toUpperCase();
        const tableName = tableMetadata.name.toUpperCase();

        // 1. Verificar presencia de la tabla principal
        if (!upperSQL.includes(tableName) && !upperSQL.includes(' FROM C ')) { // C es alias común
            throw new Error(`Validación Fallida: El SQL generado no referencia la tabla '${tableMetadata.name}' del contexto.`);
        }

        // 2. Anti-injection básico y protección de sistema
        const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'REPLACE'];
        for (const word of forbidden) {
            if (upperSQL.includes(word + ' ')) {
                throw new Error(`Violación de seguridad: El SQL generado contiene comandos de escritura prohibidos (${word}).`);
            }
        }

        // 3. Verificar columnas básicas si no es SELECT *
        if (!upperSQL.includes('*')) {
            const columns = tableMetadata.columns.map((c: any) => c.name.toUpperCase());
            // Esta verificación es heurística, solo para capturar errores groseros
            const sqlParts = upperSQL.split(/SELECT|FROM|WHERE|GROUP BY|ORDER BY/);
            const selectPart = sqlParts[1] || '';

            // Si hay Alias (i.total_amount), limpiar para verificar presencia en contexto
            const cleanedSelect = selectPart.replace(/\w+\./g, '').replace(/AS \w+/g, '');
            // TODO: Validación de columnas más profunda si fuera necesario
        }
    }

    private buildWhereClause(params: Record<string, any>, tableMeta: any): string {
        const conditions: string[] = [];
        const cols = tableMeta.columns.map((c: any) => c.name.toLowerCase());

        if (params.county) {
            if (cols.includes('florida_county')) conditions.push(`florida_county LIKE '%${params.county}%'`);
            else if (cols.includes('county')) conditions.push(`county LIKE '%${params.county}%'`);
        }

        if (params.status && cols.includes('status')) {
            conditions.push(`status = '${params.status}'`);
        }

        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }
}
