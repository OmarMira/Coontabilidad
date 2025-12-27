const fs = require('fs');
const path = require('path');

console.log('📊 REPORTE DE CUMPLIMIENTO TÉCNICO - ACCOUNTEXPRESS NEXT-GEN');
console.log('============================================================');
console.log('Fecha:', new Date().toLocaleString());
console.log('Repositorio: https://github.com/OmarMira/Coontabilidad');
console.log('Directorio:', process.cwd());
console.log('');

// 1. VERIFICAR STACK TECNOLÓGICO
console.log('1. STACK TECNOLÓGICO:');
console.log('====================');

if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const required = {
        'react': '^18.2.0',
        'typescript': '^5.3.0',
        'vite': '^5.0.0',
        'tailwindcss': '^3.4.0',
        '@tanstack/react-query': '^5.0.0',
        'zustand': '^4.4.0',
        'zod': '^3.22.0',
        'lucide-react': '^0.309.0',
        'sql.js': '^1.8.0'
    };
    
    let passed = 0;
    const total = Object.keys(required).length;
    
    for (const [dep, version] of Object.entries(required)) {
        const actual = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
        if (actual) {
            console.log(`  ✅ ${dep}: ${actual}`);
            passed++;
        } else {
            console.log(`  ❌ ${dep}: REQUERIDO ${version}, NO ENCONTRADO`);
        }
    }
    
    console.log(`  RESULTADO: ${passed}/${total} dependencias correctas`);
} else {
    console.log('  ❌ package.json NO ENCONTRADO');
}

// 2. VERIFICAR ESTRUCTURA DE DIRECTORIOS CRÍTICA
console.log('\n2. ESTRUCTURA DE DIRECTORIOS CRÍTICA:');
console.log('=====================================');

const requiredDirs = {
    'src/core/architecture': 'Arquitectura multicapa',
    'src/core/security': 'Sistemas de cifrado',
    'src/core/audit': 'Auditoría por lotes',
    'src/core/migrations': 'Migraciones atómicas',
    'src/core/workers': 'Worker Orchestrator',
    'src/core/monitoring': 'Performance Monitor',
    'src/services/ai': 'Servicios de IA',
    'src/services/accounting': 'Servicios contables',
    'src/database/models': 'Modelos de datos',
    'src/database/schemas': 'Esquemas SQLite',
    'src/ui/components': 'Componentes React',
    'tests': 'Tests unitarios e2e'
};

for (const [dir, description] of Object.entries(requiredDirs)) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`  ✅ ${dir} - ${description}`);
    } else {
        console.log(`  ❌ FALTANTE: ${dir} - ${description}`);
    }
}

// 3. VERIFICAR ARCHIVOS CRÍTICOS
console.log('\n3. ARCHIVOS CRÍTICOS DEL SISTEMA:');
console.log('=================================');

const requiredFiles = {
    'src/core/architecture/ResilientStorage.ts': 'Arquitectura multicapa',
    'src/core/security/HybridEncryptionSystem.js': 'Sistema de cifrado híbrido',
    'src/core/audit/BatchAuditSystem.js': 'Auditoría por lotes',
    'src/core/migrations/ResilientMigrationEngine.js': 'Motor de migraciones atómicas',
    'src/core/workers/WorkerOrchestrator.js': 'Orquestador de workers',
    'src/core/monitoring/IntelligentPerformanceMonitor.js': 'Monitor de performance',
    'src/services/ai/ConversationalIAService.ts': 'Servicio de IA conversacional',
    'src/services/ai/DeepSeekService.ts': 'Integración DeepSeek',
    'src/database/models/ChartOfAccounts.ts': 'Modelo Plan de Cuentas',
    'src/database/models/FloridaTaxConfig.ts': 'Configuración impuestos FL',
    'src/database/simple-db.ts': 'Base de datos SQLite'
};

for (const [file, description] of Object.entries(requiredFiles)) {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} - ${description}`);
    } else {
        console.log(`  ❌ FALTANTE: ${file} - ${description}`);
    }
}

// 4. VERIFICAR CONFIGURACIÓN DE FLORIDA TAX
console.log('\n4. CONFIGURACIÓN FLORIDA TAX:');
console.log('=============================');

const floridaKeywords = ['DR-15', 'sales_tax', 'surtax', 'Miami-Dade', 'Broward', 'florida_tax'];
let floridaFound = 0;

function searchInFiles(dir, keywords) {
    const results = {};
    keywords.forEach(keyword => results[keyword] = false);
    
    function searchDir(currentDir) {
        if (!fs.existsSync(currentDir)) return;
        
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                searchDir(fullPath);
            } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    keywords.forEach(keyword => {
                        if (content.includes(keyword)) {
                            results[keyword] = true;
                        }
                    });
                } catch (error) {
                    // Ignorar errores de lectura
                }
            }
        }
    }
    
    searchDir(dir);
    return results;
}

const floridaResults = searchInFiles('src', floridaKeywords);
for (const [keyword, found] of Object.entries(floridaResults)) {
    if (found) {
        console.log(`  ✅ ${keyword} - Implementado`);
        floridaFound++;
    } else {
        console.log(`  ❌ ${keyword} - NO ENCONTRADO`);
    }
}

console.log(`  RESULTADO: ${floridaFound}/${floridaKeywords.length} elementos Florida Tax implementados`);

// 5. VERIFICAR SISTEMA DE IA
console.log('\n5. SISTEMA DE IA HÍBRIDO:');
console.log('========================');

const aiKeywords = ['ConversationalIAService', 'DeepSeekService', 'QueryProcessor', 'readonly', 'fallback'];
const aiResults = searchInFiles('src', aiKeywords);
let aiFound = 0;

for (const [keyword, found] of Object.entries(aiResults)) {
    if (found) {
        console.log(`  ✅ ${keyword} - Implementado`);
        aiFound++;
    } else {
        console.log(`  ❌ ${keyword} - NO ENCONTRADO`);
    }
}

console.log(`  RESULTADO: ${aiFound}/${aiKeywords.length} elementos de IA implementados`);

// 6. VERIFICAR MODELO DE DATOS CRÍTICO
console.log('\n6. MODELO DE DATOS CRÍTICO:');
console.log('==========================');

const criticalTables = ['customers', 'invoices', 'journal_entries', 'chart_of_accounts', 'florida_tax_config', 'audit_chain', 'products', 'suppliers'];
const tablesResults = searchInFiles('src', criticalTables);
let tablesFound = 0;

for (const [table, found] of Object.entries(tablesResults)) {
    if (found) {
        console.log(`  ✅ ${table} - Implementado`);
        tablesFound++;
    } else {
        console.log(`  ❌ ${table} - FALTANTE`);
    }
}

console.log(`  RESULTADO: ${tablesFound}/${criticalTables.length} tablas críticas implementadas`);

// 7. VERIFICAR CONFIGURACIÓN DE ENTORNO
console.log('\n7. CONFIGURACIÓN DE ENTORNO:');
console.log('============================');

if (fs.existsSync('.env.local')) {
    console.log('  ✅ .env.local - Presente');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = ['REACT_APP_AI_MODE', 'REACT_APP_DEEPSEEK_API_KEY', 'REACT_APP_SQLITE_VERSION'];
    
    for (const envVar of envVars) {
        if (envContent.includes(envVar)) {
            console.log(`    ✅ ${envVar} - Configurado`);
        } else {
            console.log(`    ❌ ${envVar} - FALTANTE`);
        }
    }
} else {
    console.log('  ❌ .env.local - NO ENCONTRADO');
}

// 8. RESUMEN DE CUMPLIMIENTO
console.log('\n📊 RESUMEN DE CUMPLIMIENTO:');
console.log('==========================');

const totalChecks = 6;
let passedChecks = 0;

if (floridaFound >= 3) passedChecks++;
if (aiFound >= 4) passedChecks++;
if (tablesFound >= 6) passedChecks++;
if (fs.existsSync('.env.local')) passedChecks++;
if (fs.existsSync('package.json')) passedChecks++;
if (fs.existsSync('src/services/ai/ConversationalIAService.ts')) passedChecks++;

const compliancePercentage = Math.round((passedChecks * 100) / totalChecks);

console.log(`  Cumplimiento General: ${passedChecks}/${totalChecks} (${compliancePercentage}%)`);
console.log('');

if (compliancePercentage >= 90) {
    console.log('🎯 ESTADO: ✅ CUMPLIMIENTO EXCELENTE');
    console.log('   El sistema cumple con la especificación técnica');
} else if (compliancePercentage >= 70) {
    console.log('🎯 ESTADO: ⚠️  CUMPLIMIENTO PARCIAL');
    console.log('   Requiere correcciones menores');
} else {
    console.log('🎯 ESTADO: ❌ CUMPLIMIENTO INSUFICIENTE');
    console.log('   Requiere implementación de componentes críticos');
}

console.log('');
console.log('⚠️  ACCIONES REQUERIDAS:');
console.log('  1. Implementar componentes faltantes marcados con ❌');
console.log('  2. Ejecutar pruebas de integridad contable');
console.log('  3. Validar cifrado de base de datos');
console.log('  4. Verificar generación de reportes DR-15');
console.log('  5. Probar recuperación de backups cifrados');
console.log('');
console.log('📋 Para generar estructura faltante, ejecutar: node create_missing_structure.cjs');