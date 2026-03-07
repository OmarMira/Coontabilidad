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

    constructor() { }

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
                const SQL = await initSqlJs({});
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
            // Pass locateFile so wa-sqlite always loads the .wasm from /public
            // (served verbatim by Vite), not relative to the hashed bundle path.
            const module = await SQLiteFactory({
                locateFile: (file: string) => `/${file}`
            });
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

            // Verify persistence — wrapped separately so a benign wa-sqlite SQLITE_OK
            // response (caught as "not an error") doesn't abort the full init
            try {
                await this.exec('CREATE TABLE IF NOT EXISTS system_check (id INTEGER PRIMARY KEY, initialized_at TEXT)');
                await this.run('INSERT INTO system_check (initialized_at) VALUES (?)', [new Date().toISOString()]);
            } catch (checkErr: any) {
                // "not an error" = SQLITE_OK (code 0) misinterpreted by wa-sqlite IDB adapter
                // This is safe to ignore — the DB IS open and functional
                if (!String(checkErr?.message ?? checkErr).includes('not an error')) {
                    console.warn('⚠️ system_check warning (non-fatal):', checkErr);
                }
            }

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
            const stmt = this.sqlJsDB.prepare(sql);
            try {
                stmt.run(params);
            } finally {
                stmt.free();
            }
            return;
        }

        if (!this.sqlite3 || this.db === null) throw new Error('DB not initialized');

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
                const colCount = this.sqlite3.column_count(stmt);
                const rowObj: Record<string, any> = {};

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
        if (this.sqlJsDB) {
            try {
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

    async executeBatchTransaction(queries: { sql: string, params: any[] }[]): Promise<void> {
        return await this.executeTransaction(async () => {
            for (const query of queries) {
                await this.run(query.sql, query.params);
            }
        });
    }

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

    async sync(): Promise<void> {
        if (!this.sqlite3 || this.db === null) return;

        try {
            if (this.vfs && typeof this.vfs.flush === 'function') {
                await this.vfs.flush();
            }
            await this.exec('PRAGMA wal_checkpoint(TRUNCATE)');
        } catch (e) {
            console.warn('Sync warning (non-critical):', e);
        }
    }

    async getDatabaseSize(): Promise<number> {
        return 0;
    }
}
