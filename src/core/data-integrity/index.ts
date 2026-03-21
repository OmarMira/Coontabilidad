import { logger } from '../../core/logging/SystemLogger';
/**
 * Data Integrity Module - Central Export
 * 
 * Exporta todos los servicios de integridad de datos
 */

export {
  DataIntegrityValidator,
  DataIntegrityCore
} from './DataIntegrityCore';

export type {
  DataValidationRule,
  ValidationRule,
  IntegrityCheckResult,
  IntegrityError,
  IntegrityWarning,
  RepairOperation,
  DataAuditLog
} from './DataIntegrityCore';

export { VALIDATION_RULES } from './DataIntegrityCore';

export { DataIntegrityChecker } from './DataIntegrityChecker';
export type { CheckConfig } from './DataIntegrityChecker';

export { DataRepairEngine } from './DataRepairEngine';
export type { RepairPlan } from './DataRepairEngine';

export { DataHealthCheckService } from './DataHealthCheckService';
export type {
  HealthCheckReport,
  HealthMetrics
} from './DataHealthCheckService';

// ====================================
// INICIALIZACIÃ“N AUTOMÃTICA
// ====================================

import { DataHealthCheckService } from './DataHealthCheckService';

/**
 * Iniciar todos los servicios de integridad
 */
export function initializeDataIntegrity() {
  logger.info('DataIntegrity', 'init_start', 'Inicializando sistema de integridad de datos');

  // Iniciar monitoreo de salud con:
  // - Check cada 5 minutos
  // - Auto-repair habilitado
  // - 3 intentos de reparaciÃ³n mÃ¡ximo
  DataHealthCheckService.startHealthMonitoring(
    5 * 60 * 1000, // 5 minutos
    true // Auto-repair
  );

  logger.info('DataIntegrity', 'init_complete', 'Sistema de integridad de datos inicializado');
}

/**
 * Detener servicios de integridad
 */
export function shutdownDataIntegrity() {
  logger.info('DataIntegrity', 'shutdown', 'Apagando sistema de integridad de datos');
  DataHealthCheckService.stopHealthMonitoring();
}

/**
 * Ejecutar verificaciÃ³n manual de integridad
 */
export async function runManualIntegrityCheck() {
  logger.info('DataIntegrity', 'manual_check', 'Ejecutando verificacion manual de integridad');
  const report = await DataHealthCheckService.performHealthCheck();
  logger.info('DataIntegrity', 'report', DataHealthCheckService.generateDetailedReport());
  return report;
}

/**
 * Obtener status de integridad
 */
export function getIntegrityStatus() {
  return {
    health: DataHealthCheckService.getCurrentStatus(),
    lastReport: DataHealthCheckService.getLatestReport(),
    history: DataHealthCheckService.getReportHistory(5)
  };
}

