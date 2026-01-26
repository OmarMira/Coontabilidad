import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw, Download, ShieldAlert, Printer, CheckCircle, Database, Wrench, Search, FileSpreadsheet, Eye, X } from 'lucide-react';
import {
    getTrialBalanceReport,
    getAccountMovementsDetails,
    validateAccountingIntegrity,
    createChartOfAccount,
    getChartOfAccountByCode,
    createJournalEntry
} from '../../database/simple-db';
import type { TrialBalanceRow } from '../../modules/accounting/Accounting.types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const TrialBalanceReport: React.FC = () => {
    // Estado para filtro de período
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [data, setData] = useState<TrialBalanceRow[]>([]);
    // Helper para formato de moneda (Requerido para tipos y consistencia)
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const [loading, setLoading] = useState(false);

    // UI States
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [movements, setMovements] = useState<any[]>([]);
    const [showIntegrityModal, setShowIntegrityModal] = useState(false);
    const [integrityResult, setIntegrityResult] = useState<{ isValid: boolean; errors: string[] } | null>(null);

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

    const handleViewDetails = async (accountCode: string) => {
        const [year, month] = period.split('-').map(Number);
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = new Date(year, month, 0).toISOString().split('T')[0];

        const details = getAccountMovementsDetails(accountCode, start, end);
        setMovements(details);
        setSelectedAccount(accountCode);
    };

    const handleRunIntegrity = () => {
        const result = validateAccountingIntegrity();
        setIntegrityResult(result);
        setShowIntegrityModal(true);
    };

    // Herramientas de Reparación y Datos (Solo Dev/Demo)
    const handleRepairAccounts = () => {
        const requiredAccounts = [
            { code: '1112', name: 'Banco Operativo', type: 'asset', normal_balance: 'debit', parent: '1100' },
            { code: '1121', name: 'Cuentas por Cobrar - Clientes', type: 'asset', normal_balance: 'debit', parent: '1100' },
            { code: '2121', name: 'Impuesto Ventas por Pagar (FL)', type: 'liability', normal_balance: 'credit', parent: '2100' },
            { code: '3100', name: 'Capital Social', type: 'equity', normal_balance: 'credit', parent: '3000' },
            { code: '4110', name: 'Ventas de Servicios', type: 'revenue', normal_balance: 'credit', parent: '4000' },
            { code: '5240', name: 'Gastos Legales', type: 'expense', normal_balance: 'debit', parent: '5000' }
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

        handleRepairAccounts();

        // 1. Asiento de Apertura
        createJournalEntry({
            entry_date: `${period}-01`,
            description: 'Apertura de Cuenta - Capital Inicial',
            reference_number: 'OPEN-001'
        }, [
            { account_code: '1112', debit_amount: 50000, credit_amount: 0, description: 'Efectivo Inicial' },
            { account_code: '3100', debit_amount: 0, credit_amount: 50000, description: 'Aporte Capital' }
        ]);

        // 2. Venta con Tax Florida
        createJournalEntry({
            entry_date: `${period}-10`,
            description: 'Venta de Servicios Corporativos',
            reference_number: 'INV-1002'
        }, [
            { account_code: '1121', debit_amount: 1070, credit_amount: 0, description: 'CxC Cliente A' },
            { account_code: '4110', debit_amount: 0, credit_amount: 1000, description: 'Servicios Web' },
            { account_code: '2121', debit_amount: 0, credit_amount: 70, description: 'FL Sales Tax 7%' }
        ]);

        loadData();
        alert('Movimientos de prueba inyectados correctamente.');
    };

    // Totales
    const totalDebit = data.reduce((s, r) => s + r.period_debit, 0);
    const totalCredit = data.reduce((s, r) => s + r.period_credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    // Export PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');

        // Header Estilizado
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, 297, 40, 'F');

        doc.setFontSize(24);
        doc.setTextColor(255);
        doc.text('ACCOUNT EXPRESS', 14, 20);

        doc.setFontSize(14);
        doc.text('BALANCE DE COMPROBACIÓN', 14, 30);

        doc.setFontSize(10);
        doc.text(`Período: ${period}`, 250, 20);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 250, 25);

        const tableData = data.map(row => [
            row.account_code,
            row.account_name,
            row.normal_balance === 'debit' ? 'DEUDORA' : 'ACREEDORA',
            formatCurrency(row.initial_balance),
            formatCurrency(row.period_debit),
            formatCurrency(row.period_credit),
            formatCurrency(row.final_balance)
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['CÓDIGO', 'DESCRIPCIÓN DE CUENTA', 'NATURALEZA', 'SALDO ANTERIOR', 'DÉBITOS', 'CRÉDITOS', 'SALDO ACTUAL']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30, halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setTextColor(50);
        doc.text(`TOTAL DÉBITOS: ${formatCurrency(totalDebit)}`, 180, finalY);
        doc.text(`TOTAL CRÉDITOS: ${formatCurrency(totalCredit)}`, 180, finalY + 8);

        if (isBalanced) {
            doc.setTextColor(46, 204, 113);
            doc.text('ESTADO: VALIDADO (CUADRADO)', 14, finalY + 8);
        } else {
            doc.setTextColor(231, 76, 60);
            doc.text(`ESTADO: DESCUADRE ($${difference.toFixed(2)})`, 14, finalY + 8);
        }

        doc.save(`Balance_Comprobacion_${period}.pdf`);
    };

    // Export Excel
    const handleDownloadExcel = () => {
        const wsData: string[][] = [
            ["ACCOUNT EXPRESS - BALANCE DE COMPROBACIÓN"],
            [`Período: ${period}`],
            [`Fecha de Generación: ${new Date().toLocaleString()}`],
            [],
            ["Código", "Nombre de Cuenta", "Naturaleza", "Saldo Anterior", "Débitos Mensuales", "Créditos Mensuales", "Saldo Actual"]
        ];

        data.forEach(row => {
            wsData.push([
                row.account_code,
                row.account_name,
                row.normal_balance.toUpperCase(),
                formatCurrency(row.initial_balance),
                formatCurrency(row.period_debit),
                formatCurrency(row.period_credit),
                formatCurrency(row.final_balance)
            ]);
        });

        wsData.push([]);
        wsData.push(["", "TOTALES GENERALES", "", "", formatCurrency(totalDebit), formatCurrency(totalCredit), ""]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Formatear columnas numéricas (D, E, F, G son 3, 4, 5, 6)
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let R = 5; R <= range.e.r; ++R) {
            for (let C = 3; C <= 6; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell) cell.z = '#,##0.00';
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
        XLSX.writeFile(wb, `Balance_Comprobacion_${period}.xlsx`);
    };

    return (
        <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl relative min-h-[600px]">
            {/* Header section con Estilo Premium */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <FileSpreadsheet className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Balance de Comprobación</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Módulo de Integridad Contable v2.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selector de Período Estilizado */}
                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período</label>
                        <input
                            type="month"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-transparent text-white border-0 p-0 text-sm font-black outline-none w-32 focus:ring-0"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl" onClick={loadData} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-blue-500/5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-xl font-bold"
                            onClick={handleRunIntegrity}
                        >
                            <ShieldAlert className="w-4 h-4 mr-2" /> Validar Datos
                        </Button>
                        <Button onClick={handleDownloadExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 shadow-lg shadow-emerald-900/40">
                            <Download className="w-4 h-4 mr-2" /> Excel
                        </Button>
                        <Button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 shadow-lg shadow-indigo-900/40">
                            <Printer className="w-4 h-4 mr-2" /> PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Debug Tools Toolbar */}
            <div className="flex justify-end gap-2 no-print opacity-40 hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="text-[9px] text-slate-600 hover:text-white" onClick={handleRepairAccounts}>
                    <Wrench className="w-3 h-3 mr-1" /> Reparar Estructura
                </Button>
                <Button variant="ghost" size="sm" className="text-[9px] text-slate-600 hover:text-white" onClick={handleGenerateTestData}>
                    <Database className="w-3 h-3 mr-1" /> Inyectar Demo
                </Button>
            </div>

            {/* Tabla Principal */}
            <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-900/20 backdrop-blur-xl shadow-inner">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-900/60 text-slate-500 font-black uppercase tracking-[0.15em] text-[9px] border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-5">Código</th>
                            <th className="px-6 py-5">Cuenta Contable</th>
                            <th className="px-6 py-5 text-center">NAT</th>
                            <th className="px-6 py-5 text-right">Saldo Anterior</th>
                            <th className="px-6 py-5 text-right">Débitos</th>
                            <th className="px-6 py-5 text-right">Créditos</th>
                            <th className="px-6 py-5 text-right">Saldo Actual</th>
                            <th className="px-6 py-5 text-center">Audit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-20 text-center text-slate-600">
                                    <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-lg">Sin movimientos en este ciclo</p>
                                    <p className="text-xs uppercase tracking-widest mt-1">Seleccione otro período o genere datos de prueba</p>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-500/[0.03] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[11px] text-blue-400 font-black bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg shadow-sm">
                                            {row.account_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-200 group-hover:text-white">{row.account_name}</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase opacity-60">{row.account_type}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`text-[10px] font-black inline-flex px-2 py-0.5 rounded-md border ${row.normal_balance === 'debit'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                            }`}>
                                            {row.normal_balance === 'debit' ? 'DB' : 'CR'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400 font-bold text-xs">
                                        {formatCurrency(row.initial_balance)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-400/90 text-sm">
                                        {row.period_debit > 0 ? formatCurrency(row.period_debit) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-rose-400/90 text-sm">
                                        {row.period_credit > 0 ? formatCurrency(row.period_credit) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-blue-300 bg-blue-500/[0.02]">
                                        <span className="p-1.5 rounded-lg border border-blue-400/10 text-sm">
                                            {formatCurrency(row.final_balance)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleViewDetails(row.account_code)}
                                            className="p-2.5 bg-slate-800/50 hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 rounded-xl transition-all border border-slate-700 hover:border-blue-500/30 shadow-sm"
                                            title="Explorar Mayoreo"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-slate-900/90 border-t-4 border-slate-800 shadow-2xl">
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-right font-black uppercase text-[10px] tracking-[0.2em] text-slate-500">Totales de Control Mensual</td>
                            <td className="px-6 py-8 text-right border-x border-slate-800/50">
                                <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Total Débitos</p>
                                <p className="font-mono text-xl font-black text-emerald-400 tracking-tighter">
                                    {formatCurrency(totalDebit)}
                                </p>
                            </td>
                            <td className="px-6 py-8 text-right border-x border-slate-800/50">
                                <p className="text-[10px] text-rose-500 font-black uppercase mb-1">Total Créditos</p>
                                <p className="font-mono text-xl font-black text-rose-400 tracking-tighter">
                                    {formatCurrency(totalCredit)}
                                </p>
                            </td>
                            <td colSpan={2} className="px-6 py-8 text-center bg-slate-950/40">
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 ${isBalanced
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-rose-500/10 border-rose-500/50 text-rose-400 animate-pulse'
                                    }`}>
                                    {isBalanced ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                    <span className="font-black text-xs uppercase tracking-widest">
                                        {isBalanced ? 'Libro Cuadrado' : 'Fuera de Balance'}
                                    </span>
                                </div>
                                {!isBalanced && (
                                    <p className="text-[9px] font-bold text-rose-500/80 mt-2">DIF: ${difference.toFixed(2)}</p>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Drill-down Modal (Account History) */}
            {selectedAccount && (
                <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
                    <Card className="w-full max-w-5xl bg-slate-900 border-slate-800 shadow-[0_0_100px_rgba(37,99,235,0.2)] h-[85vh] flex flex-col rounded-[32px] overflow-hidden">
                        <CardHeader className="bg-slate-900 border-b border-slate-800 px-8 py-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                    <Eye className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                                        Mayoreo Auxiliar: <span className="text-blue-400">{selectedAccount}</span>
                                    </CardTitle>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Exploración detallada de transacciones del ciclo</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="bg-slate-800 hover:bg-slate-700 text-white rounded-full p-2 h-auto" onClick={() => setSelectedAccount(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0 scrollbar-hide">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[9px] sticky top-0 z-10 border-b border-slate-800">
                                    <tr>
                                        <th className="px-8 py-5">Fecha</th>
                                        <th className="px-8 py-5">Referencia</th>
                                        <th className="px-8 py-5">Concepto / Descripción</th>
                                        <th className="px-8 py-5 text-right">Débito</th>
                                        <th className="px-8 py-5 text-right">Crédito</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {movements.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 italic">No existen asientos registrados para esta cuenta en el período.</td></tr>
                                    ) : (
                                        movements.map((move, i) => (
                                            <tr key={i} className="hover:bg-blue-500/[0.02] transition-colors">
                                                <td className="px-8 py-5 font-mono text-xs text-slate-400">{move.date}</td>
                                                <td className="px-8 py-5 font-black text-[11px] text-blue-400 tracking-tighter">{move.reference}</td>
                                                <td className="px-8 py-5 text-slate-300 font-medium">{move.description}</td>
                                                <td className="px-8 py-5 text-right font-mono font-black text-emerald-400 text-lg">
                                                    {move.debit > 0 ? move.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono font-black text-rose-400 text-lg">
                                                    {move.credit > 0 ? move.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                        <div className="bg-slate-900 p-6 border-t border-slate-800 flex justify-end">
                            <div className="flex gap-12">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Suma Débitos</p>
                                    <p className="text-xl font-black text-emerald-400">{movements.reduce((a, c) => a + c.debit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Suma Créditos</p>
                                    <p className="text-xl font-black text-rose-400">{movements.reduce((a, c) => a + c.credit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Integrity Diagnosis Modal */}
            {showIntegrityModal && integrityResult && (
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-slate-950 border border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
                        <CardHeader className="border-b border-slate-800/50 pb-6">
                            <CardTitle className="flex items-center gap-4 text-2xl font-black text-white">
                                <div className={`p-2 rounded-xl ${integrityResult.isValid ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                    {integrityResult.isValid ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <ShieldAlert className="w-8 h-8 text-rose-500" />}
                                </div>
                                Diagnóstico de Salud Contable
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {integrityResult.isValid ? (
                                <div className="text-emerald-400 bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                                    <p className="font-black text-lg mb-2">INTEGRIDAD TOTAL CONFIRMADA</p>
                                    <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest leading-loose">
                                        El motor de validación no encontró inconsistencias entre encabezados y detalles de asientos ni descuadres en el libro mayor.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.2em]">Inconsistencias Detectadas:</p>
                                    <div className="max-h-60 overflow-auto bg-black/40 p-6 rounded-3xl border border-rose-500/10 space-y-3 custom-scrollbar">
                                        {integrityResult.errors.map((err, i) => (
                                            <div key={i} className="flex gap-4 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                                <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                                <p className="text-xs text-rose-200 font-mono font-bold">{err}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-3 pt-4">
                                <Button onClick={() => setShowIntegrityModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-6 rounded-2xl transition-all">
                                    Cerrar Diagnóstico
                                </Button>
                                {!integrityResult.isValid && (
                                    <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">
                                        Se recomienda revisar los asientos listados mediante el registro de auditoría
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
