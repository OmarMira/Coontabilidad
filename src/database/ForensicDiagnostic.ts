import { db, DB_NAME } from './simple-db';
import { logger } from '../utils/logger';

export interface DiagnosticReport {
    timestamp: Date;
    errors: string[];
    warnings: string[];
    recommendations: string[];
    rawState: any;
}

export interface FixResult {
    success: boolean;
    backupId?: string;
    timestamp: Date;
    checksum: string;
}

export class ForensicDatabaseDiagnostic {
    /**
     * Realiza un análisis profundo de la base de datos buscando inconsistencias y errores de integridad.
     */
    static async performDeepAnalysis(): Promise<DiagnosticReport> {
        const report: DiagnosticReport = {
            timestamp: new Date(),
            errors: [],
            warnings: [],
            recommendations: [],
            rawState: {}
        };

        if (!db) {
            report.errors.push('Database instance not available for analysis');
            return report;
        }

        try {
            // 1. CAPTURAR ESTADO ACTUAL
            const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
            const tables = tablesRes.length > 0 ? tablesRes[0].values.map(v => v[0] as string) : [];
            report.rawState.tables = tables;

            // 2. VERIFICAR FK
            const fkCheck = db.exec('PRAGMA foreign_key_check;');
            if (fkCheck.length > 0) {
                const violations = fkCheck[0].values.map(row => `Violation in table ${row[0]}, rowid ${row[1]}, target ${row[2]}`);
                report.errors.push(...violations);
            }

            // 3. VERIFICAR INTEGRIDAD FÍSICA
            const integrityCheck = db.exec('PRAGMA integrity_check;');
            if (integrityCheck[0].values[0][0] !== 'ok') {
                report.errors.push(`Physical integrity failure: ${integrityCheck[0].values[0][0]}`);
            }

            // 4. GENERAR RECOMENDACIONES
            if (report.errors.length > 0) {
                report.recommendations.push('NUCLEAR_REBUILD_REQUIRED');
            } else {
                report.recommendations.push('SYSTEM_STABLE');
            }

        } catch (error: any) {
            report.errors.push(`Analysis failed: ${error.message}`);
        }

        return report;
    }

    /**
     * Ejecuta el fix definitivo: Reconstrucción nuclear desde cero para limpiar estados corruptos.
     */
    static async executeDefinitiveFix(): Promise<FixResult> {
        logger.emergency('EJECUTANDO FIX DEFINITIVO PARA ERROR FK - MODO NUCLEAR', undefined, undefined, 'Forensic', 'start');

        if (!db) throw new Error('Database not initialized');

        try {
            // FASE 1: NUCLEAR REBUILD
            await this.nuclearRebuild();

            // FASE 2: VERIFICACIÓN DE 3 PASOS
            await this.threeStepVerification();

            const checksum = await this.generateSystemChecksum();

            logger.success('SISTEMA RECONSTRUIDO Y VALIDADO TRAS FIX NUCLEAR', undefined, 'Forensic', 'success');

            return {
                success: true,
                timestamp: new Date(),
                checksum: checksum
            };

        } catch (error: any) {
            logger.critical('FALLA EN EL FIX DEFINITIVO NUCLEAR', { error: error.message }, undefined, 'Forensic', 'failed');
            throw error;
        }
    }

    private static async nuclearRebuild(): Promise<void> {
        if (!db) return;

        logger.warn('Iniciando Nuclear Rebuild: Eliminando todos los artefactos...', undefined, 'Forensic', 'cleanup');

        // 1. Desactivar FK
        db.run('PRAGMA foreign_keys = OFF;');

        // 2. Obtener y eliminar todas las tablas, vistas e índices
        const objects = db.exec("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'view', 'index') AND name NOT LIKE 'sqlite_%'");

        if (objects.length > 0) {
            for (const row of objects[0].values) {
                const type = row[0] as string;
                const name = row[1] as string;
                try {
                    db.run(`DROP ${type.toUpperCase()} IF EXISTS "${name}"`);
                    logger.debug(`Eliminado ${type}: ${name}`, undefined, 'Forensic', 'cleanup');
                } catch (e) { }
            }
        }

        // 3. VACUUM para limpiar el archivo
        db.run('VACUUM;');

        // 4. Crear schema garantizado con UUIDs y orden estricto
        await this.createGuaranteedSchema();
    }

    private static async createGuaranteedSchema(): Promise<void> {
        if (!db) return;

        logger.info('Creando schema garantizado con arquitectura a prueba de fallos...', undefined, 'Forensic', 'schema');

        const creationOrder = [
            // FASE A: Metadatos y Versión
            `CREATE TABLE system_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // FASE B: Catálogos con UUIDs (Prevenir colisiones y facilitar migraciones)
            `CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        county TEXT NOT NULL,
        tax_id TEXT,
        email TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        unit_price REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // FASE C: Transacciones con DEFERRABLE constraints
            `CREATE TABLE invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        number TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('sale', 'purchase')),
        customer_uuid TEXT NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        total REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_uuid) REFERENCES customers(uuid) DEFERRABLE INITIALLY DEFERRED
      )`,

            `CREATE TABLE invoice_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_uuid TEXT NOT NULL,
        product_uuid TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        line_total REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (invoice_uuid) REFERENCES invoices(uuid) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
        FOREIGN KEY (product_uuid) REFERENCES products(uuid) DEFERRABLE INITIALLY DEFERRED
      )`,

            // ÍNDICES
            `CREATE INDEX idx_invoices_customer ON invoices(customer_uuid)`,
            `CREATE INDEX idx_lines_invoice ON invoice_lines(invoice_uuid)`
        ];

        db.run('BEGIN TRANSACTION;');
        try {
            for (const sql of creationOrder) {
                db.run(sql);
            }
            db.run('COMMIT;');
        } catch (e: any) {
            db.run('ROLLBACK;');
            throw new Error(`Failed to create guaranteed schema: ${e.message}`);
        }
    }

    private static async threeStepVerification(): Promise<void> {
        if (!db) return;

        // 1. Estructura
        const tablesCount = db.exec("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")[0].values[0][0] as number;
        if (tablesCount < 3) throw new Error('Verification failed: Missing tables');

        // 2. Relaciones (Reactivar y checkear)
        db.run('PRAGMA foreign_keys = ON;');
        const fkCheck = db.exec('PRAGMA foreign_key_check;');
        if (fkCheck.length > 0) throw new Error('Verification failed: Foreign key violations detected after rebuild');

        // 3. Coherencia
        const integrity = db.exec('PRAGMA integrity_check;');
        if (integrity[0].values[0][0] !== 'ok') throw new Error('Verification failed: Data integrity error');
    }

    private static async generateSystemChecksum(): Promise<string> {
        if (!db) return 'unknown';
        // Checksum simplificado basado en el esquema
        const res = db.exec("SELECT group_concat(name) FROM sqlite_master");
        return `v2_${res[0].values[0][0]}`;
    }
}
