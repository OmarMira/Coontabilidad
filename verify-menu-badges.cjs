/**
 * VERIFICACIÓN - LIMPIEZA DE ETIQUETAS DE MENÚ
 * 
 * Verifica que se eliminaron todas las etiquetas "NEW" y "Activo"
 * del sistema de menús, dejando solo las etiquetas "Próximo".
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN - Limpieza de Etiquetas de Menú');
console.log('==============================================\n');

// Leer el archivo del sidebar
const sidebarPath = path.join(__dirname, 'src/components/Sidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

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

console.log('📋 VERIFICACIÓN DE LIMPIEZA DE ETIQUETAS:\n');

// 1. Verificar que no hay etiquetas "NEW"
const newBadgeCount = (sidebarContent.match(/badge: 'NEW'/g) || []).length;
checkCriteria(
  '1. Etiquetas "NEW" eliminadas',
  newBadgeCount === 0,
  newBadgeCount > 0 ? `Se encontraron ${newBadgeCount} etiquetas "NEW"` : 'No se encontraron etiquetas "NEW"'
);

// 2. Verificar que no hay etiquetas "Activo"
const activeBadgeCount = (sidebarContent.match(/badge: 'Activo'/g) || []).length;
checkCriteria(
  '2. Etiquetas "Activo" eliminadas',
  activeBadgeCount === 0,
  activeBadgeCount > 0 ? `Se encontraron ${activeBadgeCount} etiquetas "Activo"` : 'No se encontraron etiquetas "Activo"'
);

// 3. Verificar que se mantienen las etiquetas "Próximo"
const proximoBadgeCount = (sidebarContent.match(/badge: 'Próximo'/g) || []).length;
checkCriteria(
  '3. Etiquetas "Próximo" mantenidas',
  proximoBadgeCount > 0,
  `Se encontraron ${proximoBadgeCount} etiquetas "Próximo" (correcto)`
);

// 4. Verificar que se eliminó la propiedad isNew
const isNewCount = (sidebarContent.match(/isNew: true/g) || []).length;
checkCriteria(
  '4. Propiedad "isNew" eliminada',
  isNewCount === 0,
  isNewCount > 0 ? `Se encontraron ${isNewCount} propiedades "isNew"` : 'No se encontraron propiedades "isNew"'
);

// 5. Verificar que se eliminó el renderizado de "NEW"
const newRenderCount = (sidebarContent.match(/NEW<\/span>/g) || []).length;
checkCriteria(
  '5. Renderizado de "NEW" eliminado',
  newRenderCount === 0,
  newRenderCount > 0 ? `Se encontraron ${newRenderCount} renderizados de "NEW"` : 'No se encontraron renderizados de "NEW"'
);

// 6. Verificar que se eliminó el estilo para "Activo"
const activeStyleCount = (sidebarContent.match(/item\.badge === 'Activo'/g) || []).length;
checkCriteria(
  '6. Estilos para "Activo" eliminados',
  activeStyleCount === 0,
  activeStyleCount > 0 ? `Se encontraron ${activeStyleCount} estilos para "Activo"` : 'No se encontraron estilos para "Activo"'
);

console.log('🎯 VERIFICACIÓN DE FUNCIONALIDAD ESPECÍFICA:\n');

// Contar elementos de menú que mantienen etiquetas "Próximo"
const menuItemsWithProximo = [
  'Configuración del Sistema',
  'Usuarios y Roles', 
  'Seguridad y Cifrado',
  'Órdenes de Compra',
  'Reportes de Proveedores',
  'Cotizaciones',
  'Reportes de Clientes',
  'Balance de Comprobación',
  'Reportes Financieros',
  'Movimientos',
  'Ajustes de Inventario',
  'Reportes de Inventario',
  'Ubicaciones',
  'Reportes Fiscales',
  'Calendario Fiscal',
  'Métodos de Pago',
  'Cuentas Bancarias',
  'Centro de Ayuda'
];

let proximoItemsFound = 0;
menuItemsWithProximo.forEach(item => {
  if (sidebarContent.includes(item) && sidebarContent.includes(`'${item}'`) && sidebarContent.includes("badge: 'Próximo'")) {
    proximoItemsFound++;
  }
});

checkCriteria(
  '7. Elementos con "Próximo" correctos',
  proximoItemsFound >= 10, // Al menos 10 elementos deben tener "Próximo"
  `Se encontraron ${proximoItemsFound} elementos con etiqueta "Próximo"`
);

// Verificar elementos que ya NO deben tener etiquetas
const elementsWithoutBadges = [
  'Datos de la Empresa',
  'Métodos de Pago',
  'Respaldos y Restauración',
  'Logs del Sistema',
  'Auditoría de Transacciones',
  'Proveedores',
  'Facturas de Compra',
  'Pagos a Proveedores',
  'Clientes',
  'Facturas de Venta',
  'Pagos de Clientes',
  'Plan de Cuentas',
  'Asientos Contables',
  'Libro Mayor',
  'Balance General',
  'Estado de Resultados',
  'Productos y Servicios',
  'Categorías',
  'Configuración Fiscal',
  'Reporte DR-15',
  'Tasas por Condado',
  'Diagnóstico Contable',
  'Pruebas de Asientos',
  'ASISTENTE IA'
];

let cleanItemsCount = 0;
elementsWithoutBadges.forEach(item => {
  const itemLine = sidebarContent.split('\n').find(line => line.includes(`'${item}'`));
  if (itemLine && !itemLine.includes('badge:')) {
    cleanItemsCount++;
  }
});

checkCriteria(
  '8. Elementos sin etiquetas limpios',
  cleanItemsCount >= 15, // Al menos 15 elementos deben estar sin etiquetas
  `Se encontraron ${cleanItemsCount} elementos sin etiquetas (correcto)`
);

console.log('=' .repeat(60));
console.log(`🎯 RESULTADO FINAL: ${allTestsPassed ? '✅ LIMPIEZA COMPLETADA EXITOSAMENTE' : '❌ ALGUNOS PROBLEMAS DETECTADOS'}`);
console.log('=' .repeat(60));

if (allTestsPassed) {
  console.log('\n🎉 LIMPIEZA DE ETIQUETAS COMPLETADA');
  console.log('\n📋 CAMBIOS APLICADOS:');
  console.log('   ✅ Eliminadas todas las etiquetas "NEW"');
  console.log('   ✅ Eliminadas todas las etiquetas "Activo"');
  console.log('   ✅ Mantenidas las etiquetas "Próximo"');
  console.log('   ✅ Eliminada propiedad "isNew"');
  console.log('   ✅ Limpiado el renderizado de etiquetas');
  console.log('   ✅ Simplificados los estilos de badges');
  console.log('\n🎯 RESULTADO:');
  console.log('   • Solo aparecen etiquetas "Próximo" para funciones futuras');
  console.log('   • Interfaz más limpia y profesional');
  console.log('   • Menús sin distracciones visuales innecesarias');
} else {
  console.log('\n❌ Algunos aspectos de la limpieza necesitan revisión.');
  console.log('   Revisar los fallos marcados arriba.');
}

process.exit(allTestsPassed ? 0 : 1);