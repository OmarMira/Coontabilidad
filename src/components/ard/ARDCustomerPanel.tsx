import React, { useState, useEffect } from 'react';
import { Users, FileStack, TrendingUp, CheckCircle, Search, UserMinus, PlusCircle, ArrowRight } from 'lucide-react';
import { getARDCustomerSummary } from '@/database/modules/db-company';
import { ARDCustomerSummary } from '../../modules/ard/ARD.types';
import { useLocale } from '../../i18n/useLocale';

export const ARDCustomerPanel: React.FC = () => {
    const { t } = useLocale();
    const [summaries, setSummaries] = useState<ARDCustomerSummary[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSummaries();
    }, []);

    const loadSummaries = () => {
        setSummaries(getARDCustomerSummary());
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    const filteredSummaries = summaries.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                        type="text"
                        placeholder={t('ard.searchCustomerPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">{t('ard.activeARDCustomers')}</div>
                        <div className="text-xl font-black text-white">{summaries.length}</div>
                    </div>
                </div>
            </div>

            {/* Grid of Customers */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSummaries.map((client) => (
                    <div key={client.id} className="card-elite hover:border-indigo-500/30 transition-all group overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-white font-black group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{client.name}</h4>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">ID: {client.id.toString().padStart(4, '0')}</p>
                                </div>
                            </div>
                            <TrendingUp className="w-5 h-5 text-gray-700 opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4 bg-white/[0.01]">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">{t('ard.totalDocs')}</span>
                                <div className="flex items-center gap-2">
                                    <FileStack className="w-3 h-3 text-indigo-400/50" />
                                    <span className="text-sm font-black text-white">{client.total_docs}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest block">{t('ard.grossLiquidity')}</span>
                                <div className="text-sm font-black text-indigo-400 tabular-nums">{formatCurrency(client.total_volume)}</div>
                            </div>
                        </div>

                        <div className="p-4 bg-black/20 flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5" title={t('ard.pendingConversionTooltip')}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-sun-orange animate-pulse"></div>
                                    <span className="text-[10px] font-black text-slate-500">{client.pending_conversion}</span>
                                </div>
                                <div className="flex items-center gap-1.5" title={t('ard.convertedTooltip')}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black text-slate-500">{client.total_converted}</span>
                                </div>
                            </div>

                            <button className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">
                                {t('ard.viewDetails')} <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}

                {summaries.length === 0 && (
                    <div className="col-span-full py-20 text-center card-elite border-dashed border-2 border-white/5 opacity-50">
                        <UserMinus className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">{t('ard.noLinkedCustomers')}</p>
                        <p className="text-slate-700 text-[10px] font-bold mt-2 italic">{t('ard.assignCustomersGarHint')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
