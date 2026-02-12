import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, Clock, CheckCircle2, Filter, Search, TrendingUp, Landmark } from 'lucide-react';
import { ARDPaymentModal } from './ARDPaymentModal';
import { ARDDocument } from '../../modules/ard/ARD.types';
import { useLocale } from '../../i18n/useLocale';

interface ARDCollectionManagerProps {
    documents: ARDDocument[];
    onRefresh: () => void;
}

export const ARDCollectionManager: React.FC<ARDCollectionManagerProps> = ({ documents, onRefresh }) => {
    const { t } = useLocale();
    const [selectedToConvert, setSelectedToConvert] = useState<ARDDocument | null>(null);
    const [filter, setFilter] = useState('');

    // Solo documentos procesados (listos para cobrar) o ya convertidos
    const collectionDocs = documents.filter(d =>
        (d.status === 'processed' || d.status === 'converted') &&
        (d.name.toLowerCase().includes(filter.toLowerCase()) || d.id.toLowerCase().includes(filter.toLowerCase()))
    );

    const pendingToCollect = documents
        .filter(d => d.status === 'processed')
        .reduce((sum, d) => sum + (d.detected_amount || 0), 0);

    const recoveredToday = documents
        .filter(d => d.status === 'converted')
        .reduce((sum, d) => sum + (d.detected_amount || 0), 0);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-elite bg-gradient-to-br from-indigo-600/20 to-transparent border-indigo-500/20 !p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{t('ard.pendingToReconcile')}</span>
                        </div>
                        <div className="text-4xl font-black text-white tabular-nums">{formatCurrency(pendingToCollect)}</div>
                        <p className="text-slate-600 text-xs mt-2 font-medium">{t('ard.detectedInProcessedDocs')}</p>
                    </div>
                    <DollarSign className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500/5 rotate-12" />
                </div>

                <div className="card-elite bg-gradient-to-br from-emerald-600/20 to-transparent border-emerald-500/20 !p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">{t('ard.recoveredARD')}</span>
                        </div>
                        <div className="text-4xl font-black text-white tabular-nums">{formatCurrency(recoveredToday)}</div>
                        <p className="text-slate-600 text-xs mt-2 font-medium">{t('ard.fundsConvertedSuccess')}</p>
                    </div>
                    <CheckCircle2 className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-500/5 -rotate-12" />
                </div>
            </div>

            {/* Collection List */}
            <div className="card-elite !p-0 overflow-hidden border-white/5">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input
                            type="text"
                            placeholder={t('ard.searchPlaceholder')}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('ard.filteringPendingCollections')}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <th className="px-8 py-5">{t('ard.originARD')}</th>
                                <th className="px-8 py-5">{t('ard.ocrDetection')}</th>
                                <th className="px-8 py-5">{t('ard.financialStatus')}</th>
                                <th className="px-8 py-5 text-center">{t('ard.actionsCol')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {collectionDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${doc.status === 'converted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                <Landmark className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-white font-bold">{doc.name}</div>
                                                <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{doc.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-lg font-black text-white tabular-nums">{formatCurrency(doc.detected_amount || 0)}</div>
                                        <div className="text-[10px] font-bold text-slate-600">{t('ard.docDate', { date: doc.detected_date })}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {doc.status === 'converted' ? (
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{t('ard.collectedAndReconciled')}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sun-orange">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{t('ard.pendingPayment')}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {doc.status === 'processed' ? (
                                            <button
                                                onClick={() => setSelectedToConvert(doc)}
                                                className="btn-elite-primary !py-2.5 !px-6 flex items-center gap-2 mx-auto text-[10px]"
                                            >
                                                {t('ard.registerCollection')} <ArrowUpRight className="w-3 h-3" />
                                            </button>
                                        ) : (
                                            <span className="text-slate-700 font-bold text-[10px] uppercase tracking-widest">{t('ard.finalized')}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {collectionDocs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <p className="text-slate-700 font-black uppercase tracking-widest text-xs">No hay ítems pendientes de cobro financiero</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedToConvert && (
                <ARDPaymentModal
                    document={selectedToConvert}
                    onClose={() => setSelectedToConvert(null)}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
};
