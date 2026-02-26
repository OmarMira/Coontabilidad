import React, { useState, useEffect } from 'react';
import { X, AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle } from 'lucide-react';
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        {t('assets.disposalForm.title')}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        {asset.asset_tag} - {asset.asset_name}
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-amber-200 text-sm font-bold mb-1">{t('assets.disposalForm.warningTitle')}</p>
                    <p className="text-amber-300/80 text-sm">
                        {t('assets.disposalForm.warningText')}
                    </p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-rose-200 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Asset Summary */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-black text-white mb-4">{t('assets.details.currentValue')}</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.form.purchaseCost')}</p>
                                <p className="text-lg font-black text-white">${(asset.purchase_cost / 100).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.details.accumulated')}</p>
                                <p className="text-lg font-black text-amber-400">
                                    ${(asset.total_accumulated_depreciation / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="border-l-2 border-slate-700 pl-4">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.details.currentValue')}</p>
                                <p className="text-xl font-black text-emerald-400">${netBookValue.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Disposal Details */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4">{t('assets.disposalForm.details')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Disposal Date */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.disposalForm.date')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.disposal_date}
                                        onChange={(e) => handleChange('disposal_date', e.target.value)}
                                        min={asset.purchase_date}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Disposal Method */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.disposalForm.method')} <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.disposal_method}
                                    onChange={(e) => handleChange('disposal_method', e.target.value as DisposalMethod)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="SALE">{t('assets.disposalForm.methods.sale')}</option>
                                    <option value="RETIREMENT">{t('assets.disposalForm.methods.retirement')}</option>
                                    <option value="TRADE_IN">{t('assets.disposalForm.methods.trade_in')}</option>
                                    <option value="LOST">{t('assets.disposalForm.methods.lost')}</option>
                                </select>
                            </div>

                            {/* Disposal Proceeds */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.disposalForm.proceeds')} {formData.disposal_method === 'SALE' && <span className="text-rose-500">*</span>}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.disposal_proceeds_dollars || ''}
                                        onChange={(e) => handleChange('disposal_proceeds_dollars', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                        placeholder="0.00"
                                        required={formData.disposal_method === 'SALE'}
                                    />
                                </div>
                                {formData.disposal_method !== 'SALE' && (
                                    <p className="text-xs text-slate-500 mt-1">{t('assets.disposalForm.proceedsHint')}</p>
                                )}
                            </div>

                            {/* Calculated Gain/Loss - Highlighted */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.disposalForm.gainLossTitle')}
                                </label>
                                <div className={`p-3 rounded-xl border-2 ${gainLoss > 0
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : gainLoss < 0
                                        ? 'bg-rose-500/10 border-rose-500/30'
                                        : 'bg-slate-800/50 border-slate-700'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-2xl font-black font-mono ${gainLoss > 0 ? 'text-emerald-400' : gainLoss < 0 ? 'text-rose-400' : 'text-slate-400'
                                            }`}>
                                            {gainLoss > 0 ? '+' : ''}${gainLoss.toFixed(2)}
                                        </span>
                                        {gainLoss > 0 ? (
                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                        ) : gainLoss < 0 ? (
                                            <TrendingDown className="w-5 h-5 text-rose-400" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {gainLoss > 0 ? t('assets.disposalForm.gain') : gainLoss < 0 ? t('assets.disposalForm.loss') : t('assets.disposalForm.breakEven')}
                                    </p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.notes')}
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                                    placeholder={t('assets.disposalForm.notesPlaceholder')}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Journal Entry Preview */}
                <Card className="bg-indigo-500/10 border-indigo-500/30">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-indigo-400" />
                            {t('assets.disposalForm.preview')}
                        </h3>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-400">DR Cash (1000)</span>
                                <span className="text-white">${proceeds.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">DR Accumulated Depreciation (1650)</span>
                                <span className="text-white">${(asset.total_accumulated_depreciation / 100).toFixed(2)}</span>
                            </div>
                            {gainLoss < 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">DR {t('assets.disposalForm.loss')} (5900)</span>
                                    <span className="text-rose-400">${Math.abs(gainLoss).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                                <span className="text-slate-400">CR Fixed Asset (1600)</span>
                                <span className="text-white">${(asset.purchase_cost / 100).toFixed(2)}</span>
                            </div>
                            {gainLoss > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">CR {t('assets.disposalForm.gain')} (4900)</span>
                                    <span className="text-emerald-400">${gainLoss.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                        className="border-slate-800 text-slate-400 hover:text-white px-8 py-6 rounded-2xl font-bold"
                        disabled={loading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-700 text-white px-10 py-6 rounded-2xl font-black shadow-xl shadow-rose-900/20"
                        disabled={loading}
                    >
                        {loading ? t('common.processing') : t('assets.disposalForm.confirmBtn')}
                    </Button>
                </div>
            </form>
        </div>
    );
};
