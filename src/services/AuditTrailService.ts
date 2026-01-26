import { db } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { AuditEntry } from '../types/user.types';

export class AuditTrailService {
    private static instance: AuditTrailService;

    private constructor() { }

    public static getInstance(): AuditTrailService {
        if (!AuditTrailService.instance) {
            AuditTrailService.instance = new AuditTrailService();
        }
        return AuditTrailService.instance;
    }

    /**
     * Registra una acción en el audit trail
     */
    public async logAction(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
        if (!db) return;

        try {
            db.run(`
        INSERT INTO audit_trail (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                entry.user_id || 1,
                entry.action,
                entry.entity_type,
                entry.entity_id,
                entry.old_value ?? null,
                entry.new_value ?? null,
                entry.ip_address ?? null
            ]);

            logger.info('Audit', 'logged', `${entry.action} on ${entry.entity_type}`, { entityId: entry.entity_id });
        } catch (error) {
            logger.error('Audit', 'log_failed', 'Failed to log audit action', { entry }, error as Error);
        }
    }

    /**
     * Obtiene el audit trail con filtros
     */
    public getAuditTrail(filters: {
        userId?: number,
        entityType?: string,
        action?: string,
        limit?: number
    } = {}): AuditEntry[] {
        if (!db) return [];

        try {
            let query = 'SELECT * FROM audit_trail WHERE 1=1';
            const params: any[] = [];

            if (filters.userId) {
                query += ' AND user_id = ?';
                params.push(filters.userId);
            }
            if (filters.entityType) {
                query += ' AND entity_type = ?';
                params.push(filters.entityType);
            }
            if (filters.action) {
                query += ' AND action = ?';
                params.push(filters.action);
            }

            query += ' ORDER BY timestamp DESC LIMIT ?';
            params.push(filters.limit || 100);

            const res = db.exec(query, params);
            if (!res[0]) return [];

            const columns = res[0].columns;
            return res[0].values.map(row => {
                const obj: any = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj as AuditEntry;
            });
        } catch (error) {
            logger.error('Audit', 'fetch_failed', 'Failed to fetch audit trail', filters, error as Error);
            return [];
        }
    }
}

export default AuditTrailService.getInstance();
