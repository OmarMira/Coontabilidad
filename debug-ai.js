console.log("🔍 DIAGNÓSTICO EN TIEMPO REAL - AccountExpress AI");
console.log("================================================");

// 1. Verificar que la app pueda acceder a las variables
console.log("\n1. VARIABLES DE ENTORNO EN EJECUCIÓN:");
console.log("   REACT_APP_AI_MODE:", typeof process !== 'undefined' ? (process.env?.REACT_APP_AI_MODE || "NO en process.env") : "En navegador usa import.meta.env");

// 2. Comprobar estructura de módulos AI
console.log("\n2. ESTRUCTURA DE ARCHIVOS AI:");
const fs = require('fs');
const files = [
  'src/services/ConversationalIAService.ts',
  'src/services/ai/DeepSeekService.ts', 
  'src/config/deepseek.ts'
];
files.forEach(f => {
  console.log(`   ${fs.existsSync(f) ? '✅' : '❌'} ${f}`);
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    if (f.includes('deepseek.ts')) {
      const hasKey = content.includes('REACT_APP_DEEPSEEK_API_KEY');
      const hasVite = content.includes('import.meta.env');
      console.log(`     Config: ${hasKey ? 'API_KEY_SET' : 'NO_KEY'} | Vite: ${hasVite ? '✅' : '❌'}`);
    }
  }
});

// 3. Verificar .env.local ACTUAL
console.log("\n3. CONTENIDO ACTUAL DE .env.local:");
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  lines.forEach(l => console.log(`   ${l}`));
  
  const keyLine = lines.find(l => l.includes('REACT_APP_DEEPSEEK_API_KEY'));
  const modeLine = lines.find(l => l.includes('REACT_APP_AI_MODE'));
  
  if (keyLine) {
    const keyValue = keyLine.split('=')[1];
    const isRealKey = keyValue && !keyValue.includes('tu_clave_real_aqui') && keyValue.length > 30;
    console.log(`\n   🔐 API KEY: ${isRealKey ? '✅ REAL (' + keyValue.substring(0, 10) + '...)' : '❌ PLACEHOLDER'}`);
  }
  if (modeLine) {
    console.log(`   🎯 AI MODE: ${modeLine.split('=')[1]}`);
  }
}

console.log("\n🎯 DIAGNÓSTICO COMPLETO");
console.log("======================");
console.log("Ejecuta en tu NAVEGADOR la siguiente prueba:");
console.log("");
console.log("1. Abre AccountExpress");
console.log("2. Presiona F12 → Consola");
console.log("3. Pega esto y presiona Enter:");
console.log("");
console.log('   console.log("AI_MODE:", import.meta.env?.REACT_APP_AI_MODE || "NO_ACCESS")');
console.log('   console.log("DEEPSEEK_KEY:", import.meta.env?.REACT_APP_DEEPSEEK_API_KEY ? "✅ SET" : "❌ NOT SET")');
console.log("");
console.log("4. Comparte el resultado exacto que aparece.");