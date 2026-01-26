import React, { useState, useEffect } from 'react';
import { ScanSearch, FilePlus, Database, CheckCircle2, AlertCircle, Clock, Settings, ArrowRight, RefreshCw } from 'lucide-react';
import { ARDDocument } from '../../modules/ard/ARD.types';
import { ARDScanner } from './ARDScanner';
import { ARDDocumentList } from './ARDDocumentList';
import { getARDDocuments } from '../../database/simple-db';
import { logger } from '../../core/logging/SystemLogger';

export const ARDModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'setup'>('scan');
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadDocuments = async () => {
        try {
            const docs = getARDDocuments();
            setDocuments(docs);
        } catch (e) {
            logger.error('ARD', 'load_failed', 'Fallo al cargar documentos ARD', null, e as Error);
        }
    };

    useEffect(() => {
        loadDocuments();
        // Polling si hay documentos analizando
        const interval = setInterval(() => {
            const hasAnalyzing = documents.some(d => d.status === 'analyzing');
            if (hasAnalyzing) loadDocuments();
        }, 2000);
        return () => clearInterval(interval);
    }, [documents]);

    const stats = {
        pending: documents.filter(d => d.status === 'pending' || d.status === 'analyzing').length,
        processed: documents.filter(d => d.status === 'processed').length,
        errors: documents.filter(d => d.status === 'error').length,
        converted: documents.filter(d => d.status === 'converted').length
    };

    return (
        <div className="space-y-8 animate-fade-in px-2">
            {/* HEADER ELITE */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <ScanSearch className="w-8 h-8 text-indigo-400" />
                        </div>
                        ARD: Análisis de Recibos y Documentos
                    </h2>
                    <p className="text-gray-400 mt-2 font-medium">Motor inteligente de procesamiento de documentos y conversión automática.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'scan' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-gray-500 hover:text-white'}`}
                    >
                        <FilePlus className="w-4 h-4" /> DIGITALIZACIÓN
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Database className="w-4 h-4" /> GESTIÓN GAR
                    </button>
                </div>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'En Proceso', val: stats.pending, icon: Clock, color: 'text-sun-orange' },
                    { label: 'Analizados', val: stats.processed, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Errores', val: stats.errors, icon: AlertCircle, color: 'text-rose-400' },
                    { label: 'Convertidos', val: stats.converted, icon: RefreshCw, color: 'text-blue-400' },
                ].map((stat, i) => (
                    <div key={i} className="card-elite !p-6 flex items-center gap-4 border-l-4 border-l-white/5 hover:border-l-indigo-500/50 transition-all">
                        <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                            <div className="text-xl font-black text-white">{stat.val}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* WORKSPACE AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    {activeTab === 'scan' ? (
                        <ARDScanner onDocumentProcessed={loadDocuments} />
                    ) : (
                        <ARDDocumentList documents={documents} onRefresh={loadDocuments} />
                    )}
                </div>
            </div>

            {/* FOOTER FASE 2 */}
            <div className="p-4 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">
                        Módulo ARD Fase 2 (GAR) - Sistema de Gestión Operativo
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Motor OCR Listo</span>
                </div>
            </div>
        </div>
    );
};
