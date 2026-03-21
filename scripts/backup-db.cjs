/**
 * Script de Backup Automático de Base de Datos
 * Ejecutar: node scripts/backup-db.js
 * 
 * Crea backup con timestamp en carpeta backups/
 */

const fs = require('fs');
const path = require('path');

function backupDatabase() {
    const fecha = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(__dirname, '..', 'backups');

    // NOTA: AccountExpress usa IndexedDB en el navegador, no archivo .db
    // Este script está preparado para cuando se implemente persistencia en archivo
    const dbPath = path.join(__dirname, '..', 'data', 'database.db');
    const backupPath = path.join(backupDir, `database-backup-${fecha}.db`);

    console.log('💾 Iniciando backup de base de datos...\n');

    // Crear carpeta backups si no existe
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('📁 Carpeta backups/ creada\n');
    }

    // Verificar que existe DB
    if (!fs.existsSync(dbPath)) {
        console.warn('⚠️  AVISO: No se encontró archivo de base de datos en:', dbPath);
        console.warn('⚠️  Este sistema usa IndexedDB del navegador (almacenamiento en navegador).');
        console.warn('⚠️  Para hacer backup, usa la funcionalidad de exportación desde la aplicación.\n');
        console.log('📝 Creando archivo de instrucciones en backups/...\n');

        // Crear archivo de instrucciones
        const instrucciones = `# Instrucciones de Backup para AccountExpress

## Sistema Actual: IndexedDB (Navegador)

Este sistema usa **IndexedDB** para almacenar datos en el navegador, no en archivos .db tradicionales.

### Cómo hacer backup:

1. Abre la aplicación en el navegador
2. Ve a la sección "Backups" o "Configuración"
3. Usa el botón "Exportar Base de Datos" o "Crear Backup"
4. Guarda el archivo .aex generado en esta carpeta (backups/)

### Cómo restaurar backup:

1. Abre la aplicación en el navegador
2. Ve a la sección "Backups" o "Configuración"  
3. Usa el botón "Importar Base de Datos" o "Restaurar Backup"
4. Selecciona el archivo .aex desde esta carpeta

### Backups manuales recomendados:

- Antes de hacer cambios importantes
- Al final de cada semana
- Antes de actualizar el sistema

---
Generado: ${new Date().toISOString()}
`;

        fs.writeFileSync(path.join(backupDir, 'INSTRUCCIONES.md'), instrucciones);
        console.log('✅ Archivo de instrucciones creado: backups/INSTRUCCIONES.md\n');
        console.log('💡 TIP: Usa la funcionalidad de exportación desde la aplicación web.\n');
        process.exit(0);
    }

    // Copiar DB (si existe archivo físico)
    try {
        fs.copyFileSync(dbPath, backupPath);
        const size = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
        console.log('✅ Backup creado exitosamente:');
        console.log(`   📄 ${backupPath}`);
        console.log(`   💾 Tamaño: ${size} MB\n`);

        // Limpiar backups antiguos (mantener últimos 10)
        limpiarBackupsAntiguos(backupDir);

    } catch (error) {
        console.error('❌ ERROR al crear backup:', error.message);
        process.exit(1);
    }
}

function limpiarBackupsAntiguos(dir) {
    const archivos = fs.readdirSync(dir)
        .filter(f => f.startsWith('database-backup-'))
        .map(f => ({
            nombre: f,
            path: path.join(dir, f),
            fecha: fs.statSync(path.join(dir, f)).mtime
        }))
        .sort((a, b) => b.fecha - a.fecha);

    if (archivos.length > 10) {
        console.log('🧹 Limpiando backups antiguos...');
        archivos.slice(10).forEach(archivo => {
            fs.unlinkSync(archivo.path);
            console.log(`   🗑️  Eliminado: ${archivo.nombre}`);
        });
        console.log('');
    }
}

backupDatabase();
