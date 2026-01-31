
import initSqlJs from 'sql.js';
import { logger } from '../core/logging/SystemLogger';

export class SchemaRepairService {
    private db: initSqlJs.Database;

    constructor(db: initSqlJs.Database) {
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
                { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
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
            const companyCols = this.getTableColumns('company_data');

            if (companyCols.length === 0) {
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
                        sales_commission_percentage REAL DEFAULT 0,
                        shipping_rate REAL DEFAULT 0,
                        late_fee_percentage REAL DEFAULT 0,
                        grace_period_days INTEGER DEFAULT 0,
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
                    { name: 'is_active', type: 'BOOLEAN', default: "1" }
                ];
                for (const col of requiredColumns) {
                    if (!companyCols.includes(col.name)) {
                        try {
                            this.db.run(`ALTER TABLE company_data ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`);
                            logs.push(`✅ Agregada columna ${col.name} a company_data`);
                        } catch (e) {
                            logs.push(`⚠️ Error agregando columna ${col.name}: ${(e as Error).message}`);
                        }
                    }
                }
            }

            // Ensure Data Exists
            const hasData = this.db.exec(`SELECT COUNT(*) as count FROM company_data`);
            if (hasData.length === 0 || hasData[0].values[0][0] === 0) {
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

            // 3. LIMPIAR REGISTROS HUÉRFANOS
            await this.cleanOrphanedRecords(logs);

            // 4. FIX ADMIN PASSWORD & USERS
            const userCols = this.getTableColumns('users');
            if (userCols.length === 0) {
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS user_roles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        description TEXT,
                        level INTEGER DEFAULT 1,
                        permissions_json TEXT DEFAULT '{}',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                this.db.run(`
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
                        FOREIGN KEY (role_id) REFERENCES user_roles(id)
                    )
                `);

                // Seed Roles
                this.db.run(`
                    INSERT INTO user_roles (name, description, level, permissions_json) VALUES 
                    ('admin', 'Administrador del sistema', 10, '{"all": true}'),
                    ('accountant', 'Contador', 5, '{"accounting": true, "view_all": true}'),
                    ('user', 'Usuario estándar', 1, '{"view_own": true}'),
                    ('viewer', 'Solo lectura', 0, '{"read_only": true}')
                `);
            }

            const adminUser = this.db.exec("SELECT id, password_hash FROM users WHERE username = 'admin'");
            if (adminUser.length > 0 && adminUser[0].values.length > 0) {
                const currentHash = adminUser[0].values[0][1] as string;
                // Check if it's the broken/junk hash or empty
                if (!currentHash || currentHash.startsWith('U2FsdGVk')) {
                    const newHash = await this.hashPassword('admin123');
                    if (newHash) {
                        this.db.run("UPDATE users SET password_hash = ? WHERE username = 'admin'", [newHash]);
                        logs.push("✅ Contraseña de Admin reparada (admin123)");
                    }
                }
            } else {
                // Create admin if not exists
                const newHash = await this.hashPassword('admin123');
                if (newHash) {
                    this.db.run(`
                        INSERT INTO users (username, email, password_hash, full_name, display_name, role_id, is_active)
                        VALUES 
                        ('admin', 'admin@accountexpress.com', ?, 'System Admin', 'Admin', 1, 1)
                     `, [newHash]);
                    logs.push("✅ Usuario Admin recreado");
                }
            }

            // 5. ENSURE PAYMENT METHODS
            const pmCols = this.getTableColumns('payment_methods');
            if (pmCols.length === 0) {
                this.db.run(`
                  CREATE TABLE IF NOT EXISTS payment_methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method_name TEXT NOT NULL,
                    method_type TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    requires_reference BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                 `);
                this.db.run(`
                  INSERT INTO payment_methods (method_name, method_type, is_active, requires_reference) VALUES 
                  ('Efectivo', 'cash', 1, 0),
                  ('Transferencia Bancaria', 'bank_transfer', 1, 1),
                  ('Cheque', 'check', 1, 1),
                  ('Tarjeta de Crédito', 'credit_card', 1, 1),
                  ('Zelle', 'digital', 1, 1)
                 `);
                logs.push("✅ Métodos de pago restaurados");
            }

            return logs;
        } catch (error) {
            logger.critical('SchemaRepair', 'failed', 'Error fatal en reparación', null, error as Error);
            logs.push(`❌ Error crítico: ${(error as Error).message}`);
            return logs;
        }
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
