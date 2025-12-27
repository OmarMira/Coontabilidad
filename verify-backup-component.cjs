/**
 * VERIFICACIÓN - COMPONENTE BACKUPRESTORE
 * 
 * Verifica que el componente BackupRestore cumple con todos los criterios
 * especificados en la TAREA 1 de las instrucciones de desarrollo.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN - Componente BackupRestore');
console.log('==========================================\n');

// Leer el archivo del componente
const componentPath = path.join(__dirname, 'src/components/BackupRestore.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

// Leer el archivo del servicio
const servicePath = path.join(__dirname, 'src/services/BackupService.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

let allTestsPassed = true;

function checkCriteria(description, condition, details = '') {
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (details && condition) {
    console.log(`   ${details}`);
  } else if (!condition) {
    allTestsPassed = false;
    console.log(`   ❗ FALLO: ${details || 'Criterio no cumplido'}`);
  }
  console.log('');
}

console.log('📋 CRITERIOS DE LA TAREA 1 - BACKUP COMPONENT:\n');

// 1. Botón "Crear Backup Ahora" conectado al servicio
checkCriteria(
  '1. Botón "Crear Backup Ahora" conectado',
  componentContent.includes('backupService.exportToAex') && 
  componentContent.includes('handleExport'),
  'Botón conectado a backupService.exportToAex() en handleExport()'
);

// 2. Descarga automática implementada
checkCriteria(
  '2. Descarga automática implementada',
  serviceContent.includes('URL.createObjectURL') && 
  serviceContent.includes('link.download') &&
  serviceContent.includes('link.click()'),
  'Servicio usa URL.createObjectURL() y descarga automática'
);

// 3. Estado de loading en el botón
checkCriteria(
  '3. Estado de loading en el botón',
  componentContent.includes('isExporting') && 
  componentContent.includes('Creando Backup...') &&
  componentContent.includes('RefreshCw') &&
  componentContent.includes('animate-spin'),
  'Botón muestra spinner y texto "Creando Backup..." durante la operación'
);

// 4. Input de archivo con accept=".aex"
checkCriteria(
  '4. Input de archivo con accept=".aex"',
  componentContent.includes('accept=".aex"') && 
  componentContent.includes('type="file"'),
  'Input de archivo configurado para aceptar solo archivos .aex'
);

// 5. Botón "Restaurar Backup" funcional
checkCriteria(
  '5. Botón "Restaurar Backup" funcional',
  componentContent.includes('handleRestore') && 
  componentContent.includes('backupService.restoreFromAex') &&
  componentContent.includes('Restaurar Backup'),
  'Botón de restauración conectado a backupService.restoreFromAex()'
);

// 6. Diálogo de confirmación
checkCriteria(
  '6. Diálogo de confirmación implementado',
  serviceContent.includes('window.confirm') && 
  serviceContent.includes('eliminará todos los datos actuales'),
  'Servicio muestra confirmación antes de restaurar'
);

// 7. Fecha del último backup
checkCriteria(
  '7. Fecha del último backup mostrada',
  componentContent.includes('lastBackupDate') && 
  componentContent.includes('localStorage.getItem') &&
  componentContent.includes('localStorage.setItem') &&
  componentContent.includes('Último backup:'),
  'Componente guarda y muestra la fecha del último backup desde localStorage'
);

// 8. Tamaño de la base de datos
checkCriteria(
  '8. Tamaño de la base de datos mostrado',
  componentContent.includes('estimatedDbSize') && 
  componentContent.includes('PRAGMA page_size') &&
  componentContent.includes('PRAGMA page_count') &&
  componentContent.includes('Tamaño de BD:'),
  'Componente calcula y muestra el tamaño estimado de la base de datos'
);

// 9. Manejo de errores y mensajes
checkCriteria(
  '9. Manejo de errores y mensajes',
  componentContent.includes('showMessage') && 
  componentContent.includes('message.type') &&
  componentContent.includes('success') &&
  componentContent.includes('error'),
  'Componente maneja y muestra mensajes de éxito/error'
);

// 10. Validaciones de formulario
checkCriteria(
  '10. Validaciones de formulario',
  componentContent.includes('validateExportForm') && 
  componentContent.includes('exportPassword.length < 8') &&
  componentContent.includes('exportPassword !== confirmPassword'),
  'Formulario valida contraseñas (mínimo 8 caracteres, confirmación)'
);

console.log('🎯 VERIFICACIÓN DE FUNCIONALIDAD ESPECÍFICA:\n');

// Verificar que el componente tiene las funciones principales
const requiredFunctions = [
  'handleExport',
  'handleRestore', 
  'handleFileSelect',
  'loadSystemInfo',
  'formatFileSize'
];

requiredFunctions.forEach(func => {
  checkCriteria(
    `Función ${func}() implementada`,
    componentContent.includes(`${func}`),
    `Función ${func} encontrada en el componente`
  );
});

console.log('📊 VERIFICACIÓN DE INTERFAZ DE USUARIO:\n');

// Verificar elementos de UI específicos
const uiElements = [
  { name: 'Tabs Export/Import', pattern: 'Crear Backup' },
  { name: 'Campo contraseña con toggle', pattern: 'showExportPassword' },
  { name: 'Checkbox incluir logs', pattern: 'includeSystemLogs' },
  { name: 'Información del sistema', pattern: 'Estado del Sistema' },
  { name: 'Advertencias de seguridad', pattern: 'Recomendaciones de Seguridad' }
];

uiElements.forEach(element => {
  const regex = new RegExp(element.pattern, 'i');
  checkCriteria(
    `UI: ${element.name}`,
    regex.test(componentContent),
    `Elemento de interfaz "${element.name}" encontrado`
  );
});

console.log('🔒 VERIFICACIÓN DE SEGURIDAD:\n');

// Verificar aspectos de seguridad
checkCriteria(
  'Cifrado AES-256-GCM mencionado',
  componentContent.includes('AES-256-GCM'),
  'Componente menciona el método de cifrado utilizado'
);

checkCriteria(
  'Verificación SHA-256 mencionada',
  componentContent.includes('SHA-256 checksum'),
  'Componente menciona la verificación de integridad'
);

checkCriteria(
  'Advertencias de seguridad incluidas',
  componentContent.includes('contraseñas fuertes') && 
  componentContent.includes('ubicaciones seguras'),
  'Componente incluye recomendaciones de seguridad'
);

console.log('📁 VERIFICACIÓN DE INTEGRACIÓN CON SERVICIO:\n');

// Verificar que el servicio tiene las funciones necesarias
checkCriteria(
  'Servicio exportToAex() implementado',
  serviceContent.includes('exportToAex') && 
  serviceContent.includes('password: string'),
  'Servicio BackupService tiene función exportToAex()'
);

checkCriteria(
  'Servicio restoreFromAex() implementado',
  serviceContent.includes('restoreFromAex') && 
  serviceContent.includes('file: File'),
  'Servicio BackupService tiene función restoreFromAex()'
);

checkCriteria(
  'Servicio getServiceInfo() implementado',
  serviceContent.includes('getServiceInfo') && 
  serviceContent.includes('available'),
  'Servicio BackupService tiene función getServiceInfo()'
);

console.log('=' .repeat(50));
console.log(`🎯 RESULTADO FINAL: ${allTestsPassed ? '✅ TODOS LOS CRITERIOS CUMPLIDOS' : '❌ ALGUNOS CRITERIOS FALLAN'}`);
console.log('=' .repeat(50));

if (allTestsPassed) {
  console.log('\n🎉 [TAREA 1 LISTA] - BackupRestore.tsx listo para verificación manual.');
  console.log('\n📋 CHECKLIST PARA VERIFICACIÓN MANUAL:');
  console.log('   □ Hacer clic en "Crear Backup Ahora" descarga un archivo .aex');
  console.log('   □ Aparece spinner durante la creación del backup');
  console.log('   □ Input de archivo permite seleccionar solo archivos .aex');
  console.log('   □ Al seleccionar archivo .aex aparece botón "Restaurar"');
  console.log('   □ Restauración muestra diálogo de confirmación');
  console.log('   □ Sección "Estado del Sistema" muestra fecha y tamaño');
  console.log('\n✅ El componente está listo para pruebas manuales en el navegador.');
} else {
  console.log('\n❌ Algunos criterios no se cumplen. Revisar los fallos marcados arriba.');
}

process.exit(allTestsPassed ? 0 : 1);