import { QueryProcessor, AIResponse as LegacyAIResponse } from '../AIEngine/QueryProcessor';
import { SYSTEM_GUIDES, ACCOUNTING_KNOWLEDGE } from '../../knowledge/SystemKnowledge';
import { DeepSeekService } from './DeepSeekService';
import { DeepSeekAIResponse } from './types';

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
  private conversationHistory: any[] = [];
  private deepSeekService: DeepSeekService;

  private constructor() {
    this.deepSeekService = new DeepSeekService();
  }

  static getInstance(): ConversationalIAService {
    if (!this.instance) {
      this.instance = new ConversationalIAService();
    }
    return this.instance;
  }

  async processQuery(userQuery: string, userId: number = 1): Promise<ConversationResponse> {
    const query = userQuery.toLowerCase();
    const startTime = Date.now();
    console.log(`📝 SmartRouter procesando: "${userQuery}"`);

    try {
      // 1. INTENTO: DEEPSEEK (Inteligencia Avanzada)
      // Si la consulta parece compleja, DeepSeek tiene prioridad para dar una respuesta rica
      if (this.shouldUseDeepSeek(query)) {
        try {
          const deepSeekResponse = await this.deepSeekService.processQuery(userQuery, userId);
          if (!deepSeekResponse.metadata.fallbackUsed) {
            return this.formatDeepSeekResponse(deepSeekResponse, startTime);
          } else {
            console.warn(`[SmartRouter] DeepSeek Service indicó fallback: ${deepSeekResponse.metadata.fallbackReason}`);
          }
        } catch (error) {
          console.warn('⚠️ DeepSeek falló, continuando con motor local:', error);
        }
      }

      // 2. INTENTO: BUSCAR EN GUÍAS DEL SISTEMA (Local Fallback for How-To)
      const guideMatch = this.findGuideMatch(query);
      if (guideMatch) {
        return this.formatKnowledgeResponse(userQuery, guideMatch, 'system_guides', startTime);
      }

      // 3. INTENTO: BUSCAR EN CONOCIMIENTO CONTABLE/FISCAL (Local Fallback)
      const knowledgeMatch = this.findKnowledgeMatch(query);
      if (knowledgeMatch) {
        return this.formatKnowledgeResponse(userQuery, knowledgeMatch, 'accounting_knowledge', startTime);
      }

      // 4. FALLBACK: PROCESAR CON QUERY PROCESSOR (SQL)
      const aiResponse = await QueryProcessor.process(userQuery);
      this.addToHistory(aiResponse);
      const conversationResponse = this.formatForConversation(aiResponse);
      console.log(`✅ Consulta SQL procesada: ${aiResponse.intent.category}`);
      return conversationResponse;

    } catch (error) {
      console.error('❌ Error en ConversationalIAService:', error);
      return this.generateErrorResponse(userQuery, error as Error);
    }
  }

  private shouldUseDeepSeek(query: string): boolean {
    const complexKeywords = [
      'por que', 'analisis', 'recomienda', 'explicame', 'diferencia',
      'estrategia', 'macrs', 'depreciacion', 'acelerada', 'fiscal',
      'legal', 'florida', 'tax', 'impuesto', 'dr-15'
    ];
    return complexKeywords.some(k => query.includes(k)) || query.split(' ').length > 8;
  }

  private formatDeepSeekResponse(aiRes: DeepSeekAIResponse, startTime: number): ConversationResponse {
    const content = `🎯 **Análisis:** ${aiRes.response.intent}\n\n` +
      `📊 **Información:** ${aiRes.response.information}\n\n` +
      `👉 **Acción sugerida:** ${aiRes.response.action}\n\n` +
      `🔍 **Detalle técnico:** ${aiRes.response.explanation}\n\n` +
      `⚠️ **Seguridad/Legal:** ${aiRes.response.considerations}`;

    return {
      content,
      data: null,
      metadata: {
        query: aiRes.query,
        timestamp: aiRes.timestamp,
        intent: 'deepseek_analysis',
        confidence: 0.95,
        dataSource: 'deepseek_hybrid',
        processingTime: Date.now() - startTime
      },
      suggestions: [
        "¿Puedes explicar más sobre la acción recomendada?",
        "¿Cómo afecta esto a mis impuestos?",
        "Ver mis alertas"
      ],
      requiresAttention: false
    };
  }

  private findGuideMatch(query: string): string | null {
    const mappings: Record<string, string[]> = {
      createInvoice: ['factura', 'venta', 'cobrar', 'vender', 'invoice'],
      createCustomer: ['cliente', 'customer', 'registrar persona'],
      createBill: ['compra', 'gasto', 'pagar', 'bill', 'proveedor factura'],
      createSupplier: ['proveedor', 'supplier'],
      createProduct: ['producto', 'servicio', 'item', 'artículo'],
      generateDR15: ['dr-15', 'dr15', 'declarar', 'impuesto mensual', 'formulario'],
      viewTaxRates: ['tasas', 'condado', 'surtax', 'tax rate', 'cuanto se paga'],
      viewBalance: ['balance', 'situación', 'activo', 'pasivo'],
      createBackup: ['backup', 'respaldo', 'guardar datos', 'exportar', 'seguridad', 'aex'],
      restoreBackup: ['restaurar', 'importar backup', 'recuperar'],
      bankReconciliation: ['conciliar', 'conciliación', 'banco', 'cuadre', 'conciliacion'],
      loanPayment: ['préstamo', 'prestamo', 'pagar préstamo', 'amortización'],
      calculateDepreciation: ['depreciación', 'depreciacion', 'desgaste', 'activo fijo', 'macrs']
    };

    let bestMatch: { key: string; score: number } | null = null;
    const isHowTo = query.includes('como') || query.includes('pasos') || query.includes('ayuda') ||
      query.includes('donde') || query.includes('instrucciones') || query.includes('guia');

    for (const [guideKey, keywords] of Object.entries(mappings)) {
      let score = 0;
      keywords.forEach(k => {
        if (query.includes(k)) {
          score += (k.length > 5) ? 2 : 1;
          const words = query.split(/\s+/);
          if (words.includes(k)) score += 3;
        }
      });

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { key: guideKey, score };
      }
    }

    if (bestMatch && (bestMatch.score >= 3 || isHowTo)) {
      const guide = SYSTEM_GUIDES[bestMatch.key];
      if (!guide) return null;

      let content = `📖 **${guide.title}**\n\n${guide.description || ''}\n\n`;
      content += `**Pasos:**\n`;
      guide.steps.forEach((step, i) => content += `${i + 1}. ${step}\n`);
      if (guide.tips) {
        content += `\n💡 **Tips:**\n`;
        guide.tips.forEach(tip => content += `• ${tip}\n`);
      }
      content += `\n📍 **Ubicación:** ${guide.relatedMenu}`;
      return content;
    }
    return null;
  }

  private findKnowledgeMatch(query: string): string | null {
    if (query.includes('partida doble') || query.includes('asiento') || query.includes('debe') || query.includes('haber')) {
      const p = ACCOUNTING_KNOWLEDGE.principles.doubleEntry;
      return `🧮 **${p.name}**\n\n${p.explanation}\n\n**Ejemplo:** ${p.example}\n\n**Regla de Oro:** ${p.rule}`;
    }

    if (query.includes('devengado') || query.includes('accrual')) {
      const p = ACCOUNTING_KNOWLEDGE.principles.accrual;
      return `⏳ **${p.name}**\n\n${p.explanation}\n\n**Ejemplo:** ${p.example}`;
    }

    if (query.includes('florida') || query.includes('impuesto') || query.includes('tax')) {
      const ft = ACCOUNTING_KNOWLEDGE.floridaTax;
      let content = `🌴 **Impuestos en Florida**\n\nLa tasa base estatal es del **${ft.stateTaxRate * 100}%**. A esto se suma el surtax local de cada condado.\n\n`;

      for (const [name, data] of Object.entries(ft.counties)) {
        if (query.includes(name.toLowerCase())) {
          return `${content}📍 **Condado de ${name}:**\n• Surtax local: ${(data as any).surtax * 100}%\n• Tasa Total: ${(data as any).total * 100}%\n• Código: ${(data as any).code}`;
        }
      }

      content += `**Tasas en condados principales:**\n`;
      Object.entries(ft.counties).slice(0, 5).forEach(([name, data]: [string, any]) => {
        content += `• ${name}: ${data.total * 100}%\n`;
      });
      return content;
    }

    if (query.includes('conciliar') || query.includes('banco')) {
      return `🏦 **Conciliación Bancaria**\n\nEn AccountExpress, la conciliación se realiza comparando tus registros locales con el estado de cuenta bancario importado.\n\n**Pasos recomendados:**\n1. Importa tu estado de cuenta (OFX/CSV) en el módulo de Bancos.\n2. El sistema macheará automáticamente transacciones por monto y fecha.\n3. Revisa y aprueba las diferencias.\n\n*Nota: Esta funcionalidad está en el módulo HERRAMIENTAS > Cuentas Bancarias.*`;
    }

    return null;
  }

  private formatKnowledgeResponse(query: string, content: string, source: string, startTime: number): ConversationResponse {
    return {
      content,
      data: null,
      metadata: {
        query,
        timestamp: new Date().toISOString(),
        intent: source === 'system_guides' ? 'how_to' : 'knowledge',
        confidence: 1.0,
        dataSource: source,
        processingTime: Date.now() - startTime
      },
      suggestions: [
        "¿Necesitas más detalles sobre esto?",
        "¿Quieres ver cómo afecta esto a tus reportes?",
        "Ir al Dashboard"
      ],
      requiresAttention: false
    };
  }

  getConversationHistory(): any[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private formatForConversation(aiResponse: LegacyAIResponse): ConversationResponse {
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

  private requiresAttention(aiResponse: LegacyAIResponse): boolean {
    if ((aiResponse as any).sections?.alerts && (aiResponse as any).sections.alerts.length > 0) {
      return true;
    }
    return false;
  }

  private generateErrorResponse(query: string, error: Error): ConversationResponse {
    return {
      content: `⚠️ **Error:** ${error.message}`,
      data: null,
      metadata: {
        query,
        timestamp: new Date().toISOString(),
        intent: 'error',
        confidence: 0,
        dataSource: 'error',
        processingTime: 0
      },
      suggestions: ["Reintentar", "Ver guías del sistema"],
      requiresAttention: true
    };
  }

  private addToHistory(response: LegacyAIResponse): void {
    this.conversationHistory.unshift(response);
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(0, 20);
    }
  }
}

export default class ConversationalIAServiceStatic {
  static async processQuery(query: string): Promise<ConversationResponse> {
    const service = ConversationalIAService.getInstance();
    return await service.processQuery(query);
  }
}