/**
 * Script de configuración para Ollama y DeepSeek
 * Este script guía al usuario en la instalación de los componentes necesarios
 * para que el asistente IA funcione 100% local y offline.
 */

console.log('\x1b[36m%s\x1b[0m', '🚀 CONFIGURACIÓN DE IA LOCAL - ACCOUNTEXPRESS');
console.log('--------------------------------------------------');
console.log('Para usar el nuevo motor de IA local-first, sigue estos pasos:');
console.log('');
console.log('\x1b[33m%s\x1b[0m', '1. Descargar e Instalar Ollama:');
console.log('   Visita: https://ollama.com/');
console.log('   Descarga la versión para tu sistema operativo e instálala.');
console.log('');
console.log('\x1b[33m%s\x1b[0m', '2. Descargar el modelo DeepSeek R1:');
console.log('   Abre una terminal y ejecuta el siguiente comando:');
console.log('   \x1b[32m%s\x1b[0m', 'ollama pull deepseek-r1-distill-llama-8b');
console.log('');
console.log('\x1b[33m%s\x1b[0m', '3. Verificar el estado:');
console.log('   Asegúrate de que Ollama esté corriendo en segundo plano.');
console.log('   AccountExpress se conectará automáticamente a http://localhost:11434');
console.log('');
console.log('--------------------------------------------------');
console.log('\x1b[32m%s\x1b[0m', '✅ ¡Listo! Una vez completado, el asistente IA funcionará sin internet.');
