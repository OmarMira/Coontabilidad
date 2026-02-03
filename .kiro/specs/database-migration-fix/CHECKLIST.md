# Database Migration Fix - Implementation Checklist

**Quick reference for safe implementation**

---

## 🟢 FASE 1: Archivos Nuevos (1 hora)

- [ ] **1.1** Crear `src/core/migrations/list/013_tax_transactions.ts`
  - [ ] Implementar `up()` con CREATE TABLE
  - [ ] Implementar `down()` con DROP TABLE
  - [ ] Crear 3 índices (invoice_id, transaction_date, county)
  - [ ] Verificar: `npm run build` ✅

- [ ] **1.2** Commit: `feat(db): add Migration 013 for tax_transactions`

---

## 🟡 FASE 2: MigrationEngine (30 min)

- [ ] **2.1** Abrir `src/core/migrations/MigrationEngine.ts`
  - [ ] Agregar import: `import { TaxTransactionsMigration } from './list/013_tax_transactions';`
  - [ ] Agregar al array: `TaxTransactionsMigration`
  - [ ] Verificar: `npm run build` ✅

- [ ] **2.2** Commit: `feat(db): update MigrationEngine with Migration 013`

---

## 🟡 FASE 3: Funciones Nuevas (2 horas)

- [ ] **3.1** Agregar `executeMigrations()` en `simple-db.ts`
  - [ ] Copiar implementación del IMPLEMENTATION_GUIDE
  - [ ] Ubicar DESPUÉS de imports, ANTES de initDB()
  - [ ] Verificar: `npm run build` ✅

- [ ] **3.2** Agregar `validateRequiredTables()` en `simple-db.ts`
  - [ ] Copiar implementación del IMPLEMENTATION_GUIDE
  - [ ] Ubicar DESPUÉS de executeMigrations()
  - [ ] Verificar: `npm run build` ✅

- [ ] **3.3** Commit: `feat(db): add executeMigrations and validateRequiredTables`

---

## 🔴 FASE 4: Modificar initDB() (1 hora)

- [ ] **4.1** Buscar en `simple-db.ts`: `dbEngine.setDB(db);`
  - [ ] Agregar DESPUÉS: `await executeMigrations(dbEngine);`
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `feat(db): integrate executeMigrations into initDB`

- [ ] **4.2** Buscar: `DatabaseInitializer.initializeWithFix(db);`
  - [ ] Agregar DESPUÉS: `await validateRequiredTables(dbEngine);`
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `feat(db): add table validation to initDB`

- [ ] **4.3** CHECKPOINT: Probar aplicación
  - [ ] Limpiar localStorage
  - [ ] Ejecutar app
  - [ ] Verificar consola: "All migrations completed successfully"
  - [ ] Verificar consola: "Versión actual: 13"
  - [ ] Verificar: No errores ✅

---

## 🔴 FASE 5: Refactorizar initializeSchema() (3-4 horas)

### Paso 1: Renombrar (30 min)

- [ ] **5.1** Buscar: `function initializeSchema(`
  - [ ] Cambiar a: `function initializeLegacyTables(`
  - [ ] Buscar todas las llamadas y actualizar
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): rename initializeSchema to initializeLegacyTables`

### Paso 2: Agregar Comentario (10 min)

- [ ] **5.2** Agregar comentario JSDoc explicativo
  - [ ] Listar qué migrations cubren qué tablas
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `docs(db): document legacy tables vs migrations`

### Paso 3: Eliminar Duplicados (2-3 horas)

**⚠️ CRÍTICO: Una tabla a la vez, commit después de cada una**

- [ ] **5.3** Eliminar CREATE TABLE customers
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate customers table (covered by Migration 001)`

- [ ] **5.4** Eliminar CREATE TABLE suppliers
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate suppliers table (covered by Migration 001)`

- [ ] **5.5** Eliminar CREATE TABLE products
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate products table (covered by Migration 001)`

- [ ] **5.6** Eliminar CREATE TABLE invoices
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate invoices table (covered by Migration 001)`

- [ ] **5.7** Eliminar CREATE TABLE payments
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate payments table (covered by Migration 001)`

- [ ] **5.8** Eliminar tablas de inventario (Migration 003)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate inventory tables (covered by Migration 003)`

- [ ] **5.9** Eliminar tablas de compras (Migration 004)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate purchasing tables (covered by Migration 004)`

- [ ] **5.10** Eliminar chart_of_accounts, journal_entries (Migration 005)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate accounting tables (covered by Migration 005)`

- [ ] **5.11** Eliminar users, user_roles, audit_trail (Migration 006)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate system tables (covered by Migration 006)`

- [ ] **5.12** Eliminar florida_tax_rates (Migration 009)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate florida_tax_rates (covered by Migration 009)`

- [ ] **5.13** Eliminar fixed_assets, asset_depreciation, asset_categories (Migration 011)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate asset tables (covered by Migration 011)`

- [ ] **5.14** Eliminar budgets, budget_items (Migration 012)
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `refactor(db): remove duplicate budget tables (covered by Migration 012)`

- [ ] **5.15** CHECKPOINT: Probar aplicación
  - [ ] Limpiar localStorage
  - [ ] Ejecutar app
  - [ ] Verificar: Todas las tablas existen ✅
  - [ ] Verificar: No errores ✅

---

## 🟡 FASE 6: Conflictos Florida Tax (1 hora)

- [ ] **6.1** Modificar `src/database/DatabaseService.ts`
  - [ ] Buscar y eliminar: CREATE TABLE florida_tax_config
  - [ ] Cambiar referencias a: florida_tax_rates
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `fix(db): remove florida_tax_config from DatabaseService`

- [ ] **6.2** Modificar `src/database/EmergencyInitializer.ts`
  - [ ] Buscar y eliminar: CREATE TABLE florida_tax_config
  - [ ] Cambiar referencias a: florida_tax_rates
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `fix(db): remove florida_tax_config from EmergencyInitializer`

- [ ] **6.3** Buscar en todo el codebase
  - [ ] `grep -r "florida_tax_config" src/`
  - [ ] Cambiar todas las referencias a: florida_tax_rates
  - [ ] Verificar: `npm run build` ✅
  - [ ] Commit: `fix(db): standardize on florida_tax_rates table name`

---

## 🧪 FASE 7: Testing Final (1 hora)

- [ ] **7.1** Build de producción
  - [ ] `npm run build`
  - [ ] Verificar: 0 errores TypeScript ✅
  - [ ] Verificar: No console.log en dist/ ✅

- [ ] **7.2** Test: Primera inicialización
  - [ ] Limpiar localStorage completamente
  - [ ] Ejecutar aplicación
  - [ ] Verificar consola: "All migrations completed successfully"
  - [ ] Verificar consola: "Versión actual: 13"
  - [ ] Verificar: sys_migrations tiene 13 registros ✅

- [ ] **7.3** Test: Tablas requeridas
  - [ ] Abrir DevTools → Application → IndexedDB
  - [ ] Verificar existen:
    - [ ] sys_migrations ✅
    - [ ] fixed_assets ✅
    - [ ] asset_depreciation ✅
    - [ ] florida_tax_rates ✅
    - [ ] tax_transactions ✅
    - [ ] budgets ✅

- [ ] **7.4** Test: IRON CORE VERIFICATION
  - [ ] Ejecutar verificación
  - [ ] Verificar: 100% compliance ✅
  - [ ] Verificar: No errores de tablas faltantes ✅

- [ ] **7.5** Test: Funcionalidad básica
  - [ ] Crear un cliente ✅
  - [ ] Crear una factura ✅
  - [ ] Crear un activo fijo ✅
  - [ ] Verificar: Todo funciona sin errores ✅

---

## 🎉 FASE 8: Finalización

- [ ] **8.1** Actualizar PROGRESS.md
  - [ ] Marcar todas las tareas como completadas
  - [ ] Actualizar métricas de compliance a 100%

- [ ] **8.2** Commit final
  - [ ] `git commit -m "feat(db): complete database migration system integration"`

- [ ] **8.3** Push a GitHub
  - [ ] `git push origin main`
  - [ ] Verificar CI/CD pasa ✅

---

## 🚨 PLAN DE EMERGENCIA

### Si algo falla:

1. **STOP** - No hacer más cambios
2. **Verificar error:** `npm run build`
3. **Revertir:** `git checkout HEAD -- <archivo>`
4. **Verificar:** `npm run build` debe pasar
5. **Analizar** qué salió mal
6. **Reintentar** con más cuidado

### Puntos de restauración:

Cada commit es un punto de restauración seguro. Si algo falla:
```bash
git log --oneline  # Ver commits recientes
git reset --hard <commit-hash>  # Volver a un commit seguro
```

---

## 📊 PROGRESO

**Tiempo estimado total:** 8-9 horas

- [ ] Fase 1: Archivos Nuevos (1h)
- [ ] Fase 2: MigrationEngine (0.5h)
- [ ] Fase 3: Funciones Nuevas (2h)
- [ ] Fase 4: Modificar initDB() (1h)
- [ ] Fase 5: Refactorizar initializeSchema() (3-4h)
- [ ] Fase 6: Conflictos Florida Tax (1h)
- [ ] Fase 7: Testing Final (1h)
- [ ] Fase 8: Finalización (0.5h)

**Inicio:** ___________  
**Fin:** ___________  
**Tiempo real:** ___________

---

**Última actualización:** 2026-02-03  
**Estado:** ✅ Listo para implementación
