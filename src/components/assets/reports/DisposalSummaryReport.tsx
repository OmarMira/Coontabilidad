import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, X, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { getFixedAssetsController } from '../../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../../core/database/SQLiteEngine';
import type { AssetDisposal } from '../../../services/accounting/AssetDisposalService';

interface DisposalSummaryReportProps {
    db: SQLiteEngine;
    onClose: () => void;
}

export const DisposalSummaryReport: React.FC<DisposalSummaryReportProps> = ({ db, onClose }) => {
    const [disposals, setDisposals] = useState<AssetDisposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadDisposals();
    }, [year]);

    const loadDisposals = async () => {
        try {
            setLoading(true);
            const controller = getFixedAssetsController(db);

            // Get all disposals for the selected year
            const allDisposals = await controller.getAllDisposals();

            const yearDisposals = allDisposals.filter(d => {
                const disposalYear = new Date(d.disposal_date).getFullYear();
                return disposalYear === year;
            });

            setDisposals(yearDisposals);
        } catch (err) {
            console.error('Error loading disposal summary:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = [
            'Asset ID',
            'Disposal Date',
            'Method',
            'Original Cost',
            'Accumulated Depreciation',
            'Net Book Value',
            'Proceeds',
            'Gain/Loss'
        ];

        const rows = disposals.map(disposal => [
            disposal.asset_id,
            disposal.disposal_date,
            disposal.disposal_method,
            (disposal.original_cost / 100).toFixed(2),
            (disposal.accumulated_depreciation / 100).toFixed(2),
            (disposal.net_book_value / 100).toFixed(2),
            (disposal.disposal_proceeds / 100).toFixed(2),
            (disposal.gain_loss / 100).toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `disposal-summary-${year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate summary stats
    const summary = disposals.reduce(
        (acc, disposal) => {
            const gainLoss = disposal.gain_loss;
            return {
                totalProceeds: acc.totalProceeds + disposal.disposal_proceeds,
                totalOriginalCost: acc.totalOriginalCost + disposal.original_cost,
                totalGains: acc.totalGains + (gainLoss > 0 ? gainLoss : 0),
                totalLosses: acc.totalLosses + (gainLoss < 0 ? Math.abs(gainLoss) : 0),
                netGainLoss: acc.netGainLoss + gainLoss,
                byMethod: {
                    ...acc.byMethod,
                    [disposal.disposal_method]: (acc.byMethod[disposal.disposal_method] || 0) + 1
                }
            };
        },
        {
            totalProceeds: 0,
            totalOriginalCost: 0,
            totalGains: 0,
            totalLosses: 0,
            netGainLoss: 0,
            byMethod: {} as Record<string, number>
        }
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading disposal summary...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Disposal Summary Report</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Asset disposals and gains/losses for {year}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={exportToCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={disposals.length === 0}
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

            {/* Year Selector */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <label className="text-sm text-slate-400 font-bold">Year:</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <span className="text-sm text-slate-400">
                            {disposals.length} disposal{disposals.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Proceeds</p>
                        <p className="text-2xl font-black text-white font-mono">
                            ${(summary.totalProceeds / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 border-t-4 border-emerald-500">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Gains</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-400 font-mono">
                            ${(summary.totalGains / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 border-t-4 border-rose-500">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Losses</p>
                        </div>
                        <p className="text-2xl font-black text-rose-400 font-mono">
                            ${(summary.totalLosses / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <Card className={`bg-slate-900 border-slate-800 border-t-4 ${summary.netGainLoss >= 0 ? 'border-emerald-500' : 'border-rose-500'
                    }`}>
                    <CardContent className="p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Net Gain/Loss</p>
                        <p className={`text-2xl font-black font-mono ${summary.netGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                            {summary.netGainLoss >= 0 ? '+' : ''}${(summary.netGainLoss / 100).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* By Method Summary */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                    <h3 className="text-lg font-black text-white mb-4">Disposals by Method</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(summary.byMethod).map(([method, count]) => (
                            <div key={method} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{method.replace('_', ' ')}</p>
                                <p className="text-2xl font-black text-white">{count}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Disposals Table */}
            {disposals.length > 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950">
                                        <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Date</th>
                                        <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Method</th>
                                        <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Original Cost</th>
                                        <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Acc. Dep.</th>
                                        <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">NBV</th>
                                        <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Proceeds</th>
                                        <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Gain/Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disposals.map((disposal) => (
                                        <tr key={disposal.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                            <td className="py-3 px-4 text-sm text-white">{disposal.disposal_date}</td>
                                            <td className="py-3 px-4 text-sm text-slate-400">{disposal.disposal_method}</td>
                                            <td className="py-3 px-4 text-sm text-right font-mono">
                                                ${(disposal.original_cost / 100).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-mono text-amber-400">
                                                ${(disposal.accumulated_depreciation / 100).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-mono">
                                                ${(disposal.net_book_value / 100).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-mono">
                                                ${(disposal.disposal_proceeds / 100).toFixed(2)}
                                            </td>
                                            <td className={`py-3 px-4 text-sm text-right font-mono font-bold ${disposal.gain_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                {disposal.gain_loss >= 0 ? '+' : ''}${(disposal.gain_loss / 100).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-700 bg-slate-950">
                                        <td colSpan={5} className="py-4 px-4 text-sm font-black text-white">
                                            TOTAL ({disposals.length} disposals)
                                        </td>
                                        <td className="py-4 px-4 text-sm text-right font-mono font-black text-white">
                                            ${(summary.totalProceeds / 100).toFixed(2)}
                                        </td>
                                        <td className={`py-4 px-4 text-sm text-right font-mono font-black ${summary.netGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                            {summary.netGainLoss >= 0 ? '+' : ''}${(summary.netGainLoss / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-12 text-center">
                        <TrendingDown className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">No disposals recorded for {year}</p>
                        <p className="text-xs text-slate-500 mt-2">Assets will appear here when disposed</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
