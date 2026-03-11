# MAPA DE INSTANCIAS DE BASE DE DATOS
Documento de referencia permanente · Todos los sprints · Marzo 2026

## 1. LAS DOS INSTANCIAS — RESUMEN EJECUTIVO

Este proyecto tiene DOS instancias de base de datos activas. No son intercambiables. Usar la instancia incorrecta produce errores silenciosos o crashes de tipo `TypeError: engine.prepare is not a function`.

| INSTANCIA | VARIABLE / CLASE | ARCHIVO FUENTE | ENTORNO |
| :--- | :--- | :--- | :--- |
| **PRODUCCIÓN** | `dbEngine` / `SQLiteEngine` | `simple-db.ts` línea 68 / `SQLiteEngine.ts` línea 9 | wa-sqlite + IndexedDB |
| **LEGACY / TESTS** | `db` | `simple-db.ts` línea 29 | sql.js en memoria |

---

## 2. INSTANCIA DE PRODUCCIÓN — `dbEngine` / `SQLiteEngine`

**INSTANCIA CORRECTA PARA PRODUCCIÓN:**
Esta es la ÚNICA instancia que debes usar en código de producción.
- **Motor:** wa-sqlite con IDBBatchAtomicVFS — persiste en IndexedDB del browser.
- **Variable exportada:** `dbEngine` → `src/database/simple-db.ts` línea 68
- **Clase implementadora:** `SQLiteEngine` → `src/core/database/SQLiteEngine.ts` línea 9

### 2.1 Métodos de `SQLiteEngine`
| PROPÓSITO | MÉTODO EXACTO | NOTAS |
| :--- | :--- | :--- |
| Query con parámetros (escritura) | `run(sql, params[])` | INSERT / UPDATE / DELETE. Usar parámetros. |
| Query con resultados (lectura) | `select(sql, params[])` | SELECT. Devuelve array de objetos. |
| DDL sin parámetros | `exec(sql)` | CREATE TABLE, DROP, PRAGMA. |
| Transacción atómica | `executeTransaction(fn)` | Varias operaciones en una sola transacción. |
| Forzar persistencia IndexedDB | `sync()` | **OBLIGATORIO** post-migraciones y post-FirstRunSetup. |
| Inicializar motor | `initialize(dbName?)` | Solo en el arranque. |

**CUÁNDO llamar `sync()`:**
1. Después de `migrationEngine.migrate(sqliteEngine)`
2. Después de `firstRunSetup.run()`

---

## 3. INSTANCIA LEGACY — `db` (sql.js)

**NO USAR EN CÓDIGO NUEVO:**
Esta instancia existe por compatibilidad histórica. NO la uses en código nuevo.
- **Motor:** sql.js — SQLite en WebAssembly, opera en memoria, sin persistencia propia.
- **Variable exportada:** `db` → `src/database/simple-db.ts` línea 29

### 3.1 Archivos que aún usan `db` (legacy)
- `src/main.tsx`
- `src/services/UserService.ts`
- `src/services/AuthService.ts`
- `src/services/accounting/AccountingService.ts`
- `src/modules/system/SystemService.ts`
- `src/services/backup/CorruptionProofBackupService.ts`
- `src/workers/database.worker.ts`

---

## 4. REGLA DE ORO — Cuál instancia usar

| CONTEXTO | INSTANCIA CORRECTA |
| :--- | :--- |
| Código de producción nuevo | `dbEngine` (`SQLiteEngine`) |
| `main.tsx` — conectar migraciones | `sqliteEngine` (vía `initDB()`) |
| `MigrationEngine.migrate()` | `engine` (`SQLiteEngine` — parámetro) |
| `FirstRunSetup` | `SQLiteEngine` — parámetro del constructor |
| Archivos `.test.ts` / `.spec.ts` | `db` (`sql.js` legacy) |
| `database.worker.ts` | `db` (`sql.js` legacy) |
| `CorruptionProofBackupService` | `db` (`sql.js` legacy) |

**Si tienes dudas: DETENTE y pregunta.**
