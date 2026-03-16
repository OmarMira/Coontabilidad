/**
 * Módulo 00 — Core / Bootstrap
 * Re-exporta las instancias y funciones de bootstrap desde simple-db.ts.
 * ⚠️ Este módulo se toca ÚLTIMO en la unificación de motores.
 * Contiene las dos instancias: db (sql.js legacy) y dbEngine (SQLiteEngine persistente).
 */

export { db, getDB, dbExec, dbRun, dbEngine, getDBEngine } from '../simple-db';
