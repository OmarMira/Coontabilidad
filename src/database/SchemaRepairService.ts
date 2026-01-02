
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
