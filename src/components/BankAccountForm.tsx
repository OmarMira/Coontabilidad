import { logger } from '../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Save, XCircle, Building2, AlertCircle, ShieldCheck, Zap, Cpu, Sparkles, DollarSign, Landmark, Layers, Info } from 'lucide-react';
import type { BankAccount } from '@/database/modules/db-types';
import { useLocale } from '../i18n/useLocale';

interface BankAccountFormProps {
    initialData?: BankAccount;
    onSubmit: (data: Omit<BankAccount, 'id' | 'created_at'>) => Promise<void>;
    onCancel: () => void;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
    initialData,
    onSubmit,
    onCancel
}) => {
    const { t } = useLocale();
    const [formData, setFormData] = useState<Omit<BankAccount, 'id' | 'created_at'>>({
        account_name: '',
        bank_name: '',
        account_number: '',
        account_type: 'checking',
        routing_number: '',
        balance: 0,
        currency: 'USD',
        is_active: true,
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                account_name: initialData.account_name,
                bank_name: initialData.bank_name,
                account_number: initialData.account_number,
                account_type: initialData.account_type,
                routing_number: initialData.routing_number || '',
                balance: initialData.balance,
                currency: initialData.currency,
                is_active: initialData.is_active,
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.account_name.trim()) newErrors.account_name = t('bankAccountForm.error.nameRequired');
        if (!formData.bank_name.trim()) newErrors.bank_name = t('bankAccountForm.error.bankRequired');
        if (!formData.account_number.trim()) newErrors.account_number = t('bankAccountForm.error.accountIdRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            logger.error('BankAccountForm', 'error', 'Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl my-auto overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none"></div>

                {/* Header Hub */}
                <header className="flex items-center justify-between p-10 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="text-blue-500">
                            {initialData ? <Cpu className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {(!initialData || (initialData && initialData.id === 0)) ? t('bankAccountForm.title.create') : t('bankAccountForm.title.edit')}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {t('bankAccountForm.subtitle')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95">
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-10 space-y-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <PremiumInput label={t('bankAccountForm.label.accountAlias')} icon={Building2} value={formData.account_name} error={errors.account_name} onChange={(v: any) => handleChange('account_name', v)} placeholder={t('bankAccountForm.placeholder.accountAlias')} required t={t} />
                        <PremiumInput label={t('bankAccountForm.label.bankEntity')} icon={Landmark} value={formData.bank_name} error={errors.bank_name} onChange={(v: any) => handleChange('bank_name', v)} placeholder={t('bankAccountForm.placeholder.bankEntity')} required t={t} />

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Layers className="w-3.5 h-3.5 text-blue-500" /> {t('bankAccountForm.label.classification')}
                            </label>
                            <select
                                name="account_type"
                                value={formData.account_type}
                                onChange={(e) => handleChange('account_type', e.target.value)}
                                className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] appearance-none cursor-pointer h-[58px]"
                            >
                                <option value="checking">{t('bankAccountForm.type.checking')}</option>
                                <option value="savings">{t('bankAccountForm.type.savings')}</option>
                                <option value="credit">{t('bankAccountForm.type.credit')}</option>
                                <option value="other">{t('bankAccountForm.type.other')}</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Zap className="w-3.5 h-3.5 text-blue-500" /> {t('bankAccountForm.label.currency')}
                            </label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] appearance-none cursor-pointer h-[58px]"
                            >
                                <option value="USD">{t('bankAccountForm.currency.usd')}</option>
                                <option value="EUR">{t('bankAccountForm.currency.eur')}</option>
                                <option value="MXN">{t('bankAccountForm.currency.mxn')}</option>
                            </select>
                        </div>

                        <PremiumInput label={t('bankAccountForm.label.accountId')} icon={Layers} value={formData.account_number} error={errors.account_number} onChange={(v: any) => handleChange('account_number', v)} placeholder={t('bankAccountForm.placeholder.accountId')} required t={t} />
                        <PremiumInput label={t('bankAccountForm.label.routing')} icon={ShieldCheck} value={formData.routing_number} onChange={(v: any) => handleChange('routing_number', v)} placeholder={t('bankAccountForm.placeholder.routing')} t={t} />

                        <PremiumInput label={t('bankAccountForm.label.initialBalance')} icon={DollarSign} value={formData.balance.toString()} onChange={(v: any) => handleChange('balance', parseFloat(v) || 0)} type="number" t={t} />

                        <div className="flex items-center gap-6 p-6 bg-slate-950 border border-slate-800 rounded-3xl h-[58px] self-end">
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => handleChange('is_active', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${formData.is_active ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}></div>
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.is_active ? 'text-white' : 'text-slate-500'}`}>{t('bankAccountForm.status.label')} {formData.is_active ? t('bankAccountForm.status.active') : t('bankAccountForm.status.inactive')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Info className="w-3.5 h-3.5 text-blue-500" /> {t('bankAccountForm.label.memo')}
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={3}
                            placeholder={t('bankAccountForm.placeholder.memo')}
                            className="w-full bg-slate-950/50 text-white px-8 py-6 rounded-[2rem] border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-medium text-sm transition-all placeholder:text-slate-800 resize-none"
                        />
                    </div>

                    <footer className="flex justify-end gap-6 pt-10 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg"
                        >
                            {t('bankAccountForm.button.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {initialData ? t('bankAccountForm.button.update') : t('bankAccountForm.button.save')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const PremiumInput = ({ label, icon: Icon, value, error, onChange, placeholder, type = "text", required, t }: any) => (
    <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Icon className={`w-3.5 h-3.5 ${error ? 'text-rose-500' : 'text-blue-500'}`} /> {label} {required && '*'}
        </label>
        <div className="relative group/input">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-slate-950/50 text-white px-8 py-4 rounded-2xl border transition-all font-bold uppercase tracking-widest text-[9px] placeholder:text-slate-800 focus:outline-none ${error ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800/50 focus:border-blue-500/50 group-hover/input:border-slate-700'
                    }`}
                placeholder={placeholder}
                required={required}
            />
            {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">{error}</p>}
        </div>
    </div>
);
