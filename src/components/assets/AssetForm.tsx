import React, { useState, useEffect } from 'react';
import { XCircle, Save, Building2, Calendar, DollarSign, Info, AlertCircle, TrendingDown, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getFixedAssetsController } from '../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import type { AssetCategory } from '../../services/accounting/AssetCategoryService';
import type { AssetPurchaseData, FixedAsset } from '../../services/accounting/FixedAssetService';
import { useLocale } from '../../i18n/useLocale';
import { useAuth } from '@/contexts/AuthContext';


interface AssetFormProps {
    asset: FixedAsset | null;
    onSave: () => void;
    onCancel: () => void;
    db: SQLiteEngine;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, onSave, onCancel, db }) => {
    const { user } = useAuth();
    const { t } = useLocale();
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Form data in dollars (UI) - will convert to cents for backend
    const [formData, setFormData] = useState({
        asset_name: '',
        description: '',
        category_id: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_cost_dollars: 0,
        salvage_value_dollars: 0,
        useful_life_months: 0,
        depreciation_method: 'STRAIGHT_LINE' as 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200',
        activate_immediately: false,
        payment_method: 'CASH' as 'CASH' | 'PAYABLE'
    });

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Load asset data if editing
    useEffect(() => {
        if (asset) {
            setFormData({
                asset_name: asset.asset_name,
                description: asset.description || '',
                category_id: asset.category_id,
                purchase_date: asset.purchase_date,
                purchase_cost_dollars: asset.purchase_cost / 100,
                salvage_value_dollars: asset.salvage_value / 100,
                useful_life_months: asset.useful_life_months,
                depreciation_method: asset.depreciation_method,
                activate_immediately: false,
                payment_method: 'CASH'
            });
        }
    }, [asset]);

    // Auto-fill defaults when category changes
    useEffect(() => {
        if (formData.category_id && !asset) {
            const category = categories.find(c => c.id === formData.category_id);
            if (category) {
                setSelectedCategory(category);
                setFormData(prev => ({
                    ...prev,
                    useful_life_months: category.default_useful_life_months,
                    depreciation_method: category.default_depreciation_method,
                    salvage_value_dollars: (prev.purchase_cost_dollars * category.default_salvage_value_percent) / 100
                }));
            }
        }
    }, [formData.category_id, categories, asset]);

    const loadCategories = async () => {
        try {
            const controller = getFixedAssetsController(db);
            const cats = await controller.getActiveCategories();
            setCategories(cats);
        } catch (err: any) {
            setError(t('assets.form.errorLoadingCategories') + ': ' + err.message);
        }
    };

    const validateForm = (): boolean => {
        if (!formData.asset_name.trim()) {
            setError(t('assets.form.nameRequired'));
            return false;
        }

        if (!formData.category_id) {
            setError(t('assets.form.categoryRequired'));
            return false;
        }

        if (formData.purchase_cost_dollars <= 0) {
            setError(t('assets.form.costPositive'));
            return false;
        }

        if (formData.salvage_value_dollars >= formData.purchase_cost_dollars) {
            setError(t('assets.form.salvageLessCost'));
            return false;
        }

        if (formData.useful_life_months <= 0) {
            setError(t('assets.form.lifePositive'));
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user?.id) {
            console.error('[AssetForm] userId no disponible. Operación abortada.');
            return;
        }

        if (!validateForm()) return;

        setLoading(true);
        try {
            const controller = getFixedAssetsController(db);

            // Convert dollars to cents
            const purchaseData: AssetPurchaseData = {
                asset_name: formData.asset_name,
                description: formData.description,
                category_id: formData.category_id,
                purchase_date: formData.purchase_date,
                purchase_cost: Math.round(formData.purchase_cost_dollars * 100),
                salvage_value: Math.round(formData.salvage_value_dollars * 100),
                useful_life_months: formData.useful_life_months,
                depreciation_method: formData.depreciation_method,
                activate_immediately: formData.activate_immediately,
                payment_method: formData.payment_method
            };

            if (asset) {
                // Update existing asset
                await controller.updateAsset(asset.id, purchaseData);
            } else {
                // Create new asset
                await controller.purchaseAsset(purchaseData, user?.id ?? null);
            }

            onSave();
        } catch (err: any) {
            setError(err.message || t('assets.form.saveError'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(''); // Clear error when user changes input
    };

    // Calculate preview of monthly depreciation
    const calculatePreviewDepreciation = (): number => {
        const depreciableBase = formData.purchase_cost_dollars - formData.salvage_value_dollars;
        if (formData.useful_life_months <= 0) return 0;

        if (formData.depreciation_method === 'STRAIGHT_LINE') {
            return depreciableBase / formData.useful_life_months;
        } else {
            // Declining balance 200% - first month
            const rate = 2 / formData.useful_life_months;
            return formData.purchase_cost_dollars * rate;
        }
    };

    const monthlyDepreciation = calculatePreviewDepreciation();
    const isEdit = !!asset?.id;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

                {/* Header Hub */}
                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="text-indigo-500">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {isEdit ? t('assets.editAsset') : t('assets.addAsset')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {isEdit ? `${t('assets.reports_ui.tag')}: ${asset.asset_tag}` : t('assets.form.purchaseSetup')}
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

                <div className="flex-1 overflow-y-auto p-10 space-y-8 relative z-10 custom-scrollbar">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
                            <p className="text-rose-200 text-sm font-bold uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} id="asset-form" className="space-y-10">
                        {/* Basic Information */}
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                <Info className="w-4 h-4 text-indigo-400" />
                                {t('assets.form.basicInfo')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Asset Name */}
                                <div className="md:col-span-2">
                                    <PremiumInput
                                        label={t('assets.form.assetName')}
                                        required
                                        value={formData.asset_name}
                                        onChange={(v: string) => handleChange('asset_name', v)}
                                        placeholder={t('assets.form.assetNamePlaceholder')}
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.form.category')} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <select
                                            required
                                            value={formData.category_id || ''}
                                            onChange={(e) => handleChange('category_id', parseInt(e.target.value))}
                                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold uppercase tracking-widest text-[9px] appearance-none disabled:opacity-50"
                                            disabled={isEdit}
                                        >
                                            <option value="">{t('assets.form.selectCategory')}</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name} ({cat.default_useful_life_months / 12} {t('assets.form.years')})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 font-black">▼</div>
                                    </div>
                                    {selectedCategory && !isEdit && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 mt-2 flex items-center gap-3">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                                {t('assets.form.autoFilled', {
                                                    months: selectedCategory.default_useful_life_months,
                                                    method: selectedCategory.default_depreciation_method.replace('_', ' ')
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Purchase Date */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.form.purchaseDate')} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative group/input">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-blue-500 transition-colors" />
                                        <input
                                            type="date"
                                            required
                                            value={formData.purchase_date}
                                            onChange={(e) => handleChange('purchase_date', e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block mb-3">
                                        {t('common.description')}
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-medium text-sm placeholder:text-slate-800 resize-none"
                                        placeholder={t('assets.form.descriptionPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial Information */}
                        <div className="space-y-8 pt-6 border-t border-slate-800/50">
                            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3">
                                <DollarSign className="w-4 h-4" />
                                {t('assets.form.financialInfo')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Purchase Cost */}
                                <div>
                                    <PremiumInput
                                        label={t('assets.form.purchaseCost')}
                                        required
                                        type="number"
                                        value={formData.purchase_cost_dollars || ''}
                                        onChange={(v: string) => handleChange('purchase_cost_dollars', parseFloat(v) || 0)}
                                        prefix="$"
                                        mono
                                    />
                                </div>

                                {/* Salvage Value */}
                                <div>
                                    <PremiumInput
                                        label={t('assets.form.salvageValue')}
                                        type="number"
                                        value={formData.salvage_value_dollars || ''}
                                        onChange={(v: string) => handleChange('salvage_value_dollars', parseFloat(v) || 0)}
                                        prefix="$"
                                        mono
                                    />
                                </div>

                                {/* Useful Life */}
                                <div className="space-y-3">
                                    <PremiumInput
                                        label={t('assets.form.usefulLife')}
                                        required
                                        type="number"
                                        value={formData.useful_life_months || ''}
                                        onChange={(v: string) => handleChange('useful_life_months', parseInt(v) || 0)}
                                        placeholder="60"
                                        suffix={t('assets.form.months')}
                                        mono
                                    />
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1 ml-1">
                                        {formData.useful_life_months > 0 && `≈ ${(formData.useful_life_months / 12).toFixed(1)} ${t('assets.form.years')}`}
                                    </p>
                                </div>

                                {/* Depreciation Method */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1">
                                        {t('assets.form.depreciationMethod')}
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={formData.depreciation_method}
                                            onChange={(e) => handleChange('depreciation_method', e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold uppercase tracking-widest text-[9px] appearance-none disabled:opacity-50"
                                            disabled={isEdit && asset?.status !== 'PENDING'}
                                        >
                                            <option value="STRAIGHT_LINE">{t('assets.form.methodStraightLine')}</option>
                                            <option value="DECLINING_BALANCE_200">{t('assets.form.methodDeclining')}</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 font-black">▼</div>
                                    </div>
                                    {isEdit && asset?.status !== 'PENDING' && (
                                        <div className="flex items-center gap-2 mt-1 ml-1">
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">🔒 {t('assets.form.lockedIRS')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method (only for new assets) */}
                                {!isEdit && (
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">
                                            {t('assets.form.paymentMethod')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-6 bg-slate-950/50 p-2 rounded-[1.5rem] border border-slate-800/50 text-white">
                                            {[
                                                { id: 'CASH', label: t('assets.form.paymentCash') },
                                                { id: 'PAYABLE', label: t('assets.form.paymentPayable') }
                                            ].map((method) => (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => handleChange('payment_method', method.id)}
                                                    className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.payment_method === method.id
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                                                        : 'text-slate-500 hover:text-slate-300'
                                                        }`}
                                                >
                                                    {method.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Depreciation Preview */}
                            {monthlyDepreciation > 0 && (
                                <div className="mt-8 p-10 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <TrendingDown className="w-32 h-32 text-indigo-400" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <TrendingDown className="w-5 h-5 text-indigo-400" />
                                            <h4 className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">{t('assets.reports_ui.trend')}</h4>
                                        </div>
                                        <div className="grid grid-cols-3 gap-10">
                                            <MetricItem label={t('assets.reports_ui.avgMonthly')} value={`$${monthlyDepreciation.toFixed(2)}`} mono />
                                            <MetricItem label={t('assets.reports_ui.projected')} value={`$${(monthlyDepreciation * 12).toFixed(2)}`} mono />
                                            <MetricItem
                                                label={t('assets.reports_ui.method')}
                                                value={formData.depreciation_method === 'STRAIGHT_LINE' ? t('assets.reports_ui.linear') : t('assets.reports_ui.accelerated')}
                                                highlight
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Activation Option (only for new assets) */}
                        {!isEdit && (
                            <div className="pt-8 border-t border-slate-800/50">
                                <label className="flex items-start gap-6 cursor-pointer group bg-slate-950/30 p-8 rounded-[2rem] border border-slate-800/50 hover:border-blue-500/30 transition-all">
                                    <div className="relative mt-1">
                                        <input
                                            type="checkbox"
                                            checked={formData.activate_immediately}
                                            onChange={(e) => handleChange('activate_immediately', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${formData.activate_immediately ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}></div>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.activate_immediately ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{t('assets.form.activateImmediately')}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">
                                            {t('assets.form.activateImmediatelyHint')}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
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
                        form="asset-form"
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-indigo-900/40 hover:-translate-y-1 active:scale-95"
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{loading ? t('common.saving') : isEdit ? t('assets.form.updateBtn') : t('assets.form.createBtn')}</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

// Subcomponentes Elite
const PremiumInput = ({ label, value, onChange, type = "text", required, placeholder, prefix, suffix, mono }: any) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative group/input">
            {prefix && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs">{prefix}</div>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl py-4 focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[10px] placeholder:text-slate-800 ${prefix ? 'pl-12 pr-6' : 'px-8'} ${suffix ? 'pr-20' : ''} ${mono ? 'font-mono tracking-tighter' : ''}`}
                placeholder={placeholder}
                required={required}
            />
            {suffix && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-[9px] uppercase tracking-widest">
                    {suffix}
                </div>
            )}
        </div>
    </div>
);

const MetricItem = ({ label, value, mono, highlight }: any) => (
    <div className="text-center">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">{label}</p>
        <p className={`text-xl font-black ${highlight ? 'text-indigo-400' : 'text-white'} ${mono ? 'font-mono italic' : 'tracking-tighter uppercase'}`}>{value}</p>
    </div>
);
