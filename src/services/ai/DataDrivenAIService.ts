import { db } from '../../database/simple-db';
import { logger } from '../../utils/logger';

export interface AIResponse {
    content: string;
    source: 'database' | 'knowledge_base';
    confidence: number;
}

export interface QueryIntent {
    type: 'DATA_QUERY' | 'PROCEDURAL' | 'UNKNOWN';
    originalQuestion: string;
    targetView?: string;
}

export interface QueryData {
    sql: string;
    rows: any[];
    columns: string[];
    rowCount: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    dataPresent: boolean;
}

export class DataDrivenAIService {
    private static readonly STRICT_RULES = {
        // ❌ BLOQUEAR ABSOLUTAMENTE estas respuestas (Patrones de documentación o tutorial)
        BLOCKED_PATTERNS: [
            /¿Cómo (registrar|crear|agregar)/i,
            /Pasos?:?\s*\d+\./i,
            /Ve al menú/i,
            /Haz clic en/i,
            /Presiona (el|la)/i,
            /Tips?:/i,
            /📍 Ubicación:/i,
            /💡/i,
            /📖/i
        ],

        // ✅ REQUERIR estos elementos en respuestas de datos
        REQUIRED_FOR_DATA_QUERIES: [
            'SELECT',
            'COUNT',
            'SUM',
            'v_'
        ]
    };

    /**
     * Procesa una consulta con validación extrema para asegurar que sea data-driven.
     */
    static async processQueryWithStrictValidation(question: string): Promise<AIResponse> {
        logger.info('Procesando consulta IA con validación estricta de datos...', { question }, 'DataDrivenAI', 'process');

        if (!db) throw new Error('Database not available');

        // 1. DETECCIÓN DE INTENCIÓN (Simulada para brevedad, en producción usaría QueryProcessor)
        const intent = this.detectSimpleIntent(question);

        // 2. SI ES CONSULTA DE DATOS → OBTENER DATOS PRIMERO
        if (intent.type === 'DATA_QUERY') {
            try {
                const data = await this.fetchDataForIntent(intent);

                if (data.rowCount === 0) {
                    return {
                        content: "Lo siento, no encontré datos en el sistema que coincidan con tu consulta. ¿Deseas que analice otro parámetro?",
                        source: 'database',
                        confidence: 1.0
                    };
                }

                // 3. GENERAR RESPUESTA BASADA EN DATOS (Aquí se llamaría al LLM inyectando el context de data)
                // Por ahora simulamos la respuesta del LLM para validar el flujo
                const responseContent = this.simulatellmResponse(intent, data);

                const response: AIResponse = {
                    content: responseContent,
                    source: 'database',
                    confidence: 0.95
                };

                // 4. VALIDACIÓN EXTREMA
                const validation = this.extremeResponseValidation(response, data);

                if (!validation.isValid) {
                    logger.warn('Respuesta de IA invalidada por contener patrones de documentación o falta de datos', { errors: validation.errors }, 'DataDrivenAI', 'validation_failed');
                    // Forzar una respuesta puramente basada en la tabla de datos
                    return this.generateFallbackDataReport(data);
                }

                return response;
            } catch (error: any) {
                logger.error('Error fetching data for AI', { error: error.message }, error, 'DataDrivenAI', 'fetch_error');
                throw error;
            }
        }

        return {
            content: "Actualmente estoy optimizado para consultas de datos forenses. Por favor, hazme una pregunta sobre tus clientes, ventas o productos.",
            source: 'knowledge_base',
            confidence: 0.8
        };
    }

    private static detectSimpleIntent(question: string): QueryIntent {
        const q = question.toLowerCase();
        if (q.includes('cuanto') || q.includes('cual') || q.includes('listado') || q.includes('total')) {
            return { type: 'DATA_QUERY', originalQuestion: question };
        }
        return { type: 'PROCEDURAL', originalQuestion: question };
    }

    private static async fetchDataForIntent(intent: QueryIntent): Promise<QueryData> {
        if (!db) throw new Error('DB missing');

        const queryMap: Record<string, string> = {
            'cuantos clientes': `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
        FROM customers
      `,
            'listado en orden de compra': `
        SELECT 
          name as customer_name,
          total as total_purchased
        FROM customers
        JOIN invoices ON customers.uuid = invoices.customer_uuid
        ORDER BY total DESC
      `,
            'articulo de mas venta': `
        SELECT 
          p.name as product_name,
          SUM(il.quantity) as total_sold
        FROM products p
        JOIN invoice_lines il ON p.uuid = il.product_uuid
        GROUP BY p.uuid, p.name
        ORDER BY total_sold DESC
        LIMIT 1
      `
        };

        const matchedKey = Object.keys(queryMap).find(key =>
            intent.originalQuestion.toLowerCase().includes(key)
        );

        const sql = matchedKey ? queryMap[matchedKey] : "SELECT 'No data' as info";
        const result = db.exec(sql);

        return {
            sql,
            rows: result.length > 0 ? result[0].values : [],
            columns: result.length > 0 ? result[0].columns : [],
            rowCount: result.length > 0 ? result[0].values.length : 0
        };
    }

    private static extremeResponseValidation(response: AIResponse, data: QueryData): ValidationResult {
        const errors: string[] = [];

        // BLOQUEAR DOCUMENTACIÓN
        for (const pattern of this.STRICT_RULES.BLOCKED_PATTERNS) {
            if (pattern.test(response.content)) {
                errors.push(`CONTENIDO BLOQUEADO (Documentación): ${pattern.source}`);
            }
        }

        // REQUERIR DATOS NUMÉRICOS
        if (data.rowCount > 0 && !/\d+/.test(response.content)) {
            errors.push('FALTA DE DATOS NUMÉRICOS EN RESPUESTA ANALÍTICA');
        }

        return {
            isValid: errors.length === 0,
            errors,
            dataPresent: data.rowCount > 0
        };
    }

    private static simulatellmResponse(intent: QueryIntent, data: QueryData): string {
        // Si la respuesta fuera mal generada (como documentación), el validador la atraparía.
        // Aquí simulamos una respuesta correcta basada en datos.
        if (intent.originalQuestion.toLowerCase().includes('cuantos clientes')) {
            const total = data.rows[0][0];
            const active = data.rows[0][1];
            return `Actualmente tienes un total de ${total} clientes registrados en el sistema, de los cuales ${active} se encuentran activos.`;
        }
        return "Análisis completado: Revisa los datos adjuntos para más detalles.";
    }

    private static generateFallbackDataReport(data: QueryData): AIResponse {
        let report = "Informe de Datos Directo:\n";
        data.rows.forEach(row => {
            report += `- ${row.join(' | ')}\n`;
        });
        return {
            content: report,
            source: 'database',
            confidence: 1.0
        };
    }
}
