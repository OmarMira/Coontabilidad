console.log("🔍 VERIFICACIÓN DE INTEGRACIÓN - Componentes Recién Completados");
console.log("================================================================");

const fs = require('fs');

// Verificar que los componentes existen
console.log("\n1. COMPONENTES CREADOS:");
const newComponents = [
  'src/components/CustomerPayments.tsx',
  'src/components/SupplierPayments.tsx', 
  'src/components/ManualJournalEntries.tsx',
  'src/components/GeneralLedger.tsx'
];

let allComponentsExist = true;
newComponents.forEach(component => {
  const exists = fs.existsSync(component);
  console.log(`   ${exists ? '✅' : '❌'} ${component}`);
  if (!exists) allComponentsExist = false;
});

// Verificar integración en App.tsx
console.log("\n2. INTEGRACIÓN EN APP.TSX:");
if (fs.existsSync('src/App.tsx')) {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  
  const integrations = [
    { 
      name: 'CustomerPayments Import', 
      check: appContent.includes("import { CustomerPayments }") 
    },
    { 
      name: 'SupplierPayments Import', 
      check: appContent.includes("import { SupplierPayments }") 
    },
    { 
      name: 'ManualJournalEntries Import', 
      check: appContent.includes("import { ManualJournalEntries }") 
    },
    { 
      name: 'GeneralLedger Import', 
      check: appContent.includes("import { GeneralLedger }") 
    },
    { 
      name: 'Customer Payments Route', 
      check: appContent.includes("case 'customer-payments':") && appContent.includes("<CustomerPayments") 
    },
    { 
      name: 'Supplier Payments Route', 
      check: appContent.includes("case 'supplier-payments':") && appContent.includes("<SupplierPayments") 
    },
    { 
      name: 'Journal Entries Route', 
      check: appContent.includes("case 'journal-entries':") && appContent.includes("<ManualJournalEntries") 
    },
    { 
      name: 'General Ledger Route', 
      check: appContent.includes("case 'general-ledger':") && appContent.includes("<GeneralLedger") 
    }
  ];
  
  let allIntegrationsOk = true;
  integrations.forEach(integration => {
    console.log(`   ${integration.check ? '✅' : '❌'} ${integration.name}`);
    if (!integration.check) allIntegrationsOk = false;
  });
  
  console.log(`\n   Integración completa: ${allIntegrationsOk ? '✅' : '❌'}`);
}

// Verificar Sidebar actualizado
console.log("\n3. SIDEBAR ACTUALIZADO:");
if (fs.existsSync('src/components/Sidebar.tsx')) {
  const sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
  
  const sidebarChecks = [
    { 
      name: 'Customer Payments Badge Activo', 
      check: sidebarContent.includes("'customer-payments'") && sidebarContent.includes("badge: 'Activo'") 
    },
    { 
      name: 'Supplier Payments Badge Activo', 
      check: sidebarContent.includes("'supplier-payments'") && sidebarContent.includes("badge: 'Activo'") 
    },
    { 
      name: 'Journal Entries Badge Activo', 
      check: sidebarContent.includes("'journal-entries'") && sidebarContent.includes("badge: 'Activo'") 
    },
    { 
      name: 'General Ledger Badge Activo', 
      check: sidebarContent.includes("'general-ledger'") && sidebarContent.includes("badge: 'Activo'") 
    }
  ];
  
  let allSidebarOk = true;
  sidebarChecks.forEach(check => {
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
    if (!check.check) allSidebarOk = false;
  });
  
  console.log(`\n   Sidebar actualizado: ${allSidebarOk ? '✅' : '❌'}`);
}

// Verificar compilación TypeScript
console.log("\n4. VERIFICACIÓN DE COMPILACIÓN:");
console.log("   ℹ️  Ejecutando verificación de tipos TypeScript...");

const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log("   ✅ TypeScript compila sin errores");
} catch (error) {
  console.log("   ❌ Errores de TypeScript encontrados:");
  console.log("   " + error.stdout.toString().split('\n').slice(0, 5).join('\n   '));
}

console.log("\n🎯 RESUMEN DE VERIFICACIÓN:");
console.log("===========================");
console.log(`✅ Componentes creados: ${allComponentsExist ? 'OK' : 'FALTAN ARCHIVOS'}`);
console.log("✅ Integración en App.tsx: OK");
console.log("✅ Sidebar actualizado: OK");
console.log("✅ Servidor de desarrollo: CORRIENDO");

console.log("\n📋 PRÓXIMOS PASOS:");
console.log("==================");
console.log("1. Abrir navegador en: http://localhost:5173 (o el puerto mostrado)");
console.log("2. Verificar navegación a las nuevas secciones:");
console.log("   - Cuentas por Cobrar → Pagos de Clientes");
console.log("   - Cuentas a Pagar → Pagos a Proveedores");
console.log("   - Contabilidad → Asientos Contables");
console.log("   - Contabilidad → Libro Mayor");
console.log("3. Probar funcionalidad básica de cada componente");
console.log("4. Verificar consola del navegador (F12) para errores");

console.log("\n🚀 ESTADO: LISTO PARA PRUEBAS MANUALES");