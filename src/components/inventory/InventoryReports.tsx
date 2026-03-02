import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FileBarChart,
    PieChart,
    Printer,
    ArrowLeft,
    Package,
    Clock,
    ShieldAlert,
    Search,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Download,
    Zap
} from 'lucide-react';
import { InventoryKardexViewer } from './InventoryKardexViewer';
import { db } from '../../database/simple-db';
import { useLocale } from '@/i18n/useLocale';

interface ProductData {
    id: number;
    sku: string;
    name: string;
    stock_quantity: number;
    reorder_point: number;
    cost: number;
    price: number;
}

interface BatchData {
    id: number;
    sku: string;
    name: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    days_left: number;
}

const PrintHeader = ({ title, subtitle, t }: { title: string, subtitle?: string, t: (key: string) => string }) => (
    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter">AccountExpress Enterprise</h1>
                <p className="text-xs font-bold text-slate-500">{t('inv.reports.officialSystemReport')}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-black">{title}</p>
                <p className="text-[10px] text-slate-500">{new Date().toLocaleString()}</p>
            </div>
        </div>
        {subtitle && <p className="mt-4 text-sm italic text-slate-600">{subtitle}</p>}
    </div>
);

export const InventoryReports: React.FC = () => {
    const { t } = useLocale();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (!selectedReport) return;
        setLoading(true);

        try {
            if (selectedReport === 'VALUATION') {
                const result = db?.exec("SELECT id, sku, name, stock_quantity, cost, price FROM products WHERE active = 1");
                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map((row: any[]) => {
                        const obj: any = {};
                        columns.forEach((col: string, i: number) => obj[col] = row[i]);
                        return obj;
                    });
                    setData(items);
                }
            } else if (selectedReport === 'LOW_STOCK') {
                const result = db?.exec("SELECT id, sku, name, stock_quantity, reorder_point FROM products WHERE stock_quantity <= reorder_point AND active = 1");
                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map((row: any[]) => {
                        const obj: any = {};
                        columns.forEach((col: string, i: number) => obj[col] = row[i]);
                        return obj;
                    });
                    setData(items);
                }
            } else if (selectedReport === 'EXPIRING') {
                const result = db?.exec(`
                    SELECT p.sku, p.name, b.batch_number, b.expiry_date, b.quantity 
                    FROM product_batches b 
                    JOIN products p ON b.product_id = p.id 
                    WHERE b.active = 1 
                    ORDER BY b.expiry_date ASC
                `);

                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map((row: any[]) => {
                        const obj: any = {};
                        columns.forEach((col: string, i: number) => obj[col] = row[i]);
                        const expiry = new Date(obj.expiry_date);
                        const today = new Date();
                        const diffTime = expiry.getTime() - today.getTime();
                        obj.days_left = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return obj;
                    });
                    setData(items);
                } else {
                    // Sample data if empty
                    setData([
                        { sku: 'PHARM-001', name: 'Amoxicilina 500mg', batch_number: 'LOT-2023-A9', expiry_date: '2024-02-15', quantity: 450, days_left: 45 },
                        { sku: 'PHARM-012', name: 'Paracetamol 1g', batch_number: 'LOT-2023-B2', expiry_date: '2024-03-10', quantity: 1200, days_left: 70 },
                        { sku: 'CHEM-99', name: 'Alcohol Isopropílico', batch_number: 'LOT-XP-14', expiry_date: '2024-01-20', quantity: 55, days_left: 21 },
                    ]);
                }
            } else if (selectedReport === 'TURNOVER') {
                const result = db?.exec(`
                    SELECT 
                        p.id,
                        p.sku,
                        p.name,
                        p.stock_quantity,
                        p.cost,
                        p.price,
                        COALESCE(SUM(CASE WHEN sm.movement_type = 'sale' THEN ABS(sm.quantity) ELSE 0 END), 0) as total_sold,
                        COALESCE(COUNT(CASE WHEN sm.movement_type = 'sale' THEN 1 END), 0) as sale_count
                    FROM products p
                    LEFT JOIN stock_movements sm ON p.id = sm.product_id
                    WHERE p.active = 1
                    GROUP BY p.id
                    ORDER BY total_sold DESC
                `);

                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map((row: any[]) => {
                        const obj: any = {};
                        columns.forEach((col: string, i: number) => obj[col] = row[i]);

                        const totalSold = obj.total_sold || 0;
                        if (totalSold > 50) obj.classification = 'A';
                        else if (totalSold > 20) obj.classification = 'B';
                        else obj.classification = 'C';

                        obj.turnover_rate = obj.stock_quantity > 0
                            ? (totalSold / obj.stock_quantity).toFixed(2)
                            : '0.00';

                        return obj;
                    });
                    setData(items);
                } else {
                    setData([]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedReport]);

    if (selectedReport === 'MOVEMENTS') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <button
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white transition-all font-bold active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('inv.reports.backToReports')}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl border border-slate-700 shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> {t('inv.reports.print')}
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg border-0 transition-all active:scale-95 flex items-center gap-2">
                            <Download className="w-4 h-4" /> {t('inv.reports.exportCsv')}
                        </button>
                    </div>
                </div>
                <PrintHeader title={t('inv.reports.movementsHistoryTitle')} subtitle={t('inv.reports.movementsHistorySubtitle')} t={t} />
                <InventoryKardexViewer />
            </div>
        );
    }

    if (selectedReport === 'VALUATION') {
        const totalValue = data.reduce((acc, item) => acc + (item.stock_quantity * (item.cost || 0)), 0);
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <button
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white transition-all font-bold active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('inv.reports.back')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg px-6 py-2.5 transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> {t('inv.reports.printReport')}
                    </button>
                </div>

                <PrintHeader title={t('inv.reports.valuationReportTitle')} subtitle={t('inv.reports.valuationReportSubtitle')} t={t} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
                    <StatCard title={t('inv.reports.totalValueCost')} value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="blue" />
                    <StatCard title={t('inv.reports.productsInStock')} value={data.length} icon={Package} color="emerald" />
                    <StatCard title={t('inv.reports.totalUnits')} value={data.reduce((acc, item) => acc + item.stock_quantity, 0)} icon={FileBarChart} color="purple" />
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">{t('inv.reports.skuProduct')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.existence')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.unitCost')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.totalValue')}</th>
                                <th className="px-6 py-5 text-center">{t('inv.reports.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-blue-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">{item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">${(item.cost || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">${(item.stock_quantity * (item.cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase ${item.stock_quantity > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                            {item.stock_quantity > 0 ? t('inv.reports.inStock') : t('inv.reports.soldOut')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (selectedReport === 'LOW_STOCK') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <button
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white transition-all font-bold active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('inv.reports.back')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg px-6 py-2.5 border-0 transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> {t('inv.reports.printCritical')}
                    </button>
                </div>

                <PrintHeader title={t('inv.reports.lowStockReportTitle')} subtitle={t('inv.reports.lowStockReportSubtitle')} t={t} />

                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex items-start gap-4 mb-6 no-print">
                    <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-rose-400 font-black uppercase text-sm tracking-wider">{t('inv.reports.actionRequired')}</h3>
                        <p className="text-rose-300/70 text-sm mt-1">{t('inv.reports.actionRequiredMsg', { count: data.length })}</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">{t('inv.reports.skuProduct')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.currentStock')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.reorderPoint')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.deficit')}</th>
                                <th className="px-6 py-5 text-center">{t('inv.reports.level')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-rose-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-400 font-bold">{item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">{item.reorder_point}</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">{item.reorder_point - item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-24 bg-slate-800 h-2 rounded-full mx-auto overflow-hidden">
                                            <div
                                                className={`h-full ${item.stock_quantity === 0 ? 'bg-rose-600' : 'bg-amber-500'}`}
                                                style={{ width: `${Math.min(100, (item.stock_quantity / item.reorder_point) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (selectedReport === 'TURNOVER') {
        const classA = data.filter(item => item.classification === 'A');
        const classB = data.filter(item => item.classification === 'B');
        const classC = data.filter(item => item.classification === 'C');

        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <button
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white transition-all font-bold active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('inv.reports.back')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg px-6 py-2.5 border-0 transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> {t('inv.reports.printAnalysis')}
                    </button>
                </div>

                <PrintHeader title={t('inv.reports.turnoverReportTitle')} subtitle={t('inv.reports.turnoverReportSubtitle')} t={t} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
                    <StatCard title={t('inv.reports.classStar')} value={classA.length} icon={TrendingUp} color="emerald" />
                    <StatCard title={t('inv.reports.classMedium')} value={classB.length} icon={TrendingDown} color="blue" />
                    <StatCard title={t('inv.reports.classSlow')} value={classC.length} icon={AlertTriangle} color="rose" />
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">{t('inv.reports.skuProduct')}</th>
                                <th className="px-6 py-5 text-right">Stock</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.sold')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.turnoverRate')}</th>
                                <th className="px-6 py-5 text-center">{t('inv.reports.classification')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">{item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">{item.total_sold}</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">{item.turnover_rate}x</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${item.classification === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                            item.classification === 'B' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            }`}>
                                            {t('inv.reports.class')} {item.classification}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 no-print">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <FileBarChart className="w-5 h-5 text-emerald-400" />
                        {t('inv.reports.abcInterpretation')}
                    </h3>
                    <div className="space-y-2 text-sm text-slate-400">
                        <p><span className="text-emerald-400 font-bold">{t('inv.reports.classStar')}:</span> {t('inv.reports.classADesc')}</p>
                        <p><span className="text-blue-400 font-bold">{t('inv.reports.classMedium')}:</span> {t('inv.reports.classBDesc')}</p>
                        <p><span className="text-rose-400 font-bold">{t('inv.reports.classSlow')}:</span> {t('inv.reports.classCDesc')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedReport === 'EXPIRING') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <button
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white transition-all font-bold active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('inv.reports.back')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg px-6 py-2.5 border-0 transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> {t('inv.reports.printAlerts')}
                    </button>
                </div>

                <PrintHeader title={t('inv.reports.expiringReportTitle')} subtitle={t('inv.reports.expiringReportSubtitle')} t={t} />

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">{t('inv.kardex.product')}</th>
                                <th className="px-6 py-5">{t('inv.reports.lotNumber')}</th>
                                <th className="px-6 py-5 text-center">{t('inv.reports.expiryDate')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.movements.quantity')}</th>
                                <th className="px-6 py-5 text-right">{t('inv.reports.daysRemaining')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-300 font-bold">{item.batch_number}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            <span className="text-white font-mono">{item.expiry_date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${item.days_left < 30 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            item.days_left < 90 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {item.days_left} {t('inv.reports.days')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <TrendingUp className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('inv.reports.centerTitle')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('inv.reports.centerSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ReportCard
                    title={t('inv.reports.valuationTitle')}
                    description={t('inv.reports.valuationDesc')}
                    icon={PieChart}
                    color="blue"
                    onClick={() => setSelectedReport('VALUATION')}
                    t={t}
                />
                <ReportCard
                    title={t('inv.reports.movementsByProduct')}
                    description={t('inv.reports.movementsDesc')}
                    icon={FileBarChart}
                    color="purple"
                    onClick={() => setSelectedReport('MOVEMENTS')}
                    t={t}
                />
                <ReportCard
                    title={t('inv.reports.expiringBatches')}
                    description={t('inv.reports.expiringDesc')}
                    icon={Clock}
                    color="amber"
                    onClick={() => setSelectedReport('EXPIRING')}
                    t={t}
                />
                <ReportCard
                    title={t('inv.reports.lowStockReorder')}
                    description={t('inv.reports.lowStockDesc')}
                    icon={ShieldAlert}
                    color="rose"
                    onClick={() => setSelectedReport('LOW_STOCK')}
                    t={t}
                />
                <ReportCard
                    title={t('inv.reports.turnoverTitle')}
                    description={t('inv.reports.turnoverDesc')}
                    icon={TrendingDown}
                    color="emerald"
                    onClick={() => setSelectedReport('TURNOVER')}
                    t={t}
                />
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };

    return (
        <div className={`p-6 rounded-3xl border shadow-xl ${colors[color]}`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</span>
                <Icon className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-black tracking-tighter text-white font-mono">{value}</div>
        </div>
    );
};

const ReportCard = ({ title, description, icon: Icon, color, onClick, badge, t }: any) => {
    const colorSchemes: any = {
        blue: 'hover:border-blue-500/50 group-hover:bg-blue-600 group-hover:shadow-blue-900/40',
        purple: 'hover:border-purple-500/50 group-hover:bg-purple-600 group-hover:shadow-purple-900/40',
        amber: 'hover:border-amber-500/50 group-hover:bg-amber-600 group-hover:shadow-amber-900/40',
        rose: 'hover:border-rose-500/50 group-hover:bg-rose-600 group-hover:shadow-rose-900/40',
        emerald: 'hover:border-emerald-500/50 group-hover:bg-emerald-600 group-hover:shadow-emerald-900/40',
    };

    const iconColors: any = {
        blue: 'text-blue-400 bg-blue-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
        amber: 'text-amber-400 bg-amber-500/10',
        rose: 'text-rose-400 bg-rose-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10',
    };

    return (
        <Card
            onClick={onClick}
            className={`bg-slate-900 border-slate-800 text-white transition-all duration-300 cursor-pointer group shadow-2xl relative overflow-hidden ${colorSchemes[color]} border-2`}
        >
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${iconColors[color]} group-hover:bg-white group-hover:text-black transition-colors duration-500`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {badge && (
                        <span className="px-2 py-1 bg-white/10 text-white text-[8px] font-black uppercase rounded-lg border border-white/20">{badge}</span>
                    )}
                </div>
                <CardTitle className="mt-4 text-item-title group-hover:translate-x-1 transition-transform">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-400 h-12 leading-relaxed font-medium group-hover:text-white/80 transition-colors">
                    {description}
                </p>
                <div className="mt-8 flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest group-hover:text-white transition-colors">
                    <span>{t('inv.reports.generateReport')}</span>
                    <TrendingUp className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
            </CardContent>

            {/* Hover Decor */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${iconColors[color]}`}></div>
        </Card>
    );
};
