
import initSqlJs from 'sql.js';
import { logger } from '../core/logging/SystemLogger';
import { SchemaRepairService } from './SchemaRepairService';
import { SQLiteEngine } from '../core/database/SQLiteEngine';
import { SchemaCrawler } from '../services/ai/SchemaCrawler';
import { MigrationEngine } from '../core/migrations/MigrationEngine';

export class DatabaseInitializer {
    static async initializeWithFix(db: initSqlJs.Database): Promise<void> {
        try {
            logger.info('Database', 'init', 'Iniciando verificación de esquema...');

            // CRITICAL: Wrap sql.js instance in SQLiteEngine for SchemaRepairService compatibility
            const engine = new SQLiteEngine();
            engine.setDB(db);

            // Execute pending migrations
            logger.info('Database', 'migration_engine', 'Starting database migrations...');
            await MigrationEngine.getInstance().migrate(engine);

            const repairService = new SchemaRepairService(engine);
            const repairLogs = await repairService.repairSchema();

            repairLogs.forEach(log => {
                if (log.startsWith('❌')) logger.error('Database', 'repair_failed', log);
                else logger.info('Database', 'repair_success', log);
            });

            // DAC Phase 1: Dynamic Schema Crawling
            try {
                const crawler = new SchemaCrawler(engine);
                const context = await crawler.crawl();
                await crawler.persistContext(context);
                logger.info('Database', 'dac_phase1_success', 'Contexto dinámico de IA actualizado correctamente');
            } catch (crawlerError: any) {
                logger.error('Database', 'dac_phase1_failed', `Fallo al generar contexto de IA: ${crawlerError.message}`);
            }

        } catch (error: any) {
            logger.error('Database', 'init_failed', error.message);
        }
    }
}
