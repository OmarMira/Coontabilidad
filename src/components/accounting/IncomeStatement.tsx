import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    RefreshCw,
    Download,
    Printer,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ChevronRight,
    ArrowRight,
    PieChart,
    ArrowUpCircle,
    ArrowDownCircle,
    FileText,
    History,
    Loader2
} from 'lucide-react';
import { getIncomeStatementReport, IncomeStatementItem } from '@/database/simple-db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocale } from '@/i18n/useLocale';

export const IncomeStatement: React.FC = () => {
    const { t, language } = useLocale();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [data, setData] = useState<IncomeStatementItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = () => {
        setLoading(true);
        try {
            const [y, m] = month.split('-').map(Number);
            const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
            const endDate = new Date(y, m, 0).toISOString().split('T')[0];

            const result = getIncomeStatementReport(startDate, endDate);
            setData(result);
        } catch (error) {
            console.error('Error loading P&L Flow:', error);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    useEffect(() => {
        loadData();
    }, [month]);

    const revenue = data.filter(i => i.account_type === 'revenue');
    const expenses = data.filter(i => i.account_type === 'expense');

    const totalRevenue = revenue.reduce((s, i) => s + i.balance, 0);
    const totalExpenses = expenses.reduce((s, i) => s + i.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const [y, m] = month.split('-').map(Number);
        const monthName = new Date(y, m - 1).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' });

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(22);
        doc.setTextColor(255);
        doc.text('ACCOUNT EXPRESS', 14, 20);
        doc.setFontSize(12);
        doc.text(t('accounting.incomeStatement.pdfHeader'), 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(200);
        doc.text(t('accounting.incomeStatement.fiscalCutoff', { month: monthName.toUpperCase(), year: y.toString() }), 145, 20);
        doc.text(t('accounting.incomeStatement.reportId', { id: Math.random().toString(36).substring(7).toUpperCase() }), 145, 25);

        let finalY = 45;

        const addTableSection = (title: string, items: IncomeStatementItem[], total: number, color: [number, number, number]) => {
            doc.setFontSize(12);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(title.toUpperCase(), 14, finalY + 5);

            const body = items.map(i => [
                i.number ? `${i.number} (${i.account_code})` : i.account_code,
                i.account_name,
                formatNumber(i.balance)
            ]);

            autoTable(doc, {
                startY: finalY + 8,
                head: [[t('accounting.incomeStatement.pdfCode'), t('accounting.incomeStatement.pdfAccount'), t('accounting.incomeStatement.pdfAmount')]],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9 },
                columnStyles: { 0: { cellWidth: 25 }, 2: { halign: 'right' } }
            });

            finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFont('helvetica', 'bold');
            doc.text(`${t('accounting.incomeStatement.pdfTotal')} ${title.toUpperCase()}:`, 120, finalY);
            doc.text(`$${formatNumber(total)}`, 195, finalY, { align: 'right' });
            finalY += 15;
        };

        addTableSection(t('accounting.incomeStatement.pdfRevenue'), revenue, totalRevenue, [16, 185, 129]);
        addTableSection(t('accounting.incomeStatement.pdfExpenses'), expenses, totalExpenses, [244, 63, 94]);

        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(1);
        doc.line(14, finalY, 196, finalY);
        finalY += 15;

        doc.setFontSize(16);
        doc.setTextColor(netIncome >= 0 ? 16 : 244, netIncome >= 0 ? 185 : 63, netIncome >= 0 ? 129 : 94);
        doc.text(t('accounting.incomeStatement.pdfNetIncome'), 14, finalY);
        doc.text(`$${formatNumber(netIncome)}`, 195, finalY, { align: 'right' });

        doc.save(`AEX_P&L_${month}.pdf`);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Control Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg">
                        <PieChart className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{t('accounting.incomeStatement.title')}</h2>
                        <p className="text-slate-500 font-medium text-xs mt-1 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" /> {t('accounting.incomeStatement.performance')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner group">
                        <div className="bg-slate-900 p-2 rounded-xl group-hover:bg-blue-600/10 transition-colors">
                            <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex flex-col pr-4">
                            <span className="text-xs font-medium text-slate-500">{t('accounting.incomeStatement.monthCutoff')}</span>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="bg-transparent text-white border-0 p-0 text-sm font-bold outline-none focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                        <button onClick={loadData} disabled={loading} className="p-3 hover:bg-slate-900 text-slate-500 hover:text-white rounded-xl transition-all">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl font-bold text-[11px] transition-all">
                            <Printer className="w-4 h-4" /> {t('accounting.incomeStatement.print')}
                        </button>
                        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[11px] transition-all shadow-xl shadow-blue-900/30 active:scale-95">
                            <Download className="w-4 h-4" /> {t('accounting.incomeStatement.export')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Flow Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* REVENUE COLUMN */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-emerald-500/20 transition-all duration-500">
                    <header className="px-10 py-8 bg-slate-950/50 border-b border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{t('accounting.incomeStatement.revenue')}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500/60 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">NODO 4000</span>
                    </header>

                    <div className="p-10 space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                <p className="text-xs font-medium text-slate-600">{t('accounting.incomeStatement.syncRevenue')}</p>
                            </div>
                        ) : revenue.length === 0 ? (
                            <div className="py-20 text-center opacity-20 italic font-bold text-slate-500 text-xs">{t('accounting.incomeStatement.noRevenue')}</div>
                        ) : (
                            revenue.map((item, i) => (
                                <div key={i} className="flex justify-between items-center group/row p-4 rounded-2xl bg-slate-950/20 border border-transparent hover:border-slate-800 hover:bg-slate-950/40 transition-all">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-600 font-mono tracking-tight bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800">
                                            {item.number ? `${item.number}` : item.account_code} {item.number && <span className="text-[9px] text-slate-500 font-normal">({item.account_code})</span>}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-300 group-hover/row:text-white transition-colors">{item.account_name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-emerald-400 font-mono">
                                            ${formatNumber(item.balance)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="p-10 bg-emerald-500/5 border-t border-emerald-500/10 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">{t('accounting.incomeStatement.totalRevenue')}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('accounting.incomeStatement.auditPeriod')}</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
                            ${formatNumber(totalRevenue)}
                        </p>
                    </footer>
                </div>

                {/* EXPENSES COLUMN */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-rose-500/20 transition-all duration-500">
                    <header className="px-10 py-8 bg-slate-950/50 border-b border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                <ArrowDownCircle className="w-6 h-6 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{t('accounting.incomeStatement.expenses')}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-rose-500/60 bg-rose-500/5 px-3 py-1 rounded-full border border-rose-500/10">NODO 5000</span>
                    </header>

                    <div className="p-10 space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                                <p className="text-xs font-medium text-slate-600">{t('accounting.incomeStatement.syncExpenses')}</p>
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="py-20 text-center opacity-20 italic font-bold text-slate-500 text-xs">{t('accounting.incomeStatement.noExpenses')}</div>
                        ) : (
                            expenses.map((item, i) => (
                                <div key={i} className="flex justify-between items-center group/row p-4 rounded-2xl bg-slate-950/20 border border-transparent hover:border-slate-800 hover:bg-slate-950/40 transition-all">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-600 font-mono tracking-tight bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800">
                                            {item.number ? `${item.number}` : item.account_code} {item.number && <span className="text-[9px] text-slate-500 font-normal">({item.account_code})</span>}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-300 group-hover/row:text-white transition-colors">{item.account_name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-rose-400 font-mono">
                                            ${formatNumber(item.balance)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="p-10 bg-rose-500/5 border-t border-rose-500/10 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{t('accounting.incomeStatement.totalExpenses')}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('accounting.incomeStatement.resourceConsumption')}</p>
                        </div>
                        <p className="text-3xl font-bold text-rose-400 font-mono tracking-tight">
                            ${formatNumber(totalExpenses)}
                        </p>
                    </footer>
                </div>

                {/* BOTTOM RESULT BAR - Full Width */}
                <div className={`lg:col-span-2 relative mt-4 group cursor-pointer transition-all duration-500 transform hover:scale-[1.01]`}>
                    <div className={`absolute inset-0 blur-3xl opacity-20 transition-all group-hover:opacity-40 ${netIncome >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div className={`relative flex flex-col md:flex-row items-center justify-between p-12 rounded-[3.5rem] border-2 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-3xl transition-all ${netIncome >= 0
                        ? 'bg-slate-900/60 border-emerald-500/30'
                        : 'bg-slate-900/60 border-rose-500/30'
                        }`}>
                        <div className="flex items-center gap-8 mb-6 md:mb-0">
                            <div className={`p-6 rounded-[2rem] border shadow-2xl ${netIncome >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                }`}>
                                <DollarSign className="w-12 h-12" strokeWidth={3} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">{t('accounting.incomeStatement.managementResult')}</h4>
                                <p className="text-4xl font-bold text-white tracking-tight">
                                    {netIncome >= 0 ? t('accounting.incomeStatement.netProfit') : t('accounting.incomeStatement.netLoss')}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-baseline gap-2 mb-1 justify-end">
                                <span className={`text-6xl font-bold font-mono tracking-tight ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${formatNumber(Math.abs(netIncome))}
                                </span>
                            </div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${netIncome >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                {t('accounting.incomeStatement.cashFlowRealized')} {netIncome >= 0 ? 'E' : 'D'}
                            </p>
                        </div>
                    </div>
                </div>
            </div >
        </div >

    );
};
