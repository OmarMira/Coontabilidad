import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming existence or standard HTML
import { Label } from '@/components/ui/label'; // Assuming existence or standard HTML
import { ClipboardEdit, Save, X, Zap, AlertTriangle } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

export const InventoryAdjustments: React.FC = () => {
    const { t } = useLocale();
    const [reason, setReason] = useState('');
    const [sku, setSku] = useState('');
    const [diff, setDiff] = useState(0);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <ClipboardEdit className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('inv.adjustments.title')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('inventoryDashboard.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="bg-slate-900 border-white/5 text-white max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
                <CardContent className="space-y-6 p-10 relative">
                    <div className="space-y-2">
                        <Label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">{t('inv.adjustments.adjustmentReason')}</Label>
                        <select
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        >
                            <option value="">{t('inv.adjustments.selectOption')}</option>
                            <option value="damage">{t('inv.adjustments.damagedGoods')}</option>
                            <option value="theft">{t('inv.adjustments.theftLoss')}</option>
                            <option value="count">{t('inv.adjustments.cyclicCount')}</option>
                            <option value="expired">{t('inv.adjustments.expiredProduct')}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">{t('inv.adjustments.skuProduct')}</Label>
                            <input
                                placeholder={t('inv.adjustments.searchProduct')}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">{t('inv.adjustments.difference')}</Label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-mono focus:border-blue-500 outline-none transition-colors"
                                value={diff}
                                onChange={e => setDiff(Number(e.target.value))}
                            />
                            <p className="text-[10px] text-slate-600 italic ml-1">
                                {t('inv.adjustments.differenceHelp')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20 flex items-start gap-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                        <p className="text-xs text-orange-200/70 leading-relaxed">
                            {t('inv.adjustments.warningMessage')}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-6">
                        <button className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95">
                            <Save className="w-4 h-4" />
                            {t('inv.adjustments.saveAdjustment')}
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 border border-slate-700">
                            <X className="w-4 h-4" />
                            {t('inv.adjustments.cancel')}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
