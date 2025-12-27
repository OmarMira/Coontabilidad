import * as initSqlJs from 'sql.js';

export class SQLiteEngine {
    private db: any | null = null;

    async initialize(databaseName: string = 'accountexpress.db'): Promise<void> {
        // 1. Verificar compatibilidad OPFS
        if (!('storage' in navigator && navigator.storage && 'getDirectory' in navigator.storage)) {
            throw new Error('OPFS no disponible - navegador incompatible');
        }

        try {
            // 2. Inicializar SQLite con sql.js
            const SQL = await (initSqlJs as any)({
                locateFile: (file: string) => `/${file}`
            });

            // 3. Crear base de datos en memoria (OPFS se maneja en simple-db.ts)
            this.db = new SQL.Database();

            // 4. Configurar SQLite para mejor rendimiento
            this.db.run('PRAGMA journal_mode=WAL');
            this.db.run('PRAGMA synchronous=NORMAL');
            this.db.run('PRAGMA foreign_keys=ON');
            this.db.run('PRAGMA busy_timeout=5000');
            this.db.run('PRAGMA cache_size=-10000');

            console.log('✅ Motor SQLite inicializado');
        } catch (e) {
            console.error('SQLite initialization failed', e);
            throw e;
        }
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
