/**
 * SERVICIO CONVERSACIONAL DE IA - VERSIÓN SIMPLIFICADA FUNCIONAL
 */

import { QueryProcessor, AIResponse } from './AIEngine/QueryProcessor';

export interface ConversationResponse {
  content: string;
  data: any;
  metadata: {
    query: string;
    timestamp: string;
    intent: string;
    confidence: number;
    dataSource: string;
    processingTime: number;
  };
  suggestions: string[];
  requiresAttention: boolean;
}

export class ConversationalIAService {
  private static instance: ConversationalIAService;
  private conversationHistory: AIResponse[] = [];

  static getInstance(): ConversationalIAService {
    if (!this.instance) {
      this.instance = new ConversationalIAService();
    }
    return this.instance;
  }

  async processQuery(userQuery: string): Promise<ConversationResponse> {
    console.log(`📝 ConversationalIA procesando: "${userQuery}"`);
    
    try {
      // Procesar con QueryProcessor
      const aiResponse = await QueryProcessor.process(userQuery);

      // Guardar en historial
      this.addToHistory(aiResponse);

      // Generar respuesta de conversación
      const conversationResponse = this.formatForConversation(aiResponse);

      console.log(`✅ Consulta procesada: ${aiResponse.intent.category} con ${aiResponse.data.length} registros`);
      
      return conversationResponse;

    } catch (error) {
      console.error('❌ Error en ConversationalIAService:', error);
      return this.generateErrorResponse(userQuery, error as Error);
    }
  }

  getConversationHistory(): AIResponse[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private formatForConversation(aiResponse: AIResponse): ConversationResponse {
    return {
      content: aiResponse.formattedResponse,
      data: aiResponse.data,
      metadata: {
        query: aiResponse.query,
        timestamp: aiResponse.timestamp,
        intent: aiResponse.intent.category,
        confidence: aiResponse.intent.confidence,
        dataSource: aiResponse.metadata.dataSource,
        processingTime: aiResponse.metadata.processingTime
      },
      suggestions: this.generateSuggestions(aiResponse.intent.category),
      requiresAttention: this.requiresAttention(aiResponse)
    };
  }

  private generateSuggestions(intentCategory: string): string[] {
    const suggestions: Record<string, string[]> = {
      financial: [
        "¿Quieres ver el detalle por tipo de cuenta?",
        "¿Necesitas un reporte de balance general?",
        "¿Analizar tendencias de ingresos vs gastos?"
      ],
      inventory: [
        "¿Ver la lista completa de productos críticos?",
        "¿Generar órdenes de compra automáticas?",
        "¿Analizar historial de movimientos?"
      ],
      tax: [
        "¿Comparar impuestos por condado?",
        "¿Generar reporte DR-15 para exportar?",
        "¿Analizar tendencias de recaudación?"
      ]
    };

    return suggestions[intentCategory] || [
      "¿Necesitas algún otro análisis específico?",
      "¿Quieres consultar otro aspecto del sistema?"
    ];
  }

  private requiresAttention(aiResponse: AIResponse): boolean {
    // Verificar si hay alertas o datos críticos
    if (aiResponse.sections.alerts && aiResponse.sections.alerts.length > 0) {
      return true;
    }

    if (aiResponse.intent.category === 'inventory') {
      const criticalItems = aiResponse.data.filter((item: any) => 
        item.productos_bajo_stock && item.productos_bajo_stock > 0
      );
      return criticalItems.length > 0;
    }

    return false;
  }

  private generateErrorResponse(query: string, error: Error): ConversationResponse {
    let errorMessage = error.message;
    let suggestions: string[] = [];

    if (errorMessage.includes('no permitida')) {
      errorMessage = `🔒 **Acceso restringido**\n\n` +
                    `No puedo procesar "${query}" porque requiere acceso a datos no permitidos.\n\n` +
                    `**Política de seguridad:**\n` +
                    `• Solo puedo acceder a vistas que terminan en '_summary'\n` +
                    `• No tengo permisos para modificar datos\n` +
                    `• Consultas limitadas a análisis y reportes`;
      
      suggestions = [
        "Intenta reformular tu pregunta",
        "Usa términos como 'resumen', 'análisis'",
        "Consulta datos de solo lectura"
      ];

    } else {
      errorMessage = `⚠️ **Error al procesar consulta**\n\n` +
                    `No pude procesar: "${query}"\n\n` +
                    `**Detalle:** ${errorMessage}\n\n` +
                    `**Sugerencias:**\n` +
                    `• Reformula tu pregunta más específicamente\n` +
                    `• Usa términos financieros/contables claros\n` +
                    `• Prueba con una de las preguntas predefinidas`;
      
      suggestions = [
        "Balance general actual",
        "Productos con stock bajo",
        "Impuestos del último mes"
      ];
    }

    return {
      content: errorMessage,
      data: null,
      metadata: {
        query,
        timestamp: new Date().toISOString(),
        intent: 'error',
        confidence: 0,
        dataSource: 'error',
        processingTime: 0
      },
      suggestions,
      requiresAttention: true
    };
  }

  private addToHistory(response: AIResponse): void {
    this.conversationHistory.unshift(response);
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(0, 20);
    }
  }
}

// Función estática para compatibilidad
export default class ConversationalIAServiceStatic {
  static async processQuery(query: string): Promise<ConversationResponse> {
    const service = ConversationalIAService.getInstance();
    return await service.processQuery(query);
  }
}