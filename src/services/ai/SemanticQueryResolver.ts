
import { SchemaContext, TableMetadata } from '../../types/ai-context';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { ProductionLogger } from '../../core/logging/ProductionLogger';

/**
 * SemanticQueryResolver - Fase 2 del DAC (Semantic Bridge)
 * 
 * Este servicio resuelve entidades semánticas (ej: 'CUSTOMER') a objetos reales
 * de la base de datos (tablas, columnas) usando el contexto dinámico.
 */
export class SemanticQueryResolver {
    private context: SchemaContext | null = null;
    private db: SQLiteEngine;

    constructor(db: SQLiteEngine) {
        this.db = db;
    }

    /**
     * Carga el contexto desde la base de datos
     */
    public async loadContext(): Promise<SchemaContext | null> {
        const result = await this.db.select(`
            SELECT value FROM system_config WHERE key = 'ai_schema_context'
        `);
        if (result.length > 0 && result[0].value) {
            try {
                this.context = JSON.parse(result[0].value as string);
                ProductionLogger.info('SemanticQueryResolver', 'Context loaded successfully');
                return this.context;
            } catch (e) {
                ProductionLogger.error('SemanticQueryResolver', 'Failed to parse context JSON', e as Error);
            }
        } else {
            ProductionLogger.warn('SemanticQueryResolver', 'No AI context found in system_config');
        }
        return null;
    }

    /**
     * Establece el contexto manualmente (para compartir instancia)
     */
    public setContext(context: SchemaContext): void {
        this.context = context;
        ProductionLogger.info('SemanticQueryResolver', 'Context set manually');
    }

    /**
     * Resuelve una entidad semántica a una tabla real
     */
    public resolveTable(entityKey: string): TableMetadata | null {
        if (!this.context) return null;

        // Buscar coincidencia exacta por businessEntity
        const table = this.context.tables.find(t => t.businessEntity === entityKey);
        if (table) return table;

        // Fallback: búsqueda por nombre de tabla similar (heurística)
        const commonNames: Record<string, string[]> = {
            'CUSTOMER': ['customers', 'clients', 'clientes'],
            'SUPPLIER': ['suppliers', 'vendors', 'proveedores'],
            'INVOICE': ['invoices', 'sales', 'facturas'],
            'EXPENSE': ['bills', 'expenses', 'gastos'],
            'PRODUCT': ['products', 'items', 'productos', 'inventory']
        };

        const candidates = commonNames[entityKey] || [];
        return this.context.tables.find(t => candidates.includes(t.name.toLowerCase())) || null;
    }

    /**
     * Resuelve la columna principal de una tabla (ej: la que tiene el monto o nombre)
     */
    public resolvePrimaryColumn(tableName: string, purpose: 'amount' | 'name' | 'id'): string | null {
        if (!this.context) return null;
        const table = this.context.tables.find(t => t.name === tableName);
        if (!table) return null;

        const cols = table.columns.map(c => c.name.toLowerCase());

        if (purpose === 'amount') {
            const amountHints = ['total_amount', 'amount', 'total', 'subtotal', 'balance', 'price', 'debit_amount'];
            return table.columns.find(c => amountHints.includes(c.name.toLowerCase()))?.name || null;
        }

        if (purpose === 'name') {
            const nameHints = ['name', 'description', 'title', 'label'];
            return table.columns.find(c => nameHints.includes(c.name.toLowerCase()))?.name || null;
        }

        if (purpose === 'id') {
            return table.columns.find(c => c.pk)?.name || 'id';
        }

        return null;
    }

    /**
     * Obtiene el contexto actual
     */
    public getContext(): SchemaContext | null {
        return this.context;
    }
}
