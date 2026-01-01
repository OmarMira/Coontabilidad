import { db } from '../../database/simple-db';
import { logger } from '../../core/logging/SystemLogger';
import { AI_SECURITY_CONFIG } from '../../config/ai-security';

export class DatabaseService {
    private static instance: DatabaseService;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Ejecuta una consulta SQL de forma segura (solo lectura)
     */
    async executeSafeQuery(query: string, params: any[] = []): Promise<any[]> {
        if (!db) {
            throw new Error('Base de datos no inicializada');
        }

        // Validación de seguridad básica: permitir solo SELECT
        if (!query.trim().toUpperCase().startsWith('SELECT')) {
            logger.error('DatabaseService', 'security_violation', 'IA intentó ejecutar comando no permitido', { query });
            throw new Error('Solo se permiten consultas de lectura (SELECT)');
        }

        // Verificar que solo accede a tablas permitidas
        const lowerQuery = query.toLowerCase();
        const isTargetingAllowedTable = AI_SECURITY_CONFIG.allowedTables.some(table =>
            lowerQuery.includes(table.toLowerCase())
        );

        if (!isTargetingAllowedTable) {
            logger.warn('DatabaseService', 'restricted_access', 'IA intentó acceder a tabla no listada explícitamente', { query });
        }

        try {
            const result = db.exec(query, params);

            if (!result || result.length === 0 || !result[0].values) {
                return [];
            }

            const columns = result[0].columns;
            const rows = result[0].values;

            return rows.map((row: any[]) => {
                const obj: any = {};
                columns.forEach((col: string, index: number) => {
                    obj[col] = row[index];
                });
                return obj;
            });
        } catch (error) {
            logger.error('DatabaseService', 'query_error', 'Error ejecutando query segura', { query, error });
            throw error;
        }
    }

    /**
     * Verifica la salud de la base de datos
     */
    async checkHealth(): Promise<{ healthy: boolean }> {
        try {
            if (!db) return { healthy: false };
            db.exec('SELECT 1');
            return { healthy: true };
        } catch {
            return { healthy: false };
        }
    }

    /**
     * Obtiene información sobre el último backup
     */
    async getLastBackup(): Promise<{ timestamp: string } | null> {
        try {
            // Intentar obtener de metadatos o logs
            const result = await this.executeSafeQuery(
                "SELECT timestamp FROM system_logs WHERE action = 'export_success' ORDER BY timestamp DESC LIMIT 1"
            );
            return result.length > 0 ? { timestamp: result[0].timestamp } : null;
        } catch {
            return null;
        }
    }
}
