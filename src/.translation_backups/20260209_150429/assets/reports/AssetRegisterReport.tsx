import React, { useState, useEffect } from 'react';
import { Download, Printer, Filter, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { getFixedAssetsController } from '../../../controllers/FixedAssetsController';
import { SQLiteEngine } from '../../../core/database/SQLiteEngine';
import type { FixedAsset, AssetCategory } from '../../../services/accounting/fixed-assets';

interface AssetRegisterReportProps {
    db: SQLiteEngine;
    onClose: () => void;
}

export const AssetRegisterReport: React.FC<AssetRegisterReportProps> = ({ db, onClose }) => {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category_id: 0,
        status: 'ALL' as 'ALL' | 'ACTIVE' | 'PENDING' | 'FULLY_DEPRECIATED' | 'DISPOSED'
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const controller = getFixedAssetsController(db);

            const [assetsData, categoriesData] = await Promise.all([
                controller.getAllAssets(),
                controller.getCategories()
            ]);

            // Apply filters
            let filtered = assetsData;

            if (filters.category_id > 0) {
                filtered = filtered.filter(a => a.category_id === filters.category_id);
            }

            if (filters.status !== 'ALL') {
                filtered = filtered.filter(a => a.status === filters.status);
            }

            setAssets(filtered);
            setCategories(categoriesData);
        } catch (err) {
            console.error('Error loading asset register:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = [
            'Asset Tag',
            'Name',
            'Category',
            'Purchase Date',
            'Original Cost',
            'Accumulated Depreciation',
            'Net Book Value',
            'Status'
        ];

        const rows = assets.map(asset => {
            const category = categories.find(c => c.id === asset.category_id);
            return [
                asset.asset_tag,
                asset.asset_name,
                category?.name || 'N/A',
                asset.purchase_date,
                (asset.purchase_cost / 100).toFixed(2),
                (asset.total_accumulated_depreciation / 100).toFixed(2),
                ((asset.net_book_value || 0) / 100).toFixed(2),
                asset.status
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset-register-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const totals = assets.reduce(
        (acc, asset) => ({
            cost: acc.cost + asset.purchase_cost,
            depreciation: acc.depreciation + asset.total_accumulated_depreciation,
            bookValue: acc.bookValue + (asset.net_book_value || 0)
        }),
        { cost: 0, depreciation: 0, bookValue: 0 }
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading asset register...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h2 className="text-2xl font-black text-white">Asset Register</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Complete list of all fixed assets as of {new Date().toLocaleDateString()}
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
                    <Button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900 border-slate-800 print:hidden">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <div className="flex gap-4 flex-1">
                            <select
                                value={filters.category_id}
                                onChange={(e) => setFilters({ ...filters, category_id: parseInt(e.target.value) })}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                            >
                                <option value={0}>All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PENDING">Pending</option>
                                <option value="FULLY_DEPRECIATED">Fully Depreciated</option>
                                <option value="DISPOSED">Disposed</option>
                            </select>
                        </div>
                        <div className="text-sm text-slate-400">
                            {assets.length} asset{assets.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Content */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950">
                                    <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Tag</th>
                                    <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Asset Name</th>
                                    <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Category</th>
                                    <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Purchase Date</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Original Cost</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Accumulated Dep.</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Net Book Value</th>
                                    <th className="text-center py-3 px-4 text-xs font-black text-slate-400 uppercase print:hidden">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => {
                                    const category = categories.find(c => c.id === asset.category_id);
                                    return (
                                        <tr key={asset.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                            <td className="py-3 px-4 text-sm font-mono text-blue-400">{asset.asset_tag}</td>
                                            <td className="py-3 px-4 text-sm text-white">{asset.asset_name}</td>
                                            <td className="py-3 px-4 text-sm text-slate-400">{category?.name || 'N/A'}</td>
                                            <td className="py-3 px-4 text-sm text-slate-400">{asset.purchase_date}</td>
                                            <td className="py-3 px-4 text-sm text-right font-mono">
                                                ${(asset.purchase_cost / 100).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-mono text-amber-400">
                                                ${(asset.total_accumulated_depreciation / 100).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-mono text-emerald-400">
                                                ${((asset.net_book_value || 0) / 100).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-center print:hidden">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${asset.status === 'ACTIVE' ? 'bg-emerald-900/30 text-emerald-400' :
                                                        asset.status === 'FULLY_DEPRECIATED' ? 'bg-blue-900/30 text-blue-400' :
                                                            asset.status === 'DISPOSED' ? 'bg-rose-900/30 text-rose-400' :
                                                                'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-700 bg-slate-950">
                                    <td colSpan={4} className="py-4 px-4 text-sm font-black text-white">
                                        TOTAL ({assets.length} assets)
                                    </td>
                                    <td className="py-4 px-4 text-sm text-right font-mono font-black text-white">
                                        ${(totals.cost / 100).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-right font-mono font-black text-amber-400">
                                        ${(totals.depreciation / 100).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-right font-mono font-black text-emerald-400">
                                        ${(totals.bookValue / 100).toFixed(2)}
                                    </td>
                                    <td className="print:hidden"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Print Header (only visible when printing) */}
            <div className="hidden print:block text-center mb-4">
                <h1 className="text-2xl font-black tracking-tight">Asset Register Report</h1>
                <p className="text-sm text-slate-700">Generated on {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
};
