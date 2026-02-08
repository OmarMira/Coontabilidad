// Script para inspeccionar la base de datos REAL en tiempo de ejecución
// Este script debe ejecutarse en el contexto de la aplicación

console.log(`
=====================================
INSPECCIÓN DE BASE DE DATOS REAL
=====================================

INSTRUCCIONES:
1. Abre la consola del navegador (F12)
2. Pega este código:

// Importar la base de datos
import { db } from './src/database/simple-db';

// Listar todas las tablas
const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log('TABLAS EXISTENTES:');
console.table(tables[0]?.values || []);

// Para cada tabla, mostrar su esquema
tables[0]?.values.forEach(row => {
  const tableName = row[0];
  const schema = db.exec(\`PRAGMA table_info(\${tableName})\`);
  console.log(\`\\n📊 Tabla: \${tableName}\`);
  console.table(schema[0]?.values.map(col => ({
    name: col[1],
    type: col[2],
    notnull: col[3],
    default: col[4],
    pk: col[5]
  })));
});

=====================================

ALTERNATIVA: Usar el componente SystemAudit

Modifica temporalmente src/utils/systemAudit.ts para agregar:

export function inspectDatabase() {
  if (!db) return 'DB not initialized';
  
  try {
    // Listar tablas
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('=== TABLAS EXISTENTES ===');
    tables[0]?.values.forEach(row => console.log('  -', row[0]));
    
    // Inspeccionar journal_entries
    try {
      const jeSchema = db.exec("PRAGMA table_info(journal_entries)");
      console.log('\\n=== ESQUEMA: journal_entries ===');
      jeSchema[0]?.values.forEach(col => console.log(\`  \${col[1]} (\${col[2]})\`));
    } catch (e) {
      console.log('  ❌ Tabla journal_entries no existe');
    }
    
    // Inspeccionar journal_details
    try {
      const jdSchema = db.exec("PRAGMA table_info(journal_details)");
      console.log('\\n=== ESQUEMA: journal_details ===');
      jdSchema[0]?.values.forEach(col => console.log(\`  \${col[1]} (\${col[2]})\`));
    } catch (e) {
      console.log('  ❌ Tabla journal_details no existe');
    }
    
    // Inspeccionar fixed_assets
    try {
      const faSchema = db.exec("PRAGMA table_info(fixed_assets)");
      console.log('\\n=== ESQUEMA: fixed_assets ===');
      faSchema[0]?.values.forEach(col => console.log(\`  \${col[1]} (\${col[2]})\`));
    } catch (e) {
      console.log('  ❌ Tabla fixed_assets no existe');
    }
    
    // Inspeccionar vendor_bills
    try {
      const vbSchema = db.exec("PRAGMA table_info(vendor_bills)");
      console.log('\\n=== ESQUEMA: vendor_bills ===');
      vbSchema[0]?.values.forEach(col => console.log(\`  \${col[1]} (\${col[2]})\`));
    } catch (e) {
      console.log('  ❌ Tabla vendor_bills no existe');
    }
    
    return 'Inspección completada - ver consola';
  } catch (error) {
    return 'Error: ' + error.message;
  }
}

Luego llama a inspectDatabase() desde el componente.

=====================================
`);
