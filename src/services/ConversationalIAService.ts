import { QueryProcessor, AIResponse as LegacyAIResponse } from './AIEngine/QueryProcessor';
import { SYSTEM_GUIDES, ACCOUNTING_KNOWLEDGE } from '../knowledge/SystemKnowledge';
import { LocalAIService } from './ai/LocalAIService';
import { DeepSeekAIResponse } from './ai/types';
import { getCustomers, getInvoices, getProducts, getSuppliers, getBills } from '../database/simple-db';
import {
  getAccountBalances,
  getIncomeStatement,
  getFloridaTaxSummary,
  getInventoryValuation,
  getTotalSales,
  getTotalPurchases,
  getTopCustomer,
  getTopProduct,
  getLowStockProducts,
  getMostExpensiveProduct,
  getTaxByCounty,
  getAccountsReceivable,
  getLatestInvoice,
  getHighestInvoice,
  getAuditAlerts,
  getTopPayingCustomer,
  getTopSupplier
} from '../database/accounting-queries';

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
  private localAIService: LocalAIService;

  private constructor() {
    this.localAIService = new LocalAIService();
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
      // --- PRE-CALIFICACIÓN: ¿Es una consulta de datos contables? ---
      const isDataRequest = this.isDataQuery(query);

      // 0. INTENTO: CONSULTAS DE DATOS LOCALES Y CONTABLES (Prioridad Máxima si es data request)
      if (isDataRequest) {
        // A. BALANCE Y SITUACIÓN FINANCIERA
        if (query.includes('balance') || query.includes('situación') || query.includes('situacion') || query.includes('activo') || query.includes('pasivo') || query.includes('patrimonio')) {
          const balances = await getAccountBalances();
          const activo = balances.filter(b => b.account_type === 'asset').reduce((s, b) => s + b.balance, 0);
          const pasivo = balances.filter(b => b.account_type === 'liability').reduce((s, b) => s + b.balance, 0);
          const patrimonio = balances.filter(b => b.account_type === 'equity').reduce((s, b) => s + b.balance, 0);
          const content = `📊 **Estado de Situación:**\n\n• **Activo Total:** $${activo.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Pasivo Total:** $${pasivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Patrimonio:** $${patrimonio.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n*Nota: Datos calculados en tiempo real desde el catálogo de cuentas.*`;
          return this.formatLocalResponse(userQuery, content, { activo, pasivo, patrimonio }, 'local-accounting', startTime);
        }

        // B. GANANCIAS / UTILIDADES
        if (query.includes('ganancia') || query.includes('utilidad') || query.includes('beneficio') || query.includes('gané') || query.includes('gane') || query.includes('net income')) {
          const income = await getIncomeStatement();
          const content = `📈 **Resumen de Utilidades (P&L):**\n\n• **Ingresos Totales:** $${income.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Gastos Totales:** $${income.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Utilidad Neta:** $${income.net_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n${income.net_income > 0 ? '✅ Generando beneficios reales.' : '⚠️ Los egresos están superando los ingresos.'}`;
          return this.formatLocalResponse(userQuery, content, income, 'local-accounting', startTime);
        }

        // C. GASTOS / COMPRAS
        if (query.includes('gasté') || query.includes('gaste') || query.includes('gastos') || query.includes('compra') || query.includes('compré') || query.includes('compre') || query.includes('egresos')) {
          const purchases = await getTotalPurchases();
          const content = `💸 **Gastos y Compras:**\n\n• **Total Acumulado:** $${purchases.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Transacciones:** ${purchases.count}\n\nIncluye todos los gastos y facturas de proveedores registrados.`;
          return this.formatLocalResponse(userQuery, content, purchases, 'local-purchases', startTime);
        }

        // D. MEJOR CLIENTE / PAGOS
        if (query.includes('cliente') && (query.includes('pago mas') || query.includes('pagó mas') || query.includes('pagó más') || query.includes('mejor pagador'))) {
          const top = await getTopPayingCustomer();
          if (top) {
            return this.formatLocalResponse(userQuery, `💰 **Mejor Pagador:**\n\nEl cliente que más ha pagado es **${top.name}** con un total de **$${top.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** en **${top.count}** facturas pagadas.`, top, 'local-analytics', startTime);
          }
        }

        if (query.includes('mejor cliente') || query.includes('top cliente') || (query.includes('cliente') && query.includes('compro mas'))) {
          const top = await getTopCustomer();
          if (top) {
            return this.formatLocalResponse(userQuery, `🏆 **Top Cliente:**\n\nTu mejor cliente por volumen de ventas es **${top.name}** con un total de **$${top.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}**.`, top, 'local-analytics', startTime);
          }
        }

        // E. PROVEEDORES
        if (query.includes('mejor proveedor') || query.includes('top proveedor') || (query.includes('proveedor') && (query.includes('compro mas') || query.includes('compro más')))) {
          const top = await getTopSupplier();
          if (top) {
            return this.formatLocalResponse(userQuery, `🤝 **Mejor Proveedor:**\n\nTu proveedor principal es **${top.name}** con un volumen de negocio de **$${top.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}** en **${top.count}** compras.`, top, 'local-analytics', startTime);
          }
        }

        // F. INVENTARIO
        if (query.includes('valor') && (query.includes('inventario') || query.includes('stock') || query.includes('mercancia'))) {
          const inv = await getInventoryValuation();
          const content = `📦 **Valoración de Inventario:**\n\n• **Valor Total (Costo):** $${inv.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Items Activos:** ${inv.item_count}\n\nBasado en existencias actuales por costo unitario.`;
          return this.formatLocalResponse(userQuery, content, inv, 'local-inventory', startTime);
        }

        // G. TAX / FLORIDA
        if (query.includes('impuesto') || query.includes('tax') || query.includes('florida') || query.includes('dr15') || query.includes('dr-15')) {
          const tax = await getFloridaTaxSummary();
          const content = `🌴 **Resumen Fiscal Florida:**\n\n• **Impuesto Acumulado:** $${tax.total_tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• **Estado DR-15:** ${tax.dr15_status === 'filed' ? '✅ Presentado' : '⏳ Pendiente'}`;
          return this.formatLocalResponse(userQuery, content, tax, 'local-tax', startTime);
        }
      }

      // 1. INTENTO: BUSCAR EN GUÍAS DEL SISTEMA (Solo si no es una consulta clara de datos)
      if (!isDataRequest || query.includes('como') || query.includes('pasos') || query.includes('donde')) {
        const guideMatch = this.findGuideMatch(query);
        if (guideMatch) {
          return this.formatKnowledgeResponse(userQuery, guideMatch, 'system_guides', startTime);
        }
      }

      // 2. INTENTO: DEEPSEEK (Inteligencia Avanzada para análisis complejo)
      if (this.shouldUseDeepSeek(query)) {
        try {
          const localAIResponse = await this.localAIService.processQuery(userQuery, userId);
          if (!localAIResponse.metadata.fallbackUsed) {
            return this.formatDeepSeekResponse(localAIResponse, startTime);
          }
        } catch (error) {
          console.warn('⚠️ Local AI falló, continuando con motor local:', error);
        }
      }

      // 3. FALLBACK: PROCESAR CON QUERY PROCESSOR (SQL DINÁMICO)
      const aiResponse = await QueryProcessor.process(userQuery);
      if (aiResponse && aiResponse.formattedResponse && !aiResponse.formattedResponse.includes('financial_summary')) {
        this.addToHistory(aiResponse);
        return this.formatForConversation(aiResponse);
      }

      // 4. ÚLTIMO RECURSO: CONOCIMIENTO GENERAL
      const knowledgeMatch = this.findKnowledgeMatch(query);
      if (knowledgeMatch) {
        return this.formatKnowledgeResponse(userQuery, knowledgeMatch, 'accounting_knowledge', startTime);
      }

      return this.formatLocalResponse(userQuery, "Lo siento, no pude encontrar una respuesta precisa a tu consulta de datos. ¿Podrías ser más específico o pedirme ayuda sobre cómo usar una función?", null, 'fallback', startTime);

    } catch (error) {
      console.error('❌ Error en ConversationalIAService:', error);
      return this.generateErrorResponse(userQuery, error as Error);
    }
  }

  /**
   * Determina si la consulta es de DATOS (números, resúmenes, auditoría) 
   * vs una consulta de AYUDA/GUÍA.
   */
  private isDataQuery(query: string): boolean {
    const dataKeywords = [
      'cuanto', 'cuánto', 'quien', 'quién', 'total', 'ganancia', 'gaste', 'gasté',
      'balance', 'valor', 'stock', 'debo', 'deben', 'impuesto', 'tax', 'mejor',
      'top', 'vendí', 'vendi', 'compré', 'compre', 'situacion', 'situación',
      'pago', 'pagó', 'pagador', 'compras', 'ventas', 'factura'
    ];

    // Si contiene Keywords de datos
    return dataKeywords.some(k => query.includes(k));
  }

  private formatLocalResponse(query: string, content: string, data: any, dataSource: string, startTime: number): ConversationResponse {
    return {
      content,
      data,
      metadata: {
        query,
        timestamp: new Date().toISOString(),
        intent: 'local_data_query',
        confidence: 1.0,
        dataSource,
        processingTime: Date.now() - startTime
      },
      suggestions: [
        "Ver más detalles",
        "Generar reporte PDF",
        "Ir al Dashboard principal"
      ],
      requiresAttention: false
    };
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
      guide.steps.forEach((step: string, i: number) => content += `${i + 1}. ${step}\n`);
      if (guide.tips) {
        content += `\n💡 **Tips:**\n`;
        guide.tips.forEach((tip: string) => content += `• ${tip}\n`);
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

  private shouldUseDeepSeek(query: string): boolean {
    const complexKeywords = [
      'por que', 'analisis', 'recomienda', 'explicame', 'diferencia',
      'estrategia', 'macrs', 'depreciacion', 'acelerada', 'fiscal',
      'legal', 'florida', 'tax', 'impuesto', 'dr-15'
    ];
    return complexKeywords.some(k => query.includes(k)) || query.split(' ').length > 8;
  }
}

export default class ConversationalIAServiceStatic {
  static async processQuery(query: string): Promise<ConversationResponse> {
    const service = ConversationalIAService.getInstance();
    return await service.processQuery(query);
  }
}