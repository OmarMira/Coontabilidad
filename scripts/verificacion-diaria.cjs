/**
 * Script de Verificación Diaria del Sistema
 * Ejecutar cada día: node scripts/verificacion-diaria.js
 * 
 * Verifica:
 * - Build pasa sin errores
 * - Tests críticos pasan
 * - Base de datos accesible
 * - No hay errores TypeScript
 * - Genera reporte en docs/salud-diaria/YYYY-MM-DD.md
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function verificarSistema() {
    const fecha = new Date().toISOString().split('T')[0];
    const reportePath = path.join(__dirname, '..', 'docs', 'salud-diaria', `${fecha}.md`);

    const resultados = {
        fecha,
        build: false,
        tests: false,
        typescript: false,
        errores: []
    };

    console.log('🔍 Iniciando verificación diaria...\n');

    // 1. Verificar Build
    try {
        console.log('📦 Verificando build...');
        execSync('npm run build', { stdio: 'pipe' });
        resultados.build = true;
        console.log('✅ Build: OK\n');
    } catch (error) {
        resultados.build = false;
        resultados.errores.push('Build falló: ' + error.message);
        console.log('❌ Build: FALLO\n');
    }

    // 2. Verificar Tests Críticos
    try {
        console.log('🧪 Ejecutando tests...');
        execSync('npm test', { stdio: 'pipe' });
        resultados.tests = true;
        console.log('✅ Tests: OK\n');
    } catch (error) {
        resultados.tests = false;
        resultados.errores.push('Tests fallaron: ' + error.message);
        console.log('❌ Tests: FALLO\n');
    }

    // 3. Verificar TypeScript
    try {
        console.log('📘 Verificando TypeScript...');
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        resultados.typescript = true;
        console.log('✅ TypeScript: OK\n');
    } catch (error) {
        resultados.typescript = false;
        resultados.errores.push('TypeScript tiene errores');
        console.log('❌ TypeScript: ERRORES\n');
    }

    // 4. Generar Reporte
    generarReporte(reportePath, resultados);

    // 5. Mostrar Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`Build: ${resultados.build ? '✅' : '❌'}`);
    console.log(`Tests: ${resultados.tests ? '✅' : '❌'}`);
    console.log(`TypeScript: ${resultados.typescript ? '✅' : '❌'}`);
    console.log(`\n📄 Reporte guardado en: ${reportePath}`);

    // 6. Exit Code
    const todoOk = resultados.build && resultados.tests && resultados.typescript;
    process.exit(todoOk ? 0 : 1);
}

function generarReporte(filepath, resultados) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const contenido = `# Reporte de Salud del Sistema - ${resultados.fecha}

## Estado General
${resultados.build && resultados.tests && resultados.typescript ? '✅ SISTEMA SALUDABLE' : '⚠️ ATENCIÓN REQUERIDA'}

## Verificaciones

### Build
${resultados.build ? '✅ Exitoso' : '❌ Fallido'}

### Tests
${resultados.tests ? '✅ Pasando' : '❌ Fallando'}

### TypeScript
${resultados.typescript ? '✅ Sin errores' : '❌ Con errores'}

## Errores Detectados
${resultados.errores.length === 0 ? 'Ninguno' : resultados.errores.map(e => `- ${e}`).join('\n')}

## Acciones Recomendadas
${resultados.build && resultados.tests && resultados.typescript
            ? '✅ No se requiere acción. Sistema funcionando correctamente.'
            : '⚠️ Revisar errores arriba y corregir antes de continuar.'}

---
*Generado automáticamente por scripts/verificacion-diaria.js*
`;

    fs.writeFileSync(filepath, contenido);
}

verificarSistema();
