# 🔍 Diagnóstico: Error "no such column: purchase_cost"

**Fecha**: 7 de febrero de 2026  
**Error**: `no such column: purchase_cost` en Gestión de Activos Fijos

---

## 📋 ANÁLISIS DEL PROBLEMA

### Error Reportado
```
Error
no such column: purchase_cost
```

### Ubicación del Error
- **Componente**: `src/components/assets/FixedAssetsManager.tsx`
- **Línea**: 349 (tabla de activos)
- **Contexto**: Al intentar mostrar el costo de compra de los activos

---

## 🔎 INVESTIGACIÓN

### 1. Estructura de la Tabla `fixed_assets`

Según la migración `011_fixed_assets_schema.ts`, la tabla DEBE tener:

```sql
CREATE TABLE IF NOT EXISTS fixed_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag TEXT NOT NULL UNIQUE,
    asset_name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    
    -- Purchase details (INTEGER cents for monetary values)
    purchase_date DATE NOT NULL,
    purchase_cost INTEGER NOT NULL CHECK(purchase_cost > 0),  ← ESTA COLUMNA EXISTE
    salvage_value INTEGER DEFAULT 0,
    vendor_id INTEGER,
    ...
)
```

### 2. Código del Servicio

El servicio `FixedAssetService.ts` usa correctamente `purchase_cost`:

```typescript
async getAssetSummary(): Promise<{...}> {
    const result = await this.db.select(`
        SELECT 
            ...
            COALESCE(SUM(purchase_cost), 0) as total_cost,  ← CORRECTO
            ...
        FROM fixed_assets
        WHERE status != 'DISPOSED'
    `);
}
```

### 3. Código del Componente

El componente también usa correctamente `purchase_cost`:

```typescript
<td className="py-3 px-4 text-sm text-right font-mono">
    ${((asset.purchase_cost || 0) / 100).toFixed(2)}  ← CORRECTO (con fallback)
</td>
```

---

## 🎯 POSIBLES CAUSAS

### Causa 1: Migración No Ejecutada ⚠️
La migración `011_fixed_assets_schema.ts` no se ha ejecutado en la base de datos actual.

**Solución**:
```typescript
// Ejecutar migraciones pendientes
import { MigrationEngine } from './core/migrations/MigrationEngine';
const migrationEngine = new MigrationEngine(db);
await migrationEngine.runPendingMigrations();
```

### Causa 2: Tabla Antigua Existe 🔴
Existe una versión antigua de la tabla `fixed_assets` sin la columna `purchase_cost`.

**Verificación**:
```sql
-- Ver estructura de la tabla
PRAGMA table_info(fixed_assets);
```

**Solución**:
```sql
-- Opción A: Agregar columna faltante
ALTER TABLE fixed_assets ADD COLUMN purchase_cost INTEGER NOT NULL DEFAULT 0;

-- Opción B: Recrear tabla (PELIGRO: pierde datos)
DROP TABLE fixed_assets;
-- Luego ejecutar migración
```

### Causa 3: Base de Datos Corrupta 💥
La base de datos está corrupta o no se inicializó correctamente.

**Solución**:
```typescript
// Reinicializar base de datos
import { initDB } from './database/simple-db';
await initDB();
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Cambio en el Componente

Agregué validación defensiva para evitar el crash:

```typescript
// ANTES (crasheaba si purchase_cost no existe)
${(asset.purchase_cost / 100).toFixed(2)}

// DESPUÉS (maneja el caso de columna faltante)
${((asset.purchase_cost || 0) / 100).toFixed(2)}
```

**Archivo modificado**: `src/components/assets/FixedAssetsManager.tsx`

---

## 🔧 PASOS PARA RESOLVER COMPLETAMENTE

### Paso 1: Verificar Estado de Migraciones

```typescript
// En consola del navegador o Node.js
import { MigrationEngine } from './core/migrations/MigrationEngine';
import { db } from './database/simple-db';

const engine = new MigrationEngine(db);
const status = await engine.getMigrationStatus();
console.log('Migraciones:', status);
```

### Paso 2: Ejecutar Migraciones Pendientes

```typescript
await engine.runPendingMigrations();
```

### Paso 3: Verificar Estructura de Tabla

```sql
-- En SQL
PRAGMA table_info(fixed_assets);

-- Debe mostrar:
-- purchase_cost | INTEGER | 1 | NULL | 0
```

### Paso 4: Si la Columna No Existe, Agregarla

```sql
ALTER TABLE fixed_assets ADD COLUMN purchase_cost INTEGER NOT NULL DEFAULT 0;
```

### Paso 5: Actualizar Datos Existentes (si aplica)

```sql
-- Si hay activos con acquisition_cost en lugar de purchase_cost
UPDATE fixed_assets 
SET purchase_cost = acquisition_cost 
WHERE purchase_cost = 0 AND acquisition_cost IS NOT NULL;
```

---

## 🚨 ADVERTENCIAS

1. **NO ejecutar DROP TABLE** si hay datos importantes
2. **Hacer backup** antes de modificar estructura
3. **Verificar migraciones** antes de ejecutar en producción
4. **Probar en desarrollo** primero

---

## 📊 ESTADO ACTUAL

- ✅ Componente protegido contra crash (fallback a 0)
- ⚠️ Causa raíz sin resolver (migración pendiente)
- 🔄 Requiere verificación de base de datos

---

## 🎯 PRÓXIMOS PASOS

1. Verificar si la migración `011_fixed_assets_schema.ts` se ejecutó
2. Si no, ejecutar migraciones pendientes
3. Si la tabla existe pero sin la columna, agregar columna
4. Probar que el módulo funciona correctamente
5. Documentar el proceso de migración

---

## 📝 NOTAS TÉCNICAS

### Diferencia entre `acquisition_cost` y `purchase_cost`

- **`acquisition_cost`**: Nombre usado en `simple-db.ts` (tabla antigua)
- **`purchase_cost`**: Nombre usado en migración nueva (tabla moderna)

**Posible conflicto**: Dos esquemas diferentes coexistiendo.

### Solución de Compatibilidad

Opción 1: Usar alias en SQL
```sql
SELECT 
    purchase_cost as acquisition_cost,
    acquisition_cost as purchase_cost
FROM fixed_assets
```

Opción 2: Migrar datos
```sql
UPDATE fixed_assets 
SET purchase_cost = acquisition_cost 
WHERE purchase_cost IS NULL;
```

---

**Documentado por**: Kiro AI  
**Fecha**: 7 de febrero de 2026  
**Archivo**: `DIAGNOSTICO_ACTIVOS_FIJOS.md`
