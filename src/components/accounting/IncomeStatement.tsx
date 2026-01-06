import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getIncomeStatementReport, IncomeStatementItem } from '@/database/simple-db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const IncomeStatement: React.FC = () => {
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
            console.error('Error loading P&L:', error);
        } finally {
            setLoading(false);
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

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const [y, m] = month.split('-').map(Number);
        const monthName = new Date(y, m - 1).toLocaleString('es-ES', { month: 'long' });

        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Estado de Resultados', 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Período: ${monthName} ${y}`, 14, 30);

        let finalY = 40;

        // Secciones
        const addSection = (title: string, items: IncomeStatementItem[], total: number, color: [number, number, number]) => {
            const body = items.map(i => [i.account_code, i.account_name, i.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })]);

            autoTable(doc, {
                startY: finalY,
                head: [[title.toUpperCase(), '', '']],
                body: body,
                theme: 'plain',
                headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 30 }, 2: { halign: 'right', fontStyle: 'bold' } },
            });

            finalY = (doc as any).lastAutoTable.finalY + 2;

            // Total Sección
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`Total ${title}:`, 120, finalY + 4);
            doc.text(`$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 195, finalY + 4, { align: 'right' });
            finalY += 10;
        };

        addSection('Ingresos', revenue, totalRevenue, [16, 185, 129]); // Emerald-ish
        addSection('Gastos', expenses, totalExpenses, [244, 63, 94]); // Rose-ish

        // Resultado Final
        doc.setDrawColor(200, 200, 200);
        doc.line(14, finalY, 196, finalY);
        finalY += 10;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Utilidad Neta del Ejercicio:', 14, finalY);

        const netColor = netIncome >= 0 ? [16, 185, 129] : [244, 63, 94];
        doc.setTextColor(netColor[0], netColor[1], netColor[2]);
        doc.text(`$${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

        doc.save(`Estado_Resultados_${month}.pdf`);
    };

    return (
        <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-section-title">Estado de Resultados</h2>
                    <p className="text-standard-body opacity-80">Profit & Loss Statement</p>
                </div>

                <div className="flex items-center gap-4">
                    <label className="text-slate-400 text-sm font-medium">Período:</label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                </div>

                <div className="flex gap-3 no-print">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </Button>
                    <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-900/40 transition-all hover:scale-105">
                        <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 max-w-4xl mx-auto">
                {/* INGRESOS */}
                <div className="bg-slate-900/60 rounded-xl p-6 border border-emerald-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Ingresos Operacionales</h3>
                    </div>

                    <div className="space-y-3">
                        {revenue.length === 0 && <p className="text-slate-500 italic">No hay ingresos registrados en este período.</p>}
                        {revenue.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-slate-800/50 hover:bg-slate-800/30 px-2 rounded transition-colors">
                                <span className="text-slate-300 font-medium">
                                    <span className="text-slate-500 mr-2 font-mono text-xs">{item.account_code}</span>
                                    {item.account_name}
                                </span>
                                <span className="text-emerald-300 font-mono tracking-wide">
                                    {item.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-emerald-500/30 flex justify-between items-center">
                        <span className="text-emerald-400 font-bold uppercase text-sm tracking-wider">Total Ingresos</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                            {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* GASTOS */}
                <div className="bg-slate-900/60 rounded-xl p-6 border border-rose-500/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Gastos Operacionales</h3>
                    </div>

                    <div className="space-y-3">
                        {expenses.length === 0 && <p className="text-slate-500 italic">No hay gastos registrados en este período.</p>}
                        {expenses.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-slate-800/50 hover:bg-slate-800/30 px-2 rounded transition-colors">
                                <span className="text-slate-300 font-medium">
                                    <span className="text-slate-500 mr-2 font-mono text-xs">{item.account_code}</span>
                                    {item.account_name}
                                </span>
                                <span className="text-rose-300 font-mono tracking-wide">
                                    {item.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-rose-500/30 flex justify-between items-center">
                        <span className="text-rose-400 font-bold uppercase text-sm tracking-wider">Total Gastos</span>
                        <span className="text-2xl font-black text-rose-400 font-mono">
                            {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* NET INCOME */}
                <div className="bg-slate-800 rounded-2xl p-8 border border-slate-600 shadow-xl flex justify-between items-center transform hover:scale-[1.01] transition-transform duration-300">
                    <div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Utilidad Neta del Ejercicio</h3>
                        <p className="text-slate-500 text-xs">Ingresos menos Gastos</p>
                    </div>
                    <div className={`text-4xl font-black font-mono flex items-center gap-2 ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <DollarSign className="w-8 h-8" strokeWidth={3} />
                        {netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>
        </div>
    );
};
