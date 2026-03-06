import { logger } from '../core/logging/SystemLogger';
import { SQLiteEngine } from '../core/database/SQLiteEngine';

export class SchemaRepairService {
    private db: SQLiteEngine;

    constructor(db: SQLiteEngine) {
        this.db = db;
    }

    private async hashPassword(password: string): Promise<string> {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const keyMaterial = await crypto.subtle.importKey(
                'raw', data, 'PBKDF2', false, ['deriveBits']
            );
            const hashBuffer = await crypto.subtle.deriveBits(
                // CRITICAL: Must match simple-db.ts hashPassword (600k iterations)
                { name: 'PBKDF2', salt: salt, iterations: 600000, hash: 'SHA-256' },
                keyMaterial, 256
            );
            const hashArray = new Uint8Array(hashBuffer);
            const combined = new Uint8Array(salt.length + hashArray.length);
            combined.set(salt);
            combined.set(hashArray, salt.length);
            return btoa(String.fromCharCode(...combined));
        } catch (e) {
            console.error("Hashing failed", e);
            return "";
        }
    }

    public async repairSchema(): Promise<string[]> {
        const logs: string[] = [];
        logger.info('SchemaRepair', 'start', 'Iniciando reparación de esquema...');

        try {
            // 1. REPARAR COMPANY_DATA
            const companyCols = await this.getTableColumns('company_data');

            if (companyCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS company_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        company_name TEXT NOT NULL,
                        legal_name TEXT NOT NULL,
                        tax_id TEXT NOT NULL,
                        address TEXT NOT NULL,
                        city TEXT NOT NULL,
                        state TEXT NOT NULL DEFAULT 'FL',
                        zip_code TEXT NOT NULL,
                        phone TEXT NOT NULL,
                        email TEXT NOT NULL,
                        website TEXT,
                        logo_path TEXT,
                        fiscal_year_start TEXT DEFAULT '01-01',
                        currency TEXT DEFAULT 'USD',
                        language TEXT DEFAULT 'es',
                        timezone TEXT DEFAULT 'America/New_York',
                        date_format TEXT DEFAULT 'MM/DD/YYYY',
                        sales_commission_percentage REAL DEFAULT 0,
                        shipping_rate REAL DEFAULT 0,
                        late_fee_percentage REAL DEFAULT 0,
                        grace_period_days INTEGER DEFAULT 0,
                        tax_frequency TEXT DEFAULT 'monthly',
                        sales_tax_method TEXT DEFAULT 'accrual',
                        dr15_filing_day INTEGER DEFAULT 20,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

                    )
                `);
                logs.push("✅ Tabla company_data creada");
            } else {
                // Ensure columns exist
                const requiredColumns = [
                    { name: 'sales_commission_percentage', type: 'REAL', default: "0" },
                    { name: 'shipping_rate', type: 'REAL', default: "0" },
                    { name: 'late_fee_percentage', type: 'REAL', default: "0" },
                    { name: 'grace_period_days', type: 'INTEGER', default: "0" },
                    { name: 'fiscal_year_start', type: 'TEXT', default: "'01-01'" },
                    { name: 'fiscal_year_end', type: 'TEXT', default: "'12-31'" },
                    { name: 'tax_frequency', type: 'TEXT', default: "'monthly'" },
                    { name: 'sales_tax_method', type: 'TEXT', default: "'accrual'" },
                    { name: 'dr15_filing_day', type: 'INTEGER', default: "20" },
                    { name: 'netIncreaseInCash', type: 'REAL', default: "0" },
                    { name: 'is_active', type: 'BOOLEAN', default: "1" }

                ];
                for (const col of requiredColumns) {
                    if (!companyCols.includes(col.name)) {
                        try {
                            await this.db.run(`ALTER TABLE company_data ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`);
                            logs.push(`✅ Agregada columna ${col.name} a company_data`);
                        } catch (e) {
                            logs.push(`⚠️ Error agregando columna ${col.name}: ${(e as Error).message}`);
                        }
                    }
                }
            }

            // ASEGURAR QUE EXISTE AL MENOS UN REGISTRO (Failsafe Identity)
            const companyCountRes = await this.db.select("SELECT COUNT(*) as c FROM company_data");
            const companyCount = companyCountRes[0]?.c || 0;

            if (companyCount === 0) {
                await this.db.run(`
                    INSERT INTO company_data (
                        company_name, legal_name, tax_id, address, city, state, zip_code, phone, email, is_active
                    ) VALUES (
                        'Account Express Demo Inc.', 'Account Express Demo Inc.', 'US-DEMO-123', 
                        '100 Biscayne Blvd', 'Miami', 'FL', '33132', '(305) 555-0000', 'admin@accountexpress.com', 1
                    )
                `);
                logs.push("✅ Datos de empresa por defecto restaurados");
            }

            logs.push("✅ Tabla company_data lista");


            // 2. VERIFICAR INTEGRIDAD DE VISTAS
            await this.syncViews(logs);

            // 2.5. REPARAR TABLA CUSTOMERS
            const customerCols = await this.getTableColumns('customers');
            if (customerCols.length > 0 && !customerCols.includes('assigned_salesperson')) {
                try {
                    await this.db.run(`ALTER TABLE customers ADD COLUMN assigned_salesperson TEXT`);
                    logs.push("✅ Agregada columna assigned_salesperson a customers");
                } catch (e) {
                    logs.push(`⚠️ Error agregando columna assigned_salesperson: ${(e as Error).message}`);
                }
            }

            // 4. FIX ADMIN PASSWORD & USERS
            const userCols = await this.getTableColumns('users');
            if (userCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS user_roles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        description TEXT,
                        level INTEGER DEFAULT 1,
                        permissions_json TEXT DEFAULT '{}',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT NOT NULL UNIQUE,
                        email TEXT UNIQUE,
                        password_hash TEXT NOT NULL,
                        full_name TEXT,
                        display_name TEXT NOT NULL,
                        role_id INTEGER,
                        is_active BOOLEAN DEFAULT 1,
                        last_login DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        picture TEXT,
                        FOREIGN KEY (role_id) REFERENCES user_roles(id)
                    )
                `);

                // Seed Roles
                await this.db.run(`
                    INSERT INTO user_roles (name, description, level, permissions_json) VALUES 
                    ('admin', 'Administrador del sistema', 10, '{"all": true}'),
                    ('accountant', 'Contador', 5, '{"accounting": true, "view_all": true}'),
                    ('user', 'Usuario estándar', 1, '{"view_own": true}'),
                    ('viewer', 'Solo lectura', 0, '{"read_only": true}')
                `);
            }

            // NOTA: La creación del usuario admin se ha movido al flujo FirstTimeSetup.
            // No recreamos usuarios aquí para permitir que el sistema inicie en estado "vacio".


            // 4.5 ADD PICTURE COLUMN IF MISSING
            if (userCols.length > 0 && !userCols.includes('picture')) {
                try {
                    await this.db.run("ALTER TABLE users ADD COLUMN picture TEXT");
                    logs.push("✅ Columna 'picture' agregada a tabla users");
                } catch (e) {
                    logs.push(`⚠️ Error agregando columna picture: ${(e as Error).message}`);
                }
            }

            // 5. ENSURE PAYMENT METHODS
            const pmCols = await this.getTableColumns('payment_methods');
            if (pmCols.length === 0) {
                await this.db.run(`
                  CREATE TABLE IF NOT EXISTS payment_methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method_name TEXT NOT NULL,
                    method_type TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    requires_reference BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                 `);
                await this.db.run(`
                  INSERT INTO payment_methods (method_name, method_type, is_active, requires_reference) VALUES 
                  ('Efectivo', 'cash', 1, 0),
                  ('Transferencia Bancaria', 'bank_transfer', 1, 1),
                  ('Cheque', 'check', 1, 1),
                  ('Tarjeta de Crédito', 'credit_card', 1, 1),
                  ('Zelle', 'digital', 1, 1)
                 `);
                logs.push("✅ Métodos de pago restaurados");
            }

            // 6. REPARAR TABLAS DE ACTIVOS FIJOS
            const assetCatCols = await this.getTableColumns('asset_categories');
            if (assetCatCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS asset_categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        default_useful_life_years INTEGER,
                        default_depreciation_rate REAL,
                        account_code TEXT,
                        depreciation_expense_account TEXT,
                        accumulated_depreciation_account TEXT,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                logs.push("✅ Tabla asset_categories creada");
            }

            const assetCols = await this.getTableColumns('fixed_assets');
            if (assetCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS fixed_assets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        asset_code TEXT NOT NULL UNIQUE,
                        name TEXT NOT NULL,
                        description TEXT,
                        category_id INTEGER,
                        purchase_date TEXT NOT NULL,
                        purchase_cost REAL NOT NULL,
                        useful_life_years INTEGER,
                        useful_life_months INTEGER,
                        depreciation_method TEXT DEFAULT 'straight_line',
                        salvage_value REAL DEFAULT 0,
                        current_value REAL,
                        accumulated_depreciation REAL DEFAULT 0,
                        status TEXT DEFAULT 'active',
                        location TEXT,
                        serial_number TEXT,
                        manufacturer TEXT,
                        model TEXT,
                        purchase_order TEXT,
                        supplier_id INTEGER,
                        warranty_expiration TEXT,
                        notes TEXT,
                        disposal_date TEXT,
                        disposal_value REAL,
                        disposal_reason TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        created_by INTEGER,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (category_id) REFERENCES asset_categories(id)
                    )
                `);
                logs.push("✅ Tabla fixed_assets creada");
            }

            const depCols = await this.getTableColumns('asset_depreciation');
            if (depCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS asset_depreciation (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        asset_id INTEGER NOT NULL,
                        period_date TEXT NOT NULL,
                        depreciation_amount REAL NOT NULL,
                        accumulated_depreciation REAL NOT NULL,
                        net_book_value REAL NOT NULL,
                        journal_entry_id INTEGER,
                        is_posted BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (asset_id) REFERENCES fixed_assets(id)
                    )
                `);
                logs.push("✅ Tabla asset_depreciation creada");
            }

            // 7. REPARAR TABLAS FISCALES (FLORIDA)
            const countyCols = await this.getTableColumns('florida_tax_rates');
            if (countyCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS florida_tax_rates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        county_name TEXT NOT NULL UNIQUE,
                        county_code TEXT NOT NULL UNIQUE,
                        base_rate REAL DEFAULT 600,
                        surtax_rate REAL DEFAULT 0,
                        total_rate REAL DEFAULT 600,
                        effective_date TEXT DEFAULT '2026-01-01',
                        is_active BOOLEAN DEFAULT 1,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                logs.push("✅ Tabla florida_tax_rates creada");
            } else {
                const required = [
                    { name: 'county_code', type: 'TEXT' },
                    { name: 'base_rate', type: 'REAL', default: '600' },
                    { name: 'surtax_rate', type: 'REAL', default: '0' },
                    { name: 'effective_date', type: 'TEXT', default: "'2026-01-01'" }
                ];
                for (const col of required) {
                    if (!countyCols.includes(col.name)) {
                        try {
                            const def = col.default ? ` DEFAULT ${col.default}` : "";
                            await this.db.run(`ALTER TABLE florida_tax_rates ADD COLUMN ${col.name} ${col.type}${def}`);
                            logs.push(`✅ Agregada columna ${col.name} a florida_tax_rates`);
                        } catch (e) {
                            logs.push(`⚠️ Error agregando columna ${col.name}: ${(e as Error).message}`);
                        }
                    }
                }
            }

            // SEEDING COMPLETO (67 CONDADOS) - FORZAR SIEMPRE
            let countyCount = 0;
            try {
                const countRes = await this.db.select("SELECT COUNT(*) as c FROM florida_tax_rates");
                countyCount = countRes[0]?.c || 0;
                logs.push(`📊 Condados actuales: ${countyCount}/67`);
            } catch (e) {
                logger.error('SchemaRepair', 'count_failed', 'Error contando condados', { error: e });
            }

            // SIEMPRE insertar/actualizar los 67 condados
            if (true) {
                const counties = [
                    { name: "Alachua", code: "ALACHUA", surtax: 150 },
                    { name: "Baker", code: "BAKER", surtax: 100 },
                    { name: "Bay", code: "BAY", surtax: 100 },
                    { name: "Bradford", code: "BRADFORD", surtax: 100 },
                    { name: "Brevard", code: "BREVARD", surtax: 100 },
                    { name: "Broward", code: "BROWARD", surtax: 100 },
                    { name: "Calhoun", code: "CALHOUN", surtax: 150 },
                    { name: "Charlotte", code: "CHARLOTTE", surtax: 100 },
                    { name: "Citrus", code: "CITRUS", surtax: 100 },
                    { name: "Clay", code: "CLAY", surtax: 150 },
                    { name: "Collier", code: "COLLIER", surtax: 100 },
                    { name: "Columbia", code: "COLUMBIA", surtax: 100 },
                    { name: "DeSoto", code: "DESOTO", surtax: 150 },
                    { name: "Dixie", code: "DIXIE", surtax: 100 },
                    { name: "Duval", code: "DUVAL", surtax: 150 },
                    { name: "Escambia", code: "ESCAMBIA", surtax: 150 },
                    { name: "Flagler", code: "FLAGLER", surtax: 100 },
                    { name: "Franklin", code: "FRANKLIN", surtax: 100 },
                    { name: "Gadsden", code: "GADSDEN", surtax: 150 },
                    { name: "Gilchrist", code: "GILCHRIST", surtax: 100 },
                    { name: "Glades", code: "GLADES", surtax: 100 },
                    { name: "Gulf", code: "GULF", surtax: 100 },
                    { name: "Hamilton", code: "HAMILTON", surtax: 100 },
                    { name: "Hardee", code: "HARDEE", surtax: 100 },
                    { name: "Hendry", code: "HENDRY", surtax: 100 },
                    { name: "Hernando", code: "HERNANDO", surtax: 50 },
                    { name: "Highlands", code: "HIGHLANDS", surtax: 150 },
                    { name: "Hillsborough", code: "HILLSBOROUGH", surtax: 150 },
                    { name: "Holmes", code: "HOLMES", surtax: 100 },
                    { name: "Indian River", code: "INDIAN-RIVER", surtax: 100 },
                    { name: "Jackson", code: "JACKSON", surtax: 150 },
                    { name: "Jefferson", code: "JEFFERSON", surtax: 100 },
                    { name: "Lafayette", code: "LAFAYETTE", surtax: 100 },
                    { name: "Lake", code: "LAKE", surtax: 100 },
                    { name: "Lee", code: "LEE", surtax: 50 },
                    { name: "Leon", code: "LEON", surtax: 150 },
                    { name: "Levy", code: "LEVY", surtax: 100 },
                    { name: "Liberty", code: "LIBERTY", surtax: 150 },
                    { name: "Madison", code: "MADISON", surtax: 150 },
                    { name: "Manatee", code: "MANATEE", surtax: 100 },
                    { name: "Marion", code: "MARION", surtax: 100 },
                    { name: "Martin", code: "MARTIN", surtax: 50 },
                    { name: "Miami-Dade", code: "MIAMI-DADE", surtax: 100 },
                    { name: "Monroe", code: "MONROE", surtax: 150 },
                    { name: "Nassau", code: "NASSAU", surtax: 100 },
                    { name: "Okaloosa", code: "OKALOOSA", surtax: 50 },
                    { name: "Okeechobee", code: "OKEECHOBEE", surtax: 100 },
                    { name: "Orange", code: "ORANGE", surtax: 50 },
                    { name: "Osceola", code: "OSCEOLA", surtax: 150 },
                    { name: "Palm Beach", code: "PALM-BEACH", surtax: 100 },
                    { name: "Pasco", code: "PASCO", surtax: 100 },
                    { name: "Pinellas", code: "PINELLAS", surtax: 100 },
                    { name: "Polk", code: "POLK", surtax: 100 },
                    { name: "Putnam", code: "PUTNAM", surtax: 100 },
                    { name: "Santa Rosa", code: "SANTA-ROSA", surtax: 50 },
                    { name: "Sarasota", code: "SARASOTA", surtax: 100 },
                    { name: "Seminole", code: "SEMINOLE", surtax: 100 },
                    { name: "St. Johns", code: "ST-JOHNS", surtax: 50 },
                    { name: "St. Lucie", code: "ST-LUCIE", surtax: 100 },
                    { name: "Sumter", code: "SUMTER", surtax: 100 },
                    { name: "Suwannee", code: "SUWANNEE", surtax: 100 },
                    { name: "Taylor", code: "TAYLOR", surtax: 100 },
                    { name: "Union", code: "UNION", surtax: 100 },
                    { name: "Volusia", code: "VOLUSIA", surtax: 50 },
                    { name: "Wakulla", code: "WAKULLA", surtax: 100 },
                    { name: "Walton", code: "WALTON", surtax: 100 },
                    { name: "Washington", code: "WASHINGTON", surtax: 100 }
                ];

                for (const c of counties) {
                    await this.db.run(`
                        INSERT OR REPLACE INTO florida_tax_rates (county_name, county_code, base_rate, surtax_rate, total_rate, effective_date)
                        VALUES (?, ?, 600, ?, ?, '2026-01-01')
                    `, [c.name, c.code, c.surtax, 600 + c.surtax]);
                }
                logs.push("✅ Inyectados los 67 condados de Florida");
            }

            // 8. REPARAR BANK_ACCOUNTS
            const bankCols = await this.getTableColumns('bank_accounts');
            if (bankCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS bank_accounts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        account_name TEXT NOT NULL,
                        bank_name TEXT NOT NULL,
                        account_number TEXT NOT NULL,
                        account_type TEXT DEFAULT 'checking',
                        routing_number TEXT,
                        balance REAL DEFAULT 0,
                        currency TEXT DEFAULT 'USD',
                        is_active BOOLEAN DEFAULT 1,
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                logs.push("✅ Tabla bank_accounts creada");
            } else {
                const requiredBankCols = [
                    { name: 'routing_number', type: 'TEXT' },
                    { name: 'balance', type: 'REAL', default: '0' },
                    { name: 'currency', type: 'TEXT', default: "'USD'" }
                ];
                for (const col of requiredBankCols) {
                    if (!bankCols.includes(col.name)) {
                        try {
                            const def = col.default ? ` DEFAULT ${col.default}` : "";
                            await this.db.run(`ALTER TABLE bank_accounts ADD COLUMN ${col.name} ${col.type}${def}`);
                            logs.push(`✅ Agregada columna ${col.name} a bank_accounts`);
                        } catch (e) {
                            logs.push(`⚠️ Error agregando columna ${col.name}: ${(e as Error).message}`);
                        }
                    }
                }
            }

            const taxTransCols = await this.getTableColumns('tax_transactions');
            if (taxTransCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS tax_transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        invoice_id INTEGER NOT NULL,
                        transaction_date TEXT NOT NULL,
                        county_code TEXT NOT NULL,
                        taxable_amount REAL NOT NULL,
                        effective_rate REAL NOT NULL,
                        tax_amount REAL NOT NULL,
                        is_exempt BOOLEAN DEFAULT 0,
                        exemption_type TEXT,
                        verification_hash TEXT,
                        status TEXT DEFAULT 'pending',
                        dr15_report_id INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                logs.push("✅ Tabla tax_transactions creada");
            }

            // Verificar columnas faltantes en tax_transactions
            if (taxTransCols.length > 0) {
                const required = [
                    { name: 'county_code', type: 'TEXT' },
                    { name: 'verification_hash', type: 'TEXT' }
                ];
                for (const col of required) {
                    if (!taxTransCols.includes(col.name)) {
                        try {
                            await this.db.run(`ALTER TABLE tax_transactions ADD COLUMN ${col.name} ${col.type}`);
                            logs.push(`✅ Agregada columna ${col.name} a tax_transactions`);
                        } catch (e) {
                            logs.push(`⚠️ Error agregando columna ${col.name} a tax_transactions: ${(e as Error).message}`);
                        }
                    }
                }
            }

            // 8. REPARAR TABLA DE MIGRACIONES - SIEMPRE
            const migCols = await this.getTableColumns('sys_migrations');
            if (migCols.length === 0) {
                await this.db.run(`
                    CREATE TABLE IF NOT EXISTS sys_migrations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        version INTEGER NOT NULL UNIQUE,
                        migration_name TEXT NOT NULL,
                        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                logs.push("✅ Tabla sys_migrations creada");
            }

            // SIEMPRE insertar registro de migración
            try {
                await this.db.run("INSERT OR IGNORE INTO sys_migrations (version, migration_name) VALUES (7, 'repaired_schema_v7')");
                logs.push("✅ Migración v7 registrada");
            } catch (e) {
                logs.push(`⚠️ Error registrando migración: ${(e as Error).message}`);
            }

            if (migCols.length > 0 && !migCols.includes('version')) {
                // Fix missing version column if table existed base level
                await this.db.run("ALTER TABLE sys_migrations ADD COLUMN version INTEGER DEFAULT 0");
                await this.db.run("UPDATE sys_migrations SET version = 7 WHERE migration_name = 'initial_schema' OR migration_name = 'repaired_schema_v7'");
                logs.push("✅ Columna version agregada a sys_migrations");
            }

            // CRÍTICO: Forzar persistencia de todos los cambios a IndexedDB
            logger.info('SchemaRepair', 'sync_start', 'Forzando persistencia de cambios...');
            try {
                if (typeof this.db.sync === 'function') {
                    await this.db.sync();
                    logs.push("✅ Cambios persistidos a IndexedDB");
                }
            } catch (e) {
                logs.push(`⚠️ Error en sync: ${(e as Error).message}`);
            }

            return logs;
        } catch (error) {
            logger.error('SchemaRepair', 'failure', 'Error fatal en reparación', { error });
            return logs;
        }
    }

    public async syncViews(logs: string[] = []) {
        try {
            // Recrear vistas críticas
            await this.db.run(`DROP VIEW IF EXISTS datos_sistema`);
            await this.db.run(`
                CREATE VIEW IF NOT EXISTS datos_sistema AS
                SELECT 
                  (SELECT COUNT(*) FROM customers) as total_clientes,
                  (SELECT COUNT(*) FROM invoices) as facturas_venta,
                  (SELECT COUNT(*) FROM bills) as facturas_compra,
                  (SELECT MAX(total_amount) FROM invoices) as mayor_venta_monto,
                  (SELECT COUNT(*) FROM suppliers) as total_proveedores,
                  (SELECT IFNULL(SUM(stock_quantity * price), 0) FROM products) as valor_inventario
            `);
            logs.push("✅ Vistas del sistema sincronizadas");
        } catch (e: any) {
            logs.push(`⚠️ Error sincronizando vistas: ${e.message}`);
        }
    }

    public async cleanOrphanedRecords(logs: string[] = []) {
        try {
            // Detectar violaciones FK
            const fkCheck = await this.db.select("PRAGMA foreign_key_check");

            if (fkCheck.length === 0) {
                logs.push("✅ No se encontraron registros huérfanos");
                return;
            }

            let deletedCount = 0;
            const violations = fkCheck;

            // Agrupar violaciones por tabla
            const violationsByTable = new Map<string, number[]>();
            violations.forEach((row: any) => {
                const tableName = row.table as string;
                const rowId = row.rowid as number;
                if (!violationsByTable.has(tableName)) {
                    violationsByTable.set(tableName, []);
                }
                violationsByTable.get(tableName)!.push(rowId);
            });

            // Eliminar registros huérfanos por tabla
            for (const [tableName, rowIds] of violationsByTable.entries()) {
                try {
                    const idsStr = rowIds.join(',');
                    await this.db.run(`DELETE FROM ${tableName} WHERE rowid IN (${idsStr})`);
                    deletedCount += rowIds.length;
                    logs.push(`✅ Eliminados ${rowIds.length} registros huérfanos de ${tableName}`);
                } catch (e: any) {
                    logs.push(`⚠️ Error limpiando ${tableName}: ${e.message}`);
                }
            }

            if (deletedCount > 0) {
                logs.push(`✅ Total: ${deletedCount} registros huérfanos eliminados`);
                try {
                    await this.db.run("VACUUM");
                    logs.push("✅ Base de datos optimizada (VACUUM)");
                } catch (e: any) {
                    logs.push(`⚠️ No se pudo ejecutar VACUUM: ${e.message}`);
                }
            }

        } catch (e: any) {
            logs.push(`⚠️ Error en limpieza de registros: ${e.message}`);
        }
    }

    public async validateIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        try {
            const fkCheck = await this.db.select("PRAGMA foreign_key_check");
            if (fkCheck.length > 0) {
                fkCheck.forEach((row: any) => {
                    errors.push(`Violación FK en tabla ${row.table}, rowid ${row.rowid}, referenciando ${row.parent}`);
                });
            }
        } catch (e: any) {
            errors.push(`Error validación integridad: ${e.message}`);
        }
        return { valid: errors.length === 0, errors };
    }

    public async safeRepairWithValidation(): Promise<{ success: boolean; logs: string[]; needsRestart: boolean }> {
        const logs: string[] = [];
        let needsRestart = false;

        try {
            // 1. Reparar esquema
            const repairLogs = await this.repairSchema();
            logs.push(...repairLogs);

            // 2. Validar integridad
            const { valid, errors } = await this.validateIntegrity();
            if (!valid) {
                logs.push('⚠️ Errores FK detectados (no críticos):');
                logs.push(...errors.slice(0, 5)); // Máximo 5 para no saturar
                if (errors.length > 5) logs.push(`... y ${errors.length - 5} más`);
            } else {
                logs.push('✅ Integridad referencial validada');
            }

            // 3. Verificar si se hicieron cambios estructurales
            if (repairLogs.some(log => log.includes('Agregada') || log.includes('Migrada'))) {
                needsRestart = true;
                logs.push('🔄 Se recomienda reiniciar el sistema');
            }

            return { success: true, logs, needsRestart };

        } catch (error: any) {
            logs.push(`❌ Error crítico: ${error.message}`);
            return { success: false, logs, needsRestart: false };
        }
    }

    private async getTableColumns(tableName: string): Promise<string[]> {
        try {
            const res = await this.db.select(`PRAGMA table_info(${tableName})`);
            if (res.length > 0) {
                return res.map((row: any) => row.name as string);
            }
        } catch (e) {
            return [];
        }
        return [];
    }
}
