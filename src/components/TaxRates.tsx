import React, { useState, useEffect } from 'react';
import { MapPin, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { getAllFloridaTaxRates, updateFloridaTaxRate } from '@/database/simple-db';
import { useLocale } from '../i18n/useLocale';
import toast from 'react-hot-toast';


interface CountyTaxRate {
    id?: string | number;
    county: string;
    surtaxRate: number; // Discretionary Sales Surtax (e.g., 0.01 for 1%)
    active: boolean;
}

// Initial data based on common Florida counties
const INITIAL_RATES: CountyTaxRate[] = [
    { id: '1', county: 'Miami-Dade', surtaxRate: 0.01, active: true },
    { id: '2', county: 'Broward', surtaxRate: 0.01, active: true },
    { id: '3', county: 'Palm Beach', surtaxRate: 0.01, active: true },
    { id: '4', county: 'Orange', surtaxRate: 0.005, active: true },
    { id: '5', county: 'Hillsborough', surtaxRate: 0.015, active: true },
];

export const TaxRates: React.FC = () => {
    const { t } = useLocale();
    const [rates, setRates] = useState<CountyTaxRate[]>(INITIAL_RATES);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRates = () => {
            const dbRates = getAllFloridaTaxRates();
            if (dbRates && dbRates.length > 0) {
                const mappedRates = dbRates.map((r, idx) => ({
                    id: r.id || idx,
                    county: r.county,
                    surtaxRate: r.discretionaryRate,
                    active: true
                }));
                setRates(mappedRates);
            }
            setLoading(false);
        };

        fetchRates();
    }, []);

    const handleRateChange = (id: string | number, newRate: number) => {
        setRates(rates.map(r => r.id === id ? { ...r, surtaxRate: newRate } : r));
    };

    const toggleActive = (id: string | number) => {
        setRates(rates.map(r => r.id === id ? { ...r, active: !r.active } : r));
    };

    const handleSaveAll = async () => {
        const loadingToast = toast.loading(t('taxRates.syncing'));
        try {
            for (const rate of rates) {
                if (rate.id !== undefined) {
                    const res = updateFloridaTaxRate(Number(rate.id), rate.surtaxRate);
                    if (!res.success) throw new Error(res.message);
                }
            }
            toast.success(t('taxRates.syncSuccess'), { id: loadingToast });
        } catch (error: any) {
            toast.error(`${t('common.error')}: ${error.message}`, { id: loadingToast });
        }
    };


    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-white/10 rounded-lg shadow-md border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-blue-600" />
                            {t('taxRates.title')}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">
                            {t('taxRates.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/30 active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        {t('taxRates.saveChanges')}
                    </button>

                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-500 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold border-b dark:border-white/10">{t('taxRates.county')}</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">{t('taxRates.baseTaxState')}</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">{t('taxRates.surtaxCounty')}</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">{t('taxRates.totalTax')}</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10 text-center">{t('taxRates.status')}</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10 text-right">{t('taxRates.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {rates.map((rate) => (
                                <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-white/10/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800 dark:text-white">
                                        {rate.county}
                                    </td>
                                    <td className="p-4 text-slate-700 dark:text-slate-400">
                                        6.00%
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="5"
                                                value={(rate.surtaxRate * 100).toFixed(2)}
                                                onChange={(e) => rate.id !== undefined && handleRateChange(rate.id, parseFloat(e.target.value) / 100)}
                                                className="w-20 px-2 py-1 text-right border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                            <span className="text-slate-600">%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                                        {((0.06 + rate.surtaxRate) * 100).toFixed(2)}%
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => rate.id !== undefined && toggleActive(rate.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${rate.active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-slate-500'
                                                }`}
                                        >
                                            {rate.active ? t('taxRates.active') : t('taxRates.inactive')}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 text-slate-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-yellow-50 dark:bg-yellow-900/10 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                        <strong>{t('taxRates.importantNote')}:</strong> {t('taxRates.importantNoteDesc')}
                    </p>
                </div>
            </div>
        </div>
    );
};
