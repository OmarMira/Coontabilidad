import React, { useState } from 'react';
import { useLocale } from '../../i18n/useLocale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, AlertTriangle, ShieldCheck, XCircle, Save } from 'lucide-react';
import { getFiscalSettings, updateFiscalSettings, type FiscalSettings } from '@/database/simple-db';
import { toast } from 'react-hot-toast';


interface FiscalSettingsFormProps {
    onClose: () => void;
}

export const FiscalSettingsForm: React.FC<FiscalSettingsFormProps> = ({ onClose }) => {
    const { t } = useLocale();
    const [settings, setSettings] = useState<FiscalSettings>(getFiscalSettings());

    const handleSave = () => {
        const loading = toast.loading(t('fiscalSettings.saving'));
        try {
            const res = updateFiscalSettings(settings);
            if (res.success) {
                toast.success(t('fiscalSettings.saveSuccess'), { id: loading });
            } else {
                toast.error(`❌ ${res.message} `, { id: loading });
            }
        } catch (e: any) {
            toast.error(`Error: ${e.message} `, { id: loading });
        }
    };


    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="text-orange-500">
                            <Calculator className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {t('fiscalSettings.title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Compliance Protocol v5.0
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-10 space-y-8 overflow-y-auto flex-1">
                    <div className="bg-orange-500/10 p-6 rounded-2xl border border-orange-500/30 flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                        <div>
                            <p className="text-orange-500 font-bold uppercase tracking-widest text-[10px] mb-1">{t('common.caution')}</p>
                            <p className="text-sm text-orange-200/70 font-medium">
                                {t('fiscalSettings.cautionDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('fiscalSettings.fiscalYearStart')}</label>
                            <input
                                type="date"
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]"
                                value={settings.tax_year_start}
                                onChange={(e) => setSettings({ ...settings, tax_year_start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('fiscalSettings.filingFrequency')}</label>
                            <select
                                className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px] appearance-none"
                                value={settings.tax_frequency}
                                onChange={(e) => setSettings({ ...settings, tax_frequency: e.target.value as any })}
                            >
                                <option value="monthly">{t('fiscalSettings.monthly')}</option>
                                <option value="quarterly">{t('fiscalSettings.quarterly')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between p-6 bg-slate-950/30 rounded-2xl border border-slate-800/50 shadow-inner">
                            <div>
                                <p className="text-sm font-bold text-white uppercase tracking-tighter">{t('fiscalSettings.salesTaxMethod')}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('fiscalSettings.salesTaxMethodDesc')}</p>
                            </div>
                            <select
                                className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 focus:outline-none focus:border-blue-500"
                                value={settings.sales_tax_method}
                                onChange={(e) => setSettings({ ...settings, sales_tax_method: e.target.value as any })}
                            >
                                <option value="accrual">{t('fiscalSettings.accrual')}</option>
                                <option value="cash">{t('fiscalSettings.cash')}</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-950/30 rounded-2xl border border-slate-800/50 shadow-inner">
                            <div>
                                <p className="text-sm font-bold text-white uppercase tracking-tighter">{t('fiscalSettings.dr15CutoffDay')}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('fiscalSettings.dr15CutoffDayDesc')}</p>
                            </div>
                            <input
                                type="number"
                                className="w-20 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-sm font-black text-white focus:outline-none focus:border-blue-500"
                                value={settings.dr15_filing_day}
                                onChange={(e) => setSettings({ ...settings, dr15_filing_day: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <footer className="p-10 border-t border-slate-800/50 bg-slate-950/30 flex-shrink-0">
                    <button
                        type="button"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-3"
                        onClick={handleSave}
                    >
                        <Save className="w-5 h-5" />
                        {t('fiscalSettings.saveSettings')}
                    </button>
                </footer>
            </div>
        </div>
    );
};
