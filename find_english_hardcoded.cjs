// Archivo: find_english_hardcoded.cjs
const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath, results);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src/components');
const findings = [];

// Regex mejorada para detectar textos hardcodeados comunes en JSX y props
const patterns = [
    // Texto entre tags JSX: >Title<, > Save <
    />\s*([A-Z][a-z0-9\s\-,]+)\s*</,

    // Props comunes: title="Save", placeholder="Search...", aria-label="Close"
    /\b(title|placeholder|aria-label|alt)=["']([A-Z][a-z0-9\s\-,]+)["']/,

    // Texto en labels/headers de tablas a menudo hardcodeados en MAYÚSCULAS: "DATE", "TYPE"
    />\s*([A-Z_]{3,})\s*</,

    // Strings literales en definiciones de objetos/columnas: header: "Date"
    /header:\s*["']([A-Z][a-z\s]+)["']/,
    /label:\s*["']([A-Z][a-z\s]+)["']/,

    // Palabras clave específicas reportadas por el usuario
    /\b(Title|Subtitle|Save|Cancel|Delete|Edit|Search|Filter|Date|Type|Product|Quantity|Balance|Reference|Notes|Warning|Error|Success|Submit|Close|Open|New|Create|Update|Select|Option|Loading|Please|Wait|Confirm|Yes|No|Movements|Recorded|Transactions|Appear)\b/i
];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
        // Ignorar líneas con t(), comentarios, imports, console.log
        if (line.includes('t(') || line.trim().startsWith('//') || line.includes('import ') || line.includes('console.')) return;

        let matched = false;
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                // Validación extra para evitar falsos positivos en código (e.g. nombres de componentes <Title />)
                const text = match[1] || match[0];
                // Ignorar si parece un tag de cierre o apertura de componente sin contenido
                if (text.startsWith('<') || text.startsWith('</')) continue;

                findings.push({
                    file: file.replace(/\\/g, '/'),
                    line: idx + 1,
                    text: line.trim(),
                    match: text,
                    fullMatch: match[0]
                });
                matched = true;
                break; // Solo un match por línea para no duplicar
            }
        }
    });
});

console.log(`\n🔍 TEXTOS EN INGLÉS ENCONTRADOS: ${findings.length}\n`);

// Agrupar por archivo
const byFile = {};
findings.forEach(f => {
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);
});

fs.writeFileSync('english_hardcoded_report.json', JSON.stringify(byFile, null, 2));
console.log(`\n📊 Reporte detallado guardado en: english_hardcoded_report.json`);

// Mostrar resumen en consola (limitado para no saturar)
Object.keys(byFile).sort().slice(0, 10).forEach(file => {
    console.log(`\n📄 ${file} (${byFile[file].length} posibles ocurrencias)`);
    byFile[file].slice(0, 3).forEach(f => {
        console.log(`   Línea ${f.line}: ${f.text.substring(0, 60)}... [Detectado: "${f.match}"]`);
    });
    if (byFile[file].length > 3) console.log(`   ... y ${byFile[file].length - 3} más`);
});
