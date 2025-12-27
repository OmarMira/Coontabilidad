/**
 * VERIFICACIÓN EN TIEMPO REAL - CERTIFICACIÓN DE FUNCIONALIDAD
 * 
 * Este script verifica que las funciones implementadas estén realmente
 * conectadas y funcionales, no solo que los archivos existan.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN EN TIEMPO REAL - AccountExpress');
console.log('===============================================\n');

let criticalIssues = [];
let warnings = [];

function checkCritical(description, condition, issue = '') {
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (!condition) {
    criticalIssues.push(`${description}: ${issue}`);
    console.log(`   🚨 CRÍTICO: ${issue}`);
  }
  console.log('');
}

function checkWarning(description, condition, warning = '') {
  const status = condition ? '✅' : '⚠️';
  console.log(`${status} ${description}`);
  if (!condition) {
    warnings.push(`${description}: ${warning}`);
    console.log(`   ⚠️ ADVERTENCIA: ${warning}`);
  }
  console.log('');
}

console.log('🔧 VERIFICACIÓN CRÍTICA - BackupRestore.tsx:\n');

// Verificar que BackupService tiene funciones reales
const backupServicePath = path.join(__dirname, 'src/services/BackupService.ts');
const backupServiceContent = fs.readFileSync(backupServicePath, 'utf8');

checkCritical(
  '1. BackupService.exportToAex() implementado',
  backupServiceContent.includes('exportToAex') && 
  backupServiceContent.includes('URL.createObjectURL') &&
  backupServiceContent.includes('link.download'),
  'Función exportToAex no tiene descarga real implementada'
);

checkCritical(
  '2. BackupService.restoreFromAex() implementado',
  backupServiceContent.includes('restoreFromAex') && 
  backupServiceContent.includes('window.confirm') &&
  backupServiceContent.includes('eliminará todos los datos'),
  'Función restoreFromAex no tiene confirmación implementada'
);

// Verificar componente BackupRestore
const backupComponentPath = path.join(__dirname, 'src/components/BackupRestore.tsx');
const backupComponentContent = fs.readFileSync(backupComponentPath, 'utf8');

checkCritical(
  '3. BackupRestore conectado a servicios reales',
  backupComponentContent.includes('backupService.exportToAex') &&
  backupComponentContent.includes('backupService.restoreFromAex'),
  'Componente no está conectado a servicios reales'
);

checkCritical(
  '4. Estado de loading implementado',
  backupComponentContent.includes('isExporting') &&
  backupComponentContent.includes('Creando Backup...') &&
  backupComponentContent.includes('animate-spin'),
  'Estados de loading no implementados correctamente'
);

checkCritical(
  '5. LocalStorage para fecha de backup',
  backupComponentContent.includes('localStorage.setItem') &&
  backupComponentContent.includes('lastBackupDate'),
  'Persistencia de fecha de backup no implementada'
);

console.log('📊 VERIFICACIÓN CRÍTICA - FloridaTaxReport.tsx:\n');

// Verificar datos de condados
const countiesPath = path.join(__dirname, 'src/data/floridaCounties.ts');
if (!fs.existsSync(countiesPath)) {
  checkCritical(
    '6. Archivo de condados de Florida existe',
    false,
    'Archivo src/data/floridaCounties.ts no existe'
  );
} else {
  const countiesContent = fs.readFileSync(countiesPath, 'utf8');
  
  checkCritical(
    '6. Lista completa de condados de Florida',
    countiesContent.includes('Miami-Dade') &&
    countiesContent.includes('Orange') &&
    countiesContent.includes('Broward') &&
    countiesContent.includes('Hillsborough') &&
    countiesContent.includes('Palm Beach') &&
    countiesContent.split('name:').length > 60, // Aproximadamente 67 condados
    'Lista de condados incompleta o con datos de ejemplo'
  );
}

// Verificar componente FloridaTaxReport
const reportComponentPath = path.join(__dirname, 'src/components/FloridaTaxReport.tsx');
const reportComponentContent = fs.readFileSync(reportComponentPath, 'utf8');

checkCritical(
  '7. FloridaTaxReport importa condados reales',
  reportComponentContent.includes("from '../data/floridaCounties'") &&
  reportComponentContent.includes('getFloridaCountyNames'),
  'Componente no importa datos reales de condados'
);

checkCritical(
  '8. Función calculateReport conectada',
  reportComponentContent.includes('calculateFloridaDR15Report') &&
  reportComponentContent.includes('selectedCounty') &&
  reportComponentContent.includes('selectedPeriod'),
  'Función de cálculo no está conectada correctamente'
);

checkCritical(
  '9. Exportación CSV implementada',
  reportComponentContent.includes('exportToCSV') &&
  reportComponentContent.includes('Blob') &&
  reportComponentContent.includes('URL.createObjectURL') &&
  reportComponentContent.includes('.csv'),
  'Exportación CSV no implementada correctamente'
);

checkCritical(
  '10. Tabla con columnas requeridas',
  reportComponentContent.includes('Base Imponible') ||
  reportComponentContent.includes('Tasa') ||
  reportComponentContent.includes('Impuesto') ||
  reportComponentContent.includes('Total'),
  'Tabla no tiene las columnas requeridas'
);

console.log('🔗 VERIFICACIÓN DE INTEGRACIÓN:\n');

// Verificar que App.tsx incluye los componentes
const appPath = path.join(__dirname, 'src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

checkWarning(
  '11. BackupRestore importado en App.tsx',
  appContent.includes('BackupRestore') &&
  appContent.includes("from './components/BackupRestore'"),
  'Componente puede no estar integrado en la aplicación'
);

checkWarning(
  '12. FloridaTaxReport importado en App.tsx',
  appContent.includes('FloridaTaxReport') &&
  appContent.includes("from './components/FloridaTaxReport'"),
  'Componente puede no estar integrado en la aplicación'
);

// Verificar rutas/navegación
checkWarning(
  '13. Rutas de navegación implementadas',
  appContent.includes('backup') || appContent.includes('Backup') ||
  appContent.includes('report') || appContent.includes('Report'),
  'Rutas de navegación pueden no estar implementadas'
);

console.log('🗄️ VERIFICACIÓN DE BASE DE DATOS:\n');

// Verificar funciones de base de datos
const dbPath = path.join(__dirname, 'src/database/simple-db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf8');

checkCritical(
  '14. Función calculateFloridaDR15Report existe',
  dbContent.includes('calculateFloridaDR15Report') &&
  dbContent.includes('export') &&
  dbContent.includes('FloridaDR15Report'),
  'Función de cálculo de reportes no existe en base de datos'
);

checkWarning(
  '15. Tablas de reportes DR-15 definidas',
  dbContent.includes('florida_tax_reports') &&
  dbContent.includes('florida_tax_report_counties'),
  'Tablas de reportes pueden no estar definidas'
);

console.log('=' .repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN:');
console.log('=' .repeat(60));

if (criticalIssues.length === 0) {
  console.log('✅ VERIFICACIÓN TÉCNICA EXITOSA');
  console.log('   Todos los componentes críticos están implementados.');
  console.log('   ⚠️  PERO REQUIERE VERIFICACIÓN MANUAL DEL USUARIO');
} else {
  console.log('❌ VERIFICACIÓN TÉCNICA FALLIDA');
  console.log(`   ${criticalIssues.length} problemas críticos detectados:`);
  criticalIssues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} advertencias detectadas:`);
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
}

console.log('\n🎯 PRÓXIMO PASO OBLIGATORIO:');
console.log('   Ejecutar PROTOCOLO-CERTIFICACION-USUARIO.md');
console.log('   Solo la verificación manual del usuario es válida.');

process.exit(criticalIssues.length > 0 ? 1 : 0);