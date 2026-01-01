import { DatabaseService } from '../database/DatabaseService';
import { DeepSeekAIResponse } from './types';

export type QueryIntentType = 'CUSTOMER_COUNT' | 'CUSTOMER_RANKING' | 'TOP_SUPPLIER' | 'INVOICE_SUMMARY' | 'TOP_PRODUCT' | 'GENERAL_QUERY';

export interface QueryIntent {
    type: QueryIntentType;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class NaturalLanguageQueryProcessor {
    private static dbService = DatabaseService.getInstance();

    private static intentMap: Record<QueryIntentType, string> = {
        'CUSTOMER_COUNT': 'v_clientes_reales',
        'CUSTOMER_RANKING': 'v_clientes_reales',
        'TOP_SUPPLIER': 'v_proveedores_reales',
        'INVOICE_SUMMARY': 'v_facturas_reales',
        'TOP_PRODUCT': 'v_facturas_reales', // Fallback temporal
        'GENERAL_QUERY': 'v_facturas_reales' // Fallback seguro
    };

    static analyzeIntent(question: string): QueryIntent {
        const lowerQ = question.toLowerCase();

        if (lowerQ.includes('cliente') && (lowerQ.includes('cuanto') || lowerQ.includes('cuánto') || lowerQ.includes('cuantos') || lowerQ.includes('cuántos') || lowerQ.includes('cantidad'))) {
            return { type: 'CUSTOMER_COUNT', priority: 'HIGH' };
        }
        if (lowerQ.includes('cliente') && (lowerQ.includes('ranking') || lowerQ.includes('mejor') || lowerQ.includes('importante'))) {
            return { type: 'CUSTOMER_RANKING', priority: 'HIGH' };
        }
        if (lowerQ.includes('proveedor') && (lowerQ.includes('mayor') || lowerQ.includes('mejor') || lowerQ.includes('principal'))) {
            return { type: 'TOP_SUPPLIER', priority: 'HIGH' };
        }
        if (lowerQ.includes('factura') && (lowerQ.includes('compra') || lowerQ.includes('venta') || lowerQ.includes('resumen'))) {
            return { type: 'INVOICE_SUMMARY', priority: 'MEDIUM' };
        }
        if (lowerQ.includes('articulo') || lowerQ.includes('artículo') || lowerQ.includes('producto')) {
            if (lowerQ.includes('mas') || lowerQ.includes('más') || lowerQ.includes('vendido')) {
                return { type: 'TOP_PRODUCT', priority: 'MEDIUM' };
            }
        }

        return { type: 'GENERAL_QUERY', priority: 'LOW' };
    }

    static async getRealData(intent: QueryIntent): Promise<any[]> {
        const view = this.intentMap[intent.type];
        try {
            return await this.dbService.executeSafeQuery(`SELECT * FROM ${view} LIMIT 10`);
        } catch (error) {
            console.warn(`[QueryProcessor] Could not fetch data for view ${view}`, error);
            return [];
        }
    }
}
