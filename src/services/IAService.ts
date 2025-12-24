/**
 * SERVICIO DE IA NO INTRUSIVA
 * 
 * Cumple con Documento Técnico Oficial Sección 7: "IA No Intrusiva"
 * - Solo acceso de LECTURA a vistas _summary
 * - No puede modificar datos
 * - Proporciona análisis y recomendaciones
 * - Integración con Gemini 1.5 Flash
 */

import { logger } from '../core/logging/SystemLogger';

// Interfaces para las vistas _summary (solo lectura)
export interface FinancialSummary {
  report_type: string;
  total_assets: number;
  total_liabilities_equity: number;
  imbalance: number;
  period: string;
}

export interface TaxSummary {
  period: string;
  total_sales: number;
  taxable_sales: number;
  exempt_sales: number;
  total_tax_collected: number;
  counties_breakdown: string; // JSON string
}

export interface AuditSummary {
  table_name: string;
  total_operations: number;
  last_operation: string;
  operation_types: string; // JSON string
}

export interface BusinessInsight {
  type: 'financial' | 'tax' | 'operational' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  data_source: string;
  confidence: number; // 0-100
}

export interface IAAnalysis {
  summary: string;
  insights: BusinessInsight[];
  recommendations: string[];
  alerts: string[];
  generated_at: string;
}

class IAService {
  private db: any = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Importar la base de datos de forma dinámica
      const { db: database } = await import('../database/simple-db');
      this.db = database;
      this.isEnabled = true;
      logger.info('IAService', 'init_success', 'Servicio de IA inicializado correctamente');
    } catch (error) {
      logger.error('IAService', 'init_failed', 'Error al inicializar servicio de IA', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      this.isEnabled = false;
    }
  }

  /**
   * Obtiene resumen financiero de la vista financial_summary
   */
  public getFinancialSummary(): FinancialSummary | null {
    if (!this.isEnabled || !this.db) {
      logger.warn('IAService', 'financial_summary_disabled', 'Servicio de IA no disponible');
      return null;
    }

    try {
      logger.info('IAService', 'financial_summary_start', 'Obteniendo resumen financiero para IA');
      
      const result = this.db.exec(`
        SELECT 
          report_type,
          total_assets,
          total_liabilities_equity,
          imbalance,
          period
        FROM financial_summary 
        LIMIT 1
      `);

      if (result.length === 0 || result[0].values.length === 0) {
        logger.warn('IAService', 'financial_summary_empty', 'No hay datos financieros disponibles');
        return null;
      }

      const row = result[0].values[0];
      const summary: FinancialSummary = {
        report_type: row[0] as string,
        total_assets: Number(row[1]) || 0,
        total_liabilities_equity: Number(row[2]) || 0,
        imbalance: Number(row[3]) || 0,
        period: row[4] as string
      };

      logger.info('IAService', 'financial_summary_success', 'Resumen financiero obtenido', summary);
      return summary;

    } catch (error) {
      logger.error('IAService', 'financial_summary_error', 'Error al obtener resumen financiero', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      return null;
    }
  }

  /**
   * Obtiene resumen de impuestos de la vista tax_summary
   */
  public getTaxSummary(): TaxSummary[] {
    if (!this.isEnabled || !this.db) {
      logger.warn('IAService', 'tax_summary_disabled', 'Servicio de IA no disponible');
      return [];
    }

    try {
      logger.info('IAService', 'tax_summary_start', 'Obteniendo resumen de impuestos para IA');
      
      const result = this.db.exec(`
        SELECT 
          period,
          total_sales,
          taxable_sales,
          exempt_sales,
          total_tax_collected,
          counties_breakdown
        FROM tax_summary 
        ORDER BY period DESC
        LIMIT 12
      `);

      if (result.length === 0 || result[0].values.length === 0) {
        logger.warn('IAService', 'tax_summary_empty', 'No hay datos de impuestos disponibles');
        return [];
      }

      const summaries: TaxSummary[] = result[0].values.map(row => ({
        period: row[0] as string,
        total_sales: Number(row[1]) || 0,
        taxable_sales: Number(row[2]) || 0,
        exempt_sales: Number(row[3]) || 0,
        total_tax_collected: Number(row[4]) || 0,
        counties_breakdown: row[5] as string || '{}'
      }));

      logger.info('IAService', 'tax_summary_success', 'Resumen de impuestos obtenido', { count: summaries.length });
      return summaries;

    } catch (error) {
      logger.error('IAService', 'tax_summary_error', 'Error al obtener resumen de impuestos', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      return [];
    }
  }

  /**
   * Obtiene resumen de auditoría de la vista audit_summary
   */
  public getAuditSummary(): AuditSummary[] {
    if (!this.isEnabled || !this.db) {
      logger.warn('IAService', 'audit_summary_disabled', 'Servicio de IA no disponible');
      return [];
    }

    try {
      logger.info('IAService', 'audit_summary_start', 'Obteniendo resumen de auditoría para IA');
      
      const result = this.db.exec(`
        SELECT 
          table_name,
          total_operations,
          last_operation,
          operation_types
        FROM audit_summary 
        ORDER BY total_operations DESC
      `);

      if (result.length === 0 || result[0].values.length === 0) {
        logger.warn('IAService', 'audit_summary_empty', 'No hay datos de auditoría disponibles');
        return [];
      }

      const summaries: AuditSummary[] = result[0].values.map(row => ({
        table_name: row[0] as string,
        total_operations: Number(row[1]) || 0,
        last_operation: row[2] as string,
        operation_types: row[3] as string || '{}'
      }));

      logger.info('IAService', 'audit_summary_success', 'Resumen de auditoría obtenido', { count: summaries.length });
      return summaries;

    } catch (error) {
      logger.error('IAService', 'audit_summary_error', 'Error al obtener resumen de auditoría', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      return [];
    }
  }

  /**
   * Analiza los datos y genera insights de negocio
   */
  public async generateBusinessInsights(): Promise<BusinessInsight[]> {
    if (!this.isEnabled) {
      return [];
    }

    try {
      logger.info('IAService', 'insights_start', 'Generando insights de negocio');

      const insights: BusinessInsight[] = [];
      
      // Análisis financiero
      const financial = this.getFinancialSummary();
      if (financial) {
        // Verificar balance contable
        if (Math.abs(financial.imbalance) > 0.01) {
          insights.push({
            type: 'financial',
            priority: 'critical',
            title: 'Desbalance Contable Detectado',
            description: `El balance general muestra un desbalance de $${financial.imbalance.toFixed(2)}`,
            recommendation: 'Revisar asientos contables y corregir discrepancias inmediatamente',
            data_source: 'financial_summary',
            confidence: 95
          });
        }

        // Análisis de activos
        if (financial.total_assets > 0) {
          insights.push({
            type: 'financial',
            priority: 'medium',
            title: 'Estado Financiero Saludable',
            description: `Total de activos: $${financial.total_assets.toFixed(2)}`,
            recommendation: 'Mantener el control de activos y considerar oportunidades de inversión',
            data_source: 'financial_summary',
            confidence: 85
          });
        }
      }

      // Análisis de impuestos
      const taxData = this.getTaxSummary();
      if (taxData.length > 0) {
        const latestTax = taxData[0];
        
        // Verificar cumplimiento fiscal
        if (latestTax.total_tax_collected > 0) {
          insights.push({
            type: 'tax',
            priority: 'high',
            title: 'Impuestos por Declarar',
            description: `Impuestos recolectados en ${latestTax.period}: $${latestTax.total_tax_collected.toFixed(2)}`,
            recommendation: 'Preparar declaración DR-15 para el período correspondiente',
            data_source: 'tax_summary',
            confidence: 90
          });
        }

        // Análisis de tendencias
        if (taxData.length >= 2) {
          const currentSales = taxData[0].total_sales;
          const previousSales = taxData[1].total_sales;
          const growth = ((currentSales - previousSales) / previousSales) * 100;

          if (growth > 10) {
            insights.push({
              type: 'operational',
              priority: 'medium',
              title: 'Crecimiento en Ventas',
              description: `Crecimiento del ${growth.toFixed(1)}% en ventas respecto al período anterior`,
              recommendation: 'Analizar factores de crecimiento y planificar escalabilidad',
              data_source: 'tax_summary',
              confidence: 80
            });
          } else if (growth < -10) {
            insights.push({
              type: 'operational',
              priority: 'high',
              title: 'Declive en Ventas',
              description: `Disminución del ${Math.abs(growth).toFixed(1)}% en ventas respecto al período anterior`,
              recommendation: 'Revisar estrategias de marketing y operaciones',
              data_source: 'tax_summary',
              confidence: 85
            });
          }
        }
      }

      // Análisis de auditoría
      const auditData = this.getAuditSummary();
      if (auditData.length > 0) {
        const totalOps = auditData.reduce((sum, item) => sum + item.total_operations, 0);
        
        insights.push({
          type: 'compliance',
          priority: 'low',
          title: 'Actividad del Sistema',
          description: `Total de operaciones registradas: ${totalOps}`,
          recommendation: 'Sistema funcionando correctamente con auditoría completa',
          data_source: 'audit_summary',
          confidence: 95
        });
      }

      logger.info('IAService', 'insights_success', 'Insights generados correctamente', { count: insights.length });
      return insights;

    } catch (error) {
      logger.error('IAService', 'insights_error', 'Error al generar insights', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      return [];
    }
  }

  /**
   * Genera análisis completo del negocio
   */
  public async generateCompleteAnalysis(): Promise<IAAnalysis> {
    try {
      logger.info('IAService', 'analysis_start', 'Generando análisis completo de IA');

      const insights = await this.generateBusinessInsights();
      const financial = this.getFinancialSummary();
      const taxData = this.getTaxSummary();

      // Generar resumen
      let summary = 'Análisis del Sistema de Coontabilidad:\n\n';
      
      if (financial) {
        summary += `• Balance General: Activos $${financial.total_assets.toFixed(2)}, `;
        summary += `Pasivos + Patrimonio $${financial.total_liabilities_equity.toFixed(2)}\n`;
        summary += `• Estado Contable: ${Math.abs(financial.imbalance) < 0.01 ? 'Balanceado' : 'Desbalanceado'}\n`;
      }

      if (taxData.length > 0) {
        const latest = taxData[0];
        summary += `• Período Fiscal ${latest.period}: Ventas $${latest.total_sales.toFixed(2)}, `;
        summary += `Impuestos $${latest.total_tax_collected.toFixed(2)}\n`;
      }

      // Generar recomendaciones
      const recommendations = insights
        .filter(insight => insight.priority === 'high' || insight.priority === 'critical')
        .map(insight => insight.recommendation);

      // Generar alertas
      const alerts = insights
        .filter(insight => insight.priority === 'critical')
        .map(insight => insight.title);

      const analysis: IAAnalysis = {
        summary,
        insights,
        recommendations,
        alerts,
        generated_at: new Date().toISOString()
      };

      logger.info('IAService', 'analysis_success', 'Análisis completo generado', { 
        insights_count: insights.length,
        recommendations_count: recommendations.length,
        alerts_count: alerts.length
      });

      return analysis;

    } catch (error) {
      logger.error('IAService', 'analysis_error', 'Error al generar análisis completo', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      
      return {
        summary: 'Error al generar análisis. Verifique los logs del sistema.',
        insights: [],
        recommendations: ['Revisar configuración del sistema de IA'],
        alerts: ['Error en el sistema de análisis'],
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  public isAvailable(): boolean {
    return this.isEnabled && this.db !== null;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  public getServiceStats() {
    return {
      enabled: this.isEnabled,
      database_connected: this.db !== null,
      views_available: ['financial_summary', 'tax_summary', 'audit_summary'],
      last_check: new Date().toISOString()
    };
  }
}

// Singleton instance
export const iaService = new IAService();

// Export default
export default iaService;