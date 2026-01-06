import * as pdfjsLib from 'pdfjs-dist';
// Vite-specific worker import
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extracts raw text lines from a PDF file.
 */
export const extractTextFromPDF = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const lines: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const items = textContent.items as any[];
        const rows: { y: number, text: string }[] = [];

        items.forEach(item => {
            const y = Math.round(item.transform[5]);
            const text = item.str;
            if (!text.trim()) return;

            const row = rows.find(r => Math.abs(r.y - y) < 4);
            if (row) {
                row.text += ' ' + text;
            } else {
                rows.push({ y, text });
            }
        });

        rows.sort((a, b) => b.y - a.y);
        rows.forEach(r => lines.push(r.text));
    }

    return lines;
};
