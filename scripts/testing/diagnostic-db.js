// DIAGNÓSTICO COMPLETO DE BASE DE DATOS
// Ejecutar en la consola del navegador (F12)

(async function diagnosticoDB() {
    console.log("🔍 INICIANDO DIAGNÓSTICO COMPLETO...\n");

    try {
        const { getDB } = await import('./src/database/simple-db.ts');
        const db = getDB();

        if (!db) {
            console.error("❌ Base de datos NO inicializada");
            return;
        }

        console.log("✅ Base de datos inicializada correctamente\n");

        // 1. Verificar tablas existentes
        console.log("📋 TABLAS EXISTENTES:");
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        if (tables[0]) {
            tables[0].values.forEach(row => console.log(`  - ${row[0]}`));
        }
        console.log("");

        // 2. Contar registros en tablas críticas
        console.log("📊 CONTEO DE REGISTROS:");
        const criticalTables = ['customers', 'suppliers', 'products', 'invoices', 'bills', 'journal_entries'];

        for (const table of criticalTables) {
            try {
                const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
                const count = result[0]?.values[0]?.[0] || 0;
                console.log(`  ${table}: ${count} registros`);
            } catch (e) {
                console.log(`  ${table}: ⚠️ Error - ${e.message}`);
            }
        }
        console.log("");

        // 3. Verificar estructura de customers
        console.log("🔧 ESTRUCTURA DE TABLA 'customers':");
        const schema = db.exec("PRAGMA table_info(customers)");
        if (schema[0]) {
            schema[0].values.forEach(col => {
                console.log(`  ${col[1]} (${col[2]}) - ${col[3] ? 'NOT NULL' : 'NULL'} - Default: ${col[4] || 'N/A'}`);
            });
        }
        console.log("");

        // 4. Intentar insertar un cliente de prueba
        console.log("🧪 PRUEBA DE INSERCIÓN:");
        try {
            db.run("BEGIN TRANSACTION");
            db.run(`
        INSERT INTO customers (name, business_name, email, phone, city, state, florida_county, credit_limit, status) 
        VALUES ('TEST CLIENT', 'Test Business', 'test@test.com', '555-0000', 'Miami', 'FL', 'Miami-Dade', 5000.00, 'active')
      `);
            const testResult = db.exec("SELECT * FROM customers WHERE email = 'test@test.com'");
            if (testResult[0]?.values.length > 0) {
                console.log("  ✅ Inserción de prueba EXITOSA");
                console.log(`  Cliente creado con ID: ${testResult[0].values[0][0]}`);
            }
            db.run("ROLLBACK"); // Revertir la prueba
        } catch (e) {
            db.run("ROLLBACK");
            console.error(`  ❌ Error en inserción: ${e.message}`);
        }
        console.log("");

        // 5. Verificar logs del sistema
        console.log("📝 ÚLTIMOS LOGS DEL SISTEMA:");
        try {
            const logs = db.exec("SELECT level, module, action, message FROM system_logs ORDER BY id DESC LIMIT 10");
            if (logs[0]) {
                logs[0].values.forEach(log => {
                    console.log(`  [${log[0]}] ${log[1]}.${log[2]}: ${log[3]}`);
                });
            } else {
                console.log("  (Sin logs)");
            }
        } catch (e) {
            console.log(`  ⚠️ No se pudieron leer logs: ${e.message}`);
        }

        console.log("\n✅ DIAGNÓSTICO COMPLETADO");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN DIAGNÓSTICO:", error);
    }
})();
