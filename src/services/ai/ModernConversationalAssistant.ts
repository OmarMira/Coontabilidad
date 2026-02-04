
import { SemanticQueryAnalyzer, QueryAnalysis } from './SemanticQueryAnalyzer';
import { IntelligentSQLGenerator } from './IntelligentSQLGenerator';
import { QuerySecurityMonitor } from './QuerySecurityMonitor';
import { AccountingKnowledgeBase } from './AccountingKnowledgeBase';
import { LocalAIService } from './LocalAIService';

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
    private sqlGenerator: IntelligentSQLGenerator;
    private securityMonitor: QuerySecurityMonitor;
    private knowledgeBase: AccountingKnowledgeBase;
    private localAI: LocalAIService;
    private isInitialized: boolean = false;

    constructor() {
        this.sqlGenerator = new IntelligentSQLGenerator();
        this.securityMonitor = new QuerySecurityMonitor();
        this.knowledgeBase = new AccountingKnowledgeBase();
        this.localAI = new LocalAIService();
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            this.analyzer = await SemanticQueryAnalyzer.getInstance();
            this.isInitialized = true;
            console.log("✅ ModernConversationalAssistant Initialized.");
        } catch (error) {
            console.error("⚠️ Error initializing ModernConversationalAssistant:", error);
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
            console.error('❌ Critical error in processQuery:', error);
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
                content = `🧮 **${data.name}**\n\n${data.definition}\n\n**${lang === 'es' ? 'Ejemplo' : 'Example'}:** ${data.example || 'N/A'}`;
                if (data.florida_specific) {
                    content += `\n\n🌴 **${lang === 'es' ? 'Nota para Florida' : 'Florida Note'}:** ${data.florida_specific}`;
                }
            }
        } else if (analysis.intent.key === 'HOW_TO') {
            const steps = AccountingKnowledgeBase.getProcedure(query, lang);
            if (steps) {
                const title = lang === 'es' ? 'Procedimiento' : 'Procedure';
                content = `📖 **${title}:**\n\n` + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
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
                ? ["¿Puedes darme más detalles?", "Ver reportes relacionados"]
                : ["Can you give me more details?", "View related reports"],
            requiresAttention: false
        };
    }

    private async handleDataQuery(query: string, analysis: QueryAnalysis, startTime: number): Promise<AssistantResponse> {
        const lang = analysis.language;
        try {
            const sqlResult = this.sqlGenerator.generateSQL(analysis);
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
                ? ["¿Qué más puedes hacer?", "Ayuda del sistema"]
                : ["What else can you do?", "System help"],
            requiresAttention: false
        };
    }

    private async executeRawQuery(query: string): Promise<any[]> {
        const { db } = await import('../../database/simple-db');
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
                ? "📊 Puedo ayudarte con información sobre clientes. Intenta preguntar:\n• ¿Cuántos clientes tengo?\n• ¿Quién es mi mejor cliente?\n• Muéstrame los clientes con deuda pendiente"
                : "📊 I can help you with customer information. Try asking:\n• How many customers do I have?\n• Who is my best customer?\n• Show me customers with outstanding debt";
            suggestions = lang === 'es' 
                ? ["¿Cuántos clientes tengo?", "¿Quién es mi mejor cliente?"]
                : ["How many customers do I have?", "Who is my best customer?"];
        } else if (lower.match(/\b(factura|venta|vendi|invoice|sale|sold)\b/)) {
            msg = lang === 'es'
                ? "💰 Puedo ayudarte con información de ventas. Intenta preguntar:\n• ¿Cuánto vendí este mes?\n• ¿Cuál fue mi mejor venta?\n• Muéstrame las facturas pendientes de cobro"
                : "💰 I can help you with sales information. Try asking:\n• How much did I sell this month?\n• What was my best sale?\n• Show me outstanding invoices";
            suggestions = lang === 'es'
                ? ["¿Cuánto vendí este mes?", "¿Cuál fue mi mejor venta?"]
                : ["How much did I sell this month?", "What was my best sale?"];
        } else if (lower.match(/\b(impuesto|tax|florida|dr-?15)\b/)) {
            msg = lang === 'es'
                ? "🌴 Puedo ayudarte con impuestos de Florida. Intenta preguntar:\n• ¿Qué es el DR-15?\n• ¿Cuál es la tasa de impuesto en Miami-Dade?\n• ¿Qué productos están exentos de impuesto?\n• ¿Cómo generar el reporte DR-15?"
                : "🌴 I can help you with Florida taxes. Try asking:\n• What is DR-15?\n• What is the tax rate in Miami-Dade?\n• What products are tax-exempt?\n• How to generate the DR-15 report?";
            suggestions = lang === 'es'
                ? ["¿Qué es el DR-15?", "Tasas de impuesto por condado"]
                : ["What is DR-15?", "Tax rates by county"];
        } else if (lower.match(/\b(activo|pasivo|patrimonio|asset|liability|equity|balance)\b/)) {
            msg = lang === 'es'
                ? "🧮 Puedo explicarte conceptos contables. Intenta preguntar:\n• ¿Qué es un activo?\n• ¿Qué es un pasivo?\n• ¿Qué es el patrimonio?\n• ¿Cómo funciona la partida doble?"
                : "🧮 I can explain accounting concepts. Try asking:\n• What is an asset?\n• What is a liability?\n• What is equity?\n• How does double-entry work?";
            suggestions = lang === 'es'
                ? ["¿Qué es un activo?", "¿Qué es un pasivo?"]
                : ["What is an asset?", "What is a liability?"];
        } else if (lower.match(/\b(como|how|procedimiento|procedure|paso|step)\b/)) {
            msg = lang === 'es'
                ? "📖 Puedo guiarte en procedimientos contables. Intenta preguntar:\n• ¿Cómo crear una factura?\n• ¿Cómo registrar una venta a crédito?\n• ¿Cómo hacer conciliación bancaria?\n• ¿Cómo procesar nómina?\n• ¿Cómo prepararse para una auditoría?"
                : "📖 I can guide you through accounting procedures. Try asking:\n• How to create an invoice?\n• How to record a credit sale?\n• How to do bank reconciliation?\n• How to process payroll?\n• How to prepare for an audit?";
            suggestions = lang === 'es'
                ? ["¿Cómo crear una factura?", "¿Cómo hacer conciliación bancaria?"]
                : ["How to create an invoice?", "How to do bank reconciliation?"];
        } else if (lower.match(/\b(depreciacion|depreciation|macrs|seccion 179|section 179)\b/)) {
            msg = lang === 'es'
                ? "📉 Puedo ayudarte con depreciación de activos. Intenta preguntar:\n• ¿Qué es MACRS?\n• ¿Qué es la Sección 179?\n• ¿Cómo calcular depreciación?\n• ¿Qué es bonus depreciation?"
                : "📉 I can help you with asset depreciation. Try asking:\n• What is MACRS?\n• What is Section 179?\n• How to calculate depreciation?\n• What is bonus depreciation?";
            suggestions = lang === 'es'
                ? ["¿Qué es MACRS?", "¿Qué es la Sección 179?"]
                : ["What is MACRS?", "What is Section 179?"];
        } else if (lower.match(/\b(exencion|exemption|exento|exempt|certificado|certificate)\b/)) {
            msg = lang === 'es'
                ? "📋 Puedo ayudarte con exenciones fiscales. Intenta preguntar:\n• ¿Qué productos están exentos de impuesto?\n• ¿Qué es un certificado de reventa?\n• ¿Qué es el DR-13?\n• ¿Qué es el use tax?"
                : "📋 I can help you with tax exemptions. Try asking:\n• What products are tax-exempt?\n• What is a resale certificate?\n• What is DR-13?\n• What is use tax?";
            suggestions = lang === 'es'
                ? ["¿Qué es un certificado de reventa?", "Productos exentos de impuesto"]
                : ["What is a resale certificate?", "Tax-exempt products"];
        } else {
            msg = lang === 'es'
                ? "🤖 Soy tu asistente contable para Florida. Puedo ayudarte con:\n\n📊 **Datos del sistema:**\n• Clientes, facturas, productos, ventas\n• Reportes financieros y estadísticas\n\n🧮 **Conceptos contables:**\n• Activos, pasivos, patrimonio\n• Depreciación, MACRS, Sección 179\n• Plan de cuentas, libro mayor\n\n🌴 **Impuestos de Florida:**\n• DR-15, tasas por condado (67 condados)\n• Exenciones, certificados de reventa\n• Use tax, impuesto sobre propiedad personal\n\n📖 **Procedimientos:**\n• Crear facturas, registrar ventas\n• Conciliación bancaria, cierre de mes\n• Procesar nómina, auditorías\n\n**Ejemplos de preguntas:**\n• ¿Cuánto vendí este mes?\n• ¿Qué es el DR-15?\n• ¿Cómo hacer conciliación bancaria?\n• ¿Cuál es la tasa de impuesto en Broward?"
                : "🤖 I'm your Florida accounting assistant. I can help you with:\n\n📊 **System data:**\n• Customers, invoices, products, sales\n• Financial reports and statistics\n\n🧮 **Accounting concepts:**\n• Assets, liabilities, equity\n• Depreciation, MACRS, Section 179\n• Chart of accounts, general ledger\n\n🌴 **Florida taxes:**\n• DR-15, county rates (67 counties)\n• Exemptions, resale certificates\n• Use tax, tangible personal property tax\n\n📖 **Procedures:**\n• Create invoices, record sales\n• Bank reconciliation, month-end close\n• Process payroll, audits\n\n**Example questions:**\n• How much did I sell this month?\n• What is DR-15?\n• How to do bank reconciliation?\n• What is the tax rate in Broward?";
            suggestions = lang === 'es'
                ? ["¿Cuánto vendí este mes?", "¿Qué es el DR-15?", "¿Cómo crear una factura?", "Tasas de impuesto Florida"]
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
                ? `⚠️ **Aviso del sistema:** No pudimos procesar tu solicitud. ${error.message}`
                : `⚠️ **System Notice:** We couldn't process your request. ${error.message}`,
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
