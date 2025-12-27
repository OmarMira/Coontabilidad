import { SystemKnowledge } from '../../knowledge/SystemKnowledge';
import { DatabaseService } from '../database/DatabaseService';
import { AssistantContext, KnowledgeSnippet } from './types';
import { SECURITY_FILTERS } from '../../config/deepseek';

export class ContextBuilder {
    private dbService: DatabaseService;

    constructor() {
        this.dbService = DatabaseService.getInstance();
    }

    async buildContext(userQuery: string, userId: number): Promise<AssistantContext> {
        console.log(`[ContextBuilder] Building context for user ${userId}, query: "${userQuery}"`);

        // 1. ANÁLISIS DE INTENCIÓN
        const topics = await this.extractTopicsAndIntent(userQuery);

        // 2. CONOCIMIENTO LOCAL RELEVANTE
        const localKnowledge = await this.searchLocalKnowledge(topics);

        // 3. DATOS DE VISTAS _summary (SOLO LECTURA)
        const relevantData = await this.queryRelevantSummaries(topics, userId);

        // 4. CONTEXTO DEL USUARIO
        const userContext = await this.getUserContext(userId);

        // 5. ESTADO DEL SISTEMA
        const systemState = await this.getSystemState();

        // 6. HISTORIAL DE CONVERSACIÓN
        const conversationHistory = await this.getConversationHistory(userId);

        return {
            timestamp: new Date().toISOString(),
            userQuery,
            detectedTopics: topics,
            localKnowledge,
            relevantData: this.sanitizeForAPI(relevantData),
            userPermissions: userContext,
            systemState,
            conversationHistory
        };
    }

    private async extractTopicsAndIntent(query: string): Promise<string[]> {
        const topics: string[] = [];

        // Detectar temas contables
        const accountingTerms = {
            'depreciación': ['depreciación', 'amortización', 'activo fijo', 'vida útil'],
            'impuestos': ['impuesto', 'tax', 'florida', 'condado', 'DR-15', 'surtax'],
            'inventario': ['inventario', 'stock', 'lote', 'SKU', 'rotación'],
            'facturación': ['factura', 'invoice', 'cliente', 'proveedor', 'pago'],
            'contabilidad': ['asiento', 'débito', 'crédito', 'balance', 'partida doble']
        };

        const queryLower = query.toLowerCase();

        // Buscar coincidencias
        Object.entries(accountingTerms).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                topics.push(topic);
            }
        });

        return topics.length > 0 ? topics : ['general'];
    }

    private async searchLocalKnowledge(topics: string[]): Promise<KnowledgeSnippet[]> {
        const snippets: KnowledgeSnippet[] = [];

        // Buscar en conocimiento del sistema
        for (const topic of topics) {
            const results = await SystemKnowledge.searchByTopic(topic);
            snippets.push(...results.map(result => ({
                source: 'system_knowledge' as any,
                content: result.content,
                relevance: result.relevance,
                lastUpdated: result.lastUpdated
            })));
        }

        return snippets
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 10);
    }

    private async queryRelevantSummaries(topics: string[], userId: number): Promise<any[]> {
        const queries: string[] = [];

        // Construir consultas seguras basadas en temas
        if (topics.includes('inventario')) {
            queries.push('SELECT product_name, current_stock, min_stock, last_movement FROM inventory_summary LIMIT 10');
        }

        if (topics.includes('impuestos')) {
            queries.push('SELECT county_code, tax_rate, surtax_rate, effective_date FROM tax_summary_florida LIMIT 5');
        }

        if (topics.includes('facturación')) {
            queries.push('SELECT invoice_type, count, total_amount, last_30_days FROM invoices_summary LIMIT 5');
        }

        if (topics.includes('contabilidad')) {
            queries.push('SELECT account_type, balance, last_entry_date FROM financial_summary LIMIT 10');
        }

        if (queries.length === 0) {
            return [];
        }

        try {
            const results = [];
            for (const query of queries) {
                const data = await this.dbService.executeSafeQuery(query, []);
                results.push(...data);
            }
            return results;
        } catch (error) {
            return [];
        }
    }

    private sanitizeForAPI(data: any[]): any[] {
        return data.map(item => {
            const sanitized = { ...item };
            const sensitiveFields = [
                'email', 'phone', 'tax_id', 'address', 'social_security',
                'credit_card', 'password', 'birth_date', 'full_name'
            ];

            sensitiveFields.forEach(field => {
                if (sanitized[field] !== undefined) delete sanitized[field];
            });

            return sanitized;
        });
    }

    private async getUserContext(userId: number) {
        return {
            userId,
            roles: ['admin'], // Simplificado para desarrollo
            allowedViews: SECURITY_FILTERS.allowedTables
        };
    }

    private async getSystemState() {
        const health = await this.dbService.checkHealth();
        const backup = await this.dbService.getLastBackup();

        return {
            databaseStatus: health.healthy ? 'healthy' as any : 'offline' as any,
            lastBackup: backup?.timestamp || 'never',
            taxPeriodActive: new Date().getDate() <= 20
        };
    }

    private async getConversationHistory(userId: number) {
        try {
            const data = await this.dbService.executeSafeQuery(
                'SELECT query, response, timestamp FROM ai_conversations WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
                [userId]
            );
            return data.map(row => ({
                query: row.query,
                response: row.response,
                timestamp: row.timestamp
            }));
        } catch (error) {
            console.warn('[ContextBuilder] Could not fetch history', error);
            return [];
        }
    }
}
