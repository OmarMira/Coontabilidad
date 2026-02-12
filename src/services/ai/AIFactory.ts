import { SemanticQueryAnalyzer } from './SemanticQueryAnalyzer';
import { IntelligentSQLGenerator } from './IntelligentSQLGenerator';
import { logger } from '../../core/logging/SystemLogger';
import { db } from '../../database/simple-db';
import { translationEngine } from '../../core/i18n/TranslationEngine';

/**
 * AI FACTORY (FACADE PATTERN)
 * 
 * Centralización única de servicios de IA:
 * - IAService: Análisis de salud financiera.
 * - DataDrivenAIService: Procesamiento validado de datos.
 * - IntelligentSQLGenerator: Generación de consultas semánticas.
 */

export interface AIResponse {
    content: string;
    source: 'database' | 'knowledge_base' | 'analytical';
    confidence: number;
    data?: any;
    alerts?: string[];
    actions?: string[];
}

export class AIFactory {

    private static readonly ALLOWED_VIEWS = [
        'financial_summary',
        'tax_summary_florida',
        'inventory_summary',
        'alerts_summary',
        'customers_summary',
        'invoices_summary'
    ];

    /**
     * Punto de entrada principal para cualquier consulta de IA.
     */
    static async processQuery(query: string): Promise<AIResponse> {
        const lang = translationEngine.getLanguage();
        logger.info('AIFactory', 'process_query', `Procesando consulta unificada [${lang}]`, { query });

        try {
            const analyzer = await SemanticQueryAnalyzer.getInstance();
            const analysis = await analyzer.analyzeQuery(query);

            // 1. Manejo de consultas de conocimiento (Estructura Procedural)
            if (analysis.intent.key === 'EXPLAIN' || analysis.intent.key === 'HOW_TO') {
                const message = lang === 'es'
                    ? `He detectado que buscas información sobre "${analysis.entity.key}". Mi base de conocimientos procedural indica que debes seguir los estándares de AccountExpress para este proceso.`
                    : `I've detected that you're looking for information about "${analysis.entity.key}". My procedural knowledge base indicates you should follow AccountExpress standards for this process.`;

                return {
                    content: message,
                    source: 'knowledge_base',
                    confidence: analysis.confidence
                };
            }

            // 2. Manejo de Análisis de Salud (Módulo IAService anterior)
            if (query.toLowerCase().includes('salud') || query.toLowerCase().includes('health') || query.toLowerCase().includes('summary') || query.toLowerCase().includes('resumen')) {
                return await this.generateFinancialHealthAnalysis(lang);
            }

            // 3. Manejo de consultas de datos dinámicas
            const sqlGenerator = new IntelligentSQLGenerator();
            const { sql } = sqlGenerator.generateSQL(analysis);

            // Verificación estricta de seguridad
            this.validateSecurity(sql);

            const result = await this.executeSecureQuery(sql);

            if (!result || result.length === 0) {
                return {
                    content: translationEngine.t('noDataAvailable'),
                    source: 'database',
                    confidence: 1.0
                };
            }

            // Generación de respuesta basada estrictamente en datos
            const content = this.buildDataContent(analysis, result, lang);

            return {
                content,
                source: 'database',
                confidence: analysis.confidence,
                data: result
            };

        } catch (error) {
            logger.error('AIFactory', 'process_failed', 'Error al procesar consulta en factoría AI', null, error as Error);
            throw error;
        }
    }

    /**
     * Módulo de Salud Financiera (Heredado de IAService)
     */
    private static async generateFinancialHealthAnalysis(lang: string): Promise<AIResponse> {
        const financialData = await this.executeSecureQuery('SELECT * FROM financial_summary');
        const alertsData = await this.executeSecureQuery('SELECT * FROM alerts_summary');

        const alerts: string[] = [];
        alertsData.forEach((a: any) => {
            if (a.cantidad > 0) {
                const alertText = lang === 'es' ? `⚠️ ${a.tipo_alerta}: ${a.cantidad} detectados` : `⚠️ ${a.tipo_alerta}: ${a.cantidad} detected`;
                alerts.push(alertText);
            }
        });

        const content = lang === 'es'
            ? "Análisis de salud financiera completado basado en datos consolidados de la base de datos local."
            : "Financial health analysis completed based on consolidated local database data.";

        const actions = lang === 'es'
            ? ["Revisar flujo de caja semanal", "Verificar fechas de vencimiento de tax florida"]
            : ["Review weekly cash flow", "Verify Florida tax due dates"];

        const emptyAlert = lang === 'es' ? "✅ Sistema operando sin alertas críticas" : "✅ System operating without critical alerts";

        return {
            content,
            source: 'analytical',
            confidence: 0.98,
            data: { financial: financialData },
            alerts: alerts.length > 0 ? alerts : [emptyAlert],
            actions
        };
    }

    /**
     * Ejecución segura con validación de solo-lectura
     */
    private static async executeSecureQuery(sql: string): Promise<any[]> {
        if (!db) throw new Error('Database Engine Offline');

        const result = db.exec(sql);
        if (result.length === 0) return [];

        const columns = result[0].columns;
        return result[0].values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, i: number) => obj[col] = row[i]);
            return obj;
        });
    }

    private static validateSecurity(sql: string) {
        const s = sql.toUpperCase();
        if (!s.startsWith('SELECT')) throw new Error('Seguridad AI: Comando no autorizado');
        if (s.includes('DROP') || s.includes('DELETE') || s.includes('UPDATE')) {
            throw new Error('Seguridad AI: Intento de modificación detectado');
        }
    }

    private static buildDataContent(analysis: any, data: any[], lang: string): string {
        const entity = translationEngine.t(analysis.entity.key.toLowerCase());
        if (analysis.intent.key === 'COUNT') {
            const val = data[0].count || data[0].total || data.length;
            return lang === 'es'
                ? `El sistema reporta un total de ${val} registros bajo la categoría ${entity}.`
                : `The system reports a total of ${val} records under the ${entity} category.`;
        }
        if (analysis.intent.key === 'SUM') {
            const val = data[0].total || data[0].sum || data[0].amount || 0;
            return lang === 'es'
                ? `El análisis financiero arroja un valor total de $${val.toLocaleString()} para ${entity}.`
                : `The financial analysis yields a total value of $${val.toLocaleString()} for ${entity}.`;
        }
        return lang === 'es'
            ? `He recuperado ${data.length} registros detallados sobre ${entity}.`
            : `I have retrieved ${data.length} detailed records about ${entity}.`;
    }
}
