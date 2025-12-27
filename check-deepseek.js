import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DEEPSEEK');
console.log('=========================================');

// Verificar .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('📁 .env.local encontrado');

    // Verificar que use REACT_APP_
    const hasReactApp = content.includes('REACT_APP_');
    const hasVite = content.includes('VITE_');

    console.log(`✅ Prefijo correcto (REACT_APP_): ${hasReactApp ? 'SÍ' : 'NO'}`);
    if (hasVite) console.log('❌ ERROR: Contiene VITE_ - Debe corregirse');

    // Verificar API Key
    const lines = content.split('\n');
    const keyLine = lines.find(l => l.includes('DEEPSEEK_API_KEY'));
    if (keyLine) {
        const keyValue = keyLine.split('=')[1];
        const isRealKey = keyValue && !keyValue.includes('TU_API_KEY_REAL_AQUI') && keyValue.trim().length > 30;
        console.log(`🔐 API Key configurada: ${isRealKey ? '✅ SÍ (real)' : '❌ NO (placeholder)'}`);

        if (!isRealKey) {
            console.log('\n🎯 ACCIÓN REQUERIDA:');
            console.log('1. Obtén API Key en: https://platform.deepseek.com/api_keys');
            console.log('2. Edita .env.local y reemplaza:');
            console.log('   REACT_APP_DEEPSEEK_API_KEY=TU_API_KEY_REAL_AQUI');
            console.log('   Con tu clave real (empieza con sk-)');
            console.log('3. Guarda y reinicia: npm run dev');
        }
    }
} else {
    console.log('❌ .env.local NO encontrado');
}

// Verificar archivos de configuración
console.log('\n📁 ARCHIVOS DE CONFIGURACIÓN:');
const configFiles = [
    'src/config/deepseek.ts',
    'src/services/ai/DeepSeekService.ts',
    'src/services/ConversationalIAService.ts'
];

configFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasVite = content.includes('VITE_');
        const hasReact = content.includes('REACT_APP_');
        const status = hasVite ? '❌ VITE_' : (hasReact ? '✅ REACT_APP_' : '⚠️  Sin prefijo');
        console.log(`   ${status} - ${file}`);
    } else {
        console.log(`   ❌ NO EXISTE - ${file}`);
    }
});

console.log('\n🚀 PARA ACTIVAR DEEPSEEK:');
console.log('1. Edita .env.local con tu API Key real');
console.log('2. Reinicia el servidor de desarrollo');
console.log('3. Prueba con: "Explica depreciación MACRS en Florida"');
