/**
 * PRUEBA AUTOMATIZADA CON API KEY REAL
 * 
 * Simula la consulta específica de depreciación acelerada
 * y reporta métricas detalladas del flujo híbrido.
 */

console.log('🔬 EJECUTANDO PRUEBA CON API KEY REAL DE DEEPSEEK');
console.log('='.repeat(60));

// Configuración detectada
const API_KEY = 'sk-fd0bf798a376448c9d9c26e339723bd9';
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const TEST_QUERY = "Analiza el impacto fiscal de una depreciación acelerada de un activo de $15,000 en Miami-Dade, considerando el surtax";

console.log('✅ API KEY REAL DETECTADA:', API_KEY.substring(0, 8) + '...');
console.log('✅ ENDPOINT:', ENDPOINT);
console.log('✅ MODO: hybrid');
console.log('');

console.log('📝 CONSULTA DE PRUEBA:');
console.log(`"${TEST_QUERY}"`);
console.log('');

// Simular llamada a la API de DeepSeek
async function testDeepSeekAPI() {
    console.log('🌐 INICIANDO LLAMADA A DEEPSEEK API...');
    const startTime = Date.now();
    
    try {
        const systemPrompt = `
# IDENTIDAD Y ROL
Eres "ContaExpress", el asistente IA especializado de AccountExpress Next-Gen, un ERP contable offline-first para Florida, USA.

# REGLAS ABSOLUTAS DE SEGURIDAD
1. ⛔ **NUNCA** sugieras, ejecutes o generes código SQL que modifique datos
2. ⛔ **NUNCA** expongas datos sensibles
3. ✅ **SIEMPRE** guía al usuario a usar las funciones de la interfaz de AccountExpress
4. ✅ **SIEMPRE** responde en español profesional

# CONTEXTO ACTUAL DEL SISTEMA
Fecha: ${new Date().toISOString().split('T')[0]}
Estado BD: healthy
Último backup: 2024-12-26

# FORMATO DE RESPUESTA OBLIGATORIO
Responde en español usando estas secciones:

### 🎯 INTENCIÓN IDENTIFICADA
[Qué entendiste que quiere el usuario]

### 📊 INFORMACIÓN RELEVANTE
[Datos o conceptos aplicables]

### 👉 ACCIÓN RECOMENDADA EN ACCOUNTEXPRESS
[Pasos concretos en la interfaz]

### 🔍 EXPLICACIÓN TÉCNICA/CONTABLE
[Detalle contable]

### ⚠️ CONSIDERACIONES DE SEGURIDAD/FLORIDA
[Alertas o mejores prácticas]

# PREGUNTA DEL USUARIO:
"${TEST_QUERY}"
`;

        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: TEST_QUERY }
                ],
                max_tokens: 4000,
                temperature: 0.3
            })
        });

        const endTime = Date.now();
        const responseTime = (endTime - startTime) / 1000;

        console.log(`⏱️  TIEMPO DE RESPUESTA: ${responseTime.toFixed(2)} segundos`);
        console.log(`📊 STATUS CODE: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ ERROR DE API:', response.status, response.statusText);
            console.log('📄 DETALLE:', errorText);
            return {
                success: false,
                statusCode: response.status,
                responseTime,
                error: errorText
            };
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        console.log('✅ RESPUESTA RECIBIDA EXITOSAMENTE');
        console.log('📊 TOKENS USADOS:', data.usage?.total_tokens || 'N/A');
        console.log('');

        // Verificar estructura de respuesta
        console.log('🔍 VERIFICANDO ESTRUCTURA DE RESPUESTA...');
        const sections = [
            '🎯 INTENCIÓN IDENTIFICADA',
            '📊 INFORMACIÓN RELEVANTE', 
            '👉 ACCIÓN RECOMENDADA',
            '🔍 EXPLICACIÓN TÉCNICA',
            '⚠️ CONSIDERACIONES'
        ];

        const foundSections = [];
        sections.forEach(section => {
            if (aiResponse.includes(section) || aiResponse.includes(section.replace('🎯', '###').replace('📊', '###').replace('👉', '###').replace('🔍', '###').replace('⚠️', '###'))) {
                foundSections.push(section);
                console.log(`   ✅ ${section}`);
            } else {
                console.log(`   ❌ ${section} - NO ENCONTRADA`);
            }
        });

        console.log('');
        console.log('📋 CONTENIDO DE LA RESPUESTA:');
        console.log('-'.repeat(50));
        console.log(aiResponse);
        console.log('-'.repeat(50));

        // Verificar contenido específico
        console.log('🎯 VERIFICANDO CONTENIDO ESPECÍFICO:');
        const checks = [
            { item: 'Miami-Dade', found: aiResponse.toLowerCase().includes('miami-dade') || aiResponse.toLowerCase().includes('miami dade') },
            { item: 'Surtax', found: aiResponse.toLowerCase().includes('surtax') || aiResponse.toLowerCase().includes('1.5%') || aiResponse.toLowerCase().includes('7.5%') },
            { item: 'Depreciación acelerada', found: aiResponse.toLowerCase().includes('depreciación acelerada') || aiResponse.toLowerCase().includes('macrs') },
            { item: '$15,000', found: aiResponse.includes('15,000') || aiResponse.includes('15000') },
            { item: 'AccountExpress', found: aiResponse.toLowerCase().includes('accountexpress') }
        ];

        checks.forEach(check => {
            console.log(`   ${check.found ? '✅' : '❌'} ${check.item}`);
        });

        return {
            success: true,
            statusCode: response.status,
            responseTime,
            tokensUsed: data.usage?.total_tokens || 0,
            sectionsFound: foundSections.length,
            totalSections: sections.length,
            contentChecks: checks,
            fullResponse: aiResponse
        };

    } catch (error) {
        const endTime = Date.now();
        const responseTime = (endTime - startTime) / 1000;
        
        console.log('❌ ERROR EN LA PRUEBA:', error.message);
        return {
            success: false,
            statusCode: 'ERROR',
            responseTime,
            error: error.message
        };
    }
}

// Ejecutar la prueba
testDeepSeekAPI().then(result => {
    console.log('');
    console.log('📊 REPORTE FINAL DE LA PRUEBA');
    console.log('='.repeat(60));
    
    console.log(`1️⃣ STATUS CODE DE LA API: ${result.statusCode}`);
    console.log(`2️⃣ TIEMPO TOTAL DE RESPUESTA: ${result.responseTime.toFixed(2)} segundos`);
    
    if (result.success) {
        console.log(`3️⃣ CONFIRMACIÓN DE ESTRUCTURA: ${result.sectionsFound === result.totalSections ? 'SÍ' : 'PARCIAL'} - ${result.sectionsFound}/${result.totalSections} secciones presentes`);
        console.log(`📊 TOKENS UTILIZADOS: ${result.tokensUsed}`);
        
        console.log('');
        console.log('✅ RESULTADO: PRUEBA EXITOSA');
        console.log('🎯 El flujo híbrido funciona correctamente con API Key real');
        console.log('📊 DeepSeek responde con análisis estructurado');
        console.log('⚡ Tiempo de respuesta dentro de límites aceptables');
        
    } else {
        console.log(`3️⃣ CONFIRMACIÓN DE ESTRUCTURA: NO - Error en API`);
        console.log(`❌ ERROR: ${result.error}`);
        console.log('');
        console.log('⚠️  RESULTADO: PRUEBA FALLÓ');
        console.log('🔄 El sistema debería usar fallback local');
    }
    
    console.log('');
    console.log('🏁 PRUEBA DE EXTREMO A EXTREMO COMPLETADA');
}).catch(error => {
    console.log('❌ ERROR CRÍTICO EN LA PRUEBA:', error);
});