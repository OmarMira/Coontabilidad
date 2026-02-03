// verify-database.mjs - Verificar contenido de la base de datos
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDatabase() {
  console.log('🔍 Verificando base de datos...\n');

  try {
    // Inicializar SQL.js
    const SQL = await initSqlJs({
      locateFile: file => `./node_modules/sql.js/dist/${file}`
    });

    // Buscar archivo de base de datos en OPFS o local
    const possiblePaths = [
      path.join(__dirname, 'accounting.db'),
      path.join(__dirname, 'data', 'accounting.db'),
      path.join(__dirname, 'dist', 'accounting.db')
    ];

    let dbPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        dbPath = p;
        break;
      }
    }

    if (!dbPath) {
      console.log('❌ No se encontró archivo de base de datos local.');
      console.log('ℹ️  La base de datos está en OPFS (Origin Private File System) del navegador.');
      console.log('ℹ️  Para verificar los datos, usa la consola del navegador:\n');
      console.log('// Ejecuta esto en DevTools (F12):');
      console.log('const db = window.db;');
      console.log('const result = db.exec("SELECT COUNT(*) as total FROM suppliers");');
      console.log('console.log("Total proveedores:", result[0].values[0][0]);\n');
      console.log('// Ver todos los proveedores:');
      console.log('const suppliers = db.exec("SELECT * FROM suppliers");');
      console.log('console.table(suppliers[0].values.map(row => ({');
      console.log('  ID: row[0],');
      console.log('  Nombre: row[1],');
      console.log('  Email: row[2],');
      console.log('  Estado: row[9]');
      console.log('})));\n');
      return;
    }

    console.log(`✅ Base de datos encontrada: ${dbPath}\n`);

    // Cargar base de datos
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    // Verificar tablas principales
    const tables = [
      'suppliers',
      'customers',
      'products',
      'invoices',
      'bills',
      'quotes',
      'employees',
      'bank_accounts'
    ];

    console.log('📊 Conteo de registros:\n');
    
    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0]?.values[0]?.[0] || 0;
        console.log(`  ${table.padEnd(20)} ${count}`);
      } catch (error) {
        console.log(`  ${table.padEnd(20)} ERROR: ${error.message}`);
      }
    }

    // Mostrar algunos proveedores si existen
    console.log('\n📋 Primeros 5 proveedores:\n');
    try {
      const suppliers = db.exec('SELECT id, name, email, status FROM suppliers LIMIT 5');
      if (suppliers[0]?.values.length > 0) {
        suppliers[0].values.forEach(row => {
          console.log(`  ID: ${row[0]}, Nombre: ${row[1]}, Email: ${row[2]}, Estado: ${row[3]}`);
        });
      } else {
        console.log('  ❌ No hay proveedores en la base de datos');
      }
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }

    db.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDatabase();
