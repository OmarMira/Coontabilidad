import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingDown, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { getFixedAssetsController } from '../../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../../core/database/SQLiteEngine';
import { useLocale } from '../../../i18n/useLocale';

interface DepreciationScheduleReportProps {
    db: SQLiteEngine;
    onClose: () => void;
}

interface MonthlyProjection {
    month: string;
    total_depreciation: number;
    asset_count: number;
}

export const DepreciationScheduleReport: React.FC<DepreciationScheduleReportProps> = ({ db, onClose }) => {
    const { t } = useLocale();
    const [schedule, setSchedule] = useState<MonthlyProjection[]>([]);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(12);

    useEffect(() => {
        loadSchedule();
    }, [months]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            const controller = getFixedAssetsController(db);

            // Get all active assets
            const assets = await controller.getAllAssets();
            const activeAssets = assets.filter(a => a.status === 'ACTIVE');

            // Project depreciation for next N months
            const projections: MonthlyProjection[] = [];
            const startDate = new Date();

            for (let i = 0; i < months; i++) {
                const monthDate = new Date(startDate);
                monthDate.setMonth(monthDate.getMonth() + i);

                let monthTotal = 0;
                let assetCount = 0;

                // Calculate depreciation for each asset for this month
                for (const asset of activeAssets) {
                    const depreciableBase = asset.purchase_cost - asset.salvage_value;
                    const monthlyDep = depreciableBase / asset.useful_life_months;

                    const monthsElapsed = Math.floor(
                        (monthDate.getTime() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
                    );

                    if (monthsElapsed >= 0 && monthsElapsed < asset.useful_life_months) {
                        monthTotal += monthlyDep;
                        assetCount++;
                    }
                }

                projections.push({
                    month: monthDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
                    total_depreciation: Math.round(monthTotal),
                    asset_count: assetCount
                });
            }

            setSchedule(projections);
        } catch (err) {
            console.error('Error loading depreciation schedule:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = [
            t('assets.reports_ui.csv.month'),
            t('assets.reports_ui.csv.depreciation'),
            t('assets.reports_ui.csv.assets')
        ];
        const rows = schedule.map(item => [
            item.month,
            (item.total_depreciation / 100).toFixed(2),
            item.asset_count.toString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `depreciation-schedule-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const totalProjected = schedule.reduce((sum, item) => sum + item.total_depreciation, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">{t('assets.reports_ui.loadingDepreciation')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <TrendingDown className="w-8 h-8 text-amber-400" />
                        {t('assets.reports.depreciation')}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {t('assets.reports_ui.subtitleDepreciation', { months })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={exportToCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {t('assets.reports_ui.export')}
                    </Button>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Period Selector */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <label className="text-sm text-slate-400 font-bold">{t('assets.reports_ui.periodSelector')}</label>
                        <select
                            value={months}
                            onChange={(e) => setMonths(parseInt(e.target.value))}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                        >
                            <option value={6}>{t('common.periodMonths', { months: 6 })}</option>
                            <option value={12}>{t('common.periodMonths', { months: 12 })}</option>
                            <option value={24}>{t('common.periodMonths', { months: 24 })}</option>
                            <option value={36}>{t('common.periodMonths', { months: 36 })}</option>
                            <option value={60}>{t('common.periodMonths', { months: 60 })}</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.reports_ui.projected')}</p>
                        <p className="text-2xl font-black text-amber-400 font-mono">
                            ${(totalProjected / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.reports_ui.avgMonthly')}</p>
                        <p className="text-2xl font-black text-white font-mono">
                            ${(totalProjected / months / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('assets.reports_ui.period')}</p>
                        <p className="text-2xl font-black text-indigo-400">
                            {t('common.periodMonths', { months })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Schedule Table */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-slate-950 z-10">
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">{t('assets.reports_ui.csv.month')}</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">{t('assets.reports_ui.csv.depreciation')}</th>
                                    <th className="text-center py-3 px-4 text-xs font-black text-slate-400 uppercase">{t('assets.reports_ui.csv.assets')}</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">{t('common.percentOfTotal')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="py-3 px-4 text-sm text-white font-medium">{item.month}</td>
                                        <td className="py-3 px-4 text-sm text-right font-mono text-amber-400">
                                            ${(item.total_depreciation / 100).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-center text-slate-400">
                                            {item.asset_count}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-slate-400">
                                            {totalProjected > 0 ? ((item.total_depreciation / totalProjected) * 100).toFixed(1) : '0.0'}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Visual Chart (Simplified Bar Chart) */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                    <h3 className="text-lg font-black text-white mb-4">{t('assets.reports_ui.trend')}</h3>
                    <div className="space-y-2">
                        {schedule.map((item, index) => {
                            const maxDep = Math.max(...schedule.map(s => s.total_depreciation));
                            const width = maxDep > 0 ? (item.total_depreciation / maxDep) * 100 : 0;

                            return (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-20 text-xs text-slate-400 font-mono">{item.month}</div>
                                    <div className="flex-1 bg-slate-950 rounded-lg h-8 relative overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-lg transition-all"
                                            style={{ width: `${width}%` }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                                            <span className="text-xs font-bold text-white mix-blend-difference">
                                                ${(item.total_depreciation / 100).toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
