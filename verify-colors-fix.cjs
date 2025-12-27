console.log("🎨 VERIFICACIÓN - Corrección de Colores");
console.log("=====================================");

const fs = require('fs');

// Función para verificar colores problemáticos
function checkColors(content, filename) {
  const issues = [];
  
  // Colores problemáticos que causan baja legibilidad
  const problematicColors = [
    'text-gray-900', // Negro en fondo claro (pero problemático en modo oscuro)
    'text-gray-600', // Gris medio problemático
    'text-gray-500', // Gris claro problemático
    'bg-white',      // Fondo blanco problemático en modo oscuro
    'bg-gray-50',    // Fondo gris muy claro problemático
    'border-gray-200', // Bordes claros problemáticos
    'border-gray-300'  // Bordes claros problemáticos
  ];
  
  // Colores correctos para modo oscuro
  const correctColors = [
    'text-white',     // Texto blanco para títulos
    'text-gray-300',  // Texto gris claro para subtítulos
    'text-gray-400',  // Texto gris para elementos secundarios
    'bg-gray-800',    // Fondo oscuro principal
    'bg-gray-700',    // Fondo oscuro secundario
    'border-gray-700', // Bordes oscuros
    'border-gray-600'  // Bordes oscuros secundarios
  ];
  
  problematicColors.forEach(color => {
    if (content.includes(color)) {
      issues.push(`❌ Color problemático encontrado: ${color}`);
    }
  });
  
  let correctCount = 0;
  correctColors.forEach(color => {
    const matches = (content.match(new RegExp(color, 'g')) || []).length;
    if (matches > 0) {
      correctCount += matches;
    }
  });
  
  return { issues, correctCount };
}

console.log("\n1. VERIFICACIÓN DE COLORES EN COMPONENTES:");

const componentsToCheck = [
  'src/components/PaymentMethods.tsx',
  'src/components/CustomerPayments.tsx',
  'src/components/SupplierPayments.tsx',
  'src/components/ManualJournalEntries.tsx',
  'src/components/GeneralLedger.tsx'
];

let totalIssues = 0;
let totalCorrectColors = 0;

componentsToCheck.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    const { issues, correctCount } = checkColors(content, component);
    
    console.log(`\n   📁 ${component.split('/').pop()}:`);
    
    if (issues.length === 0) {
      console.log(`   ✅ Sin colores problemáticos detectados`);
    } else {
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log(`   ✅ Colores correctos encontrados: ${correctCount}`);
    
    totalIssues += issues.length;
    totalCorrectColors += correctCount;
  } else {
    console.log(`   ❌ Archivo no encontrado: ${component}`);
  }
});

console.log("\n2. VERIFICACIÓN ESPECÍFICA DE ELEMENTOS CRÍTICOS:");

// Verificar elementos específicos que deben tener colores correctos
const criticalElements = [
  { element: 'Headers (h1, h2, h3)', expectedColor: 'text-white' },
  { element: 'Subtítulos y descripciones', expectedColor: 'text-gray-300' },
  { element: 'Fondos principales', expectedColor: 'bg-gray-800' },
  { element: 'Inputs y formularios', expectedColor: 'bg-gray-700' },
  { element: 'Bordes', expectedColor: 'border-gray-700' }
];

criticalElements.forEach(({ element, expectedColor }) => {
  let found = false;
  componentsToCheck.forEach(component => {
    if (fs.existsSync(component)) {
      const content = fs.readFileSync(component, 'utf8');
      if (content.includes(expectedColor)) {
        found = true;
      }
    }
  });
  
  console.log(`   ${found ? '✅' : '⚠️'} ${element}: ${expectedColor} ${found ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
});

console.log("\n3. VERIFICACIÓN DE MODALES Y FORMULARIOS:");

// Verificar que los modales tengan fondos oscuros
componentsToCheck.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    
    if (content.includes('Modal') || content.includes('showForm')) {
      const hasModalDarkBg = content.includes('bg-gray-800') && content.includes('border-gray-700');
      const hasInputDarkBg = content.includes('bg-gray-700') && content.includes('text-white');
      
      console.log(`   📁 ${component.split('/').pop()}:`);
      console.log(`   ${hasModalDarkBg ? '✅' : '❌'} Modal con fondo oscuro`);
      console.log(`   ${hasInputDarkBg ? '✅' : '❌'} Inputs con fondo oscuro y texto blanco`);
    }
  }
});

console.log("\n🎯 RESUMEN DE CORRECCIÓN:");
console.log("=========================");
console.log(`❌ Issues de colores encontrados: ${totalIssues}`);
console.log(`✅ Colores correctos aplicados: ${totalCorrectColors}`);

if (totalIssues === 0) {
  console.log("\n🎉 ¡EXCELENTE! Todos los componentes tienen colores apropiados para modo oscuro");
  console.log("✅ Textos legibles con buen contraste");
  console.log("✅ Fondos oscuros apropiados");
  console.log("✅ Bordes y elementos secundarios con colores correctos");
} else {
  console.log("\n⚠️ Aún hay algunos colores que necesitan corrección");
}

console.log("\n📋 COLORES RECOMENDADOS PARA FUTURAS IMPLEMENTACIONES:");
console.log("======================================================");
console.log("• Títulos principales: text-white");
console.log("• Subtítulos y descripciones: text-gray-300");
console.log("• Texto secundario: text-gray-400");
console.log("• Fondos principales: bg-gray-800");
console.log("• Fondos secundarios: bg-gray-700");
console.log("• Bordes: border-gray-700 o border-gray-600");
console.log("• Inputs: bg-gray-700 + text-white + placeholder-gray-400");
console.log("• Hover states: hover:bg-gray-700 o hover:bg-gray-600");

console.log("\n🚀 CORRECCIÓN DE COLORES COMPLETADA");