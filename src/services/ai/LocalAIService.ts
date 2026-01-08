
import { db } from '../../database/simple-db';
import { IAnalysisService, AIResponse, DeepSeekAIResponse } from './types';

// Translation map for entities
const ENTITY_TRANSLATIONS: Record<string, { es: string, en: string, pluralEs: string, pluralEn: string }> = {
    'customer': { es: 'cliente', en: 'customer', pluralEs: 'clientes', pluralEn: 'customers' },
    'supplier': { es: 'proveedor', en: 'supplier', pluralEs: 'proveedores', pluralEn: 'suppliers' },
    'product': { es: 'producto', en: 'product', pluralEs: 'productos', pluralEn: 'products' },
    'invoice': { es: 'factura', en: 'invoice', pluralEs: 'facturas', pluralEn: 'invoices' },
    'asset': { es: 'activo', en: 'asset', pluralEs: 'activos', pluralEn: 'assets' },
    'expense': { es: 'gasto', en: 'expense', pluralEs: 'gastos', pluralEn: 'expenses' },
    'revenue': { es: 'ingreso', en: 'revenue', pluralEs: 'ingresos', pluralEn: 'revenues' },
    'account': { es: 'cuenta', en: 'account', pluralEs: 'cuentas', pluralEn: 'accounts' }
};

export class LocalAIService implements IAnalysisService {
    async analyzeFinancialHealth(): Promise<AIResponse> {
        return this.generateResponse("Financial analysis not implemented.");
    }

    async explainTaxCalculation(taxData: any): Promise<AIResponse> {
        return this.generateResponse("Tax calculation not implemented.");
    }

    async processQuery(question: string, userId: number = 1): Promise<DeepSeekAIResponse> {
        try {
            const result = await this.answer(question);
            return this.wrapResponse(question, result);
        } catch (error) {
            return this.wrapResponse(question, "Error processing query.");
        }
    }

    async generateNarrativeAnalysis(data: any[], context: { intent: string; entity: string; query: string; language?: 'es' | 'en' }): Promise<string> {
        const { intent, entity, language = 'es' } = context;

        let total = data.length;
        if (data.length === 1 && (data[0].count !== undefined || data[0].total !== undefined)) {
            total = Number(data[0].count || data[0].total || 0);
        }

        const trans = ENTITY_TRANSLATIONS[entity] || { es: entity, en: entity, pluralEs: entity + 's', pluralEn: entity + 's' };
        const entityName = total === 1 ? trans[language] : (language === 'es' ? trans.pluralEs : trans.pluralEn);

        if (total === 0) {
            return language === 'es'
                ? `He analizado tu solicitud sobre **${trans.pluralEs}**, pero actualmente no hay registros reales en la base de datos.`
                : `I have analyzed your request regarding **${trans.pluralEn}**, but there are currently no real records in the database.`;
        }

        let analysis = "";

        switch (intent) {
            case 'count_entities':
                const sampleNamesCount = data.slice(0, 3).map(d => d.name || d.business_name || d.description).filter(Boolean);
                if (language === 'es') {
                    const plural = total === 1 ? '' : 's';
                    analysis = `Actualmente el sistema cuenta con un total de **${total}** ${entityName} registrado${plural}. `;
                    if (sampleNamesCount.length > 0) analysis += `Entre ellos se encuentran **${sampleNamesCount.join(', ')}**. `;
                    analysis += `\n\n¿Deseas ver la lista completa?`;
                } else {
                    analysis = `The system currently has a total of **${total}** registered ${entityName}. `;
                    if (sampleNamesCount.length > 0) analysis += `These include **${sampleNamesCount.join(', ')}**. `;
                    analysis += `\n\nWould you like to see the full list?`;
                }
                break;

            case 'valuation':
                const valSum = data.length === 1 && (data[0].total !== undefined || data[0].count !== undefined)
                    ? Number(data[0].total || data[0].count)
                    : 0;
                if (language === 'es') {
                    analysis = `La valuación calculada para **${entityName}** es de **$${valSum.toLocaleString()}**. Este cálculo se basa en los precios y cantidades actuales.`;
                } else {
                    analysis = `The calculated valuation for **${entityName}** is **$${valSum.toLocaleString()}**. This calculation is based on current prices and quantities.`;
                }
                break;

            case 'find_best':
                const best = data[0];
                const nameBest = best.name || best.description || best.business_name || best.invoice_number || (language === 'es' ? "registro" : "record");
                const totalMetric = best.total_metric || best.total_spent || best.total_amount || best.amount || 0;
                if (language === 'es') {
                    analysis = `Tras analizar los registros, he identificado que el mejor resultado corresponde a **${nameBest}**. Registra un volumen de **$${Number(totalMetric).toLocaleString()}**.`;
                } else {
                    analysis = `After analyzing the records, I have identified that the best result corresponds to **${nameBest}**. It has a volume of **$${Number(totalMetric).toLocaleString()}**.`;
                }
                break;

            case 'sum_metrics':
                const sum = data.length === 1 && (data[0].total !== undefined || data[0].count !== undefined)
                    ? Number(data[0].total || data[0].count)
                    : data.reduce((acc, curr) => acc + (Number(curr.total) || Number(curr.amount) || Number(curr.total_amount) || 0), 0);
                if (language === 'es') {
                    analysis = `El análisis de métricas acumuladas para **${entityName}** arroja un total global de **$${sum.toLocaleString()}**.`;
                } else {
                    analysis = `The accumulated metrics analysis for **${entityName}** shows a global total of **$${sum.toLocaleString()}**.`;
                }
                break;

            default:
                if (language === 'es') {
                    analysis = `He encontrado **${total}** registros de ${entityName}. Los datos están listos para tu revisión detallada.`;
                } else {
                    analysis = `I found **${total}** records of ${entityName}. The data is ready for your detailed review.`;
                }
                break;
        }

        return analysis;
    }

    private async answer(question: string): Promise<string> {
        return `Processing: "${question}"`;
    }

    private wrapResponse(query: string, text: string): DeepSeekAIResponse {
        return {
            id: `local_${Date.now()}`,
            timestamp: new Date().toISOString(),
            query: query,
            response: {
                intent: 'DATA_ANALYSIS',
                information: text,
                action: 'Narrative Generated',
                explanation: 'Local narrative engine processed',
                considerations: 'Based on real database records'
            },
            rawResponse: text,
            contextUsed: { topics: [], dataPoints: 1, knowledgeSnippets: 0 },
            metadata: { model: 'Local-Narrative-Engine', tokensUsed: 0, processingTime: 0, fallbackUsed: false }
        };
    }

    private generateResponse(text: string): AIResponse {
        return {
            content: text,
            intent: 'N/A',
            information: text,
            action: 'N/A',
            explanation: text,
            considerations: 'N/A',
            metadata: { model: 'Local-Narrative', processingTime: 0, dataSource: 'N/A' }
        };
    }
}
