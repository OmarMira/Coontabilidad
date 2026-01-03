import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, ShieldAlert, Printer, CheckCircle, Database, Wrench } from 'lucide-react';
import {
    getTrialBalanceReport,
    TrialBalanceRow,
    createChartOfAccount,
    getChartOfAccountByCode,
    createJournalEntry
} from '@/database/simple-db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TrialBalanceReport: React.FC = () => {
    // Estado para filtro de período
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [data, setData] = useState<TrialBalanceRow[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = () => {
        setLoading(true);
        try {
            const [year, month] = period.split('-').map(Number);
            const reportData = getTrialBalanceReport(year, month);
            setData(reportData);
        } catch (error) {
            console.error('Error loading trial balance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    // Herramientas de Reparación y Datos (Solo Dev/Demo)
    const handleRepairAccounts = () => {
        const requiredAccounts = [
            { code: '1121', name: 'Cuentas por Cobrar - Clientes', type: 'asset', normal_balance: 'debit', parent: '1100' },
            { code: '2121', name: 'Impuesto Ventas por Pagar (FL)', type: 'liability', normal_balance: 'credit', parent: '2100' },
            { code: '4110', name: 'Ventas', type: 'revenue', normal_balance: 'credit', parent: '4000' }
        ];

        let created = 0;
        requiredAccounts.forEach(acc => {
            if (!getChartOfAccountByCode(acc.code)) {
                createChartOfAccount({
                    account_code: acc.code,
                    account_name: acc.name,
                    account_type: acc.type as any,
                    normal_balance: acc.normal_balance as any,
                    parent_account: acc.parent,
                    is_active: true
                });
                created++;
            }
        });

        if (created > 0) {
            alert(`Se crearon ${created} cuentas faltantes necesarias para el reporte.`);
            loadData();
        } else {
            alert('Todas las cuentas necesarias ya existen.');
        }
    };

    const handleGenerateTestData = () => {
        if (!confirm('Esto insertará asientos contables de ejemplo. ¿Continuar?')) return;

        // 1. Asiento de Apertura
        createJournalEntry({
            entry_date: `${period}-01`,
            description: 'Asiento de Apertura (Capital Inicial)',
            reference_number: 'OPEN-001'
        }, [
            { account_code: '1112', debit_amount: 50000, credit_amount: 0, description: 'Banco Inicial' },
            { account_code: '3100', debit_amount: 0, credit_amount: 50000, description: 'Capital Social' }
        ]);

        // 2. Venta de Servicios (con IVA/Tax)
        // Asegurar que las cuentas existan primero
        handleRepairAccounts();

        createJournalEntry({
            entry_date: `${period}-15`,
            description: 'Venta Servicios Web - Cliente A',
            reference_number: 'INV-DEMO-01'
        }, [
            { account_code: '1121', debit_amount: 3210, credit_amount: 0, description: 'CxC Cliente A' },
            { account_code: '4110', debit_amount: 0, credit_amount: 3000, description: 'Ingresos por Ventas' },
            { account_code: '2121', debit_amount: 0, credit_amount: 210, description: 'Tax Florida (7%)' }
        ]);

        loadData();
        alert('Datos de prueba generados exitosamente.');
    };

    // Totales
    const totalDebit = data.reduce((s, r) => s + r.debit, 0);
    const totalCredit = data.reduce((s, r) => s + r.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    // Exportar PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Balance de Comprobación', 14, 22);

        doc.setFontSize(11);
        doc.text(`Período: ${period}`, 14, 30);
        doc.text(`Fecha Generación: ${new Date().toLocaleDateString()}`, 14, 36);

        const tableData = data.map(row => [
            row.account_code,
            row.account_name,
            row.initial_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            row.final_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Código', 'Cuenta', 'Saldo Inicial', 'Débito', 'Crédito', 'Saldo Final']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        // Agregar totales y validación
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Débitos: $${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, finalY);
        doc.text(`Total Créditos: $${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, finalY + 6);

        if (isBalanced) {
            doc.setTextColor(0, 150, 0);
            doc.text('✅ BALANCE CUADRADO', 14, finalY + 14);
        } else {
            doc.setTextColor(200, 0, 0);
            doc.text(`❌ DESCUADRE DETECTADO: $${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, finalY + 14);
        }

        doc.save(`Balance_Comprobacion_${period}.pdf`);
    };

    return (
        <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-section-title">Balance de Comprobación</h2>
                    <p className="text-standard-body opacity-80">Verificación de saldos débitos y créditos</p>
                </div>

                {/* Selector de Período */}
                <div className="flex items-center gap-4">
                    <label className="text-slate-400 text-sm font-medium">Período:</label>
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex gap-3 no-print">
                    {/* Demo Tools */}
                    <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={handleRepairAccounts} title="Reparar Cuentas">
                        <Wrench className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={handleGenerateTestData} title="Generar Datos Prueba">
                        <Database className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </Button>
                    <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-900/40">
                        <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Código</th>
                            <th className="px-6 py-4">Cuenta</th>
                            <th className="px-6 py-4 text-right">Saldo Inicial</th>
                            <th className="px-6 py-4 text-right">Débitos</th>
                            <th className="px-6 py-4 text-right">Créditos</th>
                            <th className="px-6 py-4 text-right">Saldo Final</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                    No hay movimientos registrados en este período.
                                    <br />
                                    <span className="text-xs">Use el botón <Database className="w-3 h-3 inline" /> para generar datos de prueba.</span>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-blue-400 font-black bg-blue-900/20 px-2 py-1 rounded">
                                            {row.account_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-200 group-hover:text-white transition-colors">
                                        {row.account_name}
                                        <span className="ml-2 text-[10px] text-slate-500 uppercase px-1 border border-slate-700 rounded">
                                            {row.account_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">
                                        {row.initial_balance !== 0 ? row.initial_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                        {row.debit > 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                                        {row.credit > 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-blue-300">
                                        {row.final_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-slate-900 font-black border-t border-slate-700">
                        <tr>
                            <td colSpan={3} className="px-6 py-6 text-right uppercase text-xs tracking-widest text-slate-500">Totales Generales</td>
                            <td className="px-6 py-6 text-right font-mono text-xl text-emerald-400 underline decoration-emerald-500/30 decoration-4 underline-offset-8">
                                {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-6 text-right font-mono text-xl text-rose-400 underline decoration-rose-500/30 decoration-4 underline-offset-8">
                                {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-6"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Validation Banner */}
            <div className={`flex items-center gap-3 border p-4 rounded-xl ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                {isBalanced ? <CheckCircle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                <div>
                    <h3 className="font-bold text-lg">{isBalanced ? 'Partida Doble Validada' : 'Error de Partida Doble'}</h3>
                    <p className="text-sm opacity-90">
                        {isBalanced
                            ? 'La suma de débitos y créditos coincide perfectamente.'
                            : `Existe una diferencia de ${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Revise los asientos contables.`}
                    </p>
                </div>
            </div>
        </div>
    );
};
