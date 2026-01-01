import { db } from '../database/simple-db';
import { CorruptionProofBackupService } from '../services/backup/CorruptionProofBackupService';
import { ForensicDatabaseDiagnostic } from '../database/ForensicDiagnostic';
import { logger } from '../utils/logger';

export interface HealthStatus {
    healthy: boolean;
    issues: string[];
}

export class DatabaseHealthChecker {
    /**
     * Verifica la salud integral del sistema de datos.
     */
    static async checkHealth(): Promise<HealthStatus> {
        if (!db) {
            return { healthy: false, issues: ['Base de datos no instanciada'] };
        }

        const testResults = await CorruptionProofBackupService.runIntegrityTestSuite();

        return {
            healthy: testResults.passed,
            issues: testResults.failures
        };
    }

    /**
     * Intenta una reparación automática si la salud no es óptima.
     */
    static async attemptAutoRepair(): Promise<boolean> {
        logger.warn('Iniciando intento de auto-reparación de emergencia...', undefined, 'Health', 'repair_attempt');

        try {
            const report = await ForensicDatabaseDiagnostic.performDeepAnalysis();

            if (report.recommendations.includes('NUCLEAR_REBUILD_REQUIRED')) {
                await ForensicDatabaseDiagnostic.executeDefinitiveFix();
                return true;
            }

            return false;
        } catch (error: any) {
            logger.error('Fallo en el intento de auto-reparación', { error: error.message }, error, 'Health', 'repair_failed');
            return false;
        }
    }
}
