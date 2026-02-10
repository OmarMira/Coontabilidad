import React, { useState, useCallback } from 'react';
import { Upload, File, X, Sparkles, Loader2 } from 'lucide-react';
import { saveARDDocument, updateARDDocumentStatus } from '../../database/simple-db';
import { ARDDocument } from '../../modules/ard/ARD.types';

interface ARDScannerProps {
    onDocumentProcessed: () => void;
}

export const ARDScanner: React.FC<ARDScannerProps> = ({ onDocumentProcessed }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const processFile = async (file: File) => {
        setUploading(true);
        const id = `ARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // 1. Registro Inicial
        const newDoc: ARDDocument = {
            id,
            name: file.name,
            type: file.type.includes('pdf') ? 'invoice_in' : 'receipt',
            status: 'analyzing',
            fileSize: file.size,
            uploadDate: new Date().toISOString()
        };

        saveARDDocument({
            ...newDoc,
            detectedAmount: 0,
            detectedTax: 0,
            detectedDate: new Date().toISOString().split('T')[0],
            rawAnalysis: '{}'
        });

        onDocumentProcessed();

        // 2. Simulación de Análisis Inteligente (OCR/IA)
        setTimeout(() => {
            const mockResult = {
                amount: Math.floor(Math.random() * 5000) + 100,
                tax: Math.floor(Math.random() * 300) + 10,
                vendor: "Suministros Industriales S.A.",
                date: new Date().toISOString().split('T')[0]
            };

            updateARDDocumentStatus(id, 'processed', mockResult);
            onDocumentProcessed();
            setUploading(false);
        }, 3000);
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
                    {uploading ? 'Analizando Documento...' : 'Digitalización Inteligente'}
                </h3>
                <p className="text-slate-600 font-medium text-sm max-w-sm mx-auto">
                    {uploading
                        ? 'Nuestro motor de visión está extrayendo montos e impuestos. Por favor espere.'
                        : 'Arrastre sus recibos, facturas o capturas de pantalla aquí para procesarlos instantáneamente.'}
                </p>
            </div>

            {uploading && (
                <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-pulse">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Motor OCR IA Activo</span>
                </div>
            )}

            {!uploading && (
                <label className="mt-8 px-8 py-3 bg-white text-black font-black text-xs rounded-2xl cursor-pointer hover:bg-slate-200 transition-colors uppercase tracking-widest">
                    Seleccionar Archivo
                    <input type="file" className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
                </label>
            )}

            {/* Glossy Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        </div>
    );
};
