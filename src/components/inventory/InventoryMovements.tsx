import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, Search, Activity, Package, Trash2, Zap, RefreshCw } from 'lucide-react';
import { getInventoryMovements } from '../../database/simple-db';
import { useLocale } from '@/i18n/useLocale';

export const InventoryMovements: React.FC = () => {
    const { t } = useLocale();
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        const data = getInventoryMovements();
        setMovements(data);
        setLoading(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <Activity className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('inv.movements.title')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('inv.movements.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    <Button
                        variant="outline"
                        onClick={loadData}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('inv.movements.refresh')}
                    </Button>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-900/40 shadow-2xl">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-950/50 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-5">{t('inv.movements.date')}</th>
                            <th className="px-6 py-5">{t('inv.movements.type')}</th>
                            <th className="px-6 py-5">{t('inv.movements.product')}</th>
                            <th className="px-6 py-5 text-right">{t('inv.movements.quantity')}</th>
                            <th className="px-6 py-5 text-right">{t('inv.movements.balance')}</th>
                            <th className="px-6 py-5">{t('inv.movements.reference')}</th>
                            <th className="px-6 py-5">{t('inv.movements.notes')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {movements.map((move) => (
                            <tr key={move.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 font-mono text-slate-400">
                                    {new Date(move.date).toLocaleDateString()}
                                    <div className="text-[9px] text-slate-600 font-mono">{new Date(move.date).toLocaleTimeString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${move.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        move.type === 'OUT' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {move.type === 'IN' && <ArrowDownLeft className="w-3 h-3" />}
                                        {move.type === 'OUT' && <ArrowUpRight className="w-3 h-3" />}
                                        {move.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 px-2 font-mono text-[10px] bg-slate-800 rounded text-blue-400 font-black border border-slate-700">
                                            {move.product_sku}
                                        </div>
                                        <span className="text-white font-bold tracking-tight">{move.product_name}</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-right font-mono text-lg font-black ${move.quantity > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {move.quantity > 0 ? '+' : ''}{move.quantity?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-300 font-bold">
                                    {(move.balance_after || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-xs uppercase tracking-tighter">{move.reference_id || '---'}</span>
                                        <span className="text-slate-500 font-black uppercase text-[8px] tracking-widest">{move.reference_type}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs italic max-w-xs truncate">{move.notes}</td>
                            </tr>
                        ))}
                        {movements.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <Activity className="w-12 h-12 mb-4 opacity-10" />
                                        <p className="text-lg font-black tracking-tight">{t('inv.movements.noMovementsRecorded')}</p>
                                        <p className="text-sm opacity-60">{t('inv.movements.transactionsWillAppear')}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
