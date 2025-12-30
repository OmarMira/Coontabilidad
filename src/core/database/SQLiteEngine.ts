import * as initSqlJs from 'sql.js';

export class SQLiteEngine {
    private db: any | null = null;
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
            // We use a dynamic import or assuming global if script tag, but here we use node module
            const SQL = await (initSqlJs as any).default({
                locateFile: (file: string) => `/${file}`
            });

            // 3. Crear base de datos
            // For real persistence we need to read from OPFS here.
            // But for now keeping it aligned with previous logic where simple-db handled loading.
            // As per directive, we are focusing on the Engine structure. 
            // The loading logic should ideally be here.
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
    run(sql: string, params: any[] = []): void {
        if (!this.db) throw new Error('DB not initialized');
        this.db.run(sql, params);
    }

    // Consultar (Select)
    select(sql: string, params: any[] = []): any[] {
        if (!this.db) throw new Error('DB not initialized');
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        const results = [];
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
