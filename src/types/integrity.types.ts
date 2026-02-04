/**
 * Sistema de Integridad - Tipos Base
 * Nivel NASA: Contratos estrictos para verificación del sistema
 */

export type CheckStatus = 'pending' | 'running' | 'passed' | 'failed' | 'warning';
export type CheckSeverity = 'critical' | 'warning' | 'info';

/**
 * Resultado de una verificación individual
 */
export interface CheckResult {
    passed: boolean;
    message: string;
    details?: Record<string, any>;
    canAutoRepair: boolean;
    repairAction?: () => Promise<void>;
}

/**
 * Definición de una verificación de integridad
 */
export interface IntegrityCheck {
    id: string;
    name: string;
    description: string;
    severity: CheckSeverity;
    status: CheckStatus;
    execute: () => Promise<CheckResult>;
}

/**
 * Resultado de una verificación con métricas
 */
export interface IntegrityCheckResult extends IntegrityCheck {
    result: CheckResult;
    executionTime: number;
}

/**
 * Reporte completo del estado del sistema
 */
export interface SystemIntegrityReport {
    timestamp: string;
    overallStatus: 'healthy' | 'degraded' | 'critical';
    checks: IntegrityCheckResult[];
    criticalFailures: number;
    warnings: number;
}
