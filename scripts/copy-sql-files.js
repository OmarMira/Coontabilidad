import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de origen y destino
const sourceDir = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist');
const destDir = path.join(__dirname, '..', 'public');

// Archivos a copiar
const filesToCopy = [
  'sql-wasm.js',
  'sql-wasm.wasm'
];

console.log('📦 Copiando archivos SQL.js...');

// Verificar que el directorio de origen existe
if (!fs.existsSync(sourceDir)) {
  console.error('❌ Error: No se encontró el directorio de sql.js');
  console.error('   Ejecuta: npm install sql.js');
  process.exit(1);
}

// Crear directorio de destino si no existe
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copiar archivos
let copiedFiles = 0;
for (const file of filesToCopy) {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copiado: ${file}`);
      copiedFiles++;
    } else {
      console.warn(`⚠️  No encontrado: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error copiando ${file}:`, error.message);
  }
}

if (copiedFiles === filesToCopy.length) {
  console.log('🎉 Todos los archivos SQL.js copiados correctamente');
} else {
  console.warn(`⚠️  Solo se copiaron ${copiedFiles} de ${filesToCopy.length} archivos`);
}

console.log('📁 Archivos disponibles en /public/');