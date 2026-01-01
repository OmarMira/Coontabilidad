/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseInitializer } from '../../src/database/DatabaseInitializer';
import initSqlJs from 'sql.js';

describe('Database Initialization Fix', () => {
    let SQL: initSqlJs.SqlJsStatic;
    let db: initSqlJs.Database;

    beforeEach(async () => {
        // Cargar sql.js
        const initSqlJs = (await import('sql.js')).default;
        SQL = await initSqlJs();
        db = new SQL.Database();
    });

    it('Debe desactivar y reactivar foreign_keys durante la inicialización', async () => {
        // Espiar db.run
        const runSpy = vi.spyOn(db, 'run');

        await DatabaseInitializer.initializeWithFix(db);

        // Verificar que se llamó a PRAGMA foreign_keys
        expect(runSpy).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF;');
        expect(runSpy).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    });

    it('Debe pasar el integrity check en una base de datos nueva', async () => {
        const result = DatabaseInitializer.verifyIntegrity(db);
        expect(result).toBe(true);
    });

    it('Debe detectar violaciones de integridad si existen (simulación)', async () => {
        // Creamos tablas con FK para forzar una violación
        db.run('CREATE TABLE parents (id INTEGER PRIMARY KEY)');
        db.run('CREATE TABLE children (id INTEGER PRIMARY KEY, parent_id INTEGER, FOREIGN KEY(parent_id) REFERENCES parents(id))');

        // Desactivamos FK e insertamos basura
        db.run('PRAGMA foreign_keys = OFF');
        db.run('INSERT INTO children (id, parent_id) VALUES (1, 99)'); // 99 no existe

        // Verificamos integridad
        const result = DatabaseInitializer.verifyIntegrity(db);
        expect(result).toBe(false);
    });
});
