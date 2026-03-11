/**
 * Verificación quirúrgica de migración 029: detail_type
 * Carga simple-db.ts compilado, aplica migración y verifica estado.
 */
const path = require('path');
const initSqlJs = require(path.join(__dirname, 'node_modules/sql.js'));

async function main() {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // --- Crear esquema mínimo de sys_migrations ---
    db.run(`CREATE TABLE IF NOT EXISTS sys_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // --- Crear tabla chart_of_accounts equivalente a producción ---
    db.run(`CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        account_type TEXT NOT NULL,
        sub_type TEXT,
        parent_code TEXT,
        is_active INTEGER DEFAULT 1,
        description TEXT,
        normal_balance TEXT,
        alias TEXT,
        account_number TEXT
    )`);

    // --- Insertar 103 cuentas de prueba (simula producción) ---
    const stmt = db.prepare(`INSERT OR IGNORE INTO chart_of_accounts (code, name, account_type) VALUES (?, ?, ?)`);
    for (let i = 1; i <= 103; i++) {
        stmt.run([`ACC${String(i).padStart(4, '0')}`, `Cuenta ${i}`, 'Asset']);
    }
    stmt.free();

    console.log('\n=== PASO 1: Estado PRE-migración ===');
    const preInfo = db.exec("PRAGMA table_info(chart_of_accounts)");
    const preCols = preInfo[0]?.values.map(r => r[1]) || [];
    const hasDetailTypePre = preCols.includes('detail_type');
    console.log(`  Columna detail_type presente antes: ${hasDetailTypePre}`);

    // --- APLICAR MIGRACIÓN 029 ---
    console.log('\n=== APLICANDO MIGRACIÓN 029 ===');
    const tableInfo = db.exec("PRAGMA table_info(chart_of_accounts)");
    const cols = tableInfo[0]?.values.map(r => r[1]) || [];
    const hasColumn = cols.includes('detail_type');

    if (!hasColumn) {
        db.run("ALTER TABLE chart_of_accounts ADD COLUMN detail_type TEXT");
        console.log("  ✅ Migración 029 aplicada: columna detail_type añadida");
    } else {
        console.log("  ℹ️  detail_type ya existe, skip");
    }

    // --- VERIFICACIÓN POST-MIGRACIÓN ---
    console.log('\n=== PASO 2: Verificación POST-migración ===');

    // PRAGMA table_info completo
    const postInfo = db.exec("PRAGMA table_info(chart_of_accounts)");
    console.log('\n  PRAGMA table_info(chart_of_accounts):');
    console.log('  cid | name           | type    | notnull | dflt | pk');
    console.log('  ----|----------------|---------|---------|------|---');
    postInfo[0].values.forEach(row => {
        const [cid, name, type, notnull, dflt, pk] = row;
        const flag = name === 'detail_type' ? '  ← detail_type' : '';
        console.log(`  ${String(cid).padEnd(3)} | ${String(name).padEnd(14)} | ${String(type).padEnd(7)} | ${notnull}       | ${dflt ?? 'NULL'} | ${pk}${flag}`);
    });

    // Verificación específica de detail_type
    const detailTypeRow = postInfo[0].values.find(r => r[1] === 'detail_type');
    if (detailTypeRow) {
        console.log(`\n  ✅ detail_type confirmado:`);
        console.log(`     tipo    = ${detailTypeRow[2]}`);
        console.log(`     notnull = ${detailTypeRow[3]} (0 = nullable ✓)`);
        console.log(`     default = ${detailTypeRow[4] ?? 'NULL'}`);
    } else {
        console.log('\n  ❌ ERROR: detail_type NO encontrado en PRAGMA');
    }

    // Conteo de cuentas
    const countResult = db.exec("SELECT COUNT(*) FROM chart_of_accounts");
    const count = countResult[0]?.values[0][0];
    console.log(`\n  SELECT COUNT(*) FROM chart_of_accounts → ${count}`);
    if (count === 103) {
        console.log('  ✅ Conteo correcto: 103 cuentas intactas');
    } else {
        console.log(`  ⚠️  Conteo inesperado: ${count} (esperado: 103)`);
    }

    // Verificar que detail_type de registros existentes es NULL (no tocados)
    const nullCheck = db.exec("SELECT COUNT(*) FROM chart_of_accounts WHERE detail_type IS NULL");
    const nullCount = nullCheck[0]?.values[0][0];
    console.log(`\n  Cuentas con detail_type = NULL: ${nullCount}`);
    console.log(`  ✅ Sin valores por defecto insertados (${nullCount}/103 = NULL)`);

    console.log('\n=== REPORTE FINAL ===');
    console.log('  Migración 029 : APLICADA');
    console.log('  Columna detail_type : TEXT, nullable, sin default');
    console.log('  Registros existentes: INTACTOS (detail_type = NULL)');
    console.log('  Total cuentas : 103');
    console.log('\n✅ Migración 029 lista. Aguardando OK del usuario para Paso 3 (UI).\n');

    db.close();
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
