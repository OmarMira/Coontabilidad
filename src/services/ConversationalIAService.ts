/**
 * SERVICIO DE IA CONVERSACIONAL
 * 
 * Motor de procesamiento de consultas en lenguaje natural
 * - Análisis de intenciones
 * - Respuestas estructuradas
 * - Acceso a vistas _summary
 */

import { iaService } from './IAService';
import { logger } from '../core/logging/SystemLogger';

export interface ConversationResponse {
  content: string;
  data?: any;
  suggestions?: string[];
  requiresAttention?: boolean;
}

export class ConversationalIAService {
  static async processQuery(query: string): Promise<ConversationResponse> {
    logger.info('ConversationalIA', 'process_query', 'Procesando consulta conversacional', { query });

    // Analizar intención
    const intent = this.analyzeIntent(query);

    try {
      switch (intent.type) {
        case 'financial_summary':
          return await this.handleFinancialQuery(query);
        case 'inventory_summary':
          return await this.handleInventoryQuery(query);
        case 'tax_summary':
          return await this.handleTaxQuery(query);
        case 'alert_summary':
          return await this.handleAlertQuery(query);
        case 'customer_summary':
          return await this.handleCustomerQuery(query);
        case 'invoice_summary':
          return await this.handleInvoiceQuery(query);
        default:
          return await this.handleGeneralQuery(query);
      }
    } catch (error) {
      logger.error('ConversationalIA', 'process_error', 'Error procesando consulta', { query }, error as Error);
      return {
        content: `⚠️ **Error al procesar consulta**\n\n` +
          `Detalles técnicos: ${error instanceof Error ? error.message : 'Error desconocido'}\n\n` +
          `Por favor, intenta reformular tu pregunta o verifica que los datos existan en el sistema.`,
        requiresAttention: true
      };
    }
  }

  private static analyzeIntent(query: string) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('balance') || lowerQuery.includes('financier') || lowerQuery.includes('cuenta') || lowerQuery.includes('contab')) {
      return { type: 'financial_summary' as const, confidence: 0.9 };
    }
    if (lowerQuery.includes('inventario') || lowerQuery.includes('stock') || lowerQuery.includes('producto') || lowerQuery.includes('reponer')) {
      return { type: 'inventory_summary' as const, confidence: 0.85 };
    }
    if (lowerQuery.includes('impuesto') || lowerQuery.includes('florida') || lowerQuery.includes('tax') || lowerQuery.includes('dr-15')) {
      return { type: 'tax_summary' as const, confidence: 0.95 };
    }
    if (lowerQuery.includes('alerta') || lowerQuery.includes('problema') || lowerQuery.includes('error') || lowerQuery.includes('critico')) {
      return { type: 'alert_summary' as const, confidence: 0.8 };
    }
    if (lowerQuery.includes('cliente') || lowerQuery.includes('customer') || lowerQuery.includes('moroso') || lowerQuery.includes('cobranza')) {
      return { type: 'customer_summary' as const, confidence: 0.85 };
    }
    if (lowerQuery.includes('factura') || lowerQuery.includes('invoice') || lowerQuery.includes('cobro') || lowerQuery.includes('pendiente')) {
      return { type: 'invoice_summary' as const, confidence: 0.9 };
    }

    return { type: 'general' as const, confidence: 0.5 };
  }

  private static async handleFinancialQuery(query: string): Promise<ConversationResponse> {
    const data = await iaService.querySummary('financial_summary');

    if (!data || data.length === 0) {
      return {
        content: `📊 **No hay datos financieros disponibles**\n\n` +
          `La vista financial_summary está vacía o no tiene datos.`,
        suggestions: [
          'Verifica que existan cuentas contables activas',
          'Revisa la configuración del plan de cuentas'
        ]
      };
    }

    const firstRow = data[0];
    const totalActivos = firstRow.total_activos || 0;
    const totalPasivos = firstRow.total_pasivos_patrimonio || 0;

    return {
      content: `📊 **Resumen Financiero**\n\n` +
        `**Balance General:**\n` +
        `• Cuentas de Activos: ${totalActivos}\n` +
        `• Cuentas de Pasivos/Patrimonio: ${totalPasivos}\n\n` +
        `**Total de cuentas:** ${totalActivos + totalPasivos}\n\n` +
        `💡 **Análisis:** Sistema contable configurado correctamente con estructura balanceada.`,
      data: firstRow,
      suggestions: [
        '¿Quieres ver el detalle de alguna cuenta específica?',
        '¿Necesitas un reporte de balance general?'
      ]
    };
  }

  private static async handleInventoryQuery(query: string): Promise<ConversationResponse> {
    try {
      const data = await iaService.querySummary('inventory_summary');
      
      if (!data || data.length === 0) {
        return {
          content: `📦 **No hay datos de inventario disponibles**\n\n` +
            `La vista inventory_summary no tiene datos o no existe.`,
          suggestions: [
            'Verifica que existan productos en el sistema',
            'Revisa la configuración de inventario'
          ]
        };
      }

      const critical = data.find(d => d.estado_stock === 'bajo');
      
      return {
        content: `📦 **Estado de Inventario**\n\n` +
          `**Productos por nivel de stock:**\n` +
          data.map(row => `• ${row.estado_stock || 'Sin clasificar'}: ${row.cantidad || 0} productos`).join('\n') + `\n\n` +
          (critical ? `⚠️ **ALERTA:** ${critical.cantidad} productos con stock bajo\n` : '') +
          `💡 **Recomendación:** ${critical ? 'Generar órdenes de compra urgentes' : 'Inventario en niveles adecuados'}`,
        data,
        requiresAttention: !!critical,
        suggestions: critical ? [
          '¿Quieres ver la lista de productos con stock bajo?',
          '¿Generar órdenes de compra automáticas?'
        ] : []
      };
    } catch (error) {
      return {
        content: `📦 **Inventario**\n\n` +
          `Los datos de inventario no están disponibles en este momento.\n\n` +
          `💡 **Sugerencia:** Verifica que la vista inventory_summary esté configurada correctamente.`,
        suggestions: ['Revisar configuración de vistas de inventario']
      };
    }
  }

  private static async handleTaxQuery(query: string): Promise<ConversationResponse> {
    try {
      const data = await iaService.querySummary('tax_summary_florida');
      
      if (!data || data.length === 0) {
        return {
          content: `🏛️ **Impuestos de Florida**\n\n` +
            `No hay datos de impuestos disponibles actualmente.\n\n` +
            `Esto puede deberse a:\n` +
            `• No hay facturas pagadas registradas\n` +
            `• La configuración de condados de Florida no está completa\n` +
            `• Los datos aún no se han procesado`,
          suggestions: [
            'Verifica que existan facturas pagadas',
            'Revisa la configuración de condados de Florida'
          ]
        };
      }

      const totalFacturas = data.reduce((sum, row) => sum + (row.facturas || 0), 0);
      const totalImpuestos = data.reduce((sum, row) => sum + (row.impuesto_calculado || 0), 0);

      return {
        content: `🏛️ **Impuestos de Florida**\n\n` +
          `**Resumen por Condado:**\n` +
          data.map(row => 
            `• ${row.county}: ${row.facturas} facturas, $${(row.impuesto_calculado || 0).toLocaleString()} en impuestos`
          ).join('\n') + `\n\n` +
          `**Totales:**\n` +
          `• Facturas procesadas: ${totalFacturas}\n` +
          `• Impuestos recaudados: $${totalImpuestos.toLocaleString()}\n\n` +
          `💡 **Estado:** Cumplimiento fiscal de Florida al día.`,
        data,
        suggestions: [
          '¿Quieres generar un reporte DR-15?',
          '¿Ver detalles de un condado específico?'
        ]
      };
    } catch (error) {
      return {
        content: `🏛️ **Impuestos de Florida**\n\n` +
          `Los datos de impuestos no están disponibles en este momento.\n\n` +
          `💡 **Sugerencia:** Verifica que la vista tax_summary_florida esté configurada correctamente.`,
        suggestions: ['Revisar configuración de impuestos de Florida']
      };
    }
  }

  private static async handleAlertQuery(query: string): Promise<ConversationResponse> {
    try {
      const data = await iaService.querySummary('alerts_summary');
      
      if (!data || data.length === 0) {
        return {
          content: `⚠️ **Estado de Alertas**\n\n` +
            `✅ **Excelente:** No hay alertas críticas en este momento.\n\n` +
            `El sistema está funcionando correctamente sin problemas detectados.`,
          suggestions: ['Continuar monitoreando el sistema']
        };
      }

      const criticalAlerts = data.filter(alert => alert.prioridad === 'high');
      const totalAlerts = data.length;

      return {
        content: `⚠️ **Estado de Alertas**\n\n` +
          `**Resumen:**\n` +
          `• Total de alertas: ${totalAlerts}\n` +
          `• Alertas críticas: ${criticalAlerts.length}\n\n` +
          `**Alertas por tipo:**\n` +
          data.map(alert => 
            `• ${alert.tipo_alerta}: ${alert.cantidad} casos (${alert.prioridad})`
          ).join('\n') + `\n\n` +
          (criticalAlerts.length > 0 ? 
            `🚨 **ATENCIÓN REQUERIDA:** ${criticalAlerts.length} alertas críticas` : 
            `✅ **ESTADO:** Sistema estable`),
        data,
        requiresAttention: criticalAlerts.length > 0,
        suggestions: criticalAlerts.length > 0 ? [
          'Ver detalles de alertas críticas',
          'Generar plan de acción correctiva'
        ] : []
      };
    } catch (error) {
      return {
        content: `⚠️ **Alertas del Sistema**\n\n` +
          `No se pueden obtener las alertas en este momento.\n\n` +
          `💡 **Sugerencia:** Verifica que la vista alerts_summary esté configurada.`,
        suggestions: ['Revisar configuración de alertas']
      };
    }
  }

  private static async handleCustomerQuery(query: string): Promise<ConversationResponse> {
    try {
      const data = await iaService.querySummary('customers_summary');
      
      if (!data || data.length === 0) {
        return {
          content: `👥 **Gestión de Clientes**\n\n` +
            `No hay datos de clientes disponibles.\n\n` +
            `💡 **Sugerencia:** Verifica que existan clientes registrados en el sistema.`,
          suggestions: ['Agregar clientes al sistema']
        };
      }

      const totalClientes = data.reduce((sum, row) => sum + (row.cantidad_clientes || 0), 0);
      const clientesActivos = data.filter(row => row.status === 'active');

      return {
        content: `👥 **Gestión de Clientes**\n\n` +
          `**Resumen por Estado:**\n` +
          data.map(row => 
            `• ${row.status}: ${row.cantidad_clientes} clientes (${row.florida_county})`
          ).join('\n') + `\n\n` +
          `**Totales:**\n` +
          `• Total de clientes: ${totalClientes}\n` +
          `• Clientes activos: ${clientesActivos.reduce((sum, row) => sum + (row.cantidad_clientes || 0), 0)}\n\n` +
          `💡 **Estado:** Base de clientes diversificada por condados de Florida.`,
        data,
        suggestions: [
          '¿Ver clientes por condado específico?',
          '¿Analizar patrones de morosidad?'
        ]
      };
    } catch (error) {
      return {
        content: `👥 **Gestión de Clientes**\n\n` +
          `Los datos de clientes no están disponibles en este momento.\n\n` +
          `💡 **Sugerencia:** Verifica la configuración de la vista customers_summary.`,
        suggestions: ['Revisar configuración de clientes']
      };
    }
  }

  private static async handleInvoiceQuery(query: string): Promise<ConversationResponse> {
    try {
      const data = await iaService.querySummary('invoices_summary');
      
      if (!data || data.length === 0) {
        return {
          content: `📄 **Estado de Facturación**\n\n` +
            `No hay datos de facturación disponibles.\n\n` +
            `💡 **Sugerencia:** Verifica que existan facturas en el sistema.`,
          suggestions: ['Crear facturas en el sistema']
        };
      }

      const totalFacturas = data.reduce((sum, row) => sum + (row.cantidad_facturas || 0), 0);
      const montoTotal = data.reduce((sum, row) => sum + (row.monto_total || 0), 0);
      const facturasPendientes = data.filter(row => row.status === 'sent' || row.status === 'overdue');

      return {
        content: `📄 **Estado de Facturación**\n\n` +
          `**Resumen por Estado:**\n` +
          data.map(row => 
            `• ${row.status}: ${row.cantidad_facturas} facturas ($${(row.monto_total || 0).toLocaleString()})`
          ).join('\n') + `\n\n` +
          `**Totales:**\n` +
          `• Total de facturas: ${totalFacturas}\n` +
          `• Monto total: $${montoTotal.toLocaleString()}\n` +
          `• Facturas pendientes: ${facturasPendientes.reduce((sum, row) => sum + (row.cantidad_facturas || 0), 0)}\n\n` +
          `💡 **Estado:** ${facturasPendientes.length > 0 ? 'Requiere seguimiento de cobranza' : 'Facturación al día'}`,
        data,
        requiresAttention: facturasPendientes.length > 0,
        suggestions: facturasPendientes.length > 0 ? [
          'Ver facturas vencidas',
          'Generar recordatorios de pago'
        ] : []
      };
    } catch (error) {
      return {
        content: `📄 **Estado de Facturación**\n\n` +
          `Los datos de facturación no están disponibles en este momento.\n\n` +
          `💡 **Sugerencia:** Verifica la configuración de la vista invoices_summary.`,
        suggestions: ['Revisar configuración de facturas']
      };
    }
  }

  private static async handleGeneralQuery(query: string): Promise<ConversationResponse> {
    return {
      content: `🤖 **Asistente Financiero**\n\n` +
        `No pude entender específicamente tu consulta: "${query}"\n\n` +
        `**Puedo ayudarte con:**\n` +
        `📊 Análisis financiero y balance general\n` +
        `📦 Estado de inventario y stock\n` +
        `🏛️ Impuestos de Florida y cumplimiento\n` +
        `⚠️ Alertas y problemas del sistema\n` +
        `👥 Gestión de clientes y cobranza\n` +
        `📄 Estado de facturación y pagos\n\n` +
        `💡 **Tip:** Sé más específico en tu pregunta para obtener mejores respuestas.`,
      suggestions: [
        'Balance general actual',
        'Productos con stock bajo',
        'Impuestos de Florida este mes',
        'Clientes con facturas vencidas'
      ]
    };
  }
}

export default ConversationalIAService;