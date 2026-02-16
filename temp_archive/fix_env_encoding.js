const fs = require('fs');

try {
    const filePath = '.env.local';
    if (fs.existsSync(filePath)) {
        // Read raw buffer
        const buffer = fs.readFileSync(filePath);

        // Convert to string assuming UTF-16LE if BOM is present (FF FE)
        let content = '';
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            console.log('Detected UTF-16LE BOM. Converting...');
            content = buffer.toString('utf16le');
        } else {
            // Try to read as utf8 but strip nulls just in case
            content = buffer.toString('utf8').replace(/\0/g, '');
        }

        // Escribir de nuevo como UTF-8 limpio
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ .env.local fixed to UTF-8 successfully!');

        // Imprimir para verificar (sin secretos en log si es posible, pero necesitamos ver si funcionó)
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.includes('GOOGLE_CLIENT_ID')) {
                console.log('Key detected:', line.split('=')[0] + '=...Length:' + line.split('=')[1]?.trim().length);
            }
        });

    } else {
        console.log('File not found');
    }
} catch (e) {
    console.error('Error fixing file:', e);
}
