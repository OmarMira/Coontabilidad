
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
        let msg = lang === 'es'
            ? "No pude entender tu consulta semánticamente. ¿Podrías intentar preguntar de otra forma?"
            : "I couldn't semantically understand your query. Could you try asking in a different way?";

        const suggestions = lang === 'es'
            ? ["¿Cuántos clientes hay?", "¿Qué es un activo?", "¿Cuánto vendí este mes?"]
            : ["How many customers are there?", "What is an asset?", "How much did I sell this month?"];

        // Contextual hints
        if (lower.match(/\b(cliente|customer)\b/)) {
            msg = lang === 'es'
                ? "Pareces preguntar sobre clientes. ¿Te refieres a cuántos tienes o quién es el mejor?"
                : "You seem to be asking about customers. Do you mean how many you have or who is the best?";
        } else if (lower.match(/\b(factura|venta|vendi|invoice|sale|sold)\b/)) {
            msg = lang === 'es'
                ? "Pareces preguntar sobre ventas. Puedo decirte el total o buscar facturas."
                : "You seem to be asking about sales. I can tell you the total or find invoices.";
        }

        return {
            success: false,
            content: msg,
            data: null,
            metadata: {
                query,
                timestamp: new Date().toISOString(),
                intent: 'EMERGENCY_FALLBACK',
                confidence: 0,
                dataSource: 'fallback',
                processingTime: Date.now() - startTime,
                method: 'emergency_fallback',
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
