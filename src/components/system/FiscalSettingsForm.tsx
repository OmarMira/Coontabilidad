import React, { useState } from 'react';
import { useLocale } from '../../i18n/useLocale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, AlertTriangle } from 'lucide-react';
import { getFiscalSettings, updateFiscalSettings, type FiscalSettings } from '../../database/simple-db';
import { toast } from 'react-hot-toast';


export const FiscalSettingsForm: React.FC = () => {
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


    return (
        <Card className="bg-slate-900 border-white/5 text-white w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-orange-400" />
                    {t('fiscalSettings.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-orange-900/20 p-3 rounded border border-orange-800/50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-300">
                        {t('fiscalSettings.cautionDesc')}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">{t('fiscalSettings.fiscalYearStart')}</label>
                        <input
                            type="date"
                            className="w-full bg-white/10 border-white/10 rounded p-2 text-white"
                            value={settings.tax_year_start}
                            onChange={(e) => setSettings({ ...settings, tax_year_start: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">{t('fiscalSettings.filingFrequency')}</label>
                        <select
                            className="w-full bg-white/10 border-white/10 rounded p-2 text-white"
                            value={settings.tax_frequency}
                            onChange={(e) => setSettings({ ...settings, tax_frequency: e.target.value as any })}
                        >
                            <option value="monthly">{t('fiscalSettings.monthly')}</option>
                            <option value="quarterly">{t('fiscalSettings.quarterly')}</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                            <p className="text-sm font-medium">{t('fiscalSettings.salesTaxMethod')}</p>
                            <p className="text-xs text-slate-600">{t('fiscalSettings.salesTaxMethodDesc')}</p>
                        </div>
                        <select
                            className="bg-white/10 border-white/10 rounded p-1 text-sm text-white"
                            value={settings.sales_tax_method}
                            onChange={(e) => setSettings({ ...settings, sales_tax_method: e.target.value as any })}
                        >
                            <option value="accrual">{t('fiscalSettings.accrual')}</option>
                            <option value="cash">{t('fiscalSettings.cash')}</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                            <p className="text-sm font-medium">{t('fiscalSettings.dr15CutoffDay')}</p>
                            <p className="text-xs text-slate-600">{t('fiscalSettings.dr15CutoffDayDesc')}</p>
                        </div>
                        <input
                            type="number"
                            className="w-16 bg-white/10 border-white/10 rounded p-1 text-center text-white"
                            value={settings.dr15_filing_day}
                            onChange={(e) => setSettings({ ...settings, dr15_filing_day: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                    onClick={handleSave}
                >
                    {t('fiscalSettings.saveSettings')}
                </Button>

            </CardContent>
        </Card>
    );
};
