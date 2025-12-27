import { SecurityValidation } from './types';
import { DatabaseService } from '../database/DatabaseService';

export class SecurityValidator {
    private rateLimitStore = new Map<string, { count: number; resetTime: number }>();

    validateQuery(userQuery: string): SecurityValidation {
        const queryLower = userQuery.toLowerCase();

        // 1. DETECCIÓN DE INYECCIÓN SQL
        const sqlPatterns = [
            /;.*--/, /union.*select/i, /drop.*table/i, /insert.*into/i,
            /update.*set/i, /delete.*from/i, /alter.*table/i,
            /exec\(/i, /execute\(/i, /xp_cmdshell/i
        ];

        for (const pattern of sqlPatterns) {
            if (pattern.test(userQuery)) {
                return {
                    allowed: false,
                    reason: 'SQL injection pattern detected',
                    severity: 'critical'
                };
            }
        }

        // 2. BLOQUEO DE PALABRAS CLAVE PELIGROSAS
        const dangerousKeywords = [
            'contraseña', 'password', 'clave', 'credencial',
            'eliminar', 'borrar', 'modificar', 'cambiar',
            'root', 'admin', 'superuser', 'grant', 'revoke'
        ];

        const foundDangerous = dangerousKeywords.filter(keyword =>
            queryLower.includes(keyword)
        );

        if (foundDangerous.length > 0) {
            return {
                allowed: false,
                reason: `Dangerous keywords detected: ${foundDangerous.join(', ')}`,
                severity: 'high'
            };
        }

        // 3. DETECCIÓN DE INTENCIÓN DE ESCRITURA
        const writeIntents = ['inserta', 'actualiza', 'borra', 'elimina', 'cambia', 'modifica'];
        const hasWriteIntent = writeIntents.some(intent => queryLower.includes(intent));

        if (hasWriteIntent) {
            const theoreticalIndicators = [
                /cómo se/i, /qué es/i, /explica/i, /diferencia entre/i,
                /ejemplo de/i, /para qué sirve/i, /cuándo se usa/i
            ];

            const isTheoretical = theoreticalIndicators.some(indicator =>
                indicator.test(userQuery)
            );

            if (!isTheoretical) {
                return {
                    allowed: false,
                    reason: 'Write operation intent detected',
                    severity: 'high'
                };
            }
        }

        return {
            allowed: true,
            reason: 'Query validated successfully',
            severity: 'low'
        };
    }

    validateResponse(aiResponse: string): { valid: boolean; issues: string[] } {
        const issues: string[] = [];
        const sensitivePatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // CC
            /\b[A-Za-z0-9._%+-]+@ [A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
        ];

        sensitivePatterns.forEach((pattern, index) => {
            if (pattern.test(aiResponse)) {
                issues.push(`Sensitive data pattern ${index + 1} found in response`);
            }
        });

        return {
            valid: issues.length === 0,
            issues
        };
    }

    async auditInteraction(
        userId: number,
        query: string,
        response: any,
        validation: SecurityValidation
    ): Promise<void> {
        try {
            await DatabaseService.getInstance().executeSafeQuery(
                `INSERT INTO system_logs (action, details, user_id, timestamp)
         VALUES (?, ?, ?, ?)`,
                [
                    'ai_interaction',
                    JSON.stringify({ query, validation }),
                    userId,
                    new Date().toISOString()
                ]
            );
        } catch (error) {
            console.error('[SecurityValidator] Audit logging failed', error);
        }
    }
}
