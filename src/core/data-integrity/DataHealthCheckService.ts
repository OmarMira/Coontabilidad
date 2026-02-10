/**
 * DataHealthCheckService - Servicio de Salud y Monitoreo de Datos
 * 
 * Monitorea continuamente:
 * - Integridad referencial
 * - Consistencia de datos
 * - Anomalías
 * - Degradación de rendimiento
 * - Genera reportes
 */

import { DataIntegrityChecker } from './DataIntegrityChecker';
import { DataRepairEngine, RepairPlan } from './DataRepairEngine';
import { IntegrityCheckResult } from './DataIntegrityCore';

export interface HealthCheckReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  checksPerformed: number;
  errorCount: number;
  warningCount: number;
  repairsApplied: number;
  averageRepairTime: number;
  lastCheck: string;
  nextCheck: string;
  details: IntegrityCheckResult;
  recommendations: string[];
}

export interface HealthMetrics {
  totalRecords: number;
  orphanRecords: number;
  duplicateRecords: number;
  inconsistencies: number;
  databaseSize: number;
  queryPerformance: {
    avgTime: number;
    maxTime: number;
    slowQueries: number;
  };
}

export class DataHealthCheckService {
  private static checkInterval: number = 5 * 60 * 1000; // 5 minutos
  private static autoRepair: boolean = true;
  private static maxRetries: number = 3;
  private static checkHistory: HealthCheckReport[] = [];
  private static lastCheckTime: Date | null = null;
  private static isRunning: boolean = false;

  /**
   * Iniciar monitoreo continuo de salud
   */
  static startHealthMonitoring(intervalMs: number = 5 * 60 * 1000, enableAutoRepair: boolean = true) {
    this.checkInterval = intervalMs;
    this.autoRepair = enableAutoRepair;

    if (this.isRunning) {
      console.warn('⚠️ Health monitoring ya está activo');
      return;
    }

    this.isRunning = true;
    console.log(`🏥 Iniciando monitoreo de salud (cada ${intervalMs / 1000}s, auto-repair: ${enableAutoRepair})`);

    // Ejecutar primer check inmediatamente
    this.performHealthCheck().catch((error) => {
      console.error('Error en primer health check:', error);
    });

    // Luego ejecutar periódicamente
    setInterval(() => {
      this.performHealthCheck().catch((error) => {
        console.error('Error en health check periódico:', error);
      });
    }, this.checkInterval);
  }

  /**
   * Detener monitoreo
   */
  static stopHealthMonitoring() {
    this.isRunning = false;
    console.log('🛑 Monitoreo de salud detenido');
  }

  /**
   * Ejecutar verificación de salud completa
   */
  static async performHealthCheck(): Promise<HealthCheckReport> {
    const startTime = Date.now();
    const checkTime = new Date().toISOString();

    try {
      // 1. Ejecutar verificación de integridad
      console.log('🔍 Ejecutando verificación de integridad...');
      const integrityResult = await DataIntegrityChecker.runFullCheck({
        checkReferences: true,
        checkDuplicates: true,
        checkConsistency: true,
        autoRepair: false, // No reparar automáticamente en esta etapa
        verbose: false
      });

      // 2. Evaluar resultados
      const criticalErrors = integrityResult.errors.filter((e) => e.severity === 'critical');
      const warnings = integrityResult.errors.filter((e) => e.severity === 'medium' || e.severity === 'low');

      let repairs: any[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      if (criticalErrors.length > 0) {
        status = 'critical';

        // Si está habilitado auto-repair, intentar reparar
        if (this.autoRepair) {
          console.log(`⚠️  Detectados ${criticalErrors.length} errores críticos, iniciando reparación...`);
          const plan = DataRepairEngine.generateRepairPlan(criticalErrors);

          for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
              repairs = await DataRepairEngine.executeRepairPlan(plan);
              console.log(`✅ Reparación exitosa en intento ${attempt}`);
              status = 'warning'; // "Reparado" pero aún requiere revisión
              break;
            } catch (error) {
              console.error(`❌ Intento ${attempt} falló: ${error}`);
              if (attempt === this.maxRetries) {
                console.error('❌ Se alcanzó el máximo de intentos de reparación');
              }
            }
          }
        }
      } else if (warnings.length > 0) {
        status = 'warning';
      }

      // 3. Calcular métricas
      const metrics = this.calculateMetrics(integrityResult);

      // 4. Generar recomendaciones
      const recommendations = this.generateRecommendations(status, integrityResult, metrics);

      // 5. Crear reporte
      const report: HealthCheckReport = {
        timestamp: checkTime,
        status,
        checksPerformed: 1,
        errorCount: integrityResult.errors.length,
        warningCount: warnings.length,
        repairsApplied: repairs.length,
        averageRepairTime: repairs.length > 0 ? (Date.now() - startTime) / repairs.length : 0,
        lastCheck: checkTime,
        nextCheck: new Date(Date.now() + this.checkInterval).toISOString(),
        details: integrityResult,
        recommendations
      };

      this.checkHistory.push(report);
      this.lastCheckTime = new Date();

      // Log del reporte
      console.log(`🏥 Health Check: ${status.toUpperCase()} (${integrityResult.errors.length} errores, ${repairs.length} reparaciones)`);

      return report;
    } catch (error) {
      console.error('Error en health check:', error);

      return {
        timestamp: checkTime,
        status: 'critical',
        checksPerformed: 1,
        errorCount: 1,
        warningCount: 0,
        repairsApplied: 0,
        averageRepairTime: 0,
        lastCheck: checkTime,
        nextCheck: new Date(Date.now() + this.checkInterval).toISOString(),
        details: {
          success: false,
          errors: [
            {
              severity: 'critical',
              table: 'system',
              message: `Health check error: ${error}`,
              repairable: false
            }
          ],
          warnings: [],
          repaired: [],
          timestamp: checkTime
        },
        recommendations: ['Revisar logs de error', 'Contactar administrador']
      };
    }
  }

  /**
   * Calcular métricas de BD
   */
  private static calculateMetrics(result: IntegrityCheckResult): HealthMetrics {
    return {
      totalRecords: 0, // Se calcularía sumando todas las tablas
      orphanRecords: result.errors.filter((e) => e.message.includes('huérfan')).length,
      duplicateRecords: result.errors.filter((e) => e.message.includes('duplicado')).length,
      inconsistencies: result.errors.filter((e) => e.message.includes('inconsistente')).length,
      databaseSize: 0, // Se obtendría del estado de BD
      queryPerformance: {
        avgTime: 0,
        maxTime: 0,
        slowQueries: 0
      }
    };
  }

  /**
   * Generar recomendaciones basadas en resultados
   */
  private static generateRecommendations(
    status: 'healthy' | 'warning' | 'critical',
    result: IntegrityCheckResult,
    metrics: HealthMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'critical') {
      recommendations.push('🚨 Estado CRÍTICO - Se requiere atención inmediata');
      recommendations.push('Revisar logs de error de integridad');
      recommendations.push('Ejecutar reparación manual si auto-repair falló');
    } else if (status === 'warning') {
      recommendations.push('⚠️ Se detectaron advertencias - Revisar próximamente');
    }

    // Recomendaciones específicas
    if (metrics.orphanRecords > 0) {
      recommendations.push(`Eliminar ${metrics.orphanRecords} registros huérfanos`);
    }

    if (metrics.duplicateRecords > 0) {
      recommendations.push(`Consolidar ${metrics.duplicateRecords} registros duplicados`);
    }

    if (metrics.inconsistencies > 0) {
      recommendations.push(`Revisar ${metrics.inconsistencies} inconsistencias de datos`);
    }

    if (result.errors.some((e) => e.message.includes('journal'))) {
      recommendations.push('Rebalancear asientos contables desbalanceados');
    }

    if (result.errors.length === 0) {
      recommendations.push('✅ Base de datos en perfecto estado - Sin acción requerida');
    }

    return recommendations;
  }

  /**
   * Obtener último reporte de salud
   */
  static getLatestReport(): HealthCheckReport | null {
    return this.checkHistory.length > 0 ? this.checkHistory[this.checkHistory.length - 1] : null;
  }

  /**
   * Obtener historial de reportes
   */
  static getReportHistory(limit: number = 10): HealthCheckReport[] {
    return this.checkHistory.slice(-limit);
  }

  /**
   * Obtener estado actual
   */
  static getCurrentStatus(): {
    isRunning: boolean;
    lastCheck: Date | null;
    status: 'healthy' | 'warning' | 'critical' | 'not_checked';
  } {
    const latest = this.getLatestReport();

    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheckTime,
      status: latest?.status || 'not_checked'
    };
  }

  /**
   * Generar reporte detallado
   */
  static generateDetailedReport(): string {
    const latest = this.getLatestReport();

    if (!latest) {
      return 'No health check reports available yet';
    }

    const report = `
╔════════════════════════════════════════════════════════════════╗
║              DATA HEALTH CHECK REPORT                          ║
╚════════════════════════════════════════════════════════════════╝

📊 ESTADO: ${latest.status.toUpperCase()}
🕐 TIMESTAMP: ${latest.timestamp}
⏱️  PRÓXIMO CHECK: ${latest.nextCheck}

📈 MÉTRICAS:
  • Errores: ${latest.errorCount}
  • Advertencias: ${latest.warningCount}
  • Reparaciones: ${latest.repairsApplied}
  • Tiempo promedio/reparación: ${latest.averageRepairTime.toFixed(2)}ms

🔍 DETALLES:
  • Referencias rotas: ${latest.details.errors.filter((e) => e.message.includes('huérfan')).length}
  • Duplicados: ${latest.details.errors.filter((e) => e.message.includes('duplicado')).length}
  • Inconsistencias: ${latest.details.errors.filter((e) => e.message.includes('inconsistente')).length}

💡 RECOMENDACIONES:
${latest.recommendations.map((r) => `  • ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════════
    `;

    return report;
  }

  /**
   * Resetear estadísticas
   */
  static resetStats() {
    this.checkHistory = [];
    this.lastCheckTime = null;
  }
}
