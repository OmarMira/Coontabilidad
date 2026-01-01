
import { db } from '../../database/simple-db';
import { IAnalysisService, AIResponse, DeepSeekAIResponse } from './types';

// LocalAIServiceSimple.ts - VERSIÓN FUNCIONAL
export class LocalAIService implements IAnalysisService {
    async analyzeFinancialHealth(): Promise<AIResponse> {
        return this.fakeAIResponse("Análisis financiero no implementado en versión simple.");
    }

    async explainTaxCalculation(taxData: any): Promise<AIResponse> {
        return this.fakeAIResponse("Cálculo de impuestos no implementado en versión simple.");
    }

    async processQuery(question: string, userId: number = 1): Promise<DeepSeekAIResponse> {
        try {
            const result = await this.answer(question);
            return this.wrapResponse(question, result);
        } catch (error) {
            console.error("LocalAIService Error:", error);
            return this.wrapResponse(question, "Lo siento, ocurrió un error al consultar el sistema.");
        }
    }

    private async answer(question: string): Promise<string> {
        if (!db) {
            return "El sistema de base de datos no está inicializado.";
        }

        try {
            const datos = db.exec('SELECT * FROM datos_sistema LIMIT 1');
            if (!datos.length || !datos[0].values.length) {
                return "No se pudieron obtener los datos del sistema.";
            }

            const row: any = {};
            datos[0].columns.forEach((col, idx) => {
                row[col] = datos[0].values[0][idx];
            });

            const qLower = question.toLowerCase();

            // RESPUESTAS DIRECTAS CON DATOS REALES
            if (qLower.includes('cuantos cliente') || qLower.includes('cuántos cliente') || qLower.includes('cantidad de cliente')) {
                return `Tienes ${row.total_clientes} clientes registrados.`;
            }

            if (qLower.includes('proveedor')) {
                return row.total_proveedores > 0
                    ? `Tienes ${row.total_proveedores} proveedores.`
                    : `No hay proveedores registrados.`;
            }

            if (qLower.includes('mayor venta')) {
                return row.mayor_venta_monto > 0
                    ? `La mayor venta es ${row.mayor_venta_numero} por $${row.mayor_venta_monto}.`
                    : `No hay ventas registradas.`;
            }

            if (qLower.includes('factura') || qLower.includes('cuantas facturas')) {
                return `Hay ${row.facturas_venta} facturas de venta y ${row.facturas_compra} de compra.`;
            }

            if (qLower.includes('inventario') || qLower.includes('valor')) {
                return `El valor total del inventario es $${row.valor_inventario || 0}.`;
            }

            // FALBACK HONESTO
            return `Consulta "${question.substring(0, 30)}..." no entendida o no implementada. Intenta preguntar por clientes, facturas o proveedores.`;

        } catch (e: any) {
            console.error("Error executing query:", e);
            return `Error al consultar base de datos: ${e.message}`;
        }
    }

    private wrapResponse(query: string, text: string): DeepSeekAIResponse {
        return {
            id: `simple_${Date.now()}`,
            timestamp: new Date().toISOString(),
            query: query,
            response: {
                intent: 'CONSULTA_DIRECTA',
                information: text,
                action: 'Verificar datos en pantalla',
                explanation: 'Respuesta generada por consulta SQL directa (Modo Seguro)',
                considerations: 'Datos en tiempo real'
            },
            rawResponse: text,
            contextUsed: { topics: [], dataPoints: 1, knowledgeSnippets: 0 },
            metadata: {
                model: 'SQL-Direct',
                tokensUsed: 0,
                processingTime: 0,
                fallbackUsed: false
            }
        };
    }

    private fakeAIResponse(text: string): AIResponse {
        return {
            content: text,
            intent: 'N/A',
            information: text,
            action: 'N/A',
            explanation: text,
            considerations: 'N/A',
            metadata: { model: 'SQL-Direct', processingTime: 0, dataSource: 'N/A' }
        };
    }
}
