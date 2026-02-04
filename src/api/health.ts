/**
 * Health Check API Endpoint
 * Proporciona información del estado del sistema para monitoreo externo
 * Nivel NASA: Endpoint estándar para sistemas de producción
 */

import { IntegrityService } from '../services/integrity/IntegrityService';
import { SystemIntegrityReport } from '../types/integrity.types';

export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'critical';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        id: string;
        name: string;
        status: 'passed' | 'failed';
        message: string;
        executionTime: number;
    }[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        criticalFailures: number;
        warnings: number;
    };
}

/**
 * Ejecuta health check completo del sistema
 */
export async function getHealthStatus(): Promise<HealthCheckResponse> {
    const startTime = performance.now();
    const service = new IntegrityService();
    const report: SystemIntegrityReport = await service.runAllChecks();
    
    const checks = report.checks.map(check => ({
        id: check.id,
        name: check.name,
        status: check.status === 'passed' ? 'passed' as const : 'failed' as const,
        message: check.result.message,
        executionTime: check.executionTime
    }));

    const passed = checks.filter(c => c.status === 'passed').length;
    const failed = checks.filter(c => c.status === 'failed').length;

    return {
        status: report.overallStatus,
        timestamp: report.timestamp,
        version: '3.0.0-iron-core',
        uptime: performance.now() - startTime,
        checks,
        summary: {
            total: checks.length,
            passed,
            failed,
            criticalFailures: report.criticalFailures,
            warnings: report.warnings
        }
    };
}

/**
 * Versión simplificada para health checks rápidos
 */
export async function getHealthStatusSimple(): Promise<{ status: string; timestamp: string }> {
    try {
        const service = new IntegrityService();
        const report = await service.runAllChecks();
        
        return {
            status: report.overallStatus,
            timestamp: report.timestamp
        };
    } catch (error) {
        return {
            status: 'critical',
            timestamp: new Date().toISOString()
        };
    }
}
