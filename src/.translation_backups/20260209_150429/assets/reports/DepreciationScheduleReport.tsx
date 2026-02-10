import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingDown, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { getFixedAssetsController } from '../../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../../core/database/SQLiteEngine';

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
                    // Simple linear depreciation calculation
                    // (This is a simplified version - real calculation should use DepreciationCalculator)
                    const depreciableBase = asset.purchase_cost - asset.salvage_value;
                    const monthlyDep = depreciableBase / asset.useful_life_months;

                    // Check if asset will still be depreciating in this month
                    const monthsElapsed = Math.floor(
                        (monthDate.getTime() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
                    );

                    if (monthsElapsed >= 0 && monthsElapsed < asset.useful_life_months) {
                        monthTotal += monthlyDep;
                        assetCount++;
                    }
                }

                projections.push({
                    month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
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
        const headers = ['Month', 'Total Depreciation', 'Assets'];
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
                    <p className="text-slate-400">Calculating depreciation schedule...</p>
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
                        Depreciation Schedule
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Projected monthly depreciation for next {months} months
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={exportToCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
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
                        <label className="text-sm text-slate-400 font-bold">Projection Period:</label>
                        <select
                            value={months}
                            onChange={(e) => setMonths(parseInt(e.target.value))}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                        >
                            <option value={6}>6 months</option>
                            <option value={12}>12 months</option>
                            <option value={24}>24 months</option>
                            <option value={36}>36 months</option>
                            <option value={60}>60 months</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Projected</p>
                        <p className="text-2xl font-black text-amber-400 font-mono">
                            ${(totalProjected / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Avg Monthly</p>
                        <p className="text-2xl font-black text-white font-mono">
                            ${(totalProjected / months / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Period</p>
                        <p className="text-2xl font-black text-indigo-400">
                            {months} months
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
                                    <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Month</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Depreciation</th>
                                    <th className="text-center py-3 px-4 text-xs font-black text-slate-400 uppercase">Assets</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">% of Total</th>
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
                    <h3 className="text-lg font-black text-white mb-4">Depreciation Trend</h3>
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
