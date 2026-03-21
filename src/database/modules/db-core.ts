/**
 * Módulo 00 — Core / Bootstrap
 * Re-exporta las instancias y funciones de bootstrap desde simple-db.ts.
 * ⚠️ Este módulo se toca ÚLTIMO en la unificación de motores.
 * Contiene las dos instancias: db (sql.js legacy) y dbEngine (SQLiteEngine persistente).
 */

export { db, getDB, dbExec, dbRun, dbEngine, getDBEngine } from '../simple-db';
export const DB_NAME = 'accountexpress.db';

export const PRIVILEGED_ROLES = ['admin', 'contador', 'auditor', 'viewer', 'accountant'];

export function rowToEntity<T>(columns: string[], row: any[]): T {
  const entity = {} as Record<string, unknown>;
  columns.forEach((col, index) => {
    entity[col] = row[index];
  });
  return entity as unknown as T;
}
