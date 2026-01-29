
import initSqlJs from 'sql.js';
import { logger } from '../core/logging/SystemLogger';

export class SchemaRepairService {
    private db: initSqlJs.Database;

    constructor(db: initSqlJs.Database) {
        this.db = db;
    }

    public async repairSchema(): Promise<string[]> {
        const logs: string[] = [];
        logger.info('SchemaRepair', 'start', 'Iniciando reparación de esquema...');

        try {
            // 1. REPARAR COMPANY_DATA
            const companyCols = this.getTableColumns('company_data');

            if (companyCols.length > 0) {
                // Verificar y agregar columnas faltantes según el esquema real
                const requiredColumns = [
                    { name: 'company_name', type: 'TEXT', default: "'Account Express Demo'" },
                    { name: 'legal_name', type: 'TEXT', default: "'Account Express Demo'" },
                    { name: 'tax_id', type: 'TEXT', default: "'US-DEMO-123'" },
                    { name: 'address', type: 'TEXT', default: "''" },
                    { name: 'city', type: 'TEXT', default: "'Miami'" },
                    { name: 'state', type: 'TEXT', default: "'FL'" },
                    { name: 'zip_code', type: 'TEXT', default: "'33132'" },
                    { name: 'phone', type: 'TEXT', default: "''" },
                    { name: 'email', type: 'TEXT', default: "'admin@accountexpress.com'" },
                    { name: 'website', type: 'TEXT', default: "NULL" },
                    { name: 'logo_path', type: 'TEXT', default: "NULL" },
                    { name: 'fiscal_year_start', type: 'TEXT', default: "'01-01'" },
                    { name: 'currency', type: 'TEXT', default: "'USD'" },
                    { name: 'language', type: 'TEXT', default: "'es'" },
                    { name: 'timezone', type: 'TEXT', default: "'America/New_York'" },
                    { name: 'date_format', type: 'TEXT', default: "'MM/DD/YYYY'" },
                    { name: 'is_active', type: 'BOOLEAN', default: "1" }
                ];

                for (const col of requiredColumns) {
                    if (!companyCols.includes(col.name)) {
                        this.db.run(`ALTER TABLE company_data ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`);
                        logs.push(`✅ Agregada columna faltante: ${col.name}`);
                    }
                }

                // Verificar que haya al menos un registro activo
                const hasData = this.db.exec(`SELECT COUNT(*) as count FROM company_data WHERE is_active = 1`);
                if (hasData.length === 0 || hasData[0].values[0][0] === 0) {
                    // Insertar datos por defecto
                    this.db.run(`
                        INSERT INTO company_data (
                            company_name, legal_name, tax_id, address, city, state, zip_code, 
                            phone, email, fiscal_year_start, currency, language, timezone, date_format, is_active
                        ) VALUES (
                            'Account Express Demo Inc.', 'Account Express Demo Inc.', 'US-DEMO-123', 
                            '100 Biscayne Blvd', 'Miami', 'FL', '33132', '(305) 555-0000', 
                            'admin@accountexpress.com', '01-01', 'USD', 'es', 'America/New_York', 'MM/DD/YYYY', 1
                        )
                    `);
                    logs.push("✅ Datos de empresa por defecto insertados");
                }
            } else {
                // Tabla no existe, crearla con el esquema completo
                this.db.run(`
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
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                logs.push("✅ Tabla company_data creada desde cero");

                // Insertar datos default
                this.db.run(`
                    INSERT INTO company_data (
                        company_name, legal_name, tax_id, address, city, state, zip_code, 
                        phone, email, fiscal_year_start, currency, language, timezone, date_format, is_active
                    ) VALUES (
                        'Account Express Demo Inc.', 'Account Express Demo Inc.', 'US-DEMO-123', 
                        '100 Biscayne Blvd', 'Miami', 'FL', '33132', '(305) 555-0000', 
                        'admin@accountexpress.com', '01-01', 'USD', 'es', 'America/New_York', 'MM/DD/YYYY', 1
                    )
                `);
                logs.push("✅ Datos de empresa por defecto insertados");
            }

            // 2. VERIFICAR INTEGRIDAD DE VISTAS
            await this.syncViews(logs);

            // 3. LIMPIAR REGISTROS HUÉRFANOS (FK VIOLATIONS)
            await this.cleanOrphanedRecords(logs);

            // 4. RECUPERAR TABLA PAYMENT_METHODS
            const pmCols = this.getTableColumns('payment_methods');
            if (pmCols.length === 0) {
                this.db.run(`
                  CREATE TABLE IF NOT EXISTS payment_methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    requires_reference BOOLEAN DEFAULT 0
                  )
                 `);
                this.db.run(`
                  INSERT INTO payment_methods (name, type, is_active, requires_reference) VALUES 
                  ('Efectivo', 'cash', 1, 0),
                  ('Transferencia Bancaria', 'bank_transfer', 1, 1),
                  ('Cheque', 'check', 1, 1),
                  ('Tarjeta de Crédito', 'credit_card', 1, 1),
                  ('Zelle', 'digital', 1, 1)
                 `);
                logs.push("✅ Tabla payment_methods restaurada");
            }

            // 5. SISTEMA DE CIERRE CONTABLE (PERIODOS)
            const fyCols = this.getTableColumns('fiscal_years');
            if (fyCols.length === 0) {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS fiscal_years (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        year INTEGER NOT NULL UNIQUE,
                        start_date TEXT NOT NULL,
                        end_date TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'open',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS accounting_periods (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        fiscal_year_id INTEGER NOT NULL,
                        month INTEGER NOT NULL,
                        status TEXT NOT NULL DEFAULT 'open',
                        start_date TEXT NOT NULL,
                        end_date TEXT NOT NULL,
                        closed_at DATETIME,
                        closed_by INTEGER,
                        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
                        UNIQUE(fiscal_year_id, month)
                    )
                `);

                // Inicializar año actual si no existe
                const currentYear = new Date().getFullYear();
                this.db.run(`
                    INSERT INTO fiscal_years (year, start_date, end_date, status)
                    VALUES (?, ?, ?, 'open')
                `, [currentYear, `${currentYear}-01-01`, `${currentYear}-12-31`]);

                const fyId = this.db.exec(`SELECT last_insert_rowid()`)[0].values[0][0] as number;

                for (let m = 1; m <= 12; m++) {
                    const monthStr = m.toString().padStart(2, '0');
                    const lastDay = new Date(currentYear, m, 0).getDate();
                    this.db.run(`
                        INSERT INTO accounting_periods (fiscal_year_id, month, start_date, end_date, status)
                        VALUES (?, ?, ?, ?, 'open')
                    `, [fyId, m, `${currentYear}-${monthStr}-01`, `${currentYear}-${monthStr}-${lastDay}`]);
                }

                logs.push(`✅ Sistema de periodos iniciado para el año ${currentYear}`);
            }

            // 6. SISTEMA DE NÓMINA (PAYROLL)
            const empCols = this.getTableColumns('employees');
            if (empCols.length === 0) {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS employees (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        employee_number TEXT NOT NULL UNIQUE,
                        first_name TEXT NOT NULL,
                        last_name TEXT NOT NULL,
                        email TEXT,
                        phone TEXT,
                        hire_date TEXT NOT NULL,
                        department TEXT,
                        position TEXT,
                        salary_type TEXT NOT NULL DEFAULT 'monthly',
                        salary_rate REAL NOT NULL DEFAULT 0,
                        status TEXT NOT NULL DEFAULT 'active',
                        florida_county TEXT DEFAULT 'Miami-Dade',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS payroll_periods (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        start_date TEXT NOT NULL,
                        end_date TEXT NOT NULL,
                        pay_date TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'open',
                        total_gross REAL DEFAULT 0,
                        total_net REAL DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS payroll_entries (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        employee_id INTEGER NOT NULL,
                        period_id INTEGER NOT NULL,
                        journal_entry_id INTEGER,
                        gross_amount REAL NOT NULL,
                        deductions_amount REAL NOT NULL DEFAULT 0,
                        net_amount REAL NOT NULL,
                        status TEXT NOT NULL DEFAULT 'draft',
                        notes TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (employee_id) REFERENCES employees(id),
                        FOREIGN KEY (period_id) REFERENCES payroll_periods(id),
                        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS payroll_line_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        payroll_entry_id INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        category TEXT NOT NULL,
                        description TEXT NOT NULL,
                        amount REAL NOT NULL,
                        FOREIGN KEY (payroll_entry_id) REFERENCES payroll_entries(id)
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS payroll_settings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        setting_key TEXT NOT NULL UNIQUE,
                        setting_value TEXT NOT NULL,
                        category TEXT NOT NULL,
                        description TEXT,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
                    CREATE TABLE IF NOT EXISTS tax_brackets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        min_income REAL NOT NULL,
                        max_income REAL,
                        fixed_amount REAL NOT NULL DEFAULT 0,
                        percentage REAL NOT NULL,
                        type TEXT NOT NULL DEFAULT 'annual', -- 'monthly' or 'annual'
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Insertar configuraciones por defecto
                this.db.run(`
                    INSERT OR IGNORE INTO payroll_settings (setting_key, setting_value, category, description) VALUES 
                    ('social_security_rate', '0.062', 'deduction', 'Tasa de Seguro Social (Empleado)'),
                    ('medicare_rate', '0.0145', 'deduction', 'Tasa de Medicare (Empleado)'),
                    ('company_ss_rate', '0.062', 'earning', 'Tasa de Seguro Social (Patronal)'),
                    ('company_medicare_rate', '0.0145', 'earning', 'Tasa de Medicare (Patronal)'),
                    ('default_overtime_multiplier', '1.5', 'multiplier', 'Multiplicador por defecto para horas extras')
                `);

                logs.push("✅ Sistema de nómina (Payroll) inicializado con parámetros de cálculo");
            }

            // =============================================
            // SISTEMA DE ACTIVOS FIJOS (FIXED ASSETS)
            // =============================================

            // Tabla de categorías de activos
            this.db.run(`
                    CREATE TABLE IF NOT EXISTS asset_categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        description TEXT,
                        default_useful_life_years INTEGER,
                        default_depreciation_rate REAL,
                        account_code TEXT,
                        depreciation_expense_account TEXT,
                        accumulated_depreciation_account TEXT,
                        is_active INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

            // Tabla principal de activos fijos
            this.db.run(`
                    CREATE TABLE IF NOT EXISTS fixed_assets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        asset_code TEXT NOT NULL UNIQUE,
                        name TEXT NOT NULL,
                        description TEXT,
                        category_id INTEGER NOT NULL,
                        acquisition_date DATE NOT NULL,
                        acquisition_cost REAL NOT NULL,
                        useful_life_years INTEGER NOT NULL,
                        useful_life_months INTEGER NOT NULL,
                        depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
                        salvage_value REAL DEFAULT 0,
                        current_value REAL,
                        accumulated_depreciation REAL DEFAULT 0,
                        status TEXT NOT NULL DEFAULT 'active',
                        location TEXT,
                        serial_number TEXT,
                        manufacturer TEXT,
                        model TEXT,
                        purchase_order TEXT,
                        supplier_id INTEGER,
                        warranty_expiration DATE,
                        notes TEXT,
                        disposal_date DATE,
                        disposal_value REAL,
                        disposal_reason TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        created_by INTEGER,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (category_id) REFERENCES asset_categories(id),
                        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
                    )
                `);

            // Tabla de depreciaciones calculadas
            this.db.run(`
                    CREATE TABLE IF NOT EXISTS asset_depreciations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        asset_id INTEGER NOT NULL,
                        period_date DATE NOT NULL,
                        depreciation_amount REAL NOT NULL,
                        accumulated_depreciation REAL NOT NULL,
                        net_book_value REAL NOT NULL,
                        journal_entry_id INTEGER,
                        is_posted INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (asset_id) REFERENCES fixed_assets(id),
                        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
                        UNIQUE(asset_id, period_date)
                    )
                `);

            // Índices para performance
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category_id)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_asset_depreciations_asset ON asset_depreciations(asset_id)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_asset_depreciations_period ON asset_depreciations(period_date)`);

            // Insertar categorías por defecto
            this.db.run(`
                    INSERT OR IGNORE INTO asset_categories (name, description, default_useful_life_years, default_depreciation_rate, account_code, depreciation_expense_account, accumulated_depreciation_account) VALUES 
                    ('Edificios', 'Construcciones e inmuebles', 27, 0.037, '1510', '5310', '1519'),
                    ('Maquinaria y Equipo', 'Equipos de producción y manufactura', 7, 0.143, '1520', '5320', '1529'),
                    ('Vehículos', 'Automóviles, camiones y transporte', 5, 0.20, '1530', '5330', '1539'),
                    ('Mobiliario y Equipo de Oficina', 'Muebles, escritorios, sillas', 7, 0.143, '1540', '5340', '1549'),
                    ('Equipo de Cómputo', 'Computadoras, servidores, periféricos', 3, 0.333, '1550', '5350', '1559'),
                    ('Herramientas', 'Herramientas de trabajo', 5, 0.20, '1560', '5360', '1569'),
                    ('Terrenos', 'Propiedades (no depreciable)', NULL, 0, '1501', NULL, NULL)
                `);

            logs.push("✅ Sistema de Activos Fijos (Fixed Assets) inicializado con categorías estándar");

        } catch (error: any) {
            logger.error('SchemaRepair', 'failed', error.message);
            logs.push(`❌ Error crítico: ${error.message}`);
        }

        return logs;
    }

    public async syncViews(logs: string[] = []) {
        try {
            // Recrear vistas críticas
            this.db.run(`DROP VIEW IF EXISTS datos_sistema`);
            this.db.run(`
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
            const fkCheck = this.db.exec("PRAGMA foreign_key_check");

            if (fkCheck.length === 0 || fkCheck[0].values.length === 0) {
                logs.push("✅ No se encontraron registros huérfanos");
                return;
            }

            let deletedCount = 0;
            const violations = fkCheck[0].values;

            // Agrupar violaciones por tabla
            const violationsByTable = new Map<string, number[]>();
            violations.forEach((row: any) => {
                const tableName = row[0] as string;
                const rowId = row[1] as number;
                if (!violationsByTable.has(tableName)) {
                    violationsByTable.set(tableName, []);
                }
                violationsByTable.get(tableName)!.push(rowId);
            });

            // Eliminar registros huérfanos por tabla
            violationsByTable.forEach((rowIds, tableName) => {
                try {
                    // Eliminar en batch
                    const idsStr = rowIds.join(',');
                    this.db.run(`DELETE FROM ${tableName} WHERE rowid IN (${idsStr})`);
                    deletedCount += rowIds.length;
                    logs.push(`✅ Eliminados ${rowIds.length} registros huérfanos de ${tableName}`);
                } catch (e: any) {
                    logs.push(`⚠️ Error limpiando ${tableName}: ${e.message}`);
                }
            });

            if (deletedCount > 0) {
                logs.push(`✅ Total: ${deletedCount} registros huérfanos eliminados`);

                // Ejecutar VACUUM para liberar espacio
                try {
                    this.db.run("VACUUM");
                    logs.push("✅ Base de datos optimizada (VACUUM)");
                } catch (e: any) {
                    logs.push(`⚠️ No se pudo ejecutar VACUUM: ${e.message}`);
                }
            }

        } catch (e: any) {
            logs.push(`⚠️ Error en limpieza de registros: ${e.message}`);
        }
    }

    public validateIntegrity(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        try {
            // Check Foreign Keys
            const fkCheck = this.db.exec("PRAGMA foreign_key_check");
            if (fkCheck.length > 0 && fkCheck[0].values.length > 0) {
                fkCheck[0].values.forEach((row: any) => {
                    errors.push(`Violación FK en tabla ${row[0]}, rowid ${row[1]}, referenciando ${row[2]}`);
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
            const { valid, errors } = this.validateIntegrity();
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

    private getTableColumns(tableName: string): string[] {
        try {
            const res = this.db.exec(`PRAGMA table_info(${tableName})`);
            if (res.length > 0 && res[0].values) {
                return res[0].values.map((row: any) => row[1] as string);
            }
        } catch (e) {
            return [];
        }
        return [];
    }
}
