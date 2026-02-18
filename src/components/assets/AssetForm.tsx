import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Calendar, DollarSign, Info, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getFixedAssetsController } from '../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import type { AssetCategory } from '../../services/accounting/AssetCategoryService';
import type { AssetPurchaseData, FixedAsset } from '../../services/accounting/FixedAssetService';
import { useLocale } from '../../i18n/useLocale';

interface AssetFormProps {
    asset: FixedAsset | null;
    onSave: () => void;
    onCancel: () => void;
    db: SQLiteEngine;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, onSave, onCancel, db }) => {
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
                await controller.purchaseAsset(purchaseData, 1); // TODO: Get user ID from context
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Building2 className="w-8 h-8 text-indigo-500" />
                        {isEdit ? t('assets.editAsset') : t('assets.addAsset')}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        {isEdit ? `${t('assets.reports_ui.tag')}: ${asset.asset_tag}` : t('assets.form.purchaseSetup')}
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-rose-200 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-400" />
                            {t('assets.form.basicInfo')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Asset Name */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.assetName')} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.asset_name}
                                    onChange={(e) => handleChange('asset_name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder={t('assets.form.assetNamePlaceholder')}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.category')} <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.category_id || ''}
                                    onChange={(e) => handleChange('category_id', parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    disabled={isEdit} // Can't change category after creation
                                >
                                    <option value="">{t('assets.form.selectCategory')}</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} ({cat.default_useful_life_months / 12} {t('assets.form.years')})
                                        </option>
                                    ))}
                                </select>
                                {selectedCategory && !isEdit && (
                                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        {t('assets.form.autoFilled', {
                                            months: selectedCategory.default_useful_life_months,
                                            method: selectedCategory.default_depreciation_method.replace('_', ' ')
                                        })}
                                    </p>
                                )}
                            </div>

                            {/* Purchase Date */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.purchaseDate')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.purchase_date}
                                        onChange={(e) => handleChange('purchase_date', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('common.description')}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                                    placeholder={t('assets.form.descriptionPlaceholder')}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Information */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            {t('assets.form.financialInfo')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Purchase Cost */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.purchaseCost')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={formData.purchase_cost_dollars || ''}
                                        onChange={(e) => handleChange('purchase_cost_dollars', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Salvage Value */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.salvageValue')}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.salvage_value_dollars || ''}
                                        onChange={(e) => handleChange('salvage_value_dollars', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Useful Life */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.usefulLife')} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.useful_life_months || ''}
                                    onChange={(e) => handleChange('useful_life_months', parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                    placeholder="60"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {formData.useful_life_months > 0 && `≈ ${(formData.useful_life_months / 12).toFixed(1)} ${t('assets.form.years')}`}
                                </p>
                            </div>

                            {/* Depreciation Method */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('assets.form.depreciationMethod')}
                                </label>
                                <select
                                    value={formData.depreciation_method}
                                    onChange={(e) => handleChange('depreciation_method', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    disabled={isEdit && asset?.status !== 'PENDING'} // Locked after activation (IRS compliance)
                                >
                                    <option value="STRAIGHT_LINE">{t('assets.form.methodStraightLine')}</option>
                                    <option value="DECLINING_BALANCE_200">{t('assets.form.methodDeclining')}</option>
                                </select>
                                {isEdit && asset?.status !== 'PENDING' && (
                                    <p className="text-xs text-amber-400 mt-1">🔒 {t('assets.form.lockedIRS')}</p>
                                )}
                            </div>

                            {/* Payment Method (only for new assets) */}
                            {!isEdit && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        {t('assets.form.paymentMethod')}
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-indigo-500 flex-1">
                                            <input
                                                type="radio"
                                                value="CASH"
                                                checked={formData.payment_method === 'CASH'}
                                                onChange={(e) => handleChange('payment_method', 'CASH')}
                                                className="text-indigo-500"
                                            />
                                            <span className="text-white font-bold">{t('assets.form.paymentCash')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-indigo-500 flex-1">
                                            <input
                                                type="radio"
                                                value="PAYABLE"
                                                checked={formData.payment_method === 'PAYABLE'}
                                                onChange={(e) => handleChange('payment_method', 'PAYABLE')}
                                                className="text-indigo-500"
                                            />
                                            <span className="text-white font-bold">{t('assets.form.paymentPayable')}</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Depreciation Preview */}
                        {monthlyDepreciation > 0 && (
                            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-sm font-black text-indigo-300">{t('assets.reports_ui.trend')}</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.reports_ui.avgMonthly')}</p>
                                        <p className="text-lg font-black text-white">${monthlyDepreciation.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.reports_ui.projected')}</p>
                                        <p className="text-lg font-black text-white">${(monthlyDepreciation * 12).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.reports_ui.method')}</p>
                                        <p className="text-sm font-bold text-indigo-300">
                                            {formData.depreciation_method === 'STRAIGHT_LINE' ? t('assets.reports_ui.linear') : t('assets.reports_ui.accelerated')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activation Option (only for new assets) */}
                {!isEdit && (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.activate_immediately}
                                    onChange={(e) => handleChange('activate_immediately', e.target.checked)}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="text-white font-bold">{t('assets.form.activateImmediately')}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {t('assets.form.activateImmediatelyHint')}
                                    </p>
                                </div>
                            </label>
                        </CardContent>
                    </Card>
                )}

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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 rounded-2xl font-black shadow-xl shadow-indigo-900/20"
                        disabled={loading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? t('common.saving') : isEdit ? t('assets.form.updateBtn') : t('assets.form.createBtn')}
                    </Button>
                </div>
            </form>
        </div>
    );
};
