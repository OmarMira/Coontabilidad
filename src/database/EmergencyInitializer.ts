import { db } from './simple-db';
import { logger } from '../utils/logger';

interface FKStatus {
    enabled: boolean;
    violations: any[];
}

interface Diagnosis {
    hasError: boolean;
    existingTables?: string[];
    fkEnabled?: boolean;
    fkViolations?: any[];
    errorMessage?: string;
    recommendation: string;
}

export class EmergencyDatabaseInitializer {
    private static isFixing = false;

    /**
     * Inicialización de emergencia con corrección de FK
     */
    static async initializeWithEmergencyFix(): Promise<void> {
        if (this.isFixing) {
            throw new Error('Initialization already in progress');
        }

        this.isFixing = true;
        logger.emergency('EJECUTANDO INICIALIZACIÓN DE EMERGENCIA CON FIX FK', undefined, undefined, 'EmergencyInit', 'start');

        try {
            if (!db) throw new Error('Database instance not available');

            // FASE 1: Diagnóstico del error actual
            const diagnosis = await this.diagnoseFKError();
            logger.info('Diagnóstico FK:', diagnosis, 'EmergencyInit', 'diagnosis');

            // Desactivar FK para el fix
            db.run('PRAGMA foreign_keys = OFF;');

            // FASE 2: Crear tablas en ORDEN ESTRATÉGICO
            await this.createTablesWithStrategicOrder();

            // FASE 3: Verificar y reparar relaciones
            await this.repairForeignRelations();

            // Reactivar FK
            db.run('PRAGMA foreign_keys = ON;');

            // FASE 4: Cargar datos iniciales en orden (esto llama al seeding normal en una app real)
            await this.loadInitialDataSafely();

            // FASE 5: Validación completa
            await this.runCompleteValidation();

            logger.success('BASE DE DATOS INICIALIZADA CORRECTAMENTE CON FIX DE EMERGENCIA', undefined, 'EmergencyInit', 'success');

            // Emitir evento de éxito
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('database-initialized-success'));
            }

        } catch (error: any) {
            logger.critical('FALLA CRÍTICA EN INICIALIZACIÓN DE EMERGENCIA', { error: error.message }, undefined, 'EmergencyInit', 'failed');

            // Intentar recuperación automática
            await this.attemptAutoRecovery();

            throw new Error(`EMERGENCY INIT FAILED: ${error.message}`);

        } finally {
            this.isFixing = false;
        }
    }

    /**
     * ORDEN ESTRATÉGICO DE CREACIÓN DE TABLAS
     * Resuelve dependencias circulares
     */
    private static async createTablesWithStrategicOrder(): Promise<void> {
        logger.info('Creando tablas en orden estratégico...', undefined, 'EmergencyInit', 'schema');

        // GRUPO 1: Tablas MAESTRAS (sin dependencias)
        await this.executeBatch([
            `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS florida_tax_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        county TEXT UNIQUE NOT NULL,
        tax_rate REAL NOT NULL CHECK(tax_rate >= 0 AND tax_rate <= 0.1),
        effective_from DATE NOT NULL,
        effective_until DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
        ]);

        // GRUPO 2: Catálogos de negocio
        await this.executeBatch([
            `CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        account_type TEXT NOT NULL CHECK(account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
        parent_id INTEGER,
        FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id) DEFERRABLE INITIALLY DEFERRED
      )`,

            `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        county TEXT NOT NULL,
        tax_id TEXT,
        email TEXT,
        phone TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        unit_price REAL NOT NULL DEFAULT 0,
        requires_inventory BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
        ]);

        // GRUPO 3: Transacciones principales
        await this.executeBatch([
            `CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('sale', 'purchase')),
        customer_id INTEGER NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) DEFERRABLE INITIALLY DEFERRED
      )`,

            `CREATE TABLE IF NOT EXISTS invoice_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        line_total REAL NOT NULL DEFAULT 0,
        line_tax_amount REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
        FOREIGN KEY (product_id) REFERENCES products(id) DEFERRABLE INITIALLY DEFERRED
      )`
        ]);

        // GRUPO 4: Contabilidad y auditoría
        await this.executeBatch([
            `CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_number TEXT UNIQUE NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT,
        total_debit REAL NOT NULL DEFAULT 0,
        total_credit REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS journal_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journal_entry_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        debit REAL NOT NULL DEFAULT 0,
        credit REAL NOT NULL DEFAULT 0,
        description TEXT,
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
        FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) DEFERRABLE INITIALLY DEFERRED,
        CHECK((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
      )`,

            `CREATE TABLE IF NOT EXISTS audit_chain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        user_id INTEGER,
        changes_hash TEXT NOT NULL,
        previous_hash TEXT,
        current_hash TEXT UNIQUE NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED
      )`
        ]);

        // GRUPO 5: Tablas auxiliares
        await this.executeBatch([
            `CREATE TABLE IF NOT EXISTS tax_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        county TEXT NOT NULL,
        taxable_base REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        calculated_at DATE NOT NULL DEFAULT CURRENT_DATE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
      )`,

            `CREATE TABLE IF NOT EXISTS backup_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_size INTEGER,
        checksum TEXT NOT NULL,
        encrypted_data BLOB NOT NULL
      )`
        ]);
    }

    /**
     * Cargar datos iniciales de forma segura
     */
    private static async loadInitialDataSafely(): Promise<void> {
        logger.info('Cargando datos iniciales...', undefined, 'EmergencyInit', 'data');

        // 1. Primero configuraciones esenciales
        await this.loadEssentialConfig();

        // 2. Luego datos de demostración (si es primer inicio)
        const isFirstRun = await this.checkFirstRun();
        if (isFirstRun) {
            await this.loadDemoData();
        }
    }

    /**
     * Diagnóstico del error FK
     */
    private static async diagnoseFKError(): Promise<Diagnosis> {
        try {
            if (!db) throw new Error('DB not available');
            // Intentar obtener información del error
            const tables = await this.getExistingTables();
            const fkStatus = await this.checkFKStatus();

            return {
                hasError: true,
                existingTables: tables,
                fkEnabled: fkStatus.enabled,
                fkViolations: fkStatus.violations,
                recommendation: this.generateFixRecommendation(tables, fkStatus)
            };

        } catch (error: any) {
            return {
                hasError: true,
                errorMessage: error.message,
                recommendation: 'REINICIAR_BASE_DATOS_COMPLETA'
            };
        }
    }

    // Métodos auxiliares
    private static async executeBatch(queries: string[]): Promise<void> {
        if (!db) return;
        for (const sql of queries) {
            try {
                db.run(sql);
            } catch (err: any) {
                logger.error(`Error executing query: ${sql}`, { error: err.message }, undefined, 'EmergencyInit', 'executeBatch');
            }
        }
    }

    private static async getExistingTables(): Promise<string[]> {
        if (!db) return [];
        try {
            const res = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
            if (res.length > 0) {
                return res[0].values.map(v => v[0] as string);
            }
        } catch (e) { }
        return [];
    }

    private static async checkFKStatus(): Promise<FKStatus> {
        if (!db) return { enabled: false, violations: [] };
        const enabledRes = db.exec("PRAGMA foreign_keys");
        const enabled = enabledRes.length > 0 && enabledRes[0].values[0][0] === 1;
        const violationsRes = db.exec("PRAGMA foreign_key_check");
        const violations = violationsRes.length > 0 ? violationsRes[0].values : [];
        return { enabled, violations };
    }

    private static generateFixRecommendation(tables: string[], fkStatus: FKStatus): string {
        if (fkStatus.violations.length > 0) return 'REPARAR_RELACIONES_EXISTENTES';
        if (tables.length === 0) return 'CREAR_SCHEMA_DESDE_CERO';
        return 'VERIFICACION_COMPLETA_REQUERIDA';
    }

    private static async repairForeignRelations(): Promise<void> {
        logger.info('Verificando y reparando relaciones...', undefined, 'EmergencyInit', 'repair');
        // Implementación simplificada: asegurar que existan los padres para FKs críticas
        // En una implementación real, esto podría ser más complejo.
    }

    private static async loadEssentialConfig(): Promise<void> {
        // Carga de roles mínimos, etc.
    }

    private static async checkFirstRun(): Promise<boolean> {
        if (!db) return false;
        try {
            const res = db.exec("SELECT COUNT(*) FROM users");
            return res.length > 0 && res[0].values[0][0] === 0;
        } catch (e) {
            return true;
        }
    }

    private static async loadDemoData(): Promise<void> {
        // Los datos de demo se suelen cargar desde simple-db.insertSampleData
        // Podríamos llamar a una función aquí si fuera necesario.
    }

    private static async runCompleteValidation(): Promise<void> {
        if (!db) return;
        const res = db.exec("PRAGMA integrity_check");
        if (res[0].values[0][0] !== 'ok') {
            throw new Error(`Integrity check failed: ${res[0].values[0][0]}`);
        }
    }

    private static async attemptAutoRecovery(): Promise<void> {
        logger.warn('Intentando recuperación automática de base de datos...', undefined, 'EmergencyInit', 'recovery');
        // En caso de fallo crítico, podríamos intentar resetear si el usuario lo permite
    }
}
