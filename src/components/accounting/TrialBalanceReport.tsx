import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
    RefreshCw,
    Download,
    ShieldAlert,
    Printer,
    CheckCircle,
    Database,
    Wrench,
    Search,
    FileSpreadsheet,
    Eye,
    X,
    Calendar,
    ArrowRight,
    ArrowDown,
    History,
    ShieldCheck,
    FileText,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { getTrialBalanceReport, getAccountMovementsDetails, validateAccountingIntegrity } from '@/database/modules/db-reports-trial';
import { createChartOfAccount, getChartOfAccountByCode } from '@/database/modules/db-chart-of-accounts';
import { createJournalEntry } from '@/database/modules/db-journal';
import type { TrialBalanceRow } from '../../modules/accounting/Accounting.types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { useLocale } from '../../i18n/useLocale';

export const TrialBalanceReport: React.FC = () => {
    const { t, language } = useLocale();
    // Estado para filtro de perÃ­odo
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [data, setData] = useState<TrialBalanceRow[]>([]);
    const [loading, setLoading] = useState(false);

    // Helper para formato de moneda
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

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
            logger.error('TrialBalanceReport', 'error', 'Error loading trial balance:', error);
        } finally {
            setTimeout(() => setLoading(false), 300); // Smooth transition
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
        setLoading(true);
        setTimeout(() => {
            const result = validateAccountingIntegrity();
            setIntegrityResult(result);
            setShowIntegrityModal(true);
            setLoading(false);
        }, 800);
    };

    // Herramientas de ReparaciÃ³n
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
            loadData();
        }
    };

    const handleGenerateTestData = () => {
        if (!confirm(t('accounting.trialBalance.repairConfirmation'))) return;
        handleRepairAccounts();
        createJournalEntry({
            entry_date: `${period}-01`,
            description: 'Apertura de Cuenta - Capital Inicial',
            reference_number: 'OPEN-001'
        }, [
            { account_code: '1112', debit_amount: 50000, credit_amount: 0, description: 'Efectivo Inicial' },
            { account_code: '3100', debit_amount: 0, credit_amount: 50000, description: 'Aporte Capital' }
        ]);
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
    };

    const totalDebit = data.reduce((s, r) => s + r.period_debit, 0);
    const totalCredit = data.reduce((s, r) => s + r.period_credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    // Export PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFillColor(15, 23, 42); // slate-950
        doc.rect(0, 0, 297, 40, 'F');
        doc.setFontSize(24);
        doc.setTextColor(255);
        doc.text('ACCOUNT EXPRESS', 14, 20);
        doc.setFontSize(14);
        doc.text(`${t('accounting.trialBalance.title').toUpperCase()} - ${t('accounting.trialBalance.protocol').toUpperCase()}`, 14, 30);
        doc.setFontSize(10);
        doc.text(`${t('accounting.trialBalance.periodLabel')}: ${period}`, 145, 25);
        doc.text(`${t('accounting.trialBalance.sessionID')}: ${Math.random().toString(36).substring(7).toUpperCase()}`, 145, 30);
        const tableData = data.map(row => [
            row.number ? `${row.number} (${row.account_code})` : row.account_code,
            row.account_name,
            row.normal_balance.toUpperCase(),
            formatCurrency(row.initial_balance),
            formatCurrency(row.period_debit),
            formatCurrency(row.period_credit),
            formatCurrency(row.final_balance)
        ]);
        autoTable(doc, {
            startY: 45,
            head: [[
                t('accounting.trialBalance.codeHeader'),
                t('accounting.trialBalance.descHeader'),
                t('accounting.trialBalance.natHeader'),
                t('accounting.trialBalance.prevBalance'),
                t('accounting.trialBalance.debits'),
                t('accounting.trialBalance.credits'),
                t('accounting.trialBalance.closingBalance')
            ]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(30);
        doc.text(`${t('accounting.trialBalance.debits').toUpperCase()}: ${formatCurrency(totalDebit)}`, 180, finalY);
        doc.text(`${t('accounting.trialBalance.credits').toUpperCase()}: ${formatCurrency(totalCredit)}`, 180, finalY + 8);
        doc.save(`AEX_TrialBalance_${period}.pdf`);
    };

    const handleDownloadExcel = () => {
        const wsData: string[][] = [
            [`ACCOUNT EXPRESS - ${t('accounting.trialBalance.title').toUpperCase()}`],
            [`${t('accounting.trialBalance.periodLabel')}: ${period}`],
            [
                t('accounting.trialBalance.codeHeader'),
                t('accounting.trialBalance.descHeader'),
                "NAT",
                t('accounting.trialBalance.prevBalance'),
                t('accounting.trialBalance.debits'),
                t('accounting.trialBalance.credits'),
                t('accounting.trialBalance.closingBalance')
            ]
        ];
        data.forEach(row => {
            wsData.push([
                row.number ? `${row.number} (${row.account_code})` : row.account_code,
                row.account_name,
                row.normal_balance.toUpperCase(),
                formatCurrency(row.initial_balance),
                formatCurrency(row.period_debit),
                formatCurrency(row.period_credit),
                formatCurrency(row.final_balance)
            ]);
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
        XLSX.writeFile(wb, `AEX_Balance_${period}.xlsx`);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Legend & Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-1 bg-slate-900/50 border border-slate-800/80 rounded-[2rem] shadow-2xl backdrop-blur-xl">
                <div className="p-6 bg-slate-950/80 rounded-[1.8rem] border border-slate-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">{t('accounting.trialBalance.openingBalance')}</span>
                        <History className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-xl font-bold text-white">{formatCurrency(data.reduce((s, r) => s + r.initial_balance, 0))}</p>
                </div>
                <div className="p-6 bg-slate-950/40 rounded-[1.8rem] border border-slate-800/20 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-500">{t('accounting.trialBalance.debitFlow')}</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalDebit)}</p>
                </div>
                <div className="p-6 bg-slate-950/40 rounded-[1.8rem] border border-slate-800/20 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-rose-500">{t('accounting.trialBalance.creditFlow')}</span>
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-xl font-bold text-rose-400">{formatCurrency(totalCredit)}</p>
                </div>
                <div className={`p-6 rounded-[1.8rem] border-2 space-y-3 ${isBalanced ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-rose-900/10 border-rose-500/30'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">{t('accounting.trialBalance.integrity')}</span>
                        {isBalanced ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />}
                    </div>
                    <p className={`text-xl font-bold ${isBalanced ? 'text-emerald-500' : 'text-rose-500'}`}>{isBalanced ? t('accounting.trialBalance.calibrated') : `${t('accounting.trialBalance.error')}: ` + formatCurrency(difference)}</p>
                </div>
            </div>

            {/* Header section with Premium Controls */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-blue-900/10 shadow-lg">
                        <FileSpreadsheet className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{t('accounting.trialBalance.title')}</h2>
                        <p className="text-slate-500 font-medium text-xs mt-1 flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-blue-500" />
                            {t('accounting.trialBalance.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Period Selector styled as Control Panel */}
                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner">
                        <div className="bg-slate-900 p-2 rounded-xl">
                            <Calendar className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col pr-4">
                            <span className="text-xs font-medium text-slate-500">{t('accounting.trialBalance.periodLabel')}</span>
                            <input
                                type="month"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="bg-transparent text-white border-0 p-0 text-sm font-bold outline-none focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                        <button onClick={loadData} disabled={loading} className="p-3 hover:bg-slate-900 text-slate-500 hover:text-white rounded-xl transition-all">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={handleRunIntegrity} className="flex items-center gap-2 px-6 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl font-bold text-[11px] transition-all">
                            <ShieldCheck className="w-4 h-4" /> {t('accounting.trialBalance.diagnosis')}
                        </button>
                        <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] transition-all shadow-xl shadow-emerald-900/20">
                            <Download className="w-4 h-4" /> {t('accounting.trialBalance.exportExcel')}
                        </button>
                        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] transition-all shadow-xl shadow-indigo-900/20">
                            <Printer className="w-4 h-4" /> {t('accounting.trialBalance.reportPDF')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Data Registry */}
            <div className="rounded-[2.5rem] border border-slate-800 overflow-hidden bg-slate-950/20 backdrop-blur-2xl shadow-2xl">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-950 text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-slate-800">
                        <tr>
                            <th className="px-10 py-6 text-center">NÃšMERO GAAP / CÃ“DIGO</th>
                            <th className="px-10 py-6">{t('accounting.trialBalance.descHeader')}</th>
                            <th className="px-10 py-6 text-center">{t('accounting.trialBalance.natHeader')}</th>
                            <th className="px-10 py-6 text-right">{t('accounting.trialBalance.prevBalance')}</th>
                            <th className="px-10 py-6 text-right">{t('accounting.trialBalance.debits')}</th>
                            <th className="px-10 py-6 text-right">{t('accounting.trialBalance.credits')}</th>
                            <th className="px-10 py-6 text-right">{t('accounting.trialBalance.closingBalance')}</th>
                            <th className="px-10 py-6 text-center">{t('accounting.trialBalance.protocol')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="py-32 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                        <p className="text-xs font-medium text-slate-500">{t('accounting.trialBalance.syncing')}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-10 py-24 text-center">
                                    <div className="space-y-4 opacity-30">
                                        <Database className="w-20 h-20 mx-auto text-slate-700" />
                                        <p className="font-bold text-xl text-slate-500 tracking-tight">{t('accounting.trialBalance.noMovements')}</p>
                                        <div className="flex justify-center gap-4 pt-4 no-print">
                                            <button onClick={handleRepairAccounts} className="text-xs font-bold text-slate-600 hover:text-white px-4 py-2 border border-slate-800 rounded-lg transition-all">{t('accounting.trialBalance.repairStructure')}</button>
                                            <button onClick={handleGenerateTestData} className="text-xs font-bold text-slate-600 hover:text-white px-4 py-2 border border-slate-800 rounded-lg transition-all">{t('accounting.trialBalance.injectDemo')}</button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-900/30 transition-all group">
                                    <td className="px-10 py-6">
                                        <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10 flex flex-col items-center">
                                            <span>{row.number || 'N/A'}</span>
                                            <span className="text-[9px] text-slate-500">{row.account_code}</span>
                                        </span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{row.account_name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-medium">{row.account_type}</span>
                                                <ChevronRight className="w-2.5 h-2.5 text-slate-800" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center justify-center gap-1.5 min-w-[50px] mx-auto ${row.normal_balance === 'debit'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full ${row.normal_balance === 'debit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            {row.normal_balance === 'debit' ? 'DB' : 'CR'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right font-mono text-[11px] text-slate-500 font-bold">
                                        {formatCurrency(row.initial_balance)}
                                    </td>
                                    <td className="px-10 py-6 text-right font-mono font-bold text-emerald-400 text-sm">
                                        {row.period_debit > 0 ? formatCurrency(row.period_debit) : '-'}
                                    </td>
                                    <td className="px-10 py-6 text-right font-mono font-bold text-rose-400 text-sm">
                                        {row.period_credit > 0 ? formatCurrency(row.period_credit) : '-'}
                                    </td>
                                    <td className="px-10 py-6 text-right font-mono font-bold text-slate-100 bg-slate-900/30 group-hover:bg-blue-600/10 transition-colors">
                                        <span className="px-4 py-2 rounded-xl border border-slate-800 text-sm group-hover:border-blue-500/30 transition-all">
                                            {formatCurrency(row.final_balance)}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <button
                                            onClick={() => handleViewDetails(row.account_code)}
                                            className="p-3 bg-slate-950 hover:bg-blue-600 text-slate-600 hover:text-white rounded-2xl transition-all border border-slate-800 hover:border-blue-500 active:scale-95 group/btn"
                                            title={t('accounting.trialBalance.viewLedger')}
                                        >
                                            <Search className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-slate-950/80 border-t-2 border-slate-800">
                        <tr>
                            <td colSpan={4} className="px-10 py-10 text-right font-bold uppercase text-xs tracking-wider text-slate-600">{t('accounting.trialBalance.auditConsolidation')}</td>
                            <td className="px-10 py-10 text-right">
                                <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1.5">{t('accounting.trialBalance.debitConsumption')}</p>
                                <p className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">
                                    {formatCurrency(totalDebit)}
                                </p>
                            </td>
                            <td className="px-10 py-10 text-right">
                                <p className="text-xs text-rose-500 font-bold uppercase tracking-wider mb-1.5">{t('accounting.trialBalance.creditConsumption')}</p>
                                <p className="font-mono text-2xl font-bold text-rose-400 tracking-tight">
                                    {formatCurrency(totalCredit)}
                                </p>
                            </td>
                            <td colSpan={2} className="px-10 py-10 text-center">
                                <div className={`inline-flex flex-col items-center gap-1.5 px-10 py-5 rounded-[2rem] border-2 shadow-2xl transition-all ${isBalanced
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                    : 'bg-rose-500/5 border-rose-500/40 text-rose-400 animate-pulse'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {isBalanced ? <CheckCircle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                                        <span className="font-bold text-sm uppercase tracking-wider">
                                            {isBalanced ? t('accounting.trialBalance.integrityBook') : t('accounting.trialBalance.criticalImbalance')}
                                        </span>
                                    </div>
                                    {!isBalanced && (
                                        <p className="text-xs font-bold text-rose-500/80 uppercase tracking-wide">{t('accounting.trialBalance.diff')}: ${formatNumber(difference)}</p>
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Drill-down Modal (Account History) - Modern Backlit Aesthetic */}
            {selectedAccount && (
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl bg-slate-900/80 rounded-[3rem] border border-slate-800 shadow-[0_0_150px_rgba(59,130,246,0.1)] h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <header className="px-12 py-8 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-blue-600/10 rounded-[1.5rem] border border-blue-500/20">
                                    <Eye className="w-8 h-8 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                        {t('accounting.trialBalance.auxHistory')}: <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{selectedAccount}</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs font-medium mt-1 flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-blue-500" /> {t('accounting.trialBalance.registeredTrans')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAccount(null)} className="p-3 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-full transition-all active:scale-90 border border-slate-700">
                                <X className="w-6 h-6" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-auto px-4 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                    <tr className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-12 py-6">{t('accounting.trialBalance.effectiveDate')}</th>
                                        <th className="px-12 py-6">{t('accounting.trialBalance.reference')}</th>
                                        <th className="px-12 py-6">{t('accounting.trialBalance.concept')}</th>
                                        <th className="px-12 py-6 text-right">{t('accounting.trialBalance.debitAction')}</th>
                                        <th className="px-12 py-6 text-right">{t('accounting.trialBalance.creditAction')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {movements.length === 0 ? (
                                        <tr><td colSpan={5} className="py-40 text-center text-slate-700 font-bold uppercase tracking-wider italic opacity-30">{t('accounting.trialBalance.zeroMovements')}</td></tr>
                                    ) : (
                                        movements.map((move, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-all group">
                                                <td className="px-12 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                        <span className="font-mono text-xs text-slate-400 font-bold">{new Date(move.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-6 font-bold text-[11px] text-blue-500 tracking-tight">{move.reference}</td>
                                                <td className="px-12 py-6 text-slate-300 font-bold text-sm tracking-tight">{move.description}</td>
                                                <td className="px-12 py-6 text-right font-mono font-bold text-emerald-400 text-lg">
                                                    {move.debit > 0 ? formatNumber(move.debit) : '-'}
                                                </td>
                                                <td className="px-12 py-6 text-right font-mono font-bold text-rose-400 text-lg">
                                                    {move.credit > 0 ? formatNumber(move.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <footer className="px-12 py-10 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex gap-4">
                                <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                                    <span className="text-xs font-medium text-slate-500 block mb-1">{t('accounting.trialBalance.totalRecords')}</span>
                                    <span className="text-white font-bold">{movements.length} {t('accounting.trialBalance.entries')}</span>
                                </div>
                            </div>
                            <div className="flex gap-12">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">{t('accounting.trialBalance.closingDebit')}</p>
                                    <p className="text-3xl font-bold text-emerald-400 tracking-tight">{formatNumber(movements.reduce((a, c) => a + c.debit, 0))}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{t('accounting.trialBalance.closingCredit')}</p>
                                    <p className="text-3xl font-bold text-rose-400 tracking-tight">{formatNumber(movements.reduce((a, c) => a + c.credit, 0))}</p>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            )}

            {/* Integrity Diagnosis Modal */}
            {showIntegrityModal && integrityResult && (
                <div className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl p-1 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-slate-950/50 p-12 space-y-10">
                            <header className="text-center space-y-4">
                                <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center border-4 shadow-2xl ${integrityResult.isValid
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-900/20'
                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-rose-900/20'
                                    }`}>
                                    {integrityResult.isValid ? <CheckCircle className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
                                </div>
                                <h3 className="text-3xl font-bold text-white tracking-tight">{t('accounting.trialBalance.netDiagnosis')}</h3>
                                <p className="text-slate-500 font-medium text-xs mt-1">{t('accounting.trialBalance.verification')}</p>
                            </header>

                            <div className="space-y-6">
                                {integrityResult.isValid ? (
                                    <div className="p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-center">
                                        <p className="font-bold text-emerald-500 text-lg tracking-tight mb-2">{t('accounting.trialBalance.perfectSync')}</p>
                                        <p className="text-xs font-medium text-emerald-200/40 italic leading-relaxed">
                                            {t('accounting.trialBalance.syncDesc')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-rose-500 uppercase tracking-wider pl-2 flex items-center gap-2">
                                            <ShieldAlert className="w-3.5 h-3.5" /> {t('accounting.trialBalance.inconsistencyLog')}
                                        </p>
                                        <div className="max-h-56 overflow-auto bg-black/40 p-6 rounded-3xl border border-slate-800 space-y-3 custom-scrollbar">
                                            {integrityResult.errors.map((err, i) => (
                                                <div key={i} className="flex gap-4 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 hover:border-rose-500/30 transition-colors">
                                                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-rose-200 font-mono font-bold leading-relaxed">{err}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowIntegrityModal(false)}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm py-6 rounded-3xl transition-all shadow-xl active:scale-95 border border-slate-700"
                                >
                                    {t('accounting.trialBalance.finishScan')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
