/**
 * SERVICIO DE IA NO INTRUSIVA - ESPECIFICACIÓN COMPLETA
 * 
 * Analista Financiero de Solo-Lectura que cumple con:
 * - Acceso EXCLUSIVO a vistas _summary
 * - Análisis predictivo basado en patrones
 * - Generación de alertas proactivas
 * - Formato de respuesta estructurado
 */

import { logger } from '../core/logging/SystemLogger';

export interface IAResponse {
  alerts: string[];
  data: Record<string, any>;
  actions: string[];
  analysis: string;
}

export class IAService {
  private allowedViews = [
    'financial_summary',
    'inventory_summary', 
    'tax_summary',
    'alerts_summary',
    'customers_summary',
    'invoices_summary'
  ];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const { db } = await import('../database/simple-db');
      if (db) {
        logger.info('IAService', 'init_success', 'Servicio de IA conectado - SOLO LECTURA');
      }
    } catch (error) {
      logger.error('IAService', 'init_failed', 'Error al conectar IA', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
    }
  }

  /**
   * Método querySummary - ACCESO RESTRINGIDO A VISTAS _summary
   */
  public async querySummary(viewName: string): Promise<any[]> {
    // VALIDACIÓN ESTRICTA: Solo vistas permitidas
    if (!viewName.endsWith('_summary') || !this.allowedViews.includes(viewName)) {
      logger.error('IAService', 'access_denied', 'Intento de acceso a vista no permitida para IA', { viewName });
      throw new Error(`Vista no permitida para IA: ${viewName}`);
    }

    try {
      const { db } = await import('../database/simple-db');
      
      if (!db) {
        throw new Error('Base de datos no inicializada');
      }

      logger.info('IAService', 'query_summary', 'IA consultando vista autorizada', { viewName });
      
      // SOLO consultas SELECT a vistas _summary
      const result = db.exec(`SELECT * FROM ${viewName}`);
      
      if (!result || result.length === 0 || !result[0].values) {
        return [];
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

      logger.info('IAService', 'query_success', 'IA obtuvo datos de vista autorizada', { 
        viewName, 
        recordsReturned: data.length 
      });

      return data;

    } catch (error) {
      logger.error('IAService', 'query_failed', 'Error en consulta IA', { viewName }, error as Error);
      throw error;
    }
  }

  /**
   * Análisis de Salud Financiera - FORMATO ESTRUCTURADO
   */
  public async analyzeFinancialHealth(): Promise<IAResponse> {
    try {
      const financialData = await this.querySummary('financial_summary');
      const alertsData = await this.querySummary('alerts_summary');
      const invoicesData = await this.querySummary('invoices_summary');

      const alerts = this.generateAlerts(alertsData);
      const actions = this.suggestActions(alertsData, invoicesData);
      const analysis = this.provideAnalysis(financialData, invoicesData);

      return {
        alerts,
        data: { financial: financialData, invoices: invoicesData },
        actions,
        analysis
      };

    } catch (error) {
      logger.error('IAService', 'analysis_failed', 'Error en análisis financiero IA', null, error as Error);
      return {
        alerts: ['⚠️ ERROR: No se pudo completar el análisis financiero'],
        data: {},
        actions: ['👉 ACCIÓN: Verificar conexión a base de datos'],
        analysis: '🔍 ANÁLISIS: Sistema de IA temporalmente no disponible'
      };
    }
  }

  /**
   * Generar alertas con formato de iconos
   */
  private generateAlerts(alertsData: any[]): string[] {
    const alerts: string[] = [];

    alertsData.forEach(alert => {
      if (alert.tipo_alerta === 'facturas_vencidas' && alert.cantidad > 0) {
        alerts.push(`⚠️ ALERTA: ${alert.cantidad} facturas vencidas detectadas`);
      }
      if (alert.tipo_alerta === 'stock_bajo' && alert.cantidad > 0) {
        alerts.push(`📦 ALERTA: ${alert.cantidad} productos con stock bajo`);
      }
      if (alert.tipo_alerta === 'clientes_inactivos' && alert.cantidad > 5) {
        alerts.push(`👥 ALERTA: ${alert.cantidad} clientes inactivos requieren atención`);
      }
    });

    if (alerts.length === 0) {
      alerts.push('✅ ESTADO: No hay alertas críticas en este momento');
    }

    return alerts;
  }

  /**
   * Sugerir acciones con formato estructurado
   */
  private suggestActions(alertsData: any[], invoicesData: any[]): string[] {
    const actions: string[] = [];

    // Acciones basadas en alertas
    const facturasPendientes = alertsData.find(a => a.tipo_alerta === 'facturas_vencidas');
    if (facturasPendientes && facturasPendientes.cantidad > 0) {
      actions.push('👉 ACCIÓN: Contactar departamento de cobranza para facturas vencidas');
      actions.push('👉 ACCIÓN: Revisar políticas de crédito para clientes morosos');
    }

    const stockBajo = alertsData.find(a => a.tipo_alerta === 'stock_bajo');
    if (stockBajo && stockBajo.cantidad > 0) {
      actions.push('👉 ACCIÓN: Generar órdenes de compra para productos con stock bajo');
    }

    // Acciones basadas en tendencias de facturas
    const facturasDraft = invoicesData.find(i => i.status === 'draft');
    if (facturasDraft && facturasDraft.cantidad_facturas > 5) {
      actions.push('👉 ACCIÓN: Procesar facturas en borrador pendientes');
    }

    if (actions.length === 0) {
      actions.push('👉 ACCIÓN: Continuar monitoreando métricas del negocio');
    }

    return actions;
  }

  /**
   * Proporcionar análisis detallado
   */
  private provideAnalysis(financialData: any[], invoicesData: any[]): string {
    let analysis = '🔍 ANÁLISIS DETALLADO:\n\n';

    // Análisis de estructura contable
    if (financialData.length > 0) {
      const totalCuentas = financialData.reduce((sum, item) => sum + (item.cantidad_cuentas || 0), 0);
      analysis += `📊 ESTRUCTURA CONTABLE: ${totalCuentas} cuentas activas distribuidas por tipo.\n`;
      
      const activos = financialData.find(f => f.account_type === 'asset');
      if (activos) {
        analysis += `💰 ACTIVOS: ${activos.cantidad_cuentas} cuentas de activos configuradas.\n`;
      }
    }

    // Análisis de facturación
    if (invoicesData.length > 0) {
      const totalFacturas = invoicesData.reduce((sum, item) => sum + (item.cantidad_facturas || 0), 0);
      const montoTotal = invoicesData.reduce((sum, item) => sum + (item.monto_total || 0), 0);
      
      analysis += `📈 FACTURACIÓN: ${totalFacturas} facturas por un total de $${montoTotal.toLocaleString()}.\n`;
      
      const facturasPagadas = invoicesData.find(i => i.status === 'paid');
      if (facturasPagadas) {
        analysis += `✅ COBROS: $${facturasPagadas.monto_total?.toLocaleString()} en facturas pagadas.\n`;
      }
    }

    analysis += '\n💡 RECOMENDACIÓN: Mantener monitoreo continuo de métricas clave para optimizar flujo de caja.';

    return analysis;
  }

  /**
   * Verificar disponibilidad del servicio
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const { db } = await import('../database/simple-db');
      return db !== null;
    } catch {
      return false;
    }
  }
}

// Instancia singleton
export const iaService = new IAService();

// Export por defecto
export default iaService;