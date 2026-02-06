import { http, HttpResponse } from 'msw';
import fs from 'fs';
import path from 'path';

// Helper to load WASM
const loadWasm = (filename: string) => {
    try {
        // Try multiple locations
        const paths = [
            path.join(process.cwd(), 'node_modules/wa-sqlite/dist', filename),
            path.join(process.cwd(), 'node_modules/sql.js/dist', filename)
        ];

        for (const p of paths) {
            if (fs.existsSync(p)) {
                return fs.readFileSync(p);
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

export const handlers = [
    // *.wasm Handler - CRITICAL for wa-sqlite in Node
    http.get('*.wasm', ({ request }) => {
        const url = new URL(request.url);
        const filename = url.pathname.split('/').pop() || '';
        const buffer = loadWasm(filename);

        if (buffer) {
            return new HttpResponse(buffer, {
                headers: { 'Content-Type': 'application/wasm' }
            });
        }
        return new HttpResponse(null, { status: 404 });
    }),

    // 1. Search Files/Folders
    http.get('https://www.googleapis.com/drive/v3/files', ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('q') || '';

        // Simular "Almacenamiento Lleno" si el token es 'QUOTA_LIMIT_TOKEN'
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer QUOTA_LIMIT_TOKEN') {
            return HttpResponse.json({
                error: {
                    code: 403,
                    message: 'Storage quota exceeded',
                    errors: [{ domain: 'global', reason: 'storageQuotaExceeded' }]
                }
            }, { status: 403 });
        }

        // Respuesta Mock para "Ensure Folder"
        if (q.includes("mimeType = 'application/vnd.google-apps.folder'")) {
            // Por defecto devuelve vacío para forzar creación, o devuelve si existe
            // Para tests, podemos asumir que NO existe inicialmente para probar creación,
            // o controlar vía header.
            return HttpResponse.json({ files: [] });
        }

        // Respuesta Mock para "Listar Backups" (Prune logic)
        // Devuelve 6 archivos para probar rotación
        if (q.includes("trashed = false") && url.searchParams.get('orderBy') === 'createdTime desc') {
            return HttpResponse.json({
                files: [
                    { id: 'file_6', name: 'backup_6.aex', createdTime: '2023-01-06T10:00:00Z' }, // Newest
                    { id: 'file_5', name: 'backup_5.aex', createdTime: '2023-01-05T10:00:00Z' },
                    { id: 'file_4', name: 'backup_4.aex', createdTime: '2023-01-04T10:00:00Z' },
                    { id: 'file_3', name: 'backup_3.aex', createdTime: '2023-01-03T10:00:00Z' },
                    { id: 'file_2', name: 'backup_2.aex', createdTime: '2023-01-02T10:00:00Z' },
                    { id: 'file_1', name: 'backup_1.aex', createdTime: '2023-01-01T10:00:00Z' }, // Oldest
                ]
            });
        }

        return HttpResponse.json({ files: [] });
    }),

    // 2. Create Folder / Upload File Metadata
    http.post('https://www.googleapis.com/drive/v3/files', () => {
        return HttpResponse.json({ id: 'new_folder_id', name: 'AccountExpress_Backups' });
    }),

    // 3. Upload Content (Multipart)
    http.post('https://www.googleapis.com/upload/drive/v3/files', ({ request }) => {
        const auth = request.headers.get('Authorization');

        // Simular error 503 si el token es 'NETWORK_ERROR_TOKEN'
        // Usaremos una variable global o state si necesitamos fallar N veces.
        // Para simplificar: Si el auth header tiene 'RETRY_TEST', fallamos la primera vez?
        // Mejor lógica en el test: MSW permite interceptar y usar generadores o estado.

        // Si queremos probar 503 una vez, Vitest+MSW state sharing es complejo.
        // Usaremos "scenario specific headers" o simplemente una variable fuera.

        if (auth === 'Bearer QUOTA_LIMIT_TOKEN') {
            return HttpResponse.json({
                error: {
                    code: 403,
                    message: 'Storage quota exceeded',
                    errors: [{ domain: 'global', reason: 'storageQuotaExceeded' }]
                }
            }, { status: 403 });
        }

        if (auth?.includes('EXPIRED_TOKEN')) {
            return HttpResponse.json({ error: { code: 401, message: 'Invalid Credentials' } }, { status: 401 });
        }

        if (auth?.includes('REVOKED_TOKEN')) {
            return HttpResponse.json({
                error: {
                    code: 403,
                    message: 'Insufficient Permission',
                    errors: [{ domain: 'global', reason: 'insufficientPermissions' }]
                }
            }, { status: 403 });
        }

        return HttpResponse.json({ id: 'uploaded_file_id', name: 'backup.aex' });
    }),

    // 4. Delete File
    http.delete('https://www.googleapis.com/drive/v3/files/:fileId', () => {
        return new HttpResponse(null, { status: 204 });
    })
];
