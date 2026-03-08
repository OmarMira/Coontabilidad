// import { db } from './simple-db'; // Removed to avoid circular dependency
import { logger } from '../core/logging/SystemLogger';
import { CurrencyUtils } from '../lib/currency';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { LogicClockService } from '../services/LogicClockService';
import { initializeDataIntegrity, runManualIntegrityCheck } from '../core/data-integrity';

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

            // 7. Inicializar Sistema de Integridad de Datos Completo
            try {
                initializeDataIntegrity();
                logger.info('DatabaseService', 'integrity_system_ready', 'Sistema de integridad de datos inicializado con monitoreo continuo');
            } catch (error) {
                logger.warn('DatabaseService', 'integrity_init_warn', 'Advertencia al inicializar sistema de integridad (no crítico)', null, error as Error);
            }

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
        logic_clock INTEGER NOT NULL DEFAULT 0,
        payload TEXT, -- Iron Clad NASA Phase 2 (Self-Healing)
        created_at TEXT DEFAULT (datetime('now')),
        created_by INTEGER NOT NULL
      );
    `);

        // Ensure logic_clock and payload exist if table was already created
        try {
            DatabaseService.dbInstance.run("ALTER TABLE audit_chain ADD COLUMN logic_clock INTEGER NOT NULL DEFAULT 0");
        } catch (e) { }
        try {
            DatabaseService.dbInstance.run("ALTER TABLE audit_chain ADD COLUMN payload TEXT");
        } catch (e) { }

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

        // 4. Tabla: SYNC OUTBOX (Iron Clad Upgrade)
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS sync_outbox (
        id TEXT PRIMARY KEY,           -- UUID
        module TEXT NOT NULL,          -- e.g., 'backups', 'invoices'
        operation TEXT NOT NULL,       -- e.g., 'UPLOAD', 'SYNC'
        payload TEXT NOT NULL,         -- JSON data
        status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

        // 5. Tabla: DRAFT TRANSACTIONS (Iron Clad Objective 4.1)
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS draft_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT NOT NULL,          -- 'accounting', 'inventory', 'payroll'
        operation TEXT NOT NULL,       -- 'CREATE_INVOICE', 'ADJUST_STOCKS'
        payload TEXT NOT NULL,         -- JSON payload of the proposed change
        ai_proposal_reason TEXT,       -- Why the AI is proposing this
        status TEXT DEFAULT 'draft',   -- 'draft', 'approved', 'rejected'
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

        // 6. Assegurar Tablas Fiscales (Llamado interno)
        // await this.ensureFiscalTables(); // Movido a método separado para claridad
    }

    private static async ensureFiscalTables() {
        // 1. FIXED ASSETS
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id INTEGER PRIMARY KEY,
        asset_number TEXT UNIQUE NOT NULL,      -- 'FA-2026-001'
        description TEXT NOT NULL,
        purchase_date TEXT NOT NULL,         -- ISO-8601
        purchase_cost INTEGER NOT NULL,      -- En centavos
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

        // 3. BANK IMPORT BATCHES
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_number TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_format TEXT NOT NULL,              -- 'CSV', 'OFX', 'QFX'
        bank_account_id INTEGER,
        total_transactions INTEGER NOT NULL,
        imported_count INTEGER DEFAULT 0,
        duplicate_count INTEGER DEFAULT 0,
        status TEXT NOT NULL,                   -- 'pending', 'completed', 'rolled_back'
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        imported_at TEXT,
        rolled_back_at TEXT
      );
    `);

        // 4. IMPORT TRANSACTIONS TEMP
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS import_transactions_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        transaction_date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        balance REAL,
        suggested_category TEXT,
        confidence_score REAL,
        is_duplicate BOOLEAN DEFAULT 0,
        duplicate_confidence REAL,
        matched_invoice_id INTEGER,
        matched_bill_id INTEGER,
        match_confidence REAL,
        excluded BOOLEAN DEFAULT 0,
        user_category TEXT,
        user_description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (batch_id) REFERENCES import_batches(id)
      );
    `);

        // 5. ML TRAINING DATA
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS ml_training_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL,
        transaction_type TEXT,                  -- 'debit', 'credit'
        source TEXT NOT NULL,                   -- 'historical', 'user_correction'
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

        // 6. ML METRICS
        DatabaseService.dbInstance.run(`
      CREATE TABLE IF NOT EXISTS ml_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_date TEXT NOT NULL,
        total_predictions INTEGER NOT NULL,
        correct_predictions INTEGER NOT NULL,
        accuracy REAL NOT NULL,
        precision_score REAL,
        recall_score REAL,
        training_examples INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

        // Create indices for performance
        DatabaseService.dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_import_batch_status ON import_batches(status);`);
        DatabaseService.dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_import_temp_batch ON import_transactions_temp(batch_id);`);
        DatabaseService.dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_ml_training_category ON ml_training_data(category);`);
        DatabaseService.dbInstance.run(`CREATE INDEX IF NOT EXISTS idx_tax_trans_date ON tax_transactions(transaction_date);`);
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
       END;`,

            // Trigger 3: Bloqueo de periodos cerrados
            `CREATE TRIGGER IF NOT EXISTS prevent_closed_period_insert
       BEFORE INSERT ON journal_entries
       FOR EACH ROW
       WHEN (EXISTS (
           SELECT 1 FROM accounting_periods p 
           JOIN fiscal_years f ON p.fiscal_year_id = f.id
           WHERE date(NEW.transaction_date) BETWEEN date(p.start_date) AND date(p.end_date)
           AND (p.status IN ('closed', 'locked') OR f.status IN ('closed', 'locked'))
       ))
       BEGIN
           SELECT RAISE(ABORT, 'ACCOUNTING ALERT: El periodo contable está cerrado o bloqueado.');
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
        // REMOVED: florida_tax_config table creation moved to initializeSchema() in simple-db.ts
        // The table is now called florida_tax_rates and is populated there
        logger.info('DatabaseService', 'tax_config_skipped', 'Florida tax rates are managed by initializeSchema()');
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



            // Insert Lines (Task 6.1.1 — Corrected to journal_details)
            const lineStmt = DatabaseService.dbInstance.prepare("INSERT INTO journal_details (journal_entry_id, account_code, debit_amount, credit_amount, description) VALUES (?, ?, ?, ?, ?)");
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
            const logicClock = await LogicClockService.getNextClock();
            DatabaseService.dbInstance.run(`INSERT INTO audit_chain(previous_hash, current_hash, table_name, record_id, operation, data_hash, created_by, logic_clock)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
                [previousHash, currentHash, 'journal_entries', jeId, 'INSERT', dataHash, entry.userId, logicClock]);

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

    /**
     * Universal Forensic Sealing (NASA Level Objective 1)
     * Seals any database record into the audit chain.
     */
    static async sealGenericRecord(data: {
        tableName: string;
        recordId: number;
        operation: 'INSERT' | 'UPDATE' | 'DELETE';
        payload: any;
        userId: number;
    }): Promise<string> {
        if (!DatabaseService.dbInstance) throw new Error('DB not initialized');

        const dataToHash = JSON.stringify(data.payload);
        const dataHash = await BasicEncryption.hash(new TextEncoder().encode(dataToHash));

        // Get Previous Hash
        const lastHashResult = await this.executeQuery("SELECT current_hash FROM audit_chain ORDER BY id DESC LIMIT 1");
        const previousHash = lastHashResult.length > 0 ? lastHashResult[0].current_hash : 'GENESIS_BLOCK';

        // Chain Hash
        const logicClock = await LogicClockService.getNextClock();
        const chainPayload = previousHash + dataHash + data.tableName + data.recordId + logicClock;
        const currentHash = await BasicEncryption.hash(new TextEncoder().encode(chainPayload));

        await DatabaseService.dbInstance.run(`
            INSERT INTO audit_chain (previous_hash, current_hash, table_name, record_id, operation, data_hash, created_by, logic_clock, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [previousHash, currentHash, data.tableName, data.recordId, data.operation, dataHash, data.userId, logicClock, dataToHash]);

        logger.info('Forensic', 'record_sealed', `Record ${data.recordId} in ${data.tableName} sealed into NASA-level Audit Chain.`);
        return currentHash;
    }

    /**
     * Creates a backup snapshot of the entire database (Iron Clad Upgrade - Phase 1)
     * Exports, compresses, and encrypts the database for safe storage.
     * 
     * @returns Promise<Blob> - Encrypted and compressed database snapshot
     */
    static async createBackupSnapshot(): Promise<Blob> {
        if (!DatabaseService.dbInstance) throw new Error('DB not initialized');

        try {
            logger.info('DatabaseService', 'backup_start', 'Creating database snapshot...');

            // 1. Export database to ArrayBuffer
            const dbData = DatabaseService.dbInstance.export();
            logger.info('DatabaseService', 'backup_export', `Database exported (${dbData.byteLength} bytes)`);

            // 2. Compress with GZIP
            const compressed = await this.compressData(dbData);
            logger.info('DatabaseService', 'backup_compress', `Compressed to ${compressed.byteLength} bytes`);

            // 3. Encrypt with AES-256-GCM
            const encryptedPackage = await BasicEncryption.encryptCombined(compressed);
            logger.info('DatabaseService', 'backup_encrypt', `Encrypted (${encryptedPackage.byteLength} bytes)`);

            // 4. Create Blob from encrypted package
            // @ts-ignore ArrayBufferLike can be SharedArrayBuffer, acceptable for encryption blob
            const blob = new Blob([encryptedPackage.buffer.slice(encryptedPackage.byteOffset, encryptedPackage.byteOffset + encryptedPackage.byteLength)], { type: 'application/octet-stream' });

            logger.info('DatabaseService', 'backup_success', `Backup snapshot created (${blob.size} bytes)`);
            return blob;

        } catch (error) {
            logger.error('DatabaseService', 'backup_failed', 'Failed to create backup snapshot', null, error as Error);
            throw error;
        }
    }

    /**
     * Compresses data using GZIP.
     * 
     * @param data - Data to compress
     * @returns Promise<Uint8Array> - Compressed data
     */
    private static async compressData(data: Uint8Array): Promise<Uint8Array> {
        const pako = await import('pako');
        return pako.gzip(data);
    }

    /**
     * Schedules automatic backups every 6 hours.
     * Backups are queued in sync_outbox for asynchronous processing.
     * 
     * @returns Promise<void>
     */
    static async scheduleAutoBackup(): Promise<void> {
        logger.info('DatabaseService', 'auto_backup_init', 'Initializing automatic backup scheduler...');

        // Check if cloud backup is configured
        const cloudConfig = localStorage.getItem('cloud_backup_config');
        if (!cloudConfig) {
            logger.warn('DatabaseService', 'auto_backup_skip', 'Cloud backup not configured, skipping auto-backup');
            return;
        }

        // Schedule backup every 6 hours
        setInterval(async () => {
            try {
                logger.info('DatabaseService', 'auto_backup_trigger', 'Automatic backup triggered');

                // Create snapshot
                const snapshot = await this.createBackupSnapshot();
                const arrayBuffer = await snapshot.arrayBuffer();

                // Generate filename with timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `backup_${timestamp}.aex`;

                // Convert ArrayBuffer to Base64 for JSON storage
                const base64Data = this.arrayBufferToBase64(arrayBuffer);

                // Insert into sync_outbox for background processing
                await this.executeQuery(`
                    INSERT INTO sync_outbox (id, module, operation, payload, status, created_at, updated_at)
                    VALUES (?, 'backups', 'UPLOAD', ?, 'pending', datetime('now'), datetime('now'))
                `, [
                    this.generateUUID(),
                    JSON.stringify({
                        filename,
                        data: base64Data,
                        size: arrayBuffer.byteLength,
                        timestamp
                    })
                ]);

                logger.info('DatabaseService', 'auto_backup_queued', `Backup ${filename} queued for upload`);

            } catch (error) {
                logger.error('DatabaseService', 'auto_backup_error', 'Auto-backup failed', null, error as Error);
            }
        }, 6 * 60 * 60 * 1000); // Every 6 hours

        logger.info('DatabaseService', 'auto_backup_scheduled', 'Automatic backups scheduled (every 6 hours)');
    }

    /**
     * Converts ArrayBuffer to Base64 string.
     * 
     * @param buffer - ArrayBuffer to convert
     * @returns string - Base64 encoded string
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Generates a UUID v4.
     * 
     * @returns string - UUID
     */
    private static generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
