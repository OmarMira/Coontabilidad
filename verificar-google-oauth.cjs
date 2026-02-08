#!/usr/bin/env node

/**
 * Script de Verificación: Google OAuth Configuration
 * Verifica que el Client ID esté correctamente configurado
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Google OAuth...\n');

// Leer .env.local
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
    console.error('❌ Error: No se encontró el archivo .env.local');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let clientId = null;

// Buscar VITE_GOOGLE_CLIENT_ID
for (const line of lines) {
    if (line.startsWith('VITE_GOOGLE_CLIENT_ID=')) {
        clientId = line.split('=')[1].trim();
        break;
    }
}

if (!clientId) {
    console.error('❌ Error: No se encontró VITE_GOOGLE_CLIENT_ID en .env.local');
    process.exit(1);
}

console.log('📋 Client ID encontrado:');
console.log(`   ${clientId}\n`);

// Verificaciones
const checks = {
    length: clientId.length >= 70,
    format: clientId.includes('.apps.googleusercontent.com'),
    prefix: clientId.startsWith('836862308960-') || /^\d{12}-/.test(clientId),
    complete: !clientId.includes('XXXX') && !clientId.includes('your_')
};

console.log('✅ Verificaciones:');
console.log(`   Longitud (>= 70 chars): ${checks.length ? '✅' : '❌'} (${clientId.length} chars)`);
console.log(`   Formato correcto: ${checks.format ? '✅' : '❌'}`);
console.log(`   Prefijo válido: ${checks.prefix ? '✅' : '❌'}`);
console.log(`   ID completo: ${checks.complete ? '✅' : '❌'}\n`);

const allPassed = Object.values(checks).every(v => v);

if (allPassed) {
    console.log('🎉 ¡Configuración correcta!');
    console.log('   El Client ID parece estar bien configurado.\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Reinicia el servidor de desarrollo (npm run dev)');
    console.log('   2. Abre http://localhost:5173');
    console.log('   3. Prueba el botón "Continuar con Google"\n');
} else {
    console.log('⚠️  Configuración incompleta');
    console.log('   El Client ID no parece estar completo.\n');
    console.log('📝 Acción requerida:');
    console.log('   1. Ve a: https://console.cloud.google.com/');
    console.log('   2. Navega a: APIs y servicios → Credenciales');
    console.log('   3. Copia el Client ID completo');
    console.log('   4. Actualiza VITE_GOOGLE_CLIENT_ID en .env.local');
    console.log('   5. Ejecuta este script nuevamente\n');
    console.log('📚 Guía completa: SOLUCION_GOOGLE_OAUTH_ERROR.md\n');
}

// Mostrar ejemplo de Client ID correcto
console.log('💡 Ejemplo de Client ID correcto:');
console.log('   836862308960-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com');
console.log('                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
console.log('                32 caracteres alfanuméricos\n');

process.exit(allPassed ? 0 : 1);
