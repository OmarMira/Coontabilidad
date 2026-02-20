// Archivo: fix_english_hardcoded.cjs
const fs = require('fs');
const path = require('path');

// Diccionario de reemplazos seguros (Solo UI, no lógica)
const replacements = {
    // Generales
    '>Title<': '>Título<',
    '>Subtitle<': '>Subtítulo<',
    '>Description<': '>Descripción<',
    '>Name<': '>Nombre<',
    '>Type<': '>Tipo<',
    '>Status<': '>Estado<',
    '>Date<': '>Fecha<',
    '>Action<': '>Acción<',
    '>Actions<': '>Acciones<',
    '>Notes<': '>Notas<',
    '>Reference<': '>Referencia<',
    '>Quantity<': '>Cantidad<',
    '>Amount<': '>Monto<',
    '>Balance<': '>Balance<', // A veces es igual, pero por si acaso cambio de contexto visual
    '>Total<': '>Total<',
    '>Product<': '>Producto<',
    '>Price<': '>Precio<',
    '>Cost<': '>Costo<',
    '>Category<': '>Categoría<',
    '>Supplier<': '>Proveedor<',
    '>Customer<': '>Cliente<',
    '>Phone<': '>Teléfono<',
    '>Email<': '>Correo<',
    '>Address<': '>Dirección<',

    // Botones y Acciones
    '>Save<': '>Guardar<',
    '>Cancel<': '>Cancelar<',
    '>Delete<': '>Eliminar<',
    '>Edit<': '>Editar<',
    '>Update<': '>Actualizar<',
    '>Create<': '>Crear<',
    '>Search<': '>Buscar<',
    '>Filter<': '>Filtrar<',
    '>Back<': '>Volver<',
    '>Next<': '>Siguiente<',
    '>Previous<': '>Anterior<',
    '>Confirm<': '>Confirmar<',
    '>Submit<': '>Enviar<',
    '>Close<': '>Cerrar<',
    '>View<': '>Ver<',
    '>Print<': '>Imprimir<',
    '>Export<': '>Exportar<',
    '>Import<': '>Importar<',
    '>Download<': '>Descargar<',
    '>Upload<': '>Subir<',

    // Headers de Tablas (a menudo en mayúsculas)
    '>DATE<': '>FECHA<',
    '>TYPE<': '>TIPO<',
    '>PRODUCT<': '>PRODUCTO<',
    '>QUANTITY<': '>CANTIDAD<',
    '>BALANCE<': '>BALANCE<',
    '>REFERENCE<': '>REFERENCIA<',
    '>NOTES<': '>NOTAS<',
    '>STATUS<': '>ESTADO<',
    '>ACTION<': '>ACCIÓN<',
    '>ACTIONS<': '>ACCIONES<',
    '>AMOUNT<': '>MONTO<',
    '>TOTAL<': '>TOTAL<',
    '>DESCRIPTION<': '>DESCRIPCIÓN<',

    // Mensajes y Estados
    '>Loading...<': '>Cargando...<',
    '>Loading<': '>Cargando<',
    '>Error<': '>Error<',
    '>Success<': '>Éxito<',
    '>Warning<': '>Advertencia<',
    '>No results found<': '>No se encontraron resultados<',
    '>No data available<': '>No hay datos disponibles<',
    '>No movements recorded<': '>No hay movimientos registrados<',
    '>No transactions found<': '>No se encontraron transacciones<',
    '>Please wait<': '>Por favor, espere<',
    '>Are you sure?<': '>¿Está seguro?<',

    // Placeholders (formato regex más complejo, se maneja abajo)
};

// Mapa específico para placeholders y atributos
const attributeReplacements = {
    'Search...': 'Buscar...',
    'Search': 'Buscar',
    'Select option': 'Seleccionar opción',
    'Enter value': 'Ingresar valor',
    'Enter name': 'Ingresar nombre',
    'Description': 'Descripción',
    '0.00': '0.00', // Mantener
};

function walk(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath, results);
        } else if (filePath.endsWith('.tsx')) { // Solo componentes TSX puros
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src/components');
let totalChanges = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let changesInFile = 0;

    // 1. Reemplazo directo de tags JSX (>Title<)
    Object.keys(replacements).forEach(english => {
        const spanish = replacements[english];
        // Usar split/join es más rápido y seguro que regex para literales simples
        if (content.includes(english)) {
            const parts = content.split(english);
            content = parts.join(spanish);
            changesInFile += parts.length - 1;
        }
    });

    // 2. Reemplazo de atributos (placeholder="Search")
    // Regex segura: placeholder="Search" o placeholder='Search'
    Object.keys(attributeReplacements).forEach(eng => {
        const esp = attributeReplacements[eng];

        const patterns = [
            { regex: new RegExp(`placeholder="${eng}"`, 'g'), replace: `placeholder="${esp}"` },
            { regex: new RegExp(`placeholder='${eng}'`, 'g'), replace: `placeholder='${esp}'` },
            { regex: new RegExp(`title="${eng}"`, 'g'), replace: `title="${esp}"` },
            { regex: new RegExp(`aria-label="${eng}"`, 'g'), replace: `aria-label="${esp}"` }
        ];

        patterns.forEach(p => {
            if (p.regex.test(content)) {
                content = content.replace(p.regex, p.replace);
                changesInFile++; // Conteo aproximado
            }
        });
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${changesInFile} texts in: ${file}`);
        totalChanges += changesInFile;
    }
});

console.log(`\n🎉 CORRECCIÓN MASIVA COMPLETADA: ${totalChanges} reemplazos realizados.`);
