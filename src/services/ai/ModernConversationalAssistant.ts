import { logger } from '../../core/logging/SystemLogger';

import { SemanticQueryAnalyzer, QueryAnalysis } from './SemanticQueryAnalyzer';
import { IntelligentSQLGenerator } from './IntelligentSQLGenerator';
import { QuerySecurityMonitor } from './QuerySecurityMonitor';
import { AccountingKnowledgeBase } from './AccountingKnowledgeBase';
import { LocalAIService } from './LocalAIService';
import { EngineBridge } from '../../core/database/EngineBridge';

export interface AssistantResponse {
    success: boolean;
    content: string;
    data: any;
    metadata: {
        query: string;
        timestamp: string;
        intent: string;
        confidence: number;
        dataSource: string;
        processingTime: number;
        method?: string;
        language?: 'es' | 'en';
    };
    suggestions: string[];
    requiresAttention: boolean;
}

export class ModernConversationalAssistant {
    private analyzer: SemanticQueryAnalyzer | null = null;
    private sqlGenerator: IntelligentSQLGenerator | null = null;
    private securityMonitor: QuerySecurityMonitor;
    private knowledgeBase: AccountingKnowledgeBase;
    private localAI: LocalAIService;
    private isInitialized: boolean = false;

    constructor() {
        this.securityMonitor = new QuerySecurityMonitor();
        this.knowledgeBase = new AccountingKnowledgeBase();
        this.localAI = new LocalAIService();
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            this.analyzer = await SemanticQueryAnalyzer.getInstance();
            this.sqlGenerator = new IntelligentSQLGenerator(EngineBridge.getEngine());
            this.isInitialized = true;
            logger.info('ModernConversationalAssistant', 'info', 'operation_failed', "âœ… ModernConversationalAssistant Initialized.");
        } catch (error) {
            logger.error('ModernConversationalAssistant', 'error', 'operation_failed', "âš ï¸ Error initializing ModernConversationalAssistant:", error);
        }
    }

    async processQuery(userQuery: string, userId: number = 1): Promise<AssistantResponse> {
        const startTime = Date.now();

        try {
            if (!this.isInitialized) await this.initialize();

            const analyzer = this.analyzer || await SemanticQueryAnalyzer.getInstance();
            const analysis = await analyzer.analyzeQuery(userQuery);
            const lang = analysis.language;

            // 1. Emergency Fallback if confidence is zero
            if (analysis.confidence === 0 || (analysis.intent.key === 'UNKNOWN' && analysis.entity.key === 'UNKNOWN')) {
                return this.emergencyFallback(userQuery, startTime, lang);
            }

            // 2. Knowledge Path (EXPLAIN or HOW_TO)
            if (analysis.intent.key === 'EXPLAIN' || analysis.intent.key === 'HOW_TO') {
                return await this.handleKnowledgeQuery(userQuery, analysis, startTime);
            }

            // 3. Special mapping for verbs if entity is ambiguous
            if (analysis.entity.key === 'UNKNOWN' || analysis.entity.key === 'INVOICE' || analysis.entity.key === 'EXPENSE') {
                const lower = userQuery.toLowerCase();
                if (lower.match(/\b(vendi|venta|sold|sale)\b/)) {
                    analysis.entity.key = 'INVOICE';
                    if (analysis.intent.key === 'UNKNOWN') analysis.intent.key = 'SUM';
                } else if (lower.match(/\b(compre|compra|bought|purchase)\b/)) {
                    analysis.entity.key = 'EXPENSE';
                    if (analysis.intent.key === 'UNKNOWN') analysis.intent.key = 'SUM';
                }
            }

            // 4. Data Path
            if (analysis.entity.key !== 'UNKNOWN') {
                return await this.handleDataQuery(userQuery, analysis, startTime);
            }

            return await this.handleGeneralQuery(userQuery, analysis, startTime);

        } catch (error: any) {
            logger.error('ModernConversationalAssistant', 'error', 'âŒ Critical error in processQuery:', error);
            return this.generateErrorResponse(userQuery, error, startTime);
        }
    }

    private async handleKnowledgeQuery(query: string, analysis: QueryAnalysis, startTime: number): Promise<AssistantResponse> {
        const lang = analysis.language;
        let content = "";

        if (analysis.intent.key === 'EXPLAIN') {
            const concept = AccountingKnowledgeBase.searchConcept(query, lang);
            if (concept) {
                const data = concept[lang];
                content = `ðŸ§® **${data.name}**\n\n${data.definition}\n\n**${lang === 'es' ? 'Ejemplo' : 'Example'}:** ${data.example || 'N/A'}`;
                if (data.florida_specific) {
                    content += `\n\nðŸŒ´ **${lang === 'es' ? 'Nota para Florida' : 'Florida Note'}:** ${data.florida_specific}`;
                }
            }
        } else if (analysis.intent.key === 'HOW_TO') {
            const steps = AccountingKnowledgeBase.getProcedure(query, lang);
            if (steps) {
                const title = lang === 'es' ? 'Procedimiento' : 'Procedure';
                content = `ðŸ“– **${title}:**\n\n` + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
            }
        }

        if (!content) return await this.handleGeneralQuery(query, analysis, startTime);

        return {
            success: true,
            content,
            data: null,
            metadata: {
                query,
                timestamp: new Date().toISOString(),
                intent: analysis.intent.key,
                confidence: analysis.confidence,
                dataSource: 'AccountingKnowledgeBase',
                processingTime: Date.now() - startTime,
                language: lang
            },
            suggestions: lang === 'es'
                ? ["Â¿Puedes darme mÃ¡s detalles?", "Ver reportes relacionados"]
                : ["Can you give me more details?", "View related reports"],
            requiresAttention: false
        };
    }

    private async handleDataQuery(query: string, analysis: QueryAnalysis, startTime: number): Promise<AssistantResponse> {
        const lang = analysis.language;
        try {
            if (!this.sqlGenerator) this.sqlGenerator = new IntelligentSQLGenerator(EngineBridge.getEngine());
            const sqlResult = await this.sqlGenerator.generateSQL(analysis);
            const security = QuerySecurityMonitor.validateQuery(sqlResult.sql);

            if (!security.isValid) {
                return this.generateErrorResponse(query, new Error(`Security: ${security.reason}`), startTime, lang);
            }

            const data = await this.executeRawQuery(sqlResult.sql);
            const narrative = await this.localAI.generateNarrativeAnalysis(data, {
                intent: analysis.intent.key === 'SUM' ? 'sum_metrics' :
                    analysis.intent.key === 'COUNT' ? 'count_entities' :
                        analysis.intent.key === 'FIND_MAX' ? 'find_best' : 'default',
                entity: analysis.entity.key.toLowerCase(),
                query: query,
                language: lang
            });

            return {
                success: true,
                content: narrative,
                data: data,
                metadata: {
                    query,
                    timestamp: new Date().toISOString(),
                    intent: analysis.intent.key,
                    confidence: analysis.confidence,
                    dataSource: 'Database',
                    processingTime: Date.now() - startTime,
                    language: lang
                },
                suggestions: lang === 'es'
                    ? ["Ver tabla de datos", "Exportar a Excel"]
                    : ["View data table", "Export to Excel"],
                requiresAttention: false
            };
        } catch (e: any) {
            return this.handleGeneralQuery(query, analysis, startTime);
        }
    }

    private async handleGeneralQuery(query: string, analysis: QueryAnalysis, startTime: number): Promise<AssistantResponse> {
        const lang = analysis.language;
        const localRes = await this.localAI.processQuery(query);
        return {
            success: true,
            content: localRes.response.information,
            data: null,
            metadata: {
                query,
                timestamp: localRes.timestamp,
                intent: 'GENERAL_AI',
                confidence: analysis.confidence,
                dataSource: localRes.metadata.model || 'LocalAI',
                processingTime: Date.now() - startTime,
                language: lang
            },
            suggestions: lang === 'es'
                ? ["Â¿QuÃ© mÃ¡s puedes hacer?", "Ayuda del sistema"]
                : ["What else can you do?", "System help"],
            requiresAttention: false
        };
    }

    private async executeRawQuery(query: string): Promise<any[]> {
        const { db } = await import('../../database/modules/db-core');
        if (!db) return [];
        try {
            const result = db.exec(query);
            if (!result || result.length === 0 || !result[0].values) return [];
            const columns = result[0].columns;
            const rows = result[0].values;
            return rows.map((row: any[]) => {
                const obj: any = {};
                columns.forEach((col: string, index: number) => {
                    obj[col] = row[index];
                });
                return obj;
            });
        } catch (e) {
            return [];
        }
    }

    private emergencyFallback(query: string, startTime: number, lang: 'es' | 'en' = 'es'): AssistantResponse {
        const lower = query.toLowerCase();
        let msg = '';
        let suggestions: string[] = [];

        // Contextual intelligent fallback
        if (lower.match(/\b(cliente|customer)\b/)) {
            msg = lang === 'es'
                ? "ðŸ“Š Puedo ayudarte con informaciÃ³n sobre clientes. Intenta preguntar:\nâ€¢ Â¿CuÃ¡ntos clientes tengo?\nâ€¢ Â¿QuiÃ©n es mi mejor cliente?\nâ€¢ MuÃ©strame los clientes con deuda pendiente"
                : "ðŸ“Š I can help you with customer information. Try asking:\nâ€¢ How many customers do I have?\nâ€¢ Who is my best customer?\nâ€¢ Show me customers with outstanding debt";
            suggestions = lang === 'es'
                ? ["Â¿CuÃ¡ntos clientes tengo?", "Â¿QuiÃ©n es mi mejor cliente?"]
                : ["How many customers do I have?", "Who is my best customer?"];
        } else if (lower.match(/\b(factura|venta|vendi|invoice|sale|sold)\b/)) {
            msg = lang === 'es'
                ? "ðŸ’° Puedo ayudarte con informaciÃ³n de ventas. Intenta preguntar:\nâ€¢ Â¿CuÃ¡nto vendÃ­ este mes?\nâ€¢ Â¿CuÃ¡l fue mi mejor venta?\nâ€¢ MuÃ©strame las facturas pendientes de cobro"
                : "ðŸ’° I can help you with sales information. Try asking:\nâ€¢ How much did I sell this month?\nâ€¢ What was my best sale?\nâ€¢ Show me outstanding invoices";
            suggestions = lang === 'es'
                ? ["Â¿CuÃ¡nto vendÃ­ este mes?", "Â¿CuÃ¡l fue mi mejor venta?"]
                : ["How much did I sell this month?", "What was my best sale?"];
        } else if (lower.match(/\b(impuesto|tax|florida|dr-?15)\b/)) {
            msg = lang === 'es'
                ? "ðŸŒ´ Puedo ayudarte con impuestos de Florida. Intenta preguntar:\nâ€¢ Â¿QuÃ© es el DR-15?\nâ€¢ Â¿CuÃ¡l es la tasa de impuesto en Miami-Dade?\nâ€¢ Â¿QuÃ© productos estÃ¡n exentos de impuesto?\nâ€¢ Â¿CÃ³mo generar el reporte DR-15?"
                : "ðŸŒ´ I can help you with Florida taxes. Try asking:\nâ€¢ What is DR-15?\nâ€¢ What is the tax rate in Miami-Dade?\nâ€¢ What products are tax-exempt?\nâ€¢ How to generate the DR-15 report?";
            suggestions = lang === 'es'
                ? ["Â¿QuÃ© es el DR-15?", "Tasas de impuesto por condado"]
                : ["What is DR-15?", "Tax rates by county"];
        } else if (lower.match(/\b(activo|pasivo|patrimonio|asset|liability|equity|balance)\b/)) {
            msg = lang === 'es'
                ? "ðŸ§® Puedo explicarte conceptos contables. Intenta preguntar:\nâ€¢ Â¿QuÃ© es un activo?\nâ€¢ Â¿QuÃ© es un pasivo?\nâ€¢ Â¿QuÃ© es el patrimonio?\nâ€¢ Â¿CÃ³mo funciona la partida doble?"
                : "ðŸ§® I can explain accounting concepts. Try asking:\nâ€¢ What is an asset?\nâ€¢ What is a liability?\nâ€¢ What is equity?\nâ€¢ How does double-entry work?";
            suggestions = lang === 'es'
                ? ["Â¿QuÃ© es un activo?", "Â¿QuÃ© es un pasivo?"]
                : ["What is an asset?", "What is a liability?"];
        } else if (lower.match(/\b(como|how|procedimiento|procedure|paso|step)\b/)) {
            msg = lang === 'es'
                ? "ðŸ“– Puedo guiarte en procedimientos contables. Intenta preguntar:\nâ€¢ Â¿CÃ³mo crear una factura?\nâ€¢ Â¿CÃ³mo registrar una venta a crÃ©dito?\nâ€¢ Â¿CÃ³mo hacer conciliaciÃ³n bancaria?\nâ€¢ Â¿CÃ³mo procesar nÃ³mina?\nâ€¢ Â¿CÃ³mo prepararse para una auditorÃ­a?"
                : "ðŸ“– I can guide you through accounting procedures. Try asking:\nâ€¢ How to create an invoice?\nâ€¢ How to record a credit sale?\nâ€¢ How to do bank reconciliation?\nâ€¢ How to process payroll?\nâ€¢ How to prepare for an audit?";
            suggestions = lang === 'es'
                ? ["Â¿CÃ³mo crear una factura?", "Â¿CÃ³mo hacer conciliaciÃ³n bancaria?"]
                : ["How to create an invoice?", "How to do bank reconciliation?"];
        } else if (lower.match(/\b(depreciacion|depreciation|macrs|seccion 179|section 179)\b/)) {
            msg = lang === 'es'
                ? "ðŸ“‰ Puedo ayudarte con depreciaciÃ³n de activos. Intenta preguntar:\nâ€¢ Â¿QuÃ© es MACRS?\nâ€¢ Â¿QuÃ© es la SecciÃ³n 179?\nâ€¢ Â¿CÃ³mo calcular depreciaciÃ³n?\nâ€¢ Â¿QuÃ© es bonus depreciation?"
                : "ðŸ“‰ I can help you with asset depreciation. Try asking:\nâ€¢ What is MACRS?\nâ€¢ What is Section 179?\nâ€¢ How to calculate depreciation?\nâ€¢ What is bonus depreciation?";
            suggestions = lang === 'es'
                ? ["Â¿QuÃ© es MACRS?", "Â¿QuÃ© es la SecciÃ³n 179?"]
                : ["What is MACRS?", "What is Section 179?"];
        } else if (lower.match(/\b(exencion|exemption|exento|exempt|certificado|certificate)\b/)) {
            msg = lang === 'es'
                ? "ðŸ“‹ Puedo ayudarte con exenciones fiscales. Intenta preguntar:\nâ€¢ Â¿QuÃ© productos estÃ¡n exentos de impuesto?\nâ€¢ Â¿QuÃ© es un certificado de reventa?\nâ€¢ Â¿QuÃ© es el DR-13?\nâ€¢ Â¿QuÃ© es el use tax?"
                : "ðŸ“‹ I can help you with tax exemptions. Try asking:\nâ€¢ What products are tax-exempt?\nâ€¢ What is a resale certificate?\nâ€¢ What is DR-13?\nâ€¢ What is use tax?";
            suggestions = lang === 'es'
                ? ["Â¿QuÃ© es un certificado de reventa?", "Productos exentos de impuesto"]
                : ["What is a resale certificate?", "Tax-exempt products"];
        } else {
            msg = lang === 'es'
                ? "ðŸ¤– Soy tu asistente contable para Florida. Puedo ayudarte con:\n\nðŸ“Š **Datos del sistema:**\nâ€¢ Clientes, facturas, productos, ventas\nâ€¢ Reportes financieros y estadÃ­sticas\n\nðŸ§® **Conceptos contables:**\nâ€¢ Activos, pasivos, patrimonio\nâ€¢ DepreciaciÃ³n, MACRS, SecciÃ³n 179\nâ€¢ Plan de cuentas, libro mayor\n\nðŸŒ´ **Impuestos de Florida:**\nâ€¢ DR-15, tasas por condado (67 condados)\nâ€¢ Exenciones, certificados de reventa\nâ€¢ Use tax, impuesto sobre propiedad personal\n\nðŸ“– **Procedimientos:**\nâ€¢ Crear facturas, registrar ventas\nâ€¢ ConciliaciÃ³n bancaria, cierre de mes\nâ€¢ Procesar nÃ³mina, auditorÃ­as\n\n**Ejemplos de preguntas:**\nâ€¢ Â¿CuÃ¡nto vendÃ­ este mes?\nâ€¢ Â¿QuÃ© es el DR-15?\nâ€¢ Â¿CÃ³mo hacer conciliaciÃ³n bancaria?\nâ€¢ Â¿CuÃ¡l es la tasa de impuesto en Broward?"
                : "ðŸ¤– I'm your Florida accounting assistant. I can help you with:\n\nðŸ“Š **System data:**\nâ€¢ Customers, invoices, products, sales\nâ€¢ Financial reports and statistics\n\nðŸ§® **Accounting concepts:**\nâ€¢ Assets, liabilities, equity\nâ€¢ Depreciation, MACRS, Section 179\nâ€¢ Chart of accounts, general ledger\n\nðŸŒ´ **Florida taxes:**\nâ€¢ DR-15, county rates (67 counties)\nâ€¢ Exemptions, resale certificates\nâ€¢ Use tax, tangible personal property tax\n\nðŸ“– **Procedures:**\nâ€¢ Create invoices, record sales\nâ€¢ Bank reconciliation, month-end close\nâ€¢ Process payroll, audits\n\n**Example questions:**\nâ€¢ How much did I sell this month?\nâ€¢ What is DR-15?\nâ€¢ How to do bank reconciliation?\nâ€¢ What is the tax rate in Broward?";
            suggestions = lang === 'es'
                ? ["Â¿CuÃ¡nto vendÃ­ este mes?", "Â¿QuÃ© es el DR-15?", "Â¿CÃ³mo crear una factura?", "Tasas de impuesto Florida"]
                : ["How much did I sell this month?", "What is DR-15?", "How to create an invoice?", "Florida tax rates"];
        }

        return {
            success: true,
            content: msg,
            data: null,
            metadata: {
                query,
                timestamp: new Date().toISOString(),
                intent: 'CONTEXTUAL_HELP',
                confidence: 0.5,
                dataSource: 'intelligent_fallback',
                processingTime: Date.now() - startTime,
                method: 'contextual_fallback',
                language: lang
            },
            suggestions,
            requiresAttention: false
        };
    }

    private generateErrorResponse(query: string, error: Error, startTime: number, lang: 'es' | 'en' = 'es'): AssistantResponse {
        return {
            success: false,
            content: lang === 'es'
                ? `âš ï¸ **Aviso del sistema:** No pudimos procesar tu solicitud. ${error.message}`
                : `âš ï¸ **System Notice:** We couldn't process your request. ${error.message}`,
            data: null,
            metadata: {
                query,
                timestamp: new Date().toISOString(),
                intent: 'ERROR',
                confidence: 0,
                dataSource: 'system',
                processingTime: Date.now() - startTime,
                language: lang
            },
            suggestions: lang === 'es' ? ["Reintentar", "Ayuda"] : ["Retry", "Help"],
            requiresAttention: true
        };
    }
}

