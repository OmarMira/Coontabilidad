
import { ConversationalIAService } from './src/services/ConversationalIAService';

async function runTests() {
    const service = ConversationalIAService.getInstance();

    const testQueries = [
        'cuantos clientes tengo',
        'articulos con bajo stock',
        'proveedores'
    ];

    console.log("🚀 INICIANDO PRUEBAS DE VERIFICACIÓN REAL\n");

    for (const query of testQueries) {
        console.log(`----------------------------------------`);
        console.log(`🔍 PREGUNTA: "${query}"`);
        try {
            const response = await service.processQuery(query);
            console.log(`🎯 INTENCIÓN: ${response.metadata.intent}`);
            console.log(`📊 DATA SOURCE: ${response.metadata.dataSource}`);
            console.log(`📝 RESPUESTA: ${response.content.substring(0, 200)}...`);
            if (response.data) {
                console.log(`📑 REGISTROS ENCONTRADOS: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
            }
        } catch (error) {
            console.error(`❌ ERROR: ${(error as Error).message}`);
        }
        console.log(`\n`);
    }
}

runTests().catch(console.error);
