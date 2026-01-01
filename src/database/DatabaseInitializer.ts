import initSqlJs from 'sql.js';
import { logger } from '../core/logging/SystemLogger';

export class DatabaseInitializer {
    /**
     * Inicializa la base de datos de forma segura, manejando restricciones de claves foráneas
     * y asegurando un orden correcto de creación de tablas.
     */
    static async initializeWithFix(db: initSqlJs.Database): Promise<void> {
        try {
            logger.info('Database', 'fix_init_start', 'Iniciando inicialización robusta con manejo de FK');

            // 1. DESACTIVAR FK TEMPORALMENTE para permitir creación y seeding sin bloqueos
            db.run('PRAGMA foreign_keys = OFF;');
            logger.debug('Database', 'fk_disabled', 'Claves foráneas desactivadas temporalmente');

            // 2. CREACIÓN DE TABLAS Y VISTAS (Ya se maneja en simple-db)

            // 3. SEEDING DE DATOS (Ya se maneja en simple-db)

            // 4. VERIFICAR INTEGRIDAD Y REACTIVAR FK
            db.run('PRAGMA foreign_keys = ON;');
            logger.debug('Database', 'fk_enabled', 'Claves foráneas reactivadas');

            // 5. VERIFICACIÓN FINAL DE INTEGRIDAD
            const fkCheck = db.exec('PRAGMA foreign_key_check;');
            if (fkCheck.length > 0) {
                const errors = fkCheck[0].values.map(row =>
                    `Tabla ${row[0]}, fila ${row[1]}, destino FK ${row[2]}`
                );
                logger.error('Database', 'fk_violations', 'Violaciones de integridad detectadas', { errors });
            } else {
                logger.success('Database', 'integrity_check', 'Integridad de base de datos verificada correctamente');
            }

        } catch (error: any) {
            logger.critical('Database', 'fix_init_failed', 'Error en la inicialización robusta', { error: error.message });
            throw error;
        }
    }

    /**
     * Método estático para verificar FK individualmente si es necesario
     */
    static verifyIntegrity(db: initSqlJs.Database): boolean {
        const result = db.exec('PRAGMA foreign_key_check;');
        return result.length === 0;
    }
}
