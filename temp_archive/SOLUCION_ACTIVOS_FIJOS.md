# ✅ Solución: Error "no such column: purchase_cost"

**Fecha**: 7 de febrero de 2026  
**Estado**: 🔧 SOLUCIÓN IDENTIFICADA

---

## 🎯 PROBLEMA IDENTIFICADO

Existen **DOS esquemas diferentes** para la tabla `fixed_assets`:

### Esquema 1: Antiguo (en `simple-db.ts`)
```typescript
export interface FixedAsset {
  id?: number;
  asset_code: string;           // ← ANTIGUO
  name: string;
  acquisition_date: string;      // ← ANTIGUO
  acquisition_cost: number;      // ← ANTIGUO
  ...
}
```

### Esquema 2: Nuevo (en migración `011_fixed_assets_schema.ts`)
```typescript
export interface FixedAsset {
  id: number;
  asset_tag: string;             // ← NUEVO
  asset_name: string;
  purchase_date: string;         // ← NUEVO
  purchase_cost: number;         // ← NUEVO
  ...
}
```

---

## 🔍 CAUSA RAÍZ

1. La tabla `fixed_assets` fue creada con el esquema antiguo
2. La migración `011_fixed_assets_schema.ts` define un esquema nuevo
3. El servicio `FixedAssetService.ts` usa el esquema nuevo
4. El componente intenta acceder a `purchase_cost` pero la tabla tiene `acquisition_cost`

---

## ✅ SOLUCIÓN INMEDIATA (Implementada)

### Cambio 1: Protección en el Componente

```typescript
// src/components/assets/FixedAssetsManager.tsx
<td className="py-3 px-4 text-sm text-right font-mono">
    ${((asset.purchase_cost || 0) / 100).toFixed(2)}  // ← Agregado fallback
</td>
```

**Resultado**: El componente ya no crashea, pero muestra $0.00 si la columna no existe.

---

## 🔧 SOLUCIÓN COMPLETA (Recomendada)

### Opción A: Migrar a Esquema Nuevo (RECOMENDADO)

Crear una migración que renombre las columnas:

```sql
-- Migración: 012_rename_fixed_assets_columns.ts

-- Paso 1: Renombrar columnas
ALTER TABLE fixed_assets RENAME COLUMN asset_code TO asset_tag;
ALTER TABLE fixed_assets RENAME COLUMN name TO asset_name;
ALTER TABLE fixed_assets RENAME COLUMN acquisition_date TO purchase_date;
ALTER TABLE fixed_assets RENAME COLUMN acquisition_cost TO purchase_cost;

-- Paso 2: Actualizar índices si existen
DROP INDEX IF EXISTS idx_fixed_assets_code;
CREATE INDEX idx_fixed_assets_tag ON fixed_assets(asset_tag);
```

**Ventajas**:
- ✅ Usa el esquema moderno y estandarizado
- ✅ Compatible con el servicio `FixedAssetService.ts`
- ✅ Mantiene todos los datos existentes

**Desventajas**:
- ⚠️ Requiere migración de datos
- ⚠️ Puede romper código que use el esquema antiguo

### Opción B: Actualizar Servicio para Usar Esquema Antiguo

Modificar `FixedAssetService.ts` para usar las columnas antiguas:

```typescript
// src/services/accounting/FixedAssetService.ts

export interface FixedAsset {
    id: number;
    asset_code: string;           // ← Cambiar de asset_tag
    name: string;                 // ← Cambiar de asset_name
    acquisition_date: string;     // ← Cambiar de purchase_date
    acquisition_cost: number;     // ← Cambiar de purchase_cost
    ...
}

// Actualizar todas las consultas SQL
async purchaseAsset(data: AssetPurchaseData, userId: number = 1): Promise<number> {
    const result = await this.db.run(
        `INSERT INTO fixed_assets 
        (asset_code, name, description, category_id, acquisition_date, acquisition_cost, ...)
        VALUES (?, ?, ?, ?, ?, ?, ...)`,
        [...]
    );
}
```

**Ventajas**:
- ✅ No requiere migración de base de datos
- ✅ Compatible con datos existentes
- ✅ Cambio más simple

**Desventajas**:
- ❌ Usa esquema antiguo (no estandarizado)
- ❌ Inconsistente con la migración `011_fixed_assets_schema.ts`

### Opción C: Crear Vista de Compatibilidad

Crear una vista SQL que mapee ambos esquemas:

```sql
CREATE VIEW fixed_assets_compat AS
SELECT 
    id,
    asset_code as asset_tag,
    asset_tag as asset_code,
    name as asset_name,
    asset_name as name,
    acquisition_date as purchase_date,
    purchase_date as acquisition_date,
    acquisition_cost as purchase_cost,
    purchase_cost as acquisition_cost,
    ...
FROM fixed_assets;
```

**Ventajas**:
- ✅ Compatibilidad con ambos esquemas
- ✅ No requiere cambios en código

**Desventajas**:
- ❌ Complejidad adicional
- ❌ Performance overhead

---

## 🎯 RECOMENDACIÓN FINAL

**Implementar Opción A: Migrar a Esquema Nuevo**

### Razones:
1. El esquema nuevo es más profesional y estandarizado
2. Usa terminología contable correcta (`purchase` en lugar de `acquisition`)
3. Compatible con el servicio moderno `FixedAssetService.ts`
4. Alineado con la migración `011_fixed_assets_schema.ts`

### Plan de Implementación:

#### Paso 1: Crear Migración de Renombrado
```typescript
// src/core/migrations/list/012_rename_fixed_assets_columns.ts

export const migration_012 = {
    id: 12,
    name: 'rename_fixed_assets_columns',
    up: async (db: any) => {
        // Verificar si las columnas antiguas existen
        const columns = await db.select("PRAGMA table_info(fixed_assets)");
        const hasOldSchema = columns.some((col: any) => col.name === 'acquisition_cost');
        
        if (hasOldSchema) {
            // SQLite no soporta RENAME COLUMN directamente en versiones antiguas
            // Necesitamos recrear la tabla
            
            await db.exec(`
                -- Crear tabla temporal con esquema nuevo
                CREATE TABLE fixed_assets_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset_tag TEXT NOT NULL UNIQUE,
                    asset_name TEXT NOT NULL,
                    description TEXT,
                    category_id INTEGER NOT NULL,
                    purchase_date DATE NOT NULL,
                    purchase_cost INTEGER NOT NULL CHECK(purchase_cost > 0),
                    salvage_value INTEGER DEFAULT 0,
                    vendor_id INTEGER,
                    useful_life_months INTEGER NOT NULL,
                    depreciation_method TEXT NOT NULL,
                    start_depreciation_date DATE,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    disposal_date DATE,
                    disposal_method TEXT,
                    disposal_amount INTEGER,
                    total_accumulated_depreciation INTEGER DEFAULT 0,
                    net_book_value INTEGER,
                    purchase_entry_id INTEGER,
                    disposal_entry_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Copiar datos del esquema antiguo al nuevo
                INSERT INTO fixed_assets_new (
                    id, asset_tag, asset_name, description, category_id,
                    purchase_date, purchase_cost, salvage_value, vendor_id,
                    useful_life_months, depreciation_method, start_depreciation_date,
                    status, disposal_date, disposal_method, disposal_amount,
                    total_accumulated_depreciation, net_book_value,
                    purchase_entry_id, disposal_entry_id, created_at, updated_at
                )
                SELECT 
                    id, asset_code, name, description, category_id,
                    acquisition_date, acquisition_cost, salvage_value, supplier_id,
                    useful_life_months, depreciation_method, NULL,
                    status, disposal_date, disposal_reason, disposal_value,
                    accumulated_depreciation, current_value,
                    NULL, NULL, created_at, updated_at
                FROM fixed_assets;
                
                -- Eliminar tabla antigua
                DROP TABLE fixed_assets;
                
                -- Renombrar tabla nueva
                ALTER TABLE fixed_assets_new RENAME TO fixed_assets;
                
                -- Recrear índices
                CREATE INDEX idx_fixed_assets_tag ON fixed_assets(asset_tag);
                CREATE INDEX idx_fixed_assets_category ON fixed_assets(category_id);
                CREATE INDEX idx_fixed_assets_status ON fixed_assets(status);
            `);
        }
    },
    down: async (db: any) => {
        // Revertir cambios (opcional)
    }
};
```

#### Paso 2: Registrar Migración
```typescript
// src/core/migrations/list/index.ts
import { migration_012 } from './012_rename_fixed_assets_columns';

export const migrations = [
    // ... migraciones existentes
    migration_012
];
```

#### Paso 3: Ejecutar Migración
```typescript
// En la inicialización de la app
import { MigrationEngine } from './core/migrations/MigrationEngine';
import { db } from './database/simple-db';

const engine = new MigrationEngine(db);
await engine.runPendingMigrations();
```

#### Paso 4: Actualizar `simple-db.ts`
```typescript
// src/database/simple-db.ts

export interface FixedAsset {
  id?: number;
  asset_tag: string;           // ← ACTUALIZADO
  asset_name: string;          // ← ACTUALIZADO
  description?: string;
  category_id: number;
  purchase_date: string;       // ← ACTUALIZADO
  purchase_cost: number;       // ← ACTUALIZADO
  salvage_value?: number;
  vendor_id?: number;
  useful_life_years: number;
  useful_life_months: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'units_of_production';
  // ... resto de campos
}

// Actualizar todas las funciones que usan FixedAsset
export function createFixedAsset(asset: Partial<FixedAsset>, userId: number): { success: boolean; message: string; id?: number } {
  // ... actualizar SQL para usar nuevos nombres de columnas
}
```

---

## 📊 IMPACTO

### Archivos a Modificar:
1. ✅ `src/components/assets/FixedAssetsManager.tsx` - YA PROTEGIDO
2. 🔄 `src/database/simple-db.ts` - Actualizar interface y funciones
3. 🔄 `src/core/migrations/list/012_rename_fixed_assets_columns.ts` - CREAR
4. 🔄 `src/core/migrations/list/index.ts` - Registrar migración

### Tiempo Estimado:
- Crear migración: 30 minutos
- Actualizar `simple-db.ts`: 1 hora
- Testing: 30 minutos
- **Total**: 2 horas

---

## ✅ ESTADO ACTUAL

- ✅ Componente protegido contra crash
- ⏳ Migración pendiente de crear
- ⏳ `simple-db.ts` pendiente de actualizar

---

**Documentado por**: Kiro AI  
**Fecha**: 7 de febrero de 2026  
**Archivo**: `SOLUCION_ACTIVOS_FIJOS.md`
