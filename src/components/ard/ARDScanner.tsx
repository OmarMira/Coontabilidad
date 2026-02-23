import React, { useState, useCallback } from 'react';
import { Upload, File, X, Sparkles, Loader2 } from 'lucide-react';
import { saveARDDocument, updateARDDocumentStatus } from '../../database/simple-db';
import { ARDDocument } from '../../modules/ard/ARD.types';
import { useLocale } from '../../i18n/useLocale';
import Tesseract from 'tesseract.js';

interface ARDScannerProps {
    onDocumentProcessed: () => void;
}

export const ARDScanner: React.FC<ARDScannerProps> = ({ onDocumentProcessed }) => {
    const { t } = useLocale();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const processFile = async (file: File) => {
        const id = `ARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`; // Generar ID único para el documento

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'spa', {
                logger: (info) => console.log(info), // Opcional: para depuración
            });

            // Parsear el texto reconocido para extraer datos relevantes
            const mockResult = parseOCRText(text);

            updateARDDocumentStatus(id, 'processed', mockResult);
            onDocumentProcessed();
        } catch (error) {
            console.error('Error al procesar OCR:', error);
            updateARDDocumentStatus(id, 'error', { error: error instanceof Error ? error.message : 'Error desconocido' });
            onDocumentProcessed();
        }
    };

    const parseOCRText = (text: string): { amount: number; tax: number; vendor: string; date: string } => {
        // Implementar lógica para extraer datos como monto, impuesto, proveedor y fecha del texto reconocido
        const amount = extractAmount(text);
        const tax = extractTax(text);
        const vendor = extractVendor(text);
        const date = extractDate(text);

        return { amount, tax, vendor, date };
    };

    const extractAmount = (text: string): number => {
        // Lógica para extraer el monto del texto
        const match = text.match(/\b\d+(\.\d{1,2})?\b/);
        return match ? parseFloat(match[0]) : 0;
    };

    const extractTax = (text: string): number => {
        // Lógica para extraer el impuesto del texto (en inglés y español)
        const match = text.match(/(?:impuesto|tax|sales tax):\s*(\d+(\.\d{1,2})?)/i);
        return match ? parseFloat(match[1]) : 0;
    };

    const extractVendor = (text: string): string => {
        // Lógica para extraer el nombre del proveedor del texto (en inglés y español)
        const match = text.match(/(?:proveedor|vendor|from|bill to):\s*(.+)/i);
        return match ? match[1].trim() : 'Desconocido';
    };

    const extractDate = (text: string): string => {
        // Lógica para extraer la fecha del texto
        const match = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
        return match ? match[0] : new Date().toISOString().split('T')[0];
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) processFile(files[0]);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
        relative overflow-hidden rounded-[32px] border-2 border-dashed transition-all duration-500 p-12
        flex flex-col items-center justify-center text-center group
        ${isDragging ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99] shadow-inner' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}
        ${uploading ? 'pointer-events-none opacity-80' : 'cursor-pointer'}
      `}
        >
            <div className={`
        w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-500
        ${uploading ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20 group-hover:scale-110'}
      `}>
                {uploading ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Upload className="w-10 h-10 text-indigo-400" />}
            </div>

            <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                    {uploading ? t('ard.analyzingDoc') : t('ard.smartDigitalization')}
                </h3>
                <p className="text-slate-600 font-medium text-sm max-w-sm mx-auto">
                    {uploading
                        ? t('ard.visionEngineProgress')
                        : t('ard.dropFilesHint')}
                </p>
            </div>

            {uploading && (
                <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-pulse">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{t('ard.activeIAOCR')}</span>
                </div>
            )}

            {!uploading && (
                <label className="mt-8 px-8 py-3 bg-white text-black font-black text-xs rounded-2xl cursor-pointer hover:bg-slate-200 transition-colors uppercase tracking-widest">
                    {t('ard.selectFile')}
                    <input type="file" className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
                </label>
            )}

            {/* Glossy Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        </div>
    );
};
