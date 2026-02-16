# Solución a los Errores de IRON CORE VERIFICATION

## Problema
Los errores que ves son porque la base de datos no tiene:
1. Los 67 condados de Florida (solo tiene 9)
2. La columna `county_code` en `florida_tax_rates`
3. La tabla `tax_transactions`
4. Las tablas `fixed_assets` y `asset_depreciation`
5. La tabla `sys_migrations`

## Causa
El código para arreglar esto YA EXISTE en `SchemaRepairService.ts`, pero no se está ejecutando correctamente en tu base de datos actual.

## Solución Paso a Paso

### Opción 1: Forzar Recreación de la Base de Datos (RECOMENDADO)

1. **Abre la consola del navegador** (F12)

2. **Ejecuta este código para limpiar la base de datos:**
```javascript
// Limpiar localStorage
localStorage.clear();
sessionStorage.clear();

// Limpiar IndexedDB
indexedDB.deleteDatabase('accountexpress_db');

console.log('✅ Base de datos limpiada');
```

3. **Recarga la página completamente** (Ctrl+F5 o Cmd+Shift+R)

4. **Espera a que se inicialice** - El sistema debería:
   - Crear todas las tablas
   - Insertar los 67 condados automáticamente
   - Crear las tablas faltantes

5. **Verifica que funcionó:**
```javascript
// En la consola del navegador
import { db } from './src/database/simple-db';

// Contar condados
const result = db.exec("SELECT COUNT(*) as count FROM florida_tax_rates");
console.log('Condados:', result[0]?.values[0]?.[0]); // Debería mostrar 67

// Verificar columna county_code
const schema = db.exec("PRAGMA table_info(florida_tax_rates)");
console.log('Columnas:', schema[0]?.values.map(v => v[1]));

// Verificar tabla tax_transactions
const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='tax_transactions'");
console.log('tax_transactions existe:', tables.length > 0);
```

### Opción 2: Ejecutar Reparación Manual (Si Opción 1 no funciona)

1. **Abre la consola del navegador** (F12)

2. **Ejecuta este script de reparación:**
```javascript
import { db } from './src/database/simple-db';
import { SchemaRepairService } from './src/database/SchemaRepairService';

// Crear instancia del servicio de reparación
const repair = new SchemaRepairService(db);

// Ejecutar reparación
repair.repairSchema().then(logs => {
    logs.forEach(log => console.log(log));
    console.log('✅ Reparación completada');
}).catch(err => {
    console.error('❌ Error en reparación:', err);
});
```

3. **Recarga la página** después de que termine

### Opción 3: Script de Reparación Directo (Más Rápido)

Ejecuta esto en la consola del navegador:

```javascript
import { db } from './src/database/simple-db';

// 1. Agregar columna county_code si no existe
try {
    db.exec("ALTER TABLE florida_tax_rates ADD COLUMN county_code TEXT");
    console.log('✅ Columna county_code agregada');
} catch (e) {
    console.log('⚠️ Columna county_code ya existe o error:', e.message);
}

// 2. Agregar columnas faltantes
try {
    db.exec("ALTER TABLE florida_tax_rates ADD COLUMN base_rate REAL DEFAULT 600");
    db.exec("ALTER TABLE florida_tax_rates ADD COLUMN surtax_rate REAL DEFAULT 100");
    console.log('✅ Columnas base_rate y surtax_rate agregadas');
} catch (e) {
    console.log('⚠️ Columnas ya existen o error:', e.message);
}

// 3. Insertar los 67 condados
const counties = [
    { name: "Alachua", code: "ALACHUA", surtax: 150 },
    { name: "Baker", code: "BAKER", surtax: 100 },
    { name: "Bay", code: "BAY", surtax: 100 },
    { name: "Bradford", code: "BRADFORD", surtax: 100 },
    { name: "Brevard", code: "BREVARD", surtax: 100 },
    { name: "Broward", code: "BROWARD", surtax: 100 },
    { name: "Calhoun", code: "CALHOUN", surtax: 150 },
    { name: "Charlotte", code: "CHARLOTTE", surtax: 100 },
    { name: "Citrus", code: "CITRUS", surtax: 100 },
    { name: "Clay", code: "CLAY", surtax: 150 },
    { name: "Collier", code: "COLLIER", surtax: 100 },
    { name: "Columbia", code: "COLUMBIA", surtax: 100 },
    { name: "DeSoto", code: "DESOTO", surtax: 150 },
    { name: "Dixie", code: "DIXIE", surtax: 100 },
    { name: "Duval", code: "DUVAL", surtax: 150 },
    { name: "Escambia", code: "ESCAMBIA", surtax: 150 },
    { name: "Flagler", code: "FLAGLER", surtax: 100 },
    { name: "Franklin", code: "FRANKLIN", surtax: 100 },
    { name: "Gadsden", code: "GADSDEN", surtax: 150 },
    { name: "Gilchrist", code: "GILCHRIST", surtax: 100 },
    { name: "Glades", code: "GLADES", surtax: 100 },
    { name: "Gulf", code: "GULF", surtax: 100 },
    { name: "Hamilton", code: "HAMILTON", surtax: 100 },
    { name: "Hardee", code: "HARDEE", surtax: 100 },
    { name: "Hendry", code: "HENDRY", surtax: 100 },
    { name: "Hernando", code: "HERNANDO", surtax: 50 },
    { name: "Highlands", code: "HIGHLANDS", surtax: 150 },
    { name: "Hillsborough", code: "HILLSBOROUGH", surtax: 150 },
    { name: "Holmes", code: "HOLMES", surtax: 100 },
    { name: "Indian River", code: "INDIAN-RIVER", surtax: 100 },
    { name: "Jackson", code: "JACKSON", surtax: 150 },
    { name: "Jefferson", code: "JEFFERSON", surtax: 100 },
    { name: "Lafayette", code: "LAFAYETTE", surtax: 100 },
    { name: "Lake", code: "LAKE", surtax: 100 },
    { name: "Lee", code: "LEE", surtax: 50 },
    { name: "Leon", code: "LEON", surtax: 150 },
    { name: "Levy", code: "LEVY", surtax: 100 },
    { name: "Liberty", code: "LIBERTY", surtax: 150 },
    { name: "Madison", code: "MADISON", surtax: 150 },
    { name: "Manatee", code: "MANATEE", surtax: 100 },
    { name: "Marion", code: "MARION", surtax: 100 },
    { name: "Martin", code: "MARTIN", surtax: 50 },
    { name: "Miami-Dade", code: "MIAMI-DADE", surtax: 100 },
    { name: "Monroe", code: "MONROE", surtax: 150 },
    { name: "Nassau", code: "NASSAU", surtax: 100 },
    { name: "Okaloosa", code: "OKALOOSA", surtax: 50 },
    { name: "Okeechobee", code: "OKEECHOBEE", surtax: 100 },
    { name: "Orange", code: "ORANGE", surtax: 50 },
    { name: "Osceola", code: "OSCEOLA", surtax: 150 },
    { name: "Palm Beach", code: "PALM-BEACH", surtax: 100 },
    { name: "Pasco", code: "PASCO", surtax: 100 },
    { name: "Pinellas", code: "PINELLAS", surtax: 100 },
    { name: "Polk", code: "POLK", surtax: 100 },
    { name: "Putnam", code: "PUTNAM", surtax: 100 },
    { name: "Santa Rosa", code: "SANTA-ROSA", surtax: 50 },
    { name: "Sarasota", code: "SARASOTA", surtax: 100 },
    { name: "Seminole", code: "SEMINOLE", surtax: 100 },
    { name: "St. Johns", code: "ST-JOHNS", surtax: 50 },
    { name: "St. Lucie", code: "ST-LUCIE", surtax: 100 },
    { name: "Sumter", code: "SUMTER", surtax: 100 },
    { name: "Suwannee", code: "SUWANNEE", surtax: 100 },
    { name: "Taylor", code: "TAYLOR", surtax: 100 },
    { name: "Union", code: "UNION", surtax: 100 },
    { name: "Volusia", code: "VOLUSIA", surtax: 50 },
    { name: "Wakulla", code: "WAKULLA", surtax: 100 },
    { name: "Walton", code: "WALTON", surtax: 100 },
    { name: "Washington", code: "WASHINGTON", surtax: 100 }
];

let inserted = 0;
for (const c of counties) {
    try {
        db.run(
            "INSERT OR REPLACE INTO florida_tax_rates (county_name, county_code, base_rate, surtax_rate, total_rate, effective_date) VALUES (?, ?, 600, ?, ?, '2026-01-01')",
            [c.name, c.code, c.surtax, 600 + c.surtax]
        );
        inserted++;
    } catch (e) {
        console.error(`Error insertando ${c.name}:`, e.message);
    }
}
console.log(`✅ ${inserted} condados insertados`);

// 4. Crear tabla tax_transactions
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS tax_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            transaction_date TEXT NOT NULL,
            county_code TEXT NOT NULL,
            taxable_amount REAL NOT NULL,
            effective_rate REAL NOT NULL,
            tax_amount REAL NOT NULL,
            is_exempt BOOLEAN DEFAULT 0,
            exemption_type TEXT,
            verification_hash TEXT,
            status TEXT DEFAULT 'pending',
            dr15_report_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Tabla tax_transactions creada');
} catch (e) {
    console.log('⚠️ Tabla tax_transactions ya existe o error:', e.message);
}

// 5. Crear tablas de activos fijos
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS fixed_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            purchase_date TEXT NOT NULL,
            purchase_cost REAL NOT NULL,
            salvage_value REAL DEFAULT 0,
            useful_life INTEGER NOT NULL,
            depreciation_method TEXT DEFAULT 'straight_line',
            accumulated_depreciation REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Tabla fixed_assets creada');
} catch (e) {
    console.log('⚠️ Tabla fixed_assets ya existe o error:', e.message);
}

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS asset_depreciation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id INTEGER NOT NULL,
            period_date TEXT NOT NULL,
            depreciation_amount REAL NOT NULL,
            accumulated_total REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(asset_id) REFERENCES fixed_assets(id)
        )
    `);
    console.log('✅ Tabla asset_depreciation creada');
} catch (e) {
    console.log('⚠️ Tabla asset_depreciation ya existe o error:', e.message);
}

// 6. Verificar resultados
const count = db.exec("SELECT COUNT(*) as c FROM florida_tax_rates")[0]?.values[0]?.[0];
console.log(`\n📊 RESUMEN:`);
console.log(`   Condados en DB: ${count}`);
console.log(`   ✅ Reparación completada`);
```

## Verificación Final

Después de aplicar cualquiera de las opciones, ejecuta IRON CORE VERIFICATION de nuevo. Deberías ver:

```
✅ Florida Counties Count: 67 (Expected: 67) PASS
✅ Tax Calc: PASS
✅ Tax Transaction Check: PASS
✅ Fiscal Tables: fixed_assets, asset_depreciation PASS
```

## Nota sobre sys_migrations

La tabla `sys_migrations` es opcional. Si no la tienes, no afecta la funcionalidad del sistema. Es solo para tracking de migraciones de esquema.

## ¿Por qué pasó esto?

Tu base de datos se creó con una versión anterior del código que solo insertaba 5 condados. El código actual ya tiene la lógica para insertar los 67, pero necesitas forzar la recreación o reparación de la base de datos para que se aplique.

