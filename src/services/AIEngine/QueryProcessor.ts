/**
 * MOTOR DE PROCESAMIENTO DE IA - VERSIÓN SIMPLIFICADA FUNCIONAL
 */

export interface QueryIntent {
  category: string;
  confidence: number;
  targetView: string;
  parameters: Record<string, any>;
  requiresData: boolean;
}

export interface AIResponse {
  query: string;
  timestamp: string;
  intent: QueryIntent;
  data: any[];
  formattedResponse: string;
  sections: {
    executiveSummary?: string;
    keyData?: string[];
    alerts?: string[];
    recommendations?: string[];
    detailedAnalysis?: string;
  };
  metadata: {
    dataSource: string;
    rowCount: number;
    processingTime: number;
  };
}

export class QueryProcessor {
  private static readonly ALLOWED_VIEWS = [
    'financial_summary',
    'inventory_summary', 
    'tax_summary_florida',
    'alerts_summary',
    'customers_summary',
    'invoices_summary'
  ];

  static async process(userQuery: string): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 QueryProcessor procesando:', userQuery);

      // 1. Validar seguridad
      this.validateQuerySafety(userQuery);

      // 2. Extraer intención
      const intent = this.extractIntent(userQuery);

      // 3. Validar vista permitida
      if (!this.ALLOWED_VIEWS.includes(intent.targetView)) {
        throw new Error(`Vista no permitida para IA: ${intent.targetView}`);
      }

      // 4. Consultar datos
      const data = await this.queryViewData(intent.targetView);

      // 5. Generar respuesta
      const formattedResponse = this.generateFormattedResponse(userQuery, data, intent);

      const processingTime = Date.now() - startTime;

      return {
        query: userQuery,
        timestamp: new Date().toISOString(),
        intent,
        data,
        formattedResponse,
        sections: this.extractResponseSections(data, intent),
        metadata: {
          dataSource: intent.targetView,
          rowCount: data.length,
          processingTime
        }
      };

    } catch (error) {
      console.error('❌ Error en QueryProcessor:', error);
      throw error;
    }
  }

  private static validateQuerySafety(query: string): void {
    const lowerQuery = query.toLowerCase();

    const forbiddenPatterns = [
      /delete\s+from/i,
      /update\s+\w+\s+set/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /alter\s+table/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(lowerQuery)) {
        throw new Error('La consulta contiene operaciones no permitidas para IA');
      }
    }
  }

  private static extractIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    // Sistema de puntuación simple
    const categoryScores = {
      financial: this.scoreQuery(lowerQuery, ['balance', 'financiero', 'cuenta', 'activo', 'pasivo']),
      inventory: this.scoreQuery(lowerQuery, ['inventario', 'stock', 'producto', 'reponer']),
      tax: this.scoreQuery(lowerQuery, ['impuesto', 'tax', 'florida', 'fiscal']),
      customer: this.scoreQuery(lowerQuery, ['cliente', 'customer', 'moroso']),
      invoice: this.scoreQuery(lowerQuery, ['factura', 'invoice', 'cobro']),
      alert: this.scoreQuery(lowerQuery, ['alerta', 'problema', 'crítico'])
    };

    let maxCategory = 'financial';
    let maxScore = categoryScores.financial;

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category;
      }
    }

    const viewMap: Record<string, string> = {
      financial: 'financial_summary',
      inventory: 'inventory_summary',
      tax: 'tax_summary_florida',
      customer: 'customers_summary',
      invoice: 'invoices_summary',
      alert: 'alerts_summary'
    };

    return {
      category: maxCategory,
      confidence: maxScore,
      targetView: viewMap[maxCategory],
      parameters: {},
      requiresData: maxScore > 0.3
    };
  }

  private static scoreQuery(query: string, keywords: string[]): number {
    let score = 0;
    for (const keyword of keywords) {
      if (query.includes(keyword)) {
        score += 1;
      }
    }
    return score / keywords.length;
  }

  private static async queryViewData(viewName: string): Promise<any[]> {
    try {
      const { db } = await import('../../database/simple-db');
      
      if (!db) {
        console.warn('⚠️ Base de datos no disponible, usando datos de ejemplo');
        return this.generateSampleData(viewName);
      }

      const query = `SELECT * FROM ${viewName} LIMIT 50`;
      console.log(`🔍 Ejecutando consulta: ${query}`);
      
      const result = db.exec(query);
      
      if (!result || result.length === 0 || !result[0].values) {
        console.warn(`⚠️ Vista ${viewName} sin datos, usando ejemplos`);
        return this.generateSampleData(viewName);
      }

      const columns = result[0].columns;
      const rows = result[0].values;
      
      const data = rows.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      });

      console.log(`✅ Datos obtenidos: ${data.length} registros de ${viewName}`);
      return data;

    } catch (error) {
      console.error(`❌ Error consultando ${viewName}:`, error);
      return this.generateSampleData(viewName);
    }
  }

  private static generateSampleData(viewName: string): any[] {
    switch (viewName) {
      case 'financial_summary':
        return [
          { reporte: 'balance_general', total_activos: 24, total_pasivos_patrimonio: 23 }
        ];
      
      case 'inventory_summary':
        return [
          { tipo: 'productos', total_productos: 15, productos_bajo_stock: 3, stock_total: 250 }
        ];
      
      case 'tax_summary_florida':
        return [
          { county: 'Miami-Dade', facturas: 15, base_imponible: 12500, impuesto_calculado: 875 },
          { county: 'Broward', facturas: 8, base_imponible: 6400, impuesto_calculado: 448 }
        ];
      
      default:
        return [{ message: `Datos de ejemplo para ${viewName}` }];
    }
  }

  private static generateFormattedResponse(query: string, data: any[], intent: QueryIntent): string {
    if (data.length === 0) {
      return `🔍 **No se encontraron datos** para: "${query}"`;
    }

    const sections = [];

    // Resumen ejecutivo
    const summary = this.generateExecutiveSummary(data, intent);
    if (summary) {
      sections.push(`📋 **RESUMEN EJECUTIVO**\n${summary}`);
    }

    // Datos clave
    const keyData = this.extractKeyData(data, intent);
    if (keyData.length > 0) {
      sections.push(`📊 **DATOS CLAVE**\n${keyData.map(item => `• ${item}`).join('\n')}`);
    }

    // Recomendaciones
    const recommendations = this.generateRecommendations(intent);
    if (recommendations.length > 0) {
      sections.push(`👉 **RECOMENDACIONES**\n${recommendations.map(rec => `• ${rec}`).join('\n')}`);
    }

    // Metadata
    sections.push(`\n📈 *Basado en ${data.length} registros de ${intent.targetView}*`);

    return sections.join('\n\n');
  }

  private static generateExecutiveSummary(data: any[], intent: QueryIntent): string {
    switch (intent.category) {
      case 'financial':
        return `Estructura contable con ${data.length} elementos analizados.`;
      case 'inventory':
        return `${data.length} elementos de inventario revisados.`;
      case 'tax':
        return `Análisis de impuestos para ${data.length} condados.`;
      default:
        return `Se encontraron ${data.length} registros relevantes.`;
    }
  }

  private static extractKeyData(data: any[], intent: QueryIntent): string[] {
    const keyData: string[] = [];

    data.slice(0, 5).forEach(item => {
      const keys = Object.keys(item);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const firstValue = item[firstKey];
        keyData.push(`${firstKey}: ${firstValue}`);
      }
    });

    return keyData;
  }

  private static generateRecommendations(intent: QueryIntent): string[] {
    const recommendations: Record<string, string[]> = {
      financial: ['Revisar balances mensuales', 'Actualizar plan de cuentas'],
      inventory: ['Generar órdenes de compra', 'Revisar niveles mínimos'],
      tax: ['Verificar tasas actualizadas', 'Preparar reporte DR-15'],
      customer: ['Revisar términos de crédito', 'Actualizar información'],
      invoice: ['Procesar facturas pendientes', 'Revisar políticas de cobro'],
      alert: ['Atender alertas críticas', 'Configurar notificaciones']
    };

    return recommendations[intent.category] || ['Continuar monitoreo regular'];
  }

  private static extractResponseSections(data: any[], intent: QueryIntent) {
    return {
      executiveSummary: this.generateExecutiveSummary(data, intent),
      keyData: this.extractKeyData(data, intent),
      alerts: [],
      recommendations: this.generateRecommendations(intent),
      detailedAnalysis: `Análisis de ${data.length} registros del sistema.`
    };
  }
}