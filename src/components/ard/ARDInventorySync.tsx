import React, { useState } from 'react';
import { Package, RefreshCw, AlertCircle, CheckCircle2, ArrowRightLeft, Info, Search } from 'lucide-react';
import { ARDDocument } from '../../modules/ard/ARD.types';
import { updateProductStock, getProducts, Product } from '@/database/simple-db';
import { toast } from 'react-hot-toast';
import { useLocale } from '../../i18n/useLocale';

interface ARDInventorySyncProps {
    documents: ARDDocument[];
}

export const ARDInventorySync: React.FC<ARDInventorySyncProps> = ({ documents }) => {
    const { t } = useLocale();
    const [searchTerm, setSearchTerm] = useState('');
    const [syncing, setSyncing] = useState<string | null>(null);
    const [showProductPicker, setShowProductPicker] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    React.useEffect(() => {
        setAllProducts(getProducts());
    }, []);

    // Filtramos solo documentos que fueron convertidos y podrían tener impacto en inventario
    const syncableDocs = documents.filter(doc =>
        (doc.status === 'converted' || doc.status === 'processed')
    );

    const handleSync = async (docId: string, productId: number) => {
        setSyncing(docId);
        try {
            // Simulamos un delay de procesamiento
            await new Promise(r => setTimeout(r, 1000));

            const result = updateProductStock(productId, 1, 'add');
            if (result.success) {
                toast.success(t('ard.inventoryUpdatedToast'));
            } else {
                toast.error(result.message);
            }
        } catch (e) {
            toast.error(t('ard.syncErrorToast'));
        } finally {
            setSyncing(null);
            setShowProductPicker(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-blue-600/5 border border-blue-500/20 rounded-[40px]">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600/20 rounded-3xl border border-blue-500/30">
                        <Package className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{t('ard.inventoryEnlace')}</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">{t('ard.inventorySubtitle')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('ard.syncStatus')}</div>
                        <div className="text-white font-black text-xl tabular-nums">{t('ard.pendingSyncDocs', { count: syncableDocs.length })}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-blue-400 animate-spin-slow">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Informative Note */}
            <div className="p-6 bg-slate-900 border border-white/5 rounded-[32px] flex items-start gap-4 shadow-xl">
                <div className="p-2 bg-indigo-500/10 rounded-xl mt-1">
                    <Info className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{t('ard.integrationNote')}</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {t('ard.integrationDesc')}
                    </p>
                </div>
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {syncableDocs.map((doc) => {
                    const analysis = JSON.parse(doc.raw_analysis || '{}');
                    return (
                        <div key={doc.id} className="card-elite hover:border-blue-500/30 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-400 transition-colors">
                                        <ArrowRightLeft className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm tracking-tight">{doc.name}</div>
                                        <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{doc.id}</div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${doc.status === 'converted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {doc.status}
                                </div>
                            </div>

                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3 mb-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600 pb-2 border-b border-white/5">
                                    <span>{t('ard.detectedProductAI')}</span>
                                    <span>{t('ard.quantity')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-indigo-400 font-bold uppercase">{analysis.vendor || t('ard.variousCharges')}</span>
                                    <span className="text-xs text-white font-black">1.00 Unit</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowProductPicker(doc.id)}
                                disabled={syncing === doc.id}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 disabled:opacity-50"
                            >
                                {syncing === doc.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3" />
                                )}
                                {syncing === doc.id ? t('ard.syncingProgress') : t('ard.syncStockBtn')}
                            </button>

                            {showProductPicker === doc.id && (
                                <div className="mt-4 p-4 bg-slate-800 rounded-2xl border border-white/10 animate-in slide-in-from-top-2">
                                    <h5 className="text-[9px] font-black text-white uppercase mb-3">{t('ard.selectInventoryProduct')}</h5>
                                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                        {allProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSync(doc.id, p.id)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[10px] text-slate-500 hover:text-white transition-colors flex justify-between items-center"
                                            >
                                                <span>{p.name} <span className="opacity-40">({p.sku})</span></span>
                                                <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {syncableDocs.length === 0 && (
                    <div className="col-span-2 py-20 text-center card-elite border-dashed border-2 opacity-50">
                        <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">{t('ard.noItemsToSync')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
