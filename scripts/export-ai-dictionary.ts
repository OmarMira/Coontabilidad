
import { SQLiteEngine } from './src/core/database/SQLiteEngine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para exportar el Diccionario de Datos Dinámico de la IA a un archivo Markdown.
 * Útil para revisiones de DevOps y auditoría.
 */
async function exportAiDictionary() {
    const dbPath = path.join(process.cwd(), 'database.sqlite'); // Ajustar según entorno
    const engine = new SQLiteEngine();

    try {
        const dbRes = await engine.select("SELECT value FROM system_config WHERE key = 'ai_schema_summary_md'");
        if (dbRes.length > 0 && dbRes[0].value) {
            const outputPath = path.join(process.cwd(), 'docs', 'AI_DB_DICTIONARY.md');

            // Asegurar directorio
            if (!fs.existsSync(path.dirname(outputPath))) {
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            }

            fs.writeFileSync(outputPath, dbRes[0].value as string);
            console.log(`✅ Diccionario exportado exitosamente a: ${outputPath}`);
        } else {
            console.warn('⚠️ No se encontró el resumen del esquema en la base de datos. ¿Se ha ejecutado el crawler?');
        }
    } catch (error) {
        console.error('❌ Error exportando diccionario:', error);
    }
}

// Nota: Este script es una utilidad para el desarrollador.
// En el navegador, el sistema lo guarda internamente.
