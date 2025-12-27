/**
 * PRUEBA COMPREHENSIVA DEL SISTEMA DE IA HÍBRIDO
 * 
 * Este script verifica el estado completo del sistema AI:
 * 1. Configuración de entorno
 * 2. Flujo híbrido (DeepSeek + Local)
 * 3. Fallback elegante
 * 4. Timeout handling
 * 5. Respuestas estructuradas
 */

console.log('🔬 INICIANDO PRUEBA COMPREHENSIVA DEL SISTEMA DE IA');
console.log('='.repeat(60));

// 1. VERIFICAR CONFIGURACIÓN DE ENTORNO
console.log('\n📋 1. VERIFICANDO CONFIGURACIÓN DE ENTORNO');
console.log('-'.repeat(40));

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    console.log('✅ Archivo .env.local encontrado');
    
    const lines = envContent.split('\n');
    const config = {};
    
    lines.forEach(line => {
        if (line.includes('=')) {
            const [key, value] = line.split('=');
            config[key.trim()] = value.trim();
        }
    });
    
    console.log('📊 Configuración actual:');
    console.log(`   REACT_APP_AI_MODE: ${config.REACT_APP_AI_MODE || 'NO DEFINIDO'}`);
    console.log(`   REACT_APP_DEEPSEEK_API_KEY: ${config.REACT_APP_DEEPSEEK_API_KEY ? 'CONFIGURADO' : 'NO DEFINIDO'}`);
    console.log(`   REACT_APP_DEEPSEEK_ENDPOINT: ${config.REACT_APP_DEEPSEEK_ENDPOINT || 'NO DEFINIDO'}`);
    console.log(`   REACT_APP_MAX_TOKENS: ${config.REACT_APP_MAX_TOKENS || 'NO DEFINIDO'}`);
    
    // Verificar modo híbrido
    if (config.REACT_APP_AI_MODE === 'hybrid') {
        console.log('✅ Modo híbrido ACTIVADO correctamente');
    } else {
        console.log('⚠️  Modo híbrido NO configurado (esperado: hybrid)');
    }
    
    // Verificar API key
    if (config.REACT_APP_DEEPSEEK_API_KEY && config.REACT_APP_DEEPSEEK_API_KEY !== 'sk-tu_clave_real_aqui') {
        console.log('✅ API Key de DeepSeek configurada');
    } else {
        console.log('⚠️  API Key de DeepSeek NO configurada o es placeholder');
    }
    
} catch (error) {
    console.log('❌ Error leyendo .env.local:', error.message);
}

// 2. VERIFICAR ARCHIVOS DEL SISTEMA AI
console.log('\n📁 2. VERIFICANDO ARCHIVOS DEL SISTEMA AI');
console.log('-'.repeat(40));

const aiFiles = [
    'src/config/deepseek.ts',
    'src/services/ConversationalIAService.ts',
    'src/services/AIEngine/QueryProcessor.ts',
    'src/services/ai/DeepSeekService.ts',
    'src/services/ai/ContextBuilder.ts',
    'src/services/ai/SecurityValidator.ts',
    'src/services/ai/types.ts',
    'src/knowledge/SystemKnowledge.ts'
];

aiFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
        console.log(`❌ ${file} - FALTANTE`);
    }
});

// 3. VERIFICAR ESTRUCTURA DE BASE DE DATOS
console.log('\n🗄️  3. VERIFICANDO ESTRUCTURA DE BASE DE DATOS');
console.log('-'.repeat(40));

const dbFile = 'src/database/simple-db.ts';
const dbPath = path.join(__dirname, dbFile);

if (fs.existsSync(dbPath)) {
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    
    // Verificar vistas _summary
    const summaryViews = [
        'financial_summary',
        'inventory_summary',
        'tax_summary_florida',
        'customers_summary',
        'invoices_summary',
        'alerts_summary'
    ];
    
    console.log('📊 Verificando vistas _summary para IA:');
    summaryViews.forEach(view => {
        if (dbContent.includes(view)) {
            console.log(`   ✅ ${view}`);
        } else {
            console.log(`   ❌ ${view} - FALTANTE`);
        }
    });
    
    // Verificar tablas de auditoría
    const auditTables = ['ai_conversations', 'system_logs'];
    console.log('\n📋 Verificando tablas de auditoría:');
    auditTables.forEach(table => {
        if (dbContent.includes(table)) {
            console.log(`   ✅ ${table}`);
        } else {
            console.log(`   ❌ ${table} - FALTANTE`);
        }
    });
    
} else {
    console.log('❌ Archivo de base de datos no encontrado');
}

// 4. SIMULACIÓN DE CONSULTAS
console.log('\n🧪 4. SIMULACIÓN DE CONSULTAS DE PRUEBA');
console.log('-'.repeat(40));

const testQueries = [
    {
        query: "¿Cuál es mi balance general?",
        expectedIntent: "financial",
        expectedSource: "financial_summary",
        complexity: "simple"
    },
    {
        query: "Explícame la diferencia entre depreciación lineal y MACRS para impuestos de Florida",
        expectedIntent: "deepseek_analysis",
        expectedSource: "deepseek_hybrid",
        complexity: "complex"
    },
    {
        query: "Productos con stock bajo",
        expectedIntent: "inventory",
        expectedSource: "inventory_summary",
        complexity: "simple"
    },
    {
        query: "¿Cómo debo registrar la depreciación acelerada de un vehículo comercial según las leyes fiscales de Florida?",
        expectedIntent: "deepseek_analysis",
        expectedSource: "deepseek_hybrid",
        complexity: "complex"
    }
];

console.log('📝 Consultas de prueba preparadas:');
testQueries.forEach((test, index) => {
    console.log(`   ${index + 1}. "${test.query}"`);
    console.log(`      Complejidad: ${test.complexity}`);
    console.log(`      Intent esperado: ${test.expectedIntent}`);
    console.log(`      Fuente esperada: ${test.expectedSource}`);
    console.log('');
});

// 5. INSTRUCCIONES PARA PRUEBA MANUAL
console.log('\n🎯 5. INSTRUCCIONES PARA PRUEBA MANUAL');
console.log('-'.repeat(40));

console.log('Para completar la prueba, sigue estos pasos:');
console.log('');
console.log('1. 🌐 Abre http://localhost:3002 en tu navegador');
console.log('2. 🔍 Abre las herramientas de desarrollador (F12)');
console.log('3. 📋 Ve a la pestaña "Console"');
console.log('4. 🤖 Haz clic en el botón flotante del asistente IA');
console.log('5. 📝 Prueba cada una de las consultas listadas arriba');
console.log('');
console.log('🔍 QUÉ BUSCAR EN LA CONSOLA:');
console.log('');
console.log('Para consultas SIMPLES (balance, stock):');
console.log('   ✅ "📝 SmartRouter procesando: [consulta]"');
console.log('   ✅ "🔍 QueryProcessor procesando: [consulta]"');
console.log('   ✅ "✅ Consulta SQL procesada: [intent]"');
console.log('   ✅ Respuesta en menos de 2 segundos');
console.log('');
console.log('Para consultas COMPLEJAS (depreciación, MACRS):');
console.log('   ✅ "📝 SmartRouter procesando: [consulta]"');
console.log('   ✅ "[DeepSeekService] Processing query for user 1"');
console.log('   ✅ "API call successful" O "API call failed → Returning fallback"');
console.log('   ✅ Respuesta estructurada en 5 secciones (🎯, 📊, 👉, 🔍, ⚠️)');
console.log('');
console.log('🚨 PROBLEMAS A REPORTAR:');
console.log('   ❌ Círculo de carga infinito');
console.log('   ❌ Errores de compilación en consola');
console.log('   ❌ Respuestas vacías o "undefined"');
console.log('   ❌ Timeouts que no se resuelven');
console.log('   ❌ Bucles de llamadas API');

// 6. RESUMEN DEL ESTADO
console.log('\n📊 6. RESUMEN DEL ESTADO ACTUAL');
console.log('='.repeat(60));

console.log('🎯 OBJETIVO: Verificar que el sistema AI híbrido funciona correctamente');
console.log('📋 COMPONENTES: DeepSeek API + Motor Local + Smart Router + Fallback');
console.log('🔒 SEGURIDAD: Solo lectura, validación de consultas, auditoría');
console.log('⚡ RENDIMIENTO: Timeout 60s, fallback inmediato, respuestas < 2s');
console.log('');
console.log('✅ Si todo funciona: El sistema está listo para producción');
console.log('⚠️  Si hay problemas: Reportar logs específicos de la consola');
console.log('');
console.log('🚀 SERVIDOR CORRIENDO EN: http://localhost:3002');
console.log('');
console.log('¡Comienza la prueba manual ahora!');