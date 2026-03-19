import { logger } from '../../core/logging/SystemLogger';

/**
 * QuerySecurityMonitor.ts
 * Monitor de seguridad para validaciÃ³n de consultas SQL y prevenciÃ³n de abusos.
 */

export interface SecurityValidationResult {
    isValid: boolean;
    reason: string;
    incidentType?: 'sql_injection' | 'blocked_pattern' | 'rate_limit';
}

export class QuerySecurityMonitor {
    private static queryCounts: Map<number, { count: number; lastReset: number }> = new Map();
    private static readonly MAX_QUERIES_PER_MINUTE = 30;

    private static readonly BLOCKED_PATTERNS = [
        /drop\s+table/i,
        /delete\s+from/i,
        /update.*set/i,
        /insert\s+into/i,
        /truncate\s+table/i,
        /alter\s+table/i,
        /union\s+select/i,
        /or\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
        /--/, // Comentarios SQL
        /\/\*/, // Comentarios multilÃ­nea
        /xp_cmdshell/i,
        /exec\s+/i
    ];

    static validateQuery(sql: string, userId: number = 1): SecurityValidationResult {
        // 1. Verificar Rate Limiting
        const now = Date.now();
        const userStats = this.queryCounts.get(userId) || { count: 0, lastReset: now };

        if (now - userStats.lastReset > 60000) {
            userStats.count = 1;
            userStats.lastReset = now;
        } else {
            userStats.count++;
        }
        this.queryCounts.set(userId, userStats);

        if (userStats.count > this.MAX_QUERIES_PER_MINUTE) {
            return { isValid: false, reason: 'LÃ­mite de consultas (30/min) excedido.', incidentType: 'rate_limit' };
        }

        // 2. Verificar Patrones Bloqueados (PrevenciÃ³n de inyecciÃ³n y mutaciÃ³n)
        for (const pattern of this.BLOCKED_PATTERNS) {
            if (pattern.test(sql)) {
                logger.error('QuerySecurityMonitor', 'error', `ðŸš¨ ALERTA DE SEGURIDAD: PatrÃ³n bloqueado detectado en query: "${sql}"`);
                return { isValid: false, reason: 'OperaciÃ³n no permitida detectada.', incidentType: 'blocked_pattern' };
            }
        }

        // 3. SanitizaciÃ³n bÃ¡sica adicional
        if (sql.includes(';') && !sql.endsWith(';')) {
            // Prevenir queries mÃºltiples
            return { isValid: false, reason: 'Consultas mÃºltiples no permitidas.', incidentType: 'blocked_pattern' };
        }

        return { isValid: true, reason: 'Consulta validada correctamente.' };
    }

    static logSecurityIncident(type: string, query: string, userId: number) {
        // En una implementaciÃ³n real, esto irÃ­a a una tabla de auditorÃ­a persistente
        logger.warn('QuerySecurityMonitor', 'warn', `[SECURITY_INCIDENT] User: ${userId} | Type: ${type} | Query: ${query}`);
    }
}
