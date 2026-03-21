
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { SchemaContext, TableMetadata, RelationshipMetadata } from '../../types/ai-context';
import { ProductionLogger } from '../../core/logging/ProductionLogger';

/**
 * SchemaCrawler - Fase 1 del DAC (Truth Discovery)
 * 
 * Este servicio se encarga de interrogar a la base de datos real para generar
 * un contexto dinámico que la IA puede consumir.
 */
export class SchemaCrawler {
    private db: SQLiteEngine;

    constructor(db: SQLiteEngine) {
        this.db = db;
    }

    /**
     * Genera el contexto completo de la base de datos
     */
    public async crawl(): Promise<SchemaContext> {
        ProductionLogger.info('SchemaCrawler', 'Starting schema crawl...');
        const startTime = Date.now();

        try {
            // 1. Obtener lista de tablas (excluyendo tablas de sistema de SQLite)
            const tablesRes = await this.db.select(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `);
            const tableNames = tablesRes.map(t => t.name as string);

            const tables: TableMetadata[] = [];
            const relationships: RelationshipMetadata[] = [];

            for (const tableName of tableNames) {
                // 2. Obtener metadatos de columnas
                const columnsRes = await this.db.select(`PRAGMA table_info(${tableName})`);
                const columns = columnsRes.map(c => ({
                    name: c.name as string,
                    type: c.type as string,
                    notNull: c.notnull === 1,
                    pk: c.pk === 1,
                    defaultValue: c.dflt_value
                }));

                // 3. Obtener conteo de filas
                const countRes = await this.db.select(`SELECT COUNT(*) as count FROM ${tableName}`);
                const rowCount = countRes[0]?.count || 0;

                // 4. Identificar entidad de negocio (Mapeo heurístico inicial)
                const businessEntity = this.inferBusinessEntity(tableName);

                tables.push({
                    name: tableName,
                    columns,
                    rowCount,
                    businessEntity
                });

                // 5. Obtener claves foráneas para relaciones
                const fkRes = await this.db.select(`PRAGMA foreign_key_list(${tableName})`);
                for (const fk of fkRes) {
                    relationships.push({
                        fromTable: tableName,
                        fromColumn: fk.from as string,
                        toTable: fk.table as string,
                        toColumn: fk.to as string
                    });
                }
            }

            // 6. Obtener Logic Clock actual para frescura de datos
            let currentLogicClock = 0;
            try {
                const logicClockRes = await this.db.select("SELECT MAX(logic_clock) as max_clock FROM journal_entries");
                currentLogicClock = logicClockRes[0]?.max_clock || 0;
            } catch (e) {
                // Columna podría no existir si la migración 008 aún no se ha ejecutado
                ProductionLogger.debug('SchemaCrawler', 'Columna logic_clock no encontrada, usando valor por defecto 0');
            }

            const context: SchemaContext = {
                version: '1.0.0-dynamic',
                generatedAt: new Date().toISOString(),
                tables,
                relationships,
                stats: {
                    totalTables: tables.length,
                    logicClock: currentLogicClock
                }
            };

            ProductionLogger.info('SchemaCrawler', `Crawl completed in ${Date.now() - startTime}ms`, {
                tablesFound: tables.length,
                relationshipsFound: relationships.length
            });

            return context;

        } catch (error) {
            ProductionLogger.error('SchemaCrawler', 'Failed to crawl schema', error as Error);
            throw error;
        }
    }

    /**
     * Infiere la entidad de negocio basándose en el nombre de la tabla
     */
    private inferBusinessEntity(tableName: string): string {
        const mappings: Record<string, string> = {
            'customers': 'CUSTOMER',
            'suppliers': 'SUPPLIER',
            'products': 'PRODUCT',
            'invoices': 'INVOICE',
            'bills': 'EXPENSE',
            'chart_of_accounts': 'ACCOUNT',
            'fixed_assets': 'ASSET',
            'journal_entries': 'JOURNAL',
            'florida_tax_rates': 'TAX_CONFIG',
            'tax_transactions': 'TAX_LEDGER'
        };
        return mappings[tableName] || 'UNKNOWN';
    }

    /**
     * Guarda el contexto en la base de datos para persistencia
     */
    public async persistContext(context: SchemaContext): Promise<void> {
        const json = JSON.stringify(context);
        await this.db.run(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at) 
            VALUES ('ai_schema_context', ?, CURRENT_TIMESTAMP)
        `, [json]);

        // Generar y persistir resumen legible (Fase 5 DAC)
        const summaryMd = this.generateMarkdownSummary(context);
        await this.db.run(`
            INSERT OR REPLACE INTO system_config (key, value, updated_at) 
            VALUES ('ai_schema_summary_md', ?, CURRENT_TIMESTAMP)
        `, [summaryMd]);

        ProductionLogger.info('SchemaCrawler', 'Schema context and Markdown summary persisted');
    }

    /**
     * Genera un resumen en Markdown del esquema actual
     */
    private generateMarkdownSummary(context: SchemaContext): string {
        const lines: string[] = [
            `# 🧠 AI Database Dictionary (Dynamic)`,
            `*Generated at: ${context.generatedAt}*`,
            `*Logic Clock: ${context.stats.logicClock}*`,
            '',
            '## 📊 Resumen de Tablas',
            '| Entidad | Tabla Física | Columnas | Registros |',
            '| :--- | :--- | :--- | :--- |'
        ];

        context.tables.forEach(t => {
            lines.push(`| ${t.businessEntity} | \`${t.name}\` | ${t.columns.length} | ${t.rowCount} |`);
        });

        lines.push('', '## 📑 Detalle de Estructura');

        context.tables.forEach(t => {
            lines.push(`### 🔹 ${t.name} (${t.businessEntity})`);
            lines.push('| Columna | Tipo | PK | Not Null | Default |');
            lines.push('| :--- | :--- | :--- | :--- | :--- |');
            t.columns.forEach(c => {
                lines.push(`| \`${c.name}\` | ${c.type} | ${c.pk ? '✅' : ''} | ${c.notNull ? '✅' : ''} | ${c.defaultValue || '-'} |`);
            });
            lines.push('');
        });

        lines.push('', '## 🔗 Relaciones detectadas');
        context.relationships.forEach(r => {
            lines.push(`- \`${r.fromTable}.${r.fromColumn}\` ➡️ \`${r.toTable}.${r.toColumn}\``);
        });

        return lines.join('\n');
    }
}
