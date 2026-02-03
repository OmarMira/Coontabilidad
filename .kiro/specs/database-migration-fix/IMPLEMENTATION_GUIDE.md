# Database Migration Fix - Implementation Guide

**Created:** 2026-02-03  
**Purpose:** Safe implementation guide after file corruption recovery

---

## 🎯 OBJETIVO

Integrar el MigrationEngine existente en el flujo de inicialización de la base de datos para resolver el problema crítico de tablas faltantes (`sys_migrations`, `fixed_assets`, `asset_depreciation`, `florida_tax_config`, `tax_transactions`).

---

## ⚠️ LECCIONES APRENDIDAS DE LA CORRUPCIÓN

### Qué Salió Mal:
1. Intento de eliminar código legacy en `simple-db.ts` (2000+ líneas)
2. Operación de strReplace falló dejando sintaxis inválida
3. Miles de errores de TypeScript
4. Necesario restaurar desde Git

### Cómo Prevenir:
1. ✅ **Cambios incrementales** - Un cambio pequeño a la vez
2. ✅ **Verificar después de cada cambio** - `npm run build` o getDiagnostics
3. ✅ **Commit frecuente** - Puntos de restauración seguros
4. ✅ **Archivos nuevos primero** - Menos riesgo que modificar existentes
5. ✅ **Contexto único en strReplace** - Suficientes líneas para uniqueness

---

## 📋 ORDEN DE IMPLEMENTACIÓN SEGURO

### FASE 1: Archivos Nuevos (Bajo Riesgo) ✅

#### Task 1: Crear Migration 013
**Archivo:** `src/core/migrations/list/013_tax_transactions.ts` (NUEVO)

**Riesgo:** 🟢 Bajo - Archivo nuevo, no afecta código existente

**Implementación:**
```typescript
import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const TaxTransactionsMigration: Migration = {
    version: 13,
    name: 'Tax Transactions Table',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 013: Creating tax_transactions table...');
        
        await db.exec(`
            CREATE TABLE IF NOT EXISTS tax_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                transaction_date DATE NOT NULL,
                county TEXT NOT NULL,
                taxable_amount INTEGER NOT NULL,
                state_tax_amount INTEGER NOT NULL,
                county_tax_amount INTEGER NOT NULL,
                total_tax_amount INTEGER NOT NULL,
                state_rate REAL NOT NULL,
                county_rate REAL NOT NULL,
                total_rate REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);

        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_invoice ON tax_transactions(invoice_id)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_date ON tax_transactions(transaction_date)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_county ON tax_transactions(county)`);

        console.log('✅ Migration 013: tax_transactions table created');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 013: Dropping tax_transactions table...');
        await db.exec(`DROP TABLE IF EXISTS tax_transactions`);
        console.log('✅ Migration 013: Rollback complete');
    }
};
```

**Verificación:**
```bash
npm run build
# Debe compilar sin errores
```

---

### FASE 2: Modificaciones Simples (Riesgo Medio) ✅

#### Task 2: Actualizar MigrationEngine
**Archivo:** `src/core/migrations/MigrationEngine.ts`

**Riesgo:** 🟡 Medio - Archivo existente pero cambio simple

**Cambios:**
1. Agregar import al inicio del archivo
2. Agregar entry al array de migrations

**Implementación:**
```typescript
// Al inicio del archivo, después de otros imports
import { TaxTransactionsMigration } from './list/013_tax_transactions';

// En el constructor o donde se define el array
private migrations: Migration[] = [
    InitialSchemaMigration,
    AIViewsMigration,
    InventorySchemaMigration,
    PurchasingSchemaMigration,
    AccountingSchemaMigration,
    SystemSchemaMigration,
    CurrencyFixAndFiscalMigration,
    new HistoricalDataFixMigration(),
    new PerformanceIndicesMigration(),
    MultiUserSchemaMigration,
    FixedAssetsSchema,
    BudgetsSchema,
    TaxTransactionsMigration  // ✅ NUEVO
];
```

**Verificación:**
```bash
npm run build
# Verificar que migrations.length === 13
```

---

### FASE 3: Funciones Nuevas en simple-db.ts (Riesgo Medio) ⚠️

#### Task 3: Agregar executeMigrations()
**Archivo:** `src/database/simple-db.ts`

**Riesgo:** 🟡 Medio - Agregar función nueva (no modificar existentes)

**Ubicación:** Después de las importaciones, antes de initDB()

**Implementación:**
```typescript
/**
 * Execute all pending database migrations
 * @throws Error if migrations fail
 */
async function executeMigrations(engine: SQLiteEngine): Promise<void> {
  try {
    logger.info('Database', 'migrations_start', 'Ejecutando migraciones de base de datos...');
    
    const migrationEngine = MigrationEngine.getInstance();
    await migrationEngine.migrate(engine);
    
    // Get final version
    const version = await engine.select('SELECT MAX(version) as version FROM sys_migrations');
    const currentVersion = version[0]?.version || 0;
    
    logger.info('Database', 'migrations_complete', `Migraciones completadas. Versión actual: ${currentVersion}`);
  } catch (error: any) {
    logger.error('Database', 'migrations_failed', 'Error crítico en migraciones', { error: error.message });
    throw new Error(`Database migration failed: ${error.message}`);
  }
}
```

**Verificación:**
```bash
npm run build
# Verificar que no hay errores de sintaxis
```

#### Task 4: Agregar validateRequiredTables()
**Archivo:** `src/database/simple-db.ts`

**Riesgo:** 🟡 Medio - Agregar función nueva

**Ubicación:** Después de executeMigrations()

**Implementación:**
```typescript
/**
 * Validate that all required tables exist after initialization
 * @throws Error if any required table is missing
 */
async function validateRequiredTables(engine: SQLiteEngine): Promise<void> {
  logger.info('Database', 'validation_start', 'Validando tablas requeridas...');
  
  const requiredTables = [
    'sys_migrations',
    'customers',
    'suppliers',
    'products',
    'invoices',
    'chart_of_accounts',
    'journal_entries',
    'fixed_assets',
    'asset_depreciation',
    'asset_categories',
    'florida_tax_rates',
    'tax_transactions',
    'budgets',
    'budget_items',
    'users',
    'user_roles'
  ];
  
  const missingTables: string[] = [];
  
  for (const tableName of requiredTables) {
    const result = await engine.select(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    
    if (result.length === 0) {
      missingTables.push(tableName);
    }
  }
  
  if (missingTables.length > 0) {
    const errorMsg = `Missing required tables: ${missingTables.join(', ')}`;
    logger.error('Database', 'validation_failed', errorMsg);
    throw new Error(errorMsg);
  }
  
  logger.info('Database', 'validation_complete', `Validación exitosa. ${requiredTables.length} tablas verificadas.`);
}
```

**Verificación:**
```bash
npm run build
```

---

### FASE 4: Modificar initDB() (Alto Riesgo) 🔴

#### Task 7: Integrar migrations en initDB()
**Archivo:** `src/database/simple-db.ts`

**Riesgo:** 🔴 Alto - Modificar función crítica existente

**Estrategia:** Cambios mínimos, uno a la vez

**Paso 1:** Agregar llamada a executeMigrations()

Buscar la sección donde se crea dbEngine:
```typescript
// Crear instancia de SQLiteEngine
dbEngine = new SQLiteEngine();
dbEngine.setDB(db);
logger.info('Database', 'engine_initialized', 'SQLiteEngine wrapper creado exitosamente');
```

Agregar DESPUÉS de esa sección:
```typescript
// ✅ NEW: Execute migrations FIRST
await executeMigrations(dbEngine);
```

**Verificación después del Paso 1:**
```bash
npm run build
# Si falla, revertir inmediatamente
```

**Paso 2:** Agregar llamada a validateRequiredTables()

Buscar la sección después de DatabaseInitializer:
```typescript
await DatabaseInitializer.initializeWithFix(db);
```

Agregar DESPUÉS:
```typescript
// ✅ NEW: Validate all required tables exist
await validateRequiredTables(dbEngine);
```

**Verificación después del Paso 2:**
```bash
npm run build
```

---

### FASE 5: Renombrar y Limpiar (Alto Riesgo) 🔴

#### Task 5 & 6: Refactorizar initializeSchema()

**Riesgo:** 🔴 Alto - Modificar función grande con muchas dependencias

**Estrategia:** Hacer en múltiples commits pequeños

**Paso 1:** Solo renombrar la función
- Buscar `function initializeSchema(`
- Cambiar a `function initializeLegacyTables(`
- Buscar todas las llamadas a `initializeSchema(` y cambiar a `initializeLegacyTables(`

**Verificación:**
```bash
npm run build
```

**Paso 2:** Agregar comentario explicativo
```typescript
/**
 * Initialize legacy tables that are not yet covered by migrations
 * This function will be phased out as more migrations are created
 * 
 * Current migrations cover:
 * - 001: customers, suppliers, products, invoices, payments, etc.
 * - 003: inventory tables
 * - 004: purchasing tables
 * - 005: accounting/chart_of_accounts
 * - 006: system tables (users, roles, audit)
 * - 007: fiscal year, currency fixes
 * - 008: historical data fixes
 * - 009: florida_tax_rates
 * - 010: multi-user schema
 * - 011: fixed_assets, asset_depreciation, asset_categories
 * - 012: budgets
 * - 013: tax_transactions
 */
async function initializeLegacyTables(db: any): Promise<void> {
  // ... existing code ...
}
```

**Paso 3:** Eliminar tablas duplicadas (UNA A LA VEZ)

**NO HACER TODO DE UNA VEZ** - Esto causó la corrupción anterior

En su lugar, eliminar una tabla a la vez y verificar:

1. Eliminar CREATE TABLE customers
2. `npm run build` - verificar
3. Commit
4. Eliminar CREATE TABLE suppliers
5. `npm run build` - verificar
6. Commit
7. ... repetir para cada tabla

**Tablas a eliminar (una por una):**
- customers, suppliers, products, invoices, payments (Migration 001)
- inventory tables (Migration 003)
- purchasing tables (Migration 004)
- chart_of_accounts, journal_entries (Migration 005)
- users, user_roles, audit_trail (Migration 006)
- florida_tax_rates (Migration 009)
- fixed_assets, asset_depreciation, asset_categories (Migration 011)
- budgets, budget_items (Migration 012)

---

### FASE 6: Resolver Conflictos Florida Tax (Medio Riesgo) 🟡

#### Tasks 9-12: Estandarizar en florida_tax_rates

**Decisión:** Usar `florida_tax_rates` (ya existe en Migration 009)

**Archivos a modificar:**
1. `src/database/DatabaseService.ts`
2. `src/database/EmergencyInitializer.ts`
3. `src/database/simple-db.ts`

**Estrategia:** Un archivo a la vez, commit después de cada uno

**Para cada archivo:**
1. Buscar `florida_tax_config`
2. Eliminar CREATE TABLE florida_tax_config
3. Cambiar referencias a `florida_tax_rates`
4. `npm run build` - verificar
5. Commit

---

## 🧪 TESTING STRATEGY

### Después de Cada Fase:

1. **Build Check:**
   ```bash
   npm run build
   ```

2. **Type Check:**
   ```bash
   npx tsc --noEmit
   ```

3. **Diagnostics:**
   Usar getDiagnostics tool en archivos modificados

### Checkpoints Críticos:

**Checkpoint 1:** Después de Fase 3
- Verificar que executeMigrations() y validateRequiredTables() compilan
- NO continuar si hay errores

**Checkpoint 2:** Después de Fase 4
- Limpiar localStorage del navegador
- Ejecutar aplicación
- Verificar que migrations se ejecutan
- Verificar que no hay errores en consola

**Checkpoint 3:** Después de Fase 5
- Verificar que no hay tablas duplicadas
- Ejecutar aplicación
- Verificar IRON CORE VERIFICATION pasa

---

## 🚨 PLAN DE EMERGENCIA

### Si Algo Sale Mal:

1. **NO PÁNICO** - No hacer más cambios
2. **Verificar el error:**
   ```bash
   npm run build
   # Leer el error completo
   ```
3. **Revertir el último cambio:**
   ```bash
   git checkout HEAD -- <archivo-con-problema>
   ```
4. **Verificar que funciona:**
   ```bash
   npm run build
   ```
5. **Analizar qué salió mal** antes de reintentar

### Puntos de Restauración:

Hacer commit después de cada fase exitosa:
- `git commit -m "feat(db): add Migration 013 for tax_transactions"`
- `git commit -m "feat(db): update MigrationEngine with Migration 013"`
- `git commit -m "feat(db): add executeMigrations and validateRequiredTables"`
- `git commit -m "feat(db): integrate migrations into initDB"`
- `git commit -m "refactor(db): rename initializeSchema to initializeLegacyTables"`
- `git commit -m "refactor(db): remove duplicate table creation (customers)"`
- ... etc.

---

## 📊 MÉTRICAS DE ÉXITO

### Criterios de Aceptación:

✅ **Build exitoso:**
```bash
npm run build
# 0 errores TypeScript
```

✅ **Migrations ejecutan:**
- Limpiar localStorage
- Ejecutar app
- Verificar en consola: "All migrations completed successfully"
- Verificar en consola: "Versión actual: 13"

✅ **Tablas existen:**
- Abrir DevTools → Application → IndexedDB
- Verificar que existen:
  - sys_migrations (con 13 registros)
  - fixed_assets
  - asset_depreciation
  - florida_tax_rates (NO florida_tax_config)
  - tax_transactions
  - budgets

✅ **IRON CORE VERIFICATION pasa:**
- Ejecutar verificación
- Verificar 100% compliance
- No errores de tablas faltantes

✅ **No console.log en producción:**
```bash
npm run build
grep -r "console.log" dist/
# Debe retornar vacío o solo console.error
```

---

## 🎯 RESUMEN

### Orden de Implementación:
1. ✅ Crear Migration 013 (nuevo archivo)
2. ✅ Actualizar MigrationEngine (cambio simple)
3. ⚠️ Agregar executeMigrations() (función nueva)
4. ⚠️ Agregar validateRequiredTables() (función nueva)
5. 🔴 Modificar initDB() (cambios mínimos)
6. 🔴 Refactorizar initializeSchema() (incremental)
7. 🟡 Resolver conflictos Florida (un archivo a la vez)

### Principios Clave:
- **Incremental:** Un cambio pequeño a la vez
- **Verificación:** Build después de cada cambio
- **Commits:** Puntos de restauración frecuentes
- **Paciencia:** No apresurarse, especialmente en Fase 5

### Tiempo Estimado:
- Fase 1-2: 1 hora
- Fase 3-4: 2 horas
- Fase 5: 3-4 horas (la más delicada)
- Fase 6: 1 hora
- Testing: 1 hora
- **Total: 8-9 horas**

---

**Documento creado:** 2026-02-03  
**Autor:** Kiro AI Assistant  
**Propósito:** Guía segura para reimplementación después de corrupción
