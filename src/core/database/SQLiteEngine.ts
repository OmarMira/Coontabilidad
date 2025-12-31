import initSqlJs from 'sql.js';

export class SQLiteEngine {
    private db: initSqlJs.Database | null = null;
    private dbName: string;

    constructor() {
        this.dbName = 'accountexpress.db';
    }

    async initialize(databaseName?: string): Promise<void> {
        if (databaseName) this.dbName = databaseName;

        // 1. Verificar compatibilidad OPFS
        if (!('storage' in navigator && navigator.storage && 'getDirectory' in navigator.storage)) {
            console.warn('OPFS not supported or not in secure context. Persistence might not work.');
        }

        try {
            // 2. Inicializar SQLite con sql.js
            const SQL = await (initSqlJs as any).default({
                locateFile: (file: string) => `/${file}`
            });

            // 3. Crear base de datos
            this.db = new SQL.Database();

            // 4. Configurar SQLite para mejor rendimiento
            this.exec('PRAGMA journal_mode=WAL');
            this.exec('PRAGMA synchronous=NORMAL');
            this.exec('PRAGMA foreign_keys=ON');
            this.exec('PRAGMA busy_timeout=5000');
            this.exec('PRAGMA cache_size=-10000');

            console.log('✅ SQLiteEngine initialized');
        } catch (e) {
            console.error('SQLite initialization failed', e);
            throw e;
        }
    }

    // Ejecutar SQL raw (DDL)
    exec(sql: string): void {
        if (!this.db) throw new Error('DB not initialized');
        this.db.run(sql);
    }

    // Ejecutar con parámetros (Insert, Update)
    run(sql: string, params: (string | number | boolean | null | Uint8Array)[] = []): void {
        if (!this.db) throw new Error('DB not initialized');
        this.db.run(sql, params as initSqlJs.SqlValue[]);
    }

    // Consultar (Select)
    select(sql: string, params: (string | number | boolean | null | Uint8Array)[] = []): Record<string, any>[] {
        if (!this.db) throw new Error('DB not initialized');
        const stmt = this.db.prepare(sql);
        stmt.bind(params as initSqlJs.SqlValue[]);
        const results: Record<string, any>[] = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }

    async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            this.db.run('BEGIN IMMEDIATE TRANSACTION');
            const result = await operation();
            this.db.run('COMMIT');
            return result;
        } catch (error) {
            this.db.run('ROLLBACK');
            throw error;
        }
    }
}
