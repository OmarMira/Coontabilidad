# Design Document - Fixed Assets Bug Fix

## Overview

Este documento describe el diseño de la solución para corregir el bug crítico en el módulo de Fixed Assets. El problema raíz es que `FixedAssetService` y otros servicios esperan una instancia de `SQLiteEngine` con métodos tipados (`select()`, `run()`), pero reciben una instancia raw de `sql.js` (tipo `any`) que no tiene estos métodos.

La solución consiste en:
1. Crear y exportar una instancia de `SQLiteEngine` desde `simple-db.ts`
2. Actualizar `getFixedAssetsController()` para aceptar ambos tipos
3. Mantener compatibilidad con código existente

## Architecture

### Current Architecture (Broken)

```
FixedAssetsManager.tsx
  ↓ (pasa db: any)
getFixedAssetsController(db)
  ↓ (crea)
FixedAssetsController(db: SQLiteEngine) ❌ Type mismatch
  ↓ (crea)
FixedAssetService(db: SQLiteEngine)
  ↓ (llama)
this.db.select() ❌ Error: "this.db.select is not a function"
```

### Proposed Architecture (Fixed)

```
simple-db.ts
  ├─ db: any (sql.js instance) - Para compatibilidad
  └─ dbEngine: SQLiteEngine (wrapper) - Para servicios tipados

FixedAssetsManager.tsx
  ↓ (pasa db o dbEngine)
getFixedAssetsController(db: any | SQLiteEngine)
  ↓ (convierte si es necesario)
FixedAssetsController(dbEngine: SQLiteEngine) ✅
  ↓ (crea)
FixedAssetService(dbEngine: SQLiteEngine) ✅
  ↓ (llama)
this.dbEngine.select() ✅ Funciona correctamente
```

## Components and Interfaces

### 1. simple-db.ts Updates

**Exports to Add:**
```typescript
// Nueva exportación de SQLiteEngine
export let dbEngine: SQLiteEngine | null = null;

// Nueva función para obtener dbEngine
export const getDBEngine = (): SQLiteEngine => {
  if (!dbEngine) {
    throw new Error('Database engine not initialized');
  }
  return dbEngine;
};
```

**Initialization Update:**
```typescript
export async function initDB() {
  // ... código existente de inicialización sql.js ...
  
  // Crear instancia de SQLiteEngine
  dbEngine = new SQLiteEngine(db);
  
  // ... resto del código ...
}
```

### 2. FixedAssetsController Updates

**Constructor Signature:**
```typescript
constructor(db: any | SQLiteEngine) {
  // Convertir a SQLiteEngine si es necesario
  const engine = db instanceof SQLiteEngine ? db : new SQLiteEngine(db);
  
  this.categoryService = new AssetCategoryService(engine);
  this.assetService = new FixedAssetService(engine);
  this.depreciationService = new DepreciationService(engine);
  this.disposalService = new AssetDisposalService(engine);
}
```

**getFixedAssetsController Update:**
```typescript
export function getFixedAssetsController(db: any | SQLiteEngine): FixedAssetsController {
  // Resetear singleton si db cambió
  if (!fixedAssetsControllerInstance || 
      (db instanceof SQLiteEngine && fixedAssetsControllerInstance['db'] !== db)) {
    fixedAssetsControllerInstance = new FixedAssetsController(db);
  }
  return fixedAssetsControllerInstance;
}
```

### 3. Component Updates (Optional)

**FixedAssetsManager.tsx:**
```typescript
// Opción 1: Usar dbEngine directamente (recomendado)
import { dbEngine } from '@/database/simple-db';
const controller = getFixedAssetsController(dbEngine!);

// Opción 2: Mantener db (funciona por conversión automática)
import { db } from '@/database/simple-db';
const controller = getFixedAssetsController(db); // Se convierte automáticamente
```

## Data Models

No se requieren cambios en los modelos de datos. Los tipos existentes (`FixedAsset`, `AssetCategory`, etc.) permanecen sin cambios.

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer.*

### Property 1: Backward Compatibility

*For any* código existente que usa `db` directamente, después de la corrección del bug, el código debe continuar funcionando sin errores.

**Validates: Requirements 1.3, 3.2**

### Property 2: Controller Accepts Both Types

*For any* llamada a `getFixedAssetsController()` con `db` (sql.js) o `dbEngine` (SQLiteEngine), el controlador debe inicializarse correctamente y los servicios deben funcionar.

**Validates: Requirements 4.1**

### Property 3: Singleton Pattern Maintained

*For any* secuencia de llamadas a `getFixedAssetsController()` con la misma instancia de db, todas las llamadas deben retornar la misma instancia del controlador.

**Validates: Requirements 4.3**

### Property 4: CRUD Operations Work

*For any* operación CRUD válida (create, read, update, delete) en activos fijos, la operación debe completarse exitosamente sin errores de "function not defined".

**Validates: Requirements 5.2**

## Error Handling

### Error Scenarios

1. **Database Not Initialized:**
   - Error: `getDBEngine()` llamado antes de `initDB()`
   - Handling: Throw error con mensaje claro
   - Recovery: Llamar `initDB()` primero

2. **Invalid DB Instance:**
   - Error: `getFixedAssetsController()` recibe null o undefined
   - Handling: Throw error con mensaje claro
   - Recovery: Pasar instancia válida

3. **SQL Execution Errors:**
   - Error: Consulta SQL inválida
   - Handling: SQLiteEngine propaga error de sql.js
   - Recovery: Corregir consulta SQL

### Error Messages

```typescript
// Database not initialized
"Database engine not initialized. Call initDB() first."

// Invalid db instance
"Invalid database instance provided to FixedAssetsController"

// SQL error (propagated from sql.js)
"SQL Error: [original error message]"
```

## Testing Strategy

### Unit Tests

**Test File:** `tests/fixed-assets-bug-fix.test.ts`

1. **Test: dbEngine is exported**
   - Verify `dbEngine` export exists
   - Verify it's an instance of SQLiteEngine after initDB()

2. **Test: getDBEngine() works**
   - Verify function returns SQLiteEngine instance
   - Verify throws error if not initialized

3. **Test: Controller accepts sql.js instance**
   - Create controller with raw db
   - Verify services are created correctly

4. **Test: Controller accepts SQLiteEngine instance**
   - Create controller with dbEngine
   - Verify services are created correctly

5. **Test: FixedAssetService.select() works**
   - Call select() method
   - Verify returns results without error

6. **Test: FixedAssetService.run() works**
   - Call run() method
   - Verify executes without error

7. **Test: Depreciation batch runs**
   - Execute monthly depreciation
   - Verify completes without database errors

### Property-Based Tests

**Test File:** `tests/fixed-assets-bug-fix.property.test.ts`

1. **Property 1: Backward Compatibility**
   - Generate random SQL queries
   - Execute with both `db` and `dbEngine`
   - Verify same results

2. **Property 2: Controller Accepts Both Types**
   - Generate random db instances (sql.js and SQLiteEngine)
   - Create controller with each
   - Verify all operations work

3. **Property 3: Singleton Pattern**
   - Call getFixedAssetsController() multiple times
   - Verify same instance returned

4. **Property 4: CRUD Operations**
   - Generate random asset data
   - Execute CRUD operations
   - Verify all complete successfully

### Integration Tests

**Manual Testing Checklist:**

1. ✅ Load FixedAssetsManager component
2. ✅ Verify no "this.db.select is not a function" error
3. ✅ Create new asset
4. ✅ View asset details
5. ✅ Update asset
6. ✅ Run depreciation batch
7. ✅ Dispose asset
8. ✅ View reports

## Implementation Notes

### Migration Strategy

1. **Phase 1: Add dbEngine export** (No breaking changes)
   - Add `dbEngine` and `getDBEngine()` to simple-db.ts
   - Initialize in `initDB()`
   - Existing code continues to work

2. **Phase 2: Update controller** (No breaking changes)
   - Update `FixedAssetsController` to accept both types
   - Update `getFixedAssetsController()` to handle conversion
   - Existing code continues to work

3. **Phase 3: Update components** (Optional, gradual)
   - Update components to use `dbEngine` directly
   - Can be done gradually, component by component
   - Old code continues to work during transition

### Performance Considerations

- **SQLiteEngine wrapper:** Minimal overhead (simple method delegation)
- **Type conversion:** Only happens once during controller initialization
- **Singleton pattern:** Prevents multiple controller instances

### Security Considerations

- No security implications (internal refactoring only)
- Same SQL injection protections as before
- Same access control as before

---

**Documento creado:** 2026-02-02  
**Autor:** Kiro AI Assistant  
**Versión:** 1.0  
**Estado:** ✅ COMPLETO
