
/**
 * QuerySecurityMonitor.ts
 * Monitor de seguridad para validación de consultas SQL y prevención de abusos.
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
        /\/\*/, // Comentarios multilínea
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
            return { isValid: false, reason: 'Límite de consultas (30/min) excedido.', incidentType: 'rate_limit' };
        }

        // 2. Verificar Patrones Bloqueados (Prevención de inyección y mutación)
        for (const pattern of this.BLOCKED_PATTERNS) {
            if (pattern.test(sql)) {
                console.error(`🚨 ALERTA DE SEGURIDAD: Patrón bloqueado detectado en query: "${sql}"`);
                return { isValid: false, reason: 'Operación no permitida detectada.', incidentType: 'blocked_pattern' };
            }
        }

        // 3. Sanitización básica adicional
        if (sql.includes(';') && !sql.endsWith(';')) {
            // Prevenir queries múltiples
            return { isValid: false, reason: 'Consultas múltiples no permitidas.', incidentType: 'blocked_pattern' };
        }

        return { isValid: true, reason: 'Consulta validada correctamente.' };
    }

    static logSecurityIncident(type: string, query: string, userId: number) {
        // En una implementación real, esto iría a una tabla de auditoría persistente
        console.warn(`[SECURITY_INCIDENT] User: ${userId} | Type: ${type} | Query: ${query}`);
    }
}
