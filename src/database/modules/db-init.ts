/**
 * Módulo 02 — Inicialización y Schema
 * Re-exporta desde simple-db.ts — initializeSchema (~1750 líneas) permanece
 * en simple-db.ts hasta que todos los módulos estén migrados al motor persistente.
 * ⚠️ CRÍTICO: No mover initializeSchema hasta validación completa del sistema.
 */

export { resetDB, initDB } from '../simple-db';
