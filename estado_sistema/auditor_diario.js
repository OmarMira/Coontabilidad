import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(__dirname, 'VERDAD_ÚNICA.json');

console.log("🔍 Iniciando Auditoría Diaria de Account Express...");

function leerVerdadUnica() {
    try {
        const raw = fs.readFileSync(JSON_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error("❌ Error leyendo VERDAD_ÚNICA.json", e);
        process.exit(1);
    }
}

function guardarVerdadUnica(data) {
    try {
        fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log("✅ VERDAD_ÚNICA.json actualizado.");
    } catch (e) {
        console.error("❌ Error guardando VERDAD_ÚNICA.json", e);
    }
}

function auditar() {
    console.log("🛠️  Ejecutando 'npm run build' (esto puede tardar)...");

    const startTime = Date.now();

    exec('npm run build', { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2) + 's';

        let verdad = leerVerdadUnica();
        let buildExitoso = !error;
        let tsErrors = 0;

        // Intentar contar errores de TS en el output (heurística simple)
        const output = stdout + stderr;
        const errorMatches = output.match(/error TS\d+/g);
        if (errorMatches) {
            tsErrors = errorMatches.length;
        }

        console.log(`⏱️  Build completado en ${duration}`);
        console.log(`📊 Estado: ${buildExitoso ? 'EXITOSO' : 'FALLIDO'}`);
        console.log(`🐞 Errores TypeScript detectados: ${tsErrors}`);

        // Actualizar datos
        verdad.ultima_actualizacion = new Date().toISOString();
        verdad.estado_sistema.build_status = buildExitoso ? "exitoso" : "fallido";
        verdad.estado_sistema.last_build_time = duration;
        verdad.estado_sistema.typescript_errors = tsErrors;

        guardarVerdadUnica(verdad);

        console.log("🚀 Ejecutando generador de README...");
        exec('python estado_sistema/generador_README.py', { cwd: PROJECT_ROOT }, (err, out, serr) => {
            if (err) console.error("❌ Error generando README:", serr);
            else console.log("✅ README actualizado automáticamente.");
        });
    });
}

auditar();
