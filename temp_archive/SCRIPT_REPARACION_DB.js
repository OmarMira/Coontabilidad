// ============================================
// SCRIPT DE REPARACIÓN DE BASE DE DATOS
// ============================================
// Copia y pega este script COMPLETO en la consola del navegador (F12)

(async function repairDatabase() {
    console.log('🔧 Iniciando reparación de base de datos...\n');

    // Acceder a la base de datos global
    const db = window.db || window.getDB?.();
    
    if (!db) {
        console.error('❌ No se pudo acceder a la base de datos');
        console.log('💡 Asegúrate de que la aplicación esté cargada completamente');
        return;
    }

    console.log('✅ Base de datos encontrada\n');

    try {
        // 1. Agregar columna county_code si no existe
        console.log('📝 Paso 1: Agregando columna county_code...');
        try {
            db.exec("ALTER TABLE florida_tax_rates ADD COLUMN county_code TEXT");
            console.log('✅ Columna county_code agregada');
        } catch (e) {
            console.log('⚠️  Columna county_code ya existe o error:', e.message);
        }

        // 2. Agregar columnas faltantes
        console.log('\n📝 Paso 2: Agregando columnas base_rate y surtax_rate...');
        try {
            db.exec("ALTER TABLE florida_tax_rates ADD COLUMN base_rate REAL DEFAULT 600");
            db.exec("ALTER TABLE florida_tax_rates ADD COLUMN surtax_rate REAL DEFAULT 100");
            console.log('✅ Columnas base_rate y surtax_rate agregadas');
        } catch (e) {
            console.log('⚠️  Columnas ya existen o error:', e.message);
        }

        // 3. Insertar los 67 condados
        console.log('\n📝 Paso 3: Insertando los 67 condados de Florida...');
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
                console.error(`❌ Error insertando ${c.name}:`, e.message);
            }
        }
        console.log(`✅ ${inserted} condados insertados`);

        // 4. Crear tabla tax_transactions
        console.log('\n📝 Paso 4: Creando tabla tax_transactions...');
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
            console.log('⚠️  Tabla tax_transactions ya existe o error:', e.message);
        }

        // 5. Crear tablas de activos fijos
        console.log('\n📝 Paso 5: Creando tabla fixed_assets...');
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS fixed_assets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset_code TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    description TEXT,
                    category_id INTEGER,
                    acquisition_date TEXT NOT NULL,
                    acquisition_cost REAL NOT NULL,
                    useful_life_years INTEGER,
                    useful_life_months INTEGER,
                    depreciation_method TEXT DEFAULT 'straight_line',
                    salvage_value REAL DEFAULT 0,
                    current_value REAL,
                    accumulated_depreciation REAL DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    location TEXT,
                    serial_number TEXT,
                    manufacturer TEXT,
                    model TEXT,
                    purchase_order TEXT,
                    supplier_id INTEGER,
                    warranty_expiration TEXT,
                    notes TEXT,
                    disposal_date TEXT,
                    disposal_value REAL,
                    disposal_reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla fixed_assets creada');
        } catch (e) {
            console.log('⚠️  Tabla fixed_assets ya existe o error:', e.message);
        }

        console.log('\n📝 Paso 6: Creando tabla asset_depreciation...');
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS asset_depreciation (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset_id INTEGER NOT NULL,
                    period_date TEXT NOT NULL,
                    depreciation_amount REAL NOT NULL,
                    accumulated_depreciation REAL NOT NULL,
                    net_book_value REAL NOT NULL,
                    journal_entry_id INTEGER,
                    is_posted BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (asset_id) REFERENCES fixed_assets(id)
                )
            `);
            console.log('✅ Tabla asset_depreciation creada');
        } catch (e) {
            console.log('⚠️  Tabla asset_depreciation ya existe o error:', e.message);
        }

        // 6. Crear tabla sys_migrations
        console.log('\n📝 Paso 7: Creando tabla sys_migrations...');
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS sys_migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version INTEGER NOT NULL UNIQUE,
                    migration_name TEXT NOT NULL,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run("INSERT OR IGNORE INTO sys_migrations (version, migration_name) VALUES (7, 'manual_repair_script')");
            console.log('✅ Tabla sys_migrations creada');
        } catch (e) {
            console.log('⚠️  Tabla sys_migrations ya existe o error:', e.message);
        }

        // 7. Verificar resultados
        console.log('\n📊 VERIFICACIÓN FINAL:');
        console.log('═══════════════════════════════════════');
        
        try {
            const countResult = db.exec("SELECT COUNT(*) as c FROM florida_tax_rates");
            const count = countResult[0]?.values[0]?.[0];
            console.log(`✅ Condados en DB: ${count}/67`);
        } catch (e) {
            console.log('❌ Error contando condados:', e.message);
        }

        try {
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tax_transactions', 'fixed_assets', 'asset_depreciation', 'sys_migrations')");
            const tableNames = tables[0]?.values.map(v => v[0]) || [];
            console.log(`✅ Tablas creadas: ${tableNames.join(', ')}`);
        } catch (e) {
            console.log('❌ Error verificando tablas:', e.message);
        }

        console.log('═══════════════════════════════════════');
        console.log('\n🎉 REPARACIÓN COMPLETADA');
        console.log('\n📌 PRÓXIMOS PASOS:');
        console.log('   1. Recarga la página (Ctrl+F5 o Cmd+Shift+R)');
        console.log('   2. Ejecuta IRON CORE VERIFICATION de nuevo');
        console.log('   3. Todos los checks deberían estar en PASS\n');

    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error);
        console.log('\n💡 Si este script no funciona, usa la Opción 1:');
        console.log('   localStorage.clear();');
        console.log('   sessionStorage.clear();');
        console.log('   indexedDB.deleteDatabase("accountexpress_db");');
        console.log('   Luego recarga la página.');
    }
})();
