
self.onmessage = (e: MessageEvent) => {
    const { type, taskId, payload } = e.data;

    if (type === 'EXECUTE_TASK') {
        try {
            const { headers, rows, filename = 'export.csv' } = payload;

            // Validate input
            if (!headers || !Array.isArray(headers) || !rows || !Array.isArray(rows)) {
                throw new Error('Invalid input: headers and rows must be arrays');
            }

            // Convert to CSV string with efficient buffering
            const csvContent = generateCSV(headers, rows);

            // Create Blob
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            self.postMessage({
                taskId,
                type: 'TASK_COMPLETE',
                payload: {
                    blob,
                    filename,
                    size: blob.size,
                    rows: rows.length
                }
            });
        } catch (error: any) {
            self.postMessage({
                taskId,
                error: error.message
            });
        }
    }
};

function generateCSV(headers: string[], rows: (string | number)[][]): string {
    const CHUNK_SIZE = 1000;
    const parts: string[] = [];

    // Add headers
    parts.push(headers.join(',') + '\n');

    // Process rows in chunks to keep memory usage stable
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const chunkStr = chunk.map(row =>
            row.map(cell => {
                const cellStr = String(cell);
                // Escape quotes and wrap in quotes if contains comma, quote or newline
                if (cellStr.includes('"') || cellStr.includes(',') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');

        parts.push(chunkStr + '\n');
    }

    return parts.join('');
}
