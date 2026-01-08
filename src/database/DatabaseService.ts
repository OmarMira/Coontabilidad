// import { db } from './simple-db'; // Removed to avoid circular dependency
import { logger } from '../core/logging/SystemLogger';
import { CurrencyUtils } from '../lib/currency';
import { BasicEncryption } from '../core/security/BasicEncryption';

export class DatabaseService {

    private static dbInstance: any = null;

    static setDB(db: any) {
        this.dbInstance = db;
    }

    /**
     * Inicializa la capa forense del sistema (L1/L3).
     */
    static async initializeForensicLayer(skipTriggers: boolean = false): Promise<void> {
        if (!DatabaseService.dbInstance) {
            throw new Error('Database Engine not initialized. Call initDB() first.');
        }

        try {
            logger.info('DatabaseService', 'forensic_init', 'Iniciando verificación de núcleo forense...');

            // 1. Asegurar tablas forenses
            await this.ensureForensicTables();

            // 2. Migración de Esquema (Asegurar compatibilidad Prompt V3)
            await this.ensureSchemaCompatibility();

            // 3. Poblar Datos Fiscales (Florida 67 Counties)
            await this.populateFloridaTaxConfig();

            // 4. Instalar Triggers Anti-Tamper
            if (!skipTriggers) {
                await this.createForensicTriggers();
            }

            // 5. Inicializar Tablas Fiscales
            await this.ensureFiscalTables();

            // 6. Verificar Integridad de Datos (Corrección de Líneas)
            await this.ensureDataIntegrity();

            logger.info('DatabaseService', 'forensic_ready', 'Núcleo forense verificado y listo.');

        } catch (error) {
            logger.error('DatabaseService', 'init_failed', 'Fallo crítico al iniciar capa forense', null, error as Error);
            throw error;
        }
    }

    private static async ensureDataIntegrity() {
        try {
            const res = DatabaseService.dbInstance.exec(`
                SELECT id, total_debit, total_credit, description 
                FROM journal_entries 
                WHERE id NOT IN (SELECT DISTINCT journal_entry_id FROM journal_entry_lines)
            `);

            if (res.length > 0 && res[0].values.length > 0) {
                logger.warn('Forensic', 'integrity_fix', 'Detectadas inconsistencias en asientos. Reparando...');
                const entries = res[0].values;

                for (const row of entries) {
                    const id = row[0] as number;
                    const debit = row[1] as number;
                    const credit = row[2] as number;
                    const desc = row[3] as string;

                    // Crear líneas de corrección (Dummy)
                    DatabaseService.dbInstance.run(`INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) VALUES (?, '9999', ?, 0, ?)`, [id, debit, desc + ' (Auto-Fix)']);
                    DatabaseService.dbInstance.run(`INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) VALUES (?, '9999', 0, ?, ?)`, [id, credit, desc + ' (Auto-Fix)']);

                    // Nota: No actualizamos el hash aquí para no romper la cadena precipitadamente. 
                    // La Migración 008 se encargará de re-hash y reparación completa de la cadena.
                }
            }
        } catch (e) {
            logger.error('Forensic', 'integrity_check_failed', 'Error al verificar integridad', null, e as Error);
        }
    }

    private static async ensureForensicTables() {
        // 1. Tabla: AUDIT CHAIN
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS audit_chain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        previous_hash TEXT,
        current_hash TEXT NOT NULL UNIQUE,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        data_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        created_by INTEGER NOT NULL
      );
    `);

        // 1b. Tabla: JOURNAL ENTRY LINES
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journal_entry_id INTEGER NOT NULL,
        account_code TEXT NOT NULL,
        debit INTEGER NOT NULL,
        credit INTEGER NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
      );
    `);

        // 2. Tabla: FLORIDA TAX CONFIG
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS florida_tax_config (
        county_code TEXT PRIMARY KEY,
        county_name TEXT NOT NULL,
        base_rate INTEGER NOT NULL, 
        surtax_rate INTEGER DEFAULT 0,
        effective_date TEXT NOT NULL,
        expiry_date TEXT,
        is_active BOOLEAN DEFAULT 1
      );
    `);

        // 3. Tabla: TAX TRANSACTIONS
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS tax_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        county_code TEXT NOT NULL,
        taxable_amount INTEGER NOT NULL, 
        tax_amount INTEGER NOT NULL,
        effective_rate INTEGER NOT NULL,
        transaction_date TEXT NOT NULL,
        verification_hash TEXT
      );
    `);

        // 4. Assegurar Tablas Fiscales (Llamado interno)
        // await this.ensureFiscalTables(); // Movido a método separado para claridad
    }

    private static async ensureFiscalTables() {
        // 1. FIXED ASSETS
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id INTEGER PRIMARY KEY,
        asset_number TEXT UNIQUE NOT NULL,      -- 'FA-2026-001'
        description TEXT NOT NULL,
        acquisition_date TEXT NOT NULL,         -- ISO-8601
        acquisition_cost INTEGER NOT NULL,      -- En centavos
        depreciation_method TEXT NOT NULL,      -- 'MACRS-5', 'SL-7'
        useful_life_years INTEGER NOT NULL,
        federal_depreciation_schedule TEXT,     -- JSON con anual
        florida_depreciation_schedule TEXT,     -- JSON con ajuste 1/7
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

        // 2. ASSET DEPRECIATION
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS asset_depreciation (
        id INTEGER PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        fiscal_year INTEGER NOT NULL,
        federal_depreciation INTEGER NOT NULL,  -- En centavos
        florida_addback INTEGER NOT NULL,       -- 1/7 del federal
        net_florida_depreciation INTEGER NOT NULL, -- federal - addback
        journal_entry_id INTEGER,               -- Referencia a asiento
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (asset_id) REFERENCES fixed_assets(id),
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
      );
    `);
    }

    private static async ensureSchemaCompatibility() {
        // Verificar y Añadir columnas faltantes en journal_entries (según Prompt V3)
        try {
            // Necesitamos 'entry_number'
            DatabaseService.dbInstance.run("ALTER TABLE journal_entries ADD COLUMN entry_number TEXT");
        } catch (e: any) {
            if (!e.message.includes("duplicate column")) {
                // ignore
            }
        }

        try {
            // Necesitamos 'transaction_date'
            DatabaseService.dbInstance.run("ALTER TABLE journal_entries ADD COLUMN transaction_date TEXT");
        } catch (e: any) {
            if (!e.message.includes("duplicate column")) {
                // ignore
            }
        }
    }

    public static async createForensicTriggers(): Promise<void> {
        const triggers = [
            // Trigger 1: Inmutabilidad de journal_entries (UPDATE)
            `CREATE TRIGGER IF NOT EXISTS prevent_journal_update
       BEFORE UPDATE ON journal_entries
       BEGIN
         SELECT RAISE(ABORT, 'FORENSIC ALERT: Registros contables son inmutables. Use contra-asiento.'); 
       END;`,

            // Trigger 2: Inmutabilidad de journal_entries (DELETE)
            `CREATE TRIGGER IF NOT EXISTS prevent_journal_delete
       BEFORE DELETE ON journal_entries
       BEGIN
         SELECT RAISE(ABORT, 'FORENSIC ALERT: Registros contables son inmutables. Use contra-asiento.'); 
       END;`
        ];

        for (const trigger of triggers) {
            try {
                DatabaseService.dbInstance.run(trigger);
            } catch (e: any) {
                logger.error("DatabaseService", "trigger_error", "Error creating trigger", null, e);
            }
        }
        logger.info('DatabaseService', 'triggers_installed', 'Triggers de inmutabilidad instalados.');
    }

    private static async populateFloridaTaxConfig() {
        try {
            const countCheck = DatabaseService.dbInstance.exec("SELECT count(*) as c FROM florida_tax_config");
            const currentCount = countCheck[0].values[0][0];

            // Si ya tenemos los 67 condados, asumimos que está bien
            if (currentCount === 67) return;

            // Si tenemos menos (ej: 50 del paso anterior), limpiamos y repoblamos completo
            if (currentCount > 0) {
                logger.warn("DatabaseService", "repopulating_tax", `Detectados ${currentCount} condados. Actualizando a lista completa de 67.`);
                DatabaseService.dbInstance.run("DELETE FROM florida_tax_config");
            }
        } catch (e) {
            return;
        }

        // Lista OFICIAL 67 Condados Florida (Tasas 2025-2026)
        const counties = [
            ['ALACHUA', 'Alachua', 600, 150],
            ['BAKER', 'Baker', 600, 100],
            ['BAY', 'Bay', 600, 100],
            ['BRADFORD', 'Bradford', 600, 100],
            ['BREVARD', 'Brevard', 600, 100],
            ['BROWARD', 'Broward', 600, 100],
            ['CALHOUN', 'Calhoun', 600, 150],
            ['CHARLOTTE', 'Charlotte', 600, 100],
            ['CITRUS', 'Citrus', 600, 0],
            ['CLAY', 'Clay', 600, 150],
            ['COLLIER', 'Collier', 600, 0],
            ['COLUMBIA', 'Columbia', 600, 150],
            ['DESOTO', 'DeSoto', 600, 150],
            ['DIXIE', 'Dixie', 600, 100],
            ['DUVAL', 'Duval', 600, 150],
            ['ESCAMBIA', 'Escambia', 600, 150],
            ['FLAGLER', 'Flagler', 600, 100],
            ['FRANKLIN', 'Franklin', 600, 150],
            ['GADSDEN', 'Gadsden', 600, 150],
            ['GILCHRIST', 'Gilchrist', 600, 100],
            ['GLADES', 'Glades', 600, 100],
            ['GULF', 'Gulf', 600, 100],
            ['HAMILTON', 'Hamilton', 600, 200], // 2% total surtax
            ['HARDEE', 'Hardee', 600, 100],
            ['HENDRY', 'Hendry', 600, 150],
            ['HERNANDO', 'Hernando', 600, 150],
            ['HIGHLANDS', 'Highlands', 600, 100],
            ['HILLSBOROUGH', 'Hillsborough', 600, 150],
            ['HOLMES', 'Holmes', 600, 150],
            ['INDIAN-RIVER', 'Indian River', 600, 50],
            ['JACKSON', 'Jackson', 600, 150],
            ['JEFFERSON', 'Jefferson', 600, 100],
            ['LAFAYETTE', 'Lafayette', 600, 100],
            ['LAKE', 'Lake', 600, 100],
            ['LEE', 'Lee', 600, 50],
            ['LEON', 'Leon', 600, 150],
            ['LEVY', 'Levy', 600, 100],
            ['LIBERTY', 'Liberty', 600, 150],
            ['MADISON', 'Madison', 600, 150],
            ['MANATEE', 'Manatee', 600, 50],
            ['MARION', 'Marion', 600, 150],
            ['MARTIN', 'Martin', 600, 50],
            ['MIAMI-DADE', 'Miami-Dade', 600, 100],
            ['MONROE', 'Monroe', 600, 150],
            ['NASSAU', 'Nassau', 600, 100],
            ['OKALOOSA', 'Okaloosa', 600, 150],
            ['OKEECHOBEE', 'Okeechobee', 600, 100],
            ['ORANGE', 'Orange', 600, 50],
            ['OSCEOLA', 'Osceola', 600, 150],
            ['PALM-BEACH', 'Palm Beach', 600, 100],
            ['PASCO', 'Pasco', 600, 150],
            ['PINELLAS', 'Pinellas', 600, 100],
            ['POLK', 'Polk', 600, 150],
            ['PUTNAM', 'Putnam', 600, 150],
            ['ST-JOHNS', 'St. Johns', 600, 50],
            ['ST-LUCIE', 'St. Lucie', 600, 50],
            ['SANTA-ROSA', 'Santa Rosa', 600, 100],
            ['SARASOTA', 'Sarasota', 600, 100],
            ['SEMINOLE', 'Seminole', 600, 100],
            ['SUMTER', 'Sumter', 600, 100],
            ['SUWANNEE', 'Suwannee', 600, 150],
            ['TAYLOR', 'Taylor', 600, 150],
            ['UNION', 'Union', 600, 100],
            ['VOLUSIA', 'Volusia', 600, 50],
            ['WAKULLA', 'Wakulla', 600, 100],
            ['WALTON', 'Walton', 600, 150],
            ['WASHINGTON', 'Washington', 600, 150]
        ];

        const effectiveDate = new Date().toISOString();

        try {
            DatabaseService.dbInstance.run("BEGIN TRANSACTION");
            const stmt = DatabaseService.dbInstance.prepare("INSERT INTO florida_tax_config (county_code, county_name, base_rate, surtax_rate, effective_date) VALUES (?, ?, ?, ?, ?)");
            for (const c of counties) {
                stmt.run([c[0], c[1], c[2], c[3], effectiveDate]);
            }
            stmt.free();
            DatabaseService.dbInstance.run("COMMIT");
            logger.info('DatabaseService', 'tax_config_populated', `Se han poblado ${counties.length} condados de Florida.`);
        } catch (error) {
            DatabaseService.dbInstance.run("ROLLBACK");
            logger.error("DatabaseService", "populate_failed", "Error poblando condados", null, error as Error);
        }
    }

    /**
     * Ejecuta una consulta SQL de manera segura.
     */
    static async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        if (!DatabaseService.dbInstance) throw new Error('DB not initialized');

        try {
            const stmt = DatabaseService.dbInstance.prepare(sql);
            stmt.bind(params);
            const items: any[] = [];
            while (stmt.step()) {
                items.push(stmt.getAsObject());
            }
            stmt.free();
            return items;
        } catch (error) {
            logger.error('DatabaseService', 'query_error', `Error SQL: ${sql}`, null, error as Error);
            throw error;
        }
    }

    /**
     * Método Forense para insertar Asientos Contables.
     */
    static async insertJournalEntry(entry: {
        description: string;
        date: string; // ISO
        items: { account_code: string; debit: number; credit: number; description?: string }[];
        userId: number;
    }): Promise<string> {
        if (!DatabaseService.dbInstance) throw new Error('DB not initialized');

        // 1. Validación de Partida Doble
        const totalDebitV = entry.items.reduce((sum, item) => sum + item.debit, 0);
        const totalCreditV = entry.items.reduce((sum, item) => sum + item.credit, 0);

        if (Math.abs(totalDebitV - totalCreditV) > 0.01) {
            throw new Error(`Desbalance detectado: Débito ${totalDebitV} vs Crédito ${totalCreditV}`);
        }

        const totalDebitCents = CurrencyUtils.toCents(totalDebitV);
        const totalCreditCents = CurrencyUtils.toCents(totalCreditV);
        if (totalDebitCents !== totalCreditCents) {
            throw new Error(`Desbalance estricto (centavos): ${totalDebitCents} vs ${totalCreditCents}`);
        }

        // 3. Generar Identificadores
        const entryNumber = `JE-${Date.now()}`;
        const transactionDate = entry.date;

        // 4. Hashing 
        const dataToHash = JSON.stringify({
            entryNumber,
            description: entry.description,
            total: totalDebitCents,
            items: entry.items.map(i => ({
                account_code: i.account_code,
                debit: CurrencyUtils.toCents(i.debit),
                credit: CurrencyUtils.toCents(i.credit),
                description: i.description || entry.description
            }))
        });
        const dataHash = await BasicEncryption.hash(new TextEncoder().encode(dataToHash));

        // 5. Audit Chain Last Hash
        const lastHashResult = await this.executeQuery("SELECT current_hash FROM audit_chain ORDER BY id DESC LIMIT 1");
        const previousHash = lastHashResult.length > 0 ? lastHashResult[0].current_hash : 'GENESIS_BLOCK';

        // 6. Chain Hash
        const chainPayload = previousHash + dataHash + transactionDate;
        const currentHash = await BasicEncryption.hash(new TextEncoder().encode(chainPayload));

        // 7. TRANSACTION
        try {
            DatabaseService.dbInstance.run('BEGIN TRANSACTION');

            const legacyDebit = totalDebitV;
            const legacyCredit = totalCreditV;

            // Usamos el esquema híbrido (Legacy + Forensic Columns)
            DatabaseService.dbInstance.run(`INSERT INTO journal_entries 
              (entry_number, description, transaction_date, entry_date, reference, total_debit, total_credit, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [entryNumber, entry.description, transactionDate, transactionDate, entryNumber, legacyDebit, legacyCredit, entry.userId]);

            const jeIdResult = DatabaseService.dbInstance.exec("SELECT last_insert_rowid() as id");
            const jeId = jeIdResult[0].values[0][0];



            // Insert Lines (Task 6.1.1)
            const lineStmt = DatabaseService.dbInstance.prepare("INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) VALUES (?, ?, ?, ?, ?)");
            for (const item of entry.items) {
                lineStmt.run([
                    jeId,
                    item.account_code,
                    item.debit, // Store as Dollars (DECIMAL)
                    item.credit, // Store as Dollars (DECIMAL)
                    item.description || entry.description // Fallback to header description
                ]);
            }
            lineStmt.free();

            // Audit Chain
            DatabaseService.dbInstance.run(`INSERT INTO audit_chain(previous_hash, current_hash, table_name, record_id, operation, data_hash, created_by)
            VALUES(?, ?, ?, ?, ?, ?, ?)`,
                [previousHash, currentHash, 'journal_entries', jeId, 'INSERT', dataHash, entry.userId]);

            DatabaseService.dbInstance.run('COMMIT');
            logger.info('DatabaseService', 'entry_sealed', `Asiento ${entryNumber} sellado criptográficamente.`);

            return entryNumber;

        } catch (error) {
            DatabaseService.dbInstance.run('ROLLBACK');
            logger.error('DatabaseService', 'transaction_failed', 'Error al insertar asiento', null, error as Error);
            throw error;
        }
    }

    /**
     * Verifies the integrity of a journal entry by recalculating its hash.
     * Supports both Service Standard (v3) and Legacy Migration (v2) hash formats.
     */
    static async verifyJournalEntryIntegrity(entryId: number): Promise<boolean> {
        try {
            const jeList = await this.executeQuery("SELECT * FROM journal_entries WHERE id = ?", [entryId]);
            if (jeList.length === 0) return false;
            const je = jeList[0];

            // Ensure order matches insertion order (by ID)
            const lines = await this.executeQuery("SELECT * FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY id ASC", [entryId]);

            // Reconstruct Items Payload
            const itemsPayload = lines.map((line: any) => ({
                account_code: line.account_code,
                debit: CurrencyUtils.toCents(line.debit), // Convert DB Dollars to Cents
                credit: CurrencyUtils.toCents(line.credit), // Convert DB Dollars to Cents
                description: line.description
            }));

            let hashMatches = false;

            const auditList = await this.executeQuery("SELECT data_hash FROM audit_chain WHERE table_name = 'journal_entries' AND record_id = ?", [entryId]);
            if (auditList.length === 0) return false;
            const storedHash = auditList[0].data_hash;

            // Scenario A: Service Standard (New)
            if (je.entry_number) {
                const payloadService = JSON.stringify({
                    entryNumber: je.entry_number,
                    description: je.description,
                    total: CurrencyUtils.toCents(je.total_debit), // Convert DB Dollars to Cents

                    items: itemsPayload
                });
                const hashService = await BasicEncryption.hash(new TextEncoder().encode(payloadService));
                if (hashService === storedHash) {
                    hashMatches = true;
                } else {
                    console.error('Hash Mismatch (Standard):');
                    console.error('Expected (Stored):', storedHash);
                    console.error('Calculated:', hashService);
                    console.error('Payload:', payloadService);
                }
            }

            // Scenario B: Migration Standard (Fallback)
            if (!hashMatches) {
                const payloadMigration = JSON.stringify({
                    id: je.id,
                    total_debit: je.total_debit, // Legacy format often used raw value
                    total_credit: je.total_credit,
                    items: itemsPayload
                });
                const hashMigration = await BasicEncryption.hash(new TextEncoder().encode(payloadMigration));
                if (hashMigration === storedHash) hashMatches = true;
            }

            return hashMatches;
        } catch (e) {
            logger.error('DatabaseService', 'verify_error', 'Error verifying integrity', null, e as Error);
            return false;
        }
    }
}
