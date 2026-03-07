import React, { useState, useEffect } from 'react';
import { ScanSearch, FilePlus, Database, CheckCircle2, AlertCircle, Clock, Settings, ArrowRight, RefreshCw, DollarSign, Users, Gem, Package, Rocket, Zap } from 'lucide-react';
import { ARDDocument } from '../../modules/ard/ARD.types';
import { ARDScanner } from './ARDScanner';
import { ARDDocumentList } from './ARDDocumentList';
import { ARDCollectionManager } from './ARDCollectionManager';
import { ARDCustomerPanel } from './ARDCustomerPanel';
import { ARDQualityPanel } from './ARDQualityPanel';
import { ARDInventorySync } from './ARDInventorySync';
import { ARDRoadmap } from './ARDRoadmap';
import { getARDDocuments } from '@/database/simple-db';
import { logger } from '../../core/logging/SystemLogger';
import { useLocale } from '../../i18n/useLocale';

export const ARDModule: React.FC = () => {
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'payments' | 'customers' | 'quality' | 'inventory' | 'roadmap'>('scan');
    const [documents, setDocuments] = useState<ARDDocument[]>([]);
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
    }, []);

    useEffect(() => {
        const hasAnalyzing = documents.some(d => d.status === 'analyzing');
        if (hasAnalyzing) {
            const interval = setInterval(loadDocuments, 2000);
            return () => clearInterval(interval);
        }
    }, [documents.some(d => d.status === 'analyzing')]);

    const stats = {
        pending: documents.filter(d => d.status === 'pending' || d.status === 'analyzing').length,
        processed: documents.filter(d => d.status === 'processed').length,
        errors: documents.filter(d => d.status === 'error').length,
        converted: documents.filter(d => d.status === 'converted').length
    };

    return (
        <div className="elite-page-container">
            {/* HEADER ELITE */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-600/10 rounded-2.5xl border border-indigo-500/20 shadow-indigo-900/10 shadow-lg group">
                        <ScanSearch className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('ard.title')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> {t('ard.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'scan' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <FilePlus className="w-4 h-4" /> {t('ard.scanning')}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <Database className="w-4 h-4" /> {t('ard.garManagement')}
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <Package className="w-4 h-4" /> {t('ard.inventory')}
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'payments' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <DollarSign className="w-4 h-4" /> {t('ard.collections')}
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <Users className="w-4 h-4" /> {t('ard.customers')}
                    </button>
                    <button
                        onClick={() => setActiveTab('quality')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'quality' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <Gem className="w-4 h-4" /> {t('ard.quality.label')}
                    </button>
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'roadmap' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'text-slate-600 hover:text-white'}`}
                    >
                        <Rocket className="w-4 h-4" /> {t('ard.roadmap.label')}
                    </button>
                </div>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: t('ard.enProceso'), val: stats.pending, icon: Clock, color: 'text-sun-orange' },
                    { label: t('ard.analizados'), val: stats.processed, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: t('ard.errores'), val: stats.errors, icon: AlertCircle, color: 'text-rose-400' },
                    { label: t('ard.convertidos'), val: stats.converted, icon: RefreshCw, color: 'text-blue-400' },
                ].map((stat, i) => (
                    <div key={i} className="card-elite !p-6 flex items-center gap-4 border-l-4 border-l-white/5 hover:border-l-indigo-500/50 transition-all">
                        <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</span>
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
                    ) : activeTab === 'history' ? (
                        <ARDDocumentList documents={documents} onRefresh={loadDocuments} />
                    ) : activeTab === 'payments' ? (
                        <ARDCollectionManager documents={documents} onRefresh={loadDocuments} />
                    ) : activeTab === 'customers' ? (
                        <ARDCustomerPanel />
                    ) : activeTab === 'inventory' ? (
                        <ARDInventorySync documents={documents} />
                    ) : activeTab === 'roadmap' ? (
                        <ARDRoadmap />
                    ) : (
                        <ARDQualityPanel />
                    )}
                </div>
            </div>

            {/* FOOTER FASE 5 */}
            <div className="p-4 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">
                        {t('ard.faseStatus')}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{t('ard.engineReady')}</span>
                </div>
            </div>
        </div>
    );
};
