import React, { useState, useEffect } from 'react';
import { XCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getFixedAssetsController } from '../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import type { FixedAsset } from '../../services/accounting/FixedAssetService';
import { useLocale } from '../../i18n/useLocale';
import { useAuth } from '@/contexts/AuthContext';


interface AssetDisposalFormProps {
    asset: FixedAsset;
    onDispose: () => void;
    onCancel: () => void;
    db: SQLiteEngine;
}

type DisposalMethod = 'SALE' | 'RETIREMENT' | 'TRADE_IN' | 'LOST';

export const AssetDisposalForm: React.FC<AssetDisposalFormProps> = ({
    asset,
    onDispose,
    onCancel,
    db
}) => {
    const { user } = useAuth();
    const { t } = useLocale();
    const [formData, setFormData] = useState({
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_method: 'SALE' as DisposalMethod,
        disposal_proceeds_dollars: 0,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Calculate current net book value and potential gain/loss
    const netBookValue = (asset.net_book_value || 0) / 100; // Convert cents to dollars
    const proceeds = formData.disposal_proceeds_dollars;
    const gainLoss = proceeds - netBookValue;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.disposal_method === 'SALE' && proceeds <= 0) {
            setError(t('assets.disposalForm.errorSaleProceeds'));
            return;
        }

        if (new Date(formData.disposal_date) < new Date(asset.purchase_date)) {
            setError(t('assets.disposalForm.errorDate'));
            return;
        }

        if (!user?.id) {
            console.error('[AssetDisposalForm] userId no disponible. Operación abortada.');
            return;
        }

        setLoading(true);
        try {
            const controller = getFixedAssetsController(db);

            await controller.disposeAsset(asset.id, {
                disposal_date: formData.disposal_date,
                disposal_method: formData.disposal_method,
                disposal_proceeds: Math.round(formData.disposal_proceeds_dollars * 100), // Convert to cents
                notes: formData.notes
            }, user?.id ?? null);

            onDispose();
        } catch (err: any) {
            setError(err.message || t('assets.disposalForm.errorSubmit'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] pointer-events-none"></div>

                {/* Header Hub */}
                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="text-rose-500">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {t('assets.disposalForm.title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> {asset.asset_tag} - {asset.asset_name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 relative z-10 custom-scrollbar">
                    {/* Warning Hub */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-8 flex items-start gap-6 animate-in slide-in-from-top-2">
                        <div className="p-4 bg-amber-500/10 rounded-2xl">
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-400 uppercase tracking-widest mb-2">{t('assets.disposalForm.warningTitle')}</p>
                            <p className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest leading-relaxed">
                                {t('assets.disposalForm.warningText')}
                            </p>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                            <p className="text-rose-200 text-sm font-bold uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} id="disposal-form" className="space-y-12">
                        {/* Current Asset Summary */}
                        <div className="grid grid-cols-3 gap-8 bg-slate-950/30 p-10 rounded-[2.5rem] border border-slate-800/50">
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 text-center">{t('assets.form.purchaseCost')}</p>
                                <p className="text-xl font-black text-white text-center font-mono tracking-tighter">${(asset.purchase_cost / 100).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 text-center">{t('assets.details.accumulated')}</p>
                                <p className="text-xl font-black text-amber-500 text-center font-mono tracking-tighter">
                                    ${(asset.total_accumulated_depreciation / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[1.5rem] p-4 group hover:bg-indigo-600/20 transition-all">
                                <p className="text-[9px] font-black text-indigo-400/70 uppercase tracking-[0.2em] mb-3 text-center">{t('assets.details.currentValue')}</p>
                                <p className="text-2xl font-black text-indigo-400 text-center font-mono tracking-tighter group-hover:scale-110 transition-transform">${netBookValue.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Disposal Details */}
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                <DollarSign className="w-4 h-4 text-rose-500" />
                                {t('assets.disposalForm.details')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Disposal Date */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.disposalForm.date')} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group/input">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-rose-500 transition-colors" />
                                        <input
                                            type="date"
                                            required
                                            value={formData.disposal_date}
                                            onChange={(e) => handleChange('disposal_date', e.target.value)}
                                            min={asset.purchase_date}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-rose-500/50 outline-none transition-all font-black uppercase tracking-widest text-[10px]"
                                        />
                                    </div>
                                </div>

                                {/* Disposal Method */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.disposalForm.method')} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group/select">
                                        <select
                                            value={formData.disposal_method}
                                            onChange={(e) => handleChange('disposal_method', e.target.value as DisposalMethod)}
                                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-rose-500/50 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none"
                                        >
                                            <option value="SALE">{t('assets.disposalForm.methods.sale')}</option>
                                            <option value="RETIREMENT">{t('assets.disposalForm.methods.retirement')}</option>
                                            <option value="TRADE_IN">{t('assets.disposalForm.methods.trade_in')}</option>
                                            <option value="LOST">{t('assets.disposalForm.methods.lost')}</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 font-black">▼</div>
                                    </div>
                                </div>

                                {/* Disposal Proceeds */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.disposalForm.proceeds')} {formData.disposal_method === 'SALE' && <span className="text-rose-500">*</span>}
                                    </label>
                                    <div className="relative group/input">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.disposal_proceeds_dollars || ''}
                                            onChange={(e) => handleChange('disposal_proceeds_dollars', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl pl-12 pr-6 py-4 text-white font-mono font-black text-base focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-800"
                                            placeholder="0.00"
                                            required={formData.disposal_method === 'SALE'}
                                        />
                                    </div>
                                    {formData.disposal_method !== 'SALE' && (
                                        <p className="text-[9px] font-bold text-slate-600 mt-1 ml-1 uppercase tracking-widest">{t('assets.disposalForm.proceedsHint')}</p>
                                    )}
                                </div>

                                {/* Calculated Gain/Loss - Highlighted */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.disposalForm.gainLossTitle')}
                                    </label>
                                    <div className={`p-4 rounded-2xl border ${gainLoss > 0
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : gainLoss < 0
                                            ? 'bg-rose-500/5 border-rose-500/20'
                                            : 'bg-slate-950/50 border-slate-800'
                                        } transition-all duration-500 overflow-hidden relative group`}>
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className={`text-2xl font-black font-mono tracking-tighter ${gainLoss > 0 ? 'text-emerald-400' : gainLoss < 0 ? 'text-rose-400' : 'text-slate-400'
                                                }`}>
                                                {gainLoss > 0 ? '+' : ''}${gainLoss.toFixed(2)}
                                            </span>
                                            <div className={`p-2 rounded-xl ${gainLoss > 0 ? 'bg-emerald-500/20' : gainLoss < 0 ? 'bg-rose-500/20' : 'bg-slate-800'}`}>
                                                {gainLoss > 0 ? (
                                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                ) : gainLoss < 0 ? (
                                                    <TrendingDown className="w-5 h-5 text-rose-400" />
                                                ) : (
                                                    <CheckCircle className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-500 mt-2 uppercase tracking-[0.2em] relative z-10">
                                            {gainLoss > 0 ? t('assets.disposalForm.gain') : gainLoss < 0 ? t('assets.disposalForm.loss') : t('assets.disposalForm.breakEven')}
                                        </p>

                                        {/* Background pattern */}
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            {gainLoss > 0 ? <TrendingUp className="w-16 h-16" /> : <TrendingDown className="w-16 h-16" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block">
                                        {t('assets.form.notes')}
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-rose-500/50 outline-none transition-all font-medium text-sm placeholder:text-slate-800 resize-none"
                                        placeholder={t('assets.disposalForm.notesPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Journal Entry Preview */}
                        <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] p-10 overflow-hidden relative group">
                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign className="w-48 h-48 text-indigo-400" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                                    <div className="w-8 h-[1px] bg-indigo-500/50"></div>
                                    {t('assets.disposalForm.preview')}
                                    <div className="w-8 h-[1px] bg-indigo-500/50"></div>
                                </h3>

                                <div className="space-y-6">
                                    <JournalLine label="DR Cash (1000)" value={`$${proceeds.toFixed(2)}`} />
                                    <JournalLine label="DR Accumulated Depreciation (1650)" value={`$${(asset.total_accumulated_depreciation / 100).toFixed(2)}`} />
                                    {gainLoss < 0 && (
                                        <JournalLine label={`DR ${t('assets.disposalForm.loss')} (5900)`} value={`$${Math.abs(gainLoss).toFixed(2)}`} highlight="rose" />
                                    )}
                                    <div className="h-[1px] bg-slate-800/50 my-6"></div>
                                    <JournalLine label="CR Fixed Asset (1600)" value={`$${(asset.purchase_cost / 100).toFixed(2)}`} indent />
                                    {gainLoss > 0 && (
                                        <JournalLine label={`CR ${t('assets.disposalForm.gain')} (4900)`} value={`$${gainLoss.toFixed(2)}`} highlight="emerald" indent />
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Hub */}
                <footer className="p-10 border-t border-slate-800/50 bg-slate-950/30 flex justify-end gap-6 flex-shrink-0 relative z-10">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-10 py-5 text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-2xl border border-transparent hover:border-slate-800"
                        disabled={loading}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        form="disposal-form"
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-rose-900/40 hover:-translate-y-1 active:scale-95"
                        disabled={loading}
                    >
                        <span>{loading ? t('common.processing') : t('assets.disposalForm.confirmBtn')}</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

const JournalLine = ({ label, value, highlight, indent }: any) => (
    <div className={`flex justify-between items-center group/line ${indent ? 'pl-8' : ''}`}>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover/line:text-slate-300 transition-colors">{label}</span>
        <span className={`text-sm font-black font-mono tracking-tighter ${highlight === 'rose' ? 'text-rose-400' : highlight === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
    </div>
);
