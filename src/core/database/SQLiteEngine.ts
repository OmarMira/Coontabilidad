import * as SQLite from 'wa-sqlite';
// @ts-ignore
import SQLiteFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
// @ts-ignore
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
// @ts-ignore
import initSqlJs from 'sql.js';

export class SQLiteEngine {
    private sqlite3: any = null;
    private db: number | null = null;
    private sqlJsDB: any = null;
    private dbName: string = 'accountexpress_v2.db';
    private vfs: any = null;

    private isDemoMode: boolean = false;

    constructor() { }

    setDemoMode(enabled: boolean) {
        this.isDemoMode = enabled;
        if (enabled) {
            console.warn('⚠️ ENGINE: MODO DEMO ACTIVADO - DATOS VOLÁTILES (RAM)');
        }
    }

    // Permitir usar una instancia de sql.js para compatibilidad con simple-db
    setDB(db: any) {
        this.sqlJsDB = db;
    }

    async initialize(databaseName?: string): Promise<void> {
        if (databaseName) this.dbName = databaseName;

        // Use sql.js for testing environment
        if (process.env.NODE_ENV === 'test') {
            try {
                console.log('🧪 Initializing sql.js for testing...');
                const SQL = await initSqlJs({
                    // In Node/Vitest, locatFile might not be needed if wasm is found or fetched via MSW
                    // But explicitly pointing to it is safer if we can.
                    // For now relying on default or MSW interception.
                });
                this.sqlJsDB = new SQL.Database();
                console.log('✅ sql.js initialized successfully');

                // Initialize settings compatible with sql.js
                this.sqlJsDB.run('PRAGMA foreign_keys=ON;');
                return;
            } catch (e) {
                console.error('❌ Failed to initialize sql.js:', e);
                throw e;
            }
        }

        try {
            console.log('🔄 Initializing wa-sqlite...');

            // 1. Initialize SQLite3 Module
            const module = await SQLiteFactory();
            this.sqlite3 = SQLite.Factory(module);

            // 2. Register Persistent VFS (IDB Batch Atomic for Main Thread compatibility)
            this.vfs = new IDBBatchAtomicVFS(this.dbName);
            // @ts-ignore
            this.sqlite3.vfs_register(this.vfs, true);

            // 3. Open Database
            // @ts-ignore
            this.db = await this.sqlite3.open_v2(
                this.dbName,
                SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_CREATE,
                this.dbName
            );


            // 4. Initialize Database Settings
            await this.exec('PRAGMA journal_mode=DELETE'); // IDB often prefers DELETE or MEMORY, WAL can be tricky without OPFS
            await this.exec('PRAGMA synchronous=NORMAL');
            await this.exec('PRAGMA foreign_keys=ON');
            await this.exec('PRAGMA cache_size=-5000');

            console.log('✅ SQLiteEngine (wa-sqlite) initialized successfully');

            // Verify persistence
            await this.exec('CREATE TABLE IF NOT EXISTS system_check (id INTEGER PRIMARY KEY, initialized_at TEXT)');
            await this.run('INSERT INTO system_check (initialized_at) VALUES (?)', [new Date().toISOString()]);

        } catch (e) {
            console.error('❌ SQLiteEngine initialization failed:', e);
            throw e;
        }
    }

    // Execute raw SQL (DDL) - Async
    async exec(sql: string): Promise<void> {
        if (this.sqlJsDB) {
            this.sqlJsDB.run(sql);
            return;
        }
        if (!this.sqlite3 || this.db === null) throw new Error('DB not initialized');
        await this.sqlite3.exec(this.db, sql);
    }

    // Run with parameters - Async
    async run(sql: string, params: any[] = []): Promise<void> {
        if (this.sqlJsDB) {
            // INTERCETOR DE MODO DEMO (RAM)
            if (this.isDemoMode) {
                const upperSql = sql.toUpperCase().trim();
                if (upperSql.startsWith('INSERT INTO')) {
                    // Extraer nombre de tabla (simplificado)
                    const match = upperSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/);
                    if (match && match[1]) {
                        const tableName = match[1];
                        try {
                            // Ejecutar conteo sincrónico (sql.js es sync)
                            const res = this.sqlJsDB.exec(`SELECT COUNT(*) as c FROM ${tableName}`);
                            if (res.length > 0 && res[0].values.length > 0) {
                                const count = res[0].values[0][0] as number;
                                if (count >= 20) {
                                    throw new Error(`Límite de demo alcanzado (20 cargas máximo por archivo) en tabla: ${tableName}`);
                                }
                            }
                        } catch (e: any) {
                            if (e.message.includes('Límite de demo')) throw e;
                            console.warn('Demo Check Warning:', e);
                        }
                    }
                }
            }

            this.sqlJsDB.run(sql, params);
            return;
        }

        if (!this.sqlite3 || this.db === null) throw new Error('DB not initialized');

        // INTERCEPTOR MODO DEMO (ASYNC WA-SQLITE)
        if (this.isDemoMode) {
            const upperSql = sql.toUpperCase().trim();
            if (upperSql.startsWith('INSERT INTO')) {
                const match = upperSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/);
                if (match && match[1]) {
                    const tableName = match[1];
                    // Necesitamos hacer una consulta async aparte
                    // Nota: Esto podría ser lento, pero es demo
                    const countRes = await this.select(`SELECT COUNT(*) as c FROM ${tableName}`);
                    if (countRes.length > 0) {
                        const count = countRes[0]['c'] as number;
                        if (count >= 20) {
                            throw new Error(`Límite de demo alcanzado (20 cargas máximo por archivo) en tabla: ${tableName}`);
                        }
                    }
                }
            }
        }

        let stmt: number | undefined;
        try {
            // @ts-ignore
            stmt = await this.sqlite3.prepare_v2(this.db, sql);
            if (!stmt) throw new Error('Failed to prepare statement');

            // Bind parameters
            if (params.length > 0) {
                // @ts-ignore wa-sqlite bind_collection: expects never but accepts any
                this.sqlite3.bind_collection(stmt, params as unknown as never[]);
            }

            // Execute
            // @ts-ignore
            await this.sqlite3.step(stmt);
        } finally {
            // @ts-ignore
            if (stmt) await this.sqlite3.finalize(stmt);
        }
    }

    // Select with parameters - Async
    async select(sql: string, params: any[] = []): Promise<Record<string, any>[]> {
        if (this.sqlJsDB) {
            const results: Record<string, any>[] = [];
            const stmt = this.sqlJsDB.prepare(sql);
            try {
                stmt.bind(params);
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
            } finally {
                stmt.free();
            }
            return results;
        }
        if (!this.sqlite3 || this.db === null) throw new Error('DB not initialized');

        const results: Record<string, any>[] = [];
        let stmt: number | undefined;

        try {
            // @ts-ignore
            stmt = await this.sqlite3.prepare_v2(this.db, sql);
            if (!stmt) throw new Error('Failed to prepare statement');

            // Bind parameters
            if (params.length > 0) {
                    // @ts-ignore
                    this.sqlite3.bind_collection(stmt, params as unknown as never[]);
            }

            // Step through results
            while (await this.sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
                // @ts-ignore
                const row = this.sqlite3.row_collection(stmt); // Returns array or object? usually array?
                // wa-sqlite row_collection returns an array of values if not configured otherwise, or object if columns?
                // Actually helper is needed to map columns.

                // Manual column mapping:
                const columns = [];
                const colCount = this.sqlite3.column_count(stmt);
                for (let i = 0; i < colCount; i++) {
                    // @ts-ignore wa-sqlite column_name signature mismatch
                    columns.push(this.sqlite3.column_name(stmt, i));
                }

                const rowObj: Record<string, any> = {};
                // @ts-ignore
                const values = this.sqlite3.row_collection(stmt); // Wait, row_collection maps to object? Check docs.
                // Inspecting IDBBatchAtomicVFS example or standard usage:
                // Usually one iterates columns and calls column_text/int/double.
                // But row_collection is a convenience method in high level API? No, likely not in core.
                // Let's rely on manual extraction for safety.

                // Re-implementation of reliable row extraction:
                for (let i = 0; i < colCount; i++) {
                    const colName = this.sqlite3.column_name(stmt, i);
                    const type = this.sqlite3.column_type(stmt, i);
                    let val: any;
                    switch (type) {
                        case SQLite.SQLITE_INTEGER:
                        case SQLite.SQLITE_FLOAT:
                            val = this.sqlite3.column_number(stmt, i);
                            break;
                        case SQLite.SQLITE_TEXT:
                            val = this.sqlite3.column_text(stmt, i);
                            break;
                        case SQLite.SQLITE_BLOB:
                            val = this.sqlite3.column_blob(stmt, i);
                            break;
                        case SQLite.SQLITE_NULL:
                            val = null;
                            break;
                        default:
                            val = this.sqlite3.column_text(stmt, i);
                    }
                    rowObj[colName] = val;
                }
                results.push(rowObj);
            }
        } finally {
            // @ts-ignore
            if (stmt) await this.sqlite3.finalize(stmt);
        }
        return results;
    }

    async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
        // En modo test con sql.js, no hay soporte nativo de transacciones async
        // Ejecutamos directamente la operación sin transacción explícita
        if (this.sqlJsDB) {
            try {
                // Check if we're already in a transaction
                try {
                    this.sqlJsDB.run('BEGIN TRANSACTION');
                    const result = await operation();
                    this.sqlJsDB.run('COMMIT');
                    return result;
                } catch (error: any) {
                    if (error.message && error.message.includes('cannot start a transaction within a transaction')) {
                        return await operation();
                    }
                    this.sqlJsDB.run('ROLLBACK');
                    throw error;
                }
            } catch (error) {
                throw error;
            }
        }

        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.exec('BEGIN IMMEDIATE TRANSACTION');
            // @ts-ignore
            const result = await operation();
            await this.exec('COMMIT');
            return result;
        } catch (error) {
            await this.exec('ROLLBACK');
            throw error;
        }
    }

    /**
     * executeBatchTransaction (Iron Clad Objective 2.2)
     * High-performance execution of multiple prepared queries in a single transaction.
     */
    async executeBatchTransaction(queries: { sql: string, params: any[] }[]): Promise<void> {
        return await this.executeTransaction(async () => {
            for (const query of queries) {
                await this.run(query.sql, query.params);
            }
        });
    }

    // Compatibility with sql.js return format: [{ columns: [...], values: [...] }] (Async)
    async execCompatible(sql: string, params: any[] = []): Promise<{ columns: string[], values: any[][] }[]> {
        if (!this.sqlite3 || this.db === null) throw new Error('DB not initialized');

        const result: { columns: string[], values: any[][] } = { columns: [], values: [] };
        let stmt: number | undefined;

        try {
            // @ts-ignore
            stmt = await this.sqlite3.prepare_v2(this.db, sql);
            if (!stmt) throw new Error('Failed to prepare statement');

            // @ts-ignore
            if (params.length > 0) {
                // @ts-ignore
                this.sqlite3.bind_collection(stmt, params as unknown as never[]);
            }

            // Get columns
            const colCount = this.sqlite3.column_count(stmt);
            for (let i = 0; i < colCount; i++) {
                result.columns.push(this.sqlite3.column_name(stmt, i));
            }

            // Get values
            while (await this.sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
                const row: any[] = [];
                for (let i = 0; i < colCount; i++) {
                    const type = this.sqlite3.column_type(stmt, i);
                    let val: any;
                    switch (type) {
                        case SQLite.SQLITE_INTEGER:
                        case SQLite.SQLITE_FLOAT:
                            val = this.sqlite3.column_number(stmt, i);
                            break;
                        case SQLite.SQLITE_TEXT:
                            val = this.sqlite3.column_text(stmt, i);
                            break;
                        case SQLite.SQLITE_BLOB:
                            val = this.sqlite3.column_blob(stmt, i);
                            break;
                        default:
                            val = this.sqlite3.column_text(stmt, i);
                    }
                    row.push(val);
                }
                result.values.push(row);
            }
        } finally {
            // @ts-ignore
            if (stmt) await this.sqlite3.finalize(stmt);
        }

        return result.values.length > 0 || result.columns.length > 0 ? [result] : [];
    }

    async close(): Promise<void> {
        if (this.sqlite3 && this.db) {
            await this.sqlite3.close(this.db);
            this.db = null;
        }
    }

    /**
     * Fuerza la persistencia de cambios a IndexedDB
     * CRÍTICO para IDBBatchAtomicVFS que hace batch de escrituras
     */
    async sync(): Promise<void> {
        if (!this.sqlite3 || this.db === null) return;

        try {
            // Forzar flush de cambios pendientes
            if (this.vfs && typeof this.vfs.flush === 'function') {
                await this.vfs.flush();
            }

            // Ejecutar checkpoint para asegurar que todo se escriba
            await this.exec('PRAGMA wal_checkpoint(TRUNCATE)');
        } catch (e) {
            console.warn('Sync warning (non-critical):', e);
        }
    }

    async getDatabaseSize(): Promise<number> {
        // Implementation for later
        return 0;
    }
}


