
import initSqlJs from 'sql.js';
import { logger } from '../core/logging/SystemLogger';
import { SchemaRepairService } from './SchemaRepairService';

export class DatabaseInitializer {
    static async initializeWithFix(db: initSqlJs.Database): Promise<void> {
        try {
            logger.info('Database', 'init', 'Iniciando verificación de esquema...');
            const repairService = new SchemaRepairService(db);
            const repairLogs = await repairService.repairSchema();

            repairLogs.forEach(log => {
                if (log.startsWith('❌')) logger.error('Database', 'repair_failed', log);
                else logger.info('Database', 'repair_success', log);
            });

        } catch (error: any) {
            logger.error('Database', 'init_failed', error.message);
        }
    }
}
