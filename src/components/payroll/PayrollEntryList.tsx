import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    FileText,
    Eye,
    Download,
    Activity
} from 'lucide-react';
import { PayrollEntry, PayrollLineItem, getPayrollEntries, getPayrollLineItems, PayrollPeriod } from '../../database/simple-db';
import { useLocale } from '@/i18n/useLocale';

interface PayrollEntryListProps {
    period: PayrollPeriod;
    onBack: () => void;
    onViewSlip?: (entry: PayrollEntry) => void;
}

export const PayrollEntryList: React.FC<PayrollEntryListProps> = ({ period, onBack, onViewSlip }) => {
    const { t } = useLocale();
    const [entries, setEntries] = useState<(PayrollEntry & { employee_name?: string })[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
    const [lineItems, setLineItems] = useState<PayrollLineItem[]>([]);

    useEffect(() => {
        if (period?.id) {
            const data = getPayrollEntries(period.id);
            setEntries(data);
        }
    }, [period]);

    const handleViewDetails = (entry: PayrollEntry) => {
        setSelectedEntry(entry);
        if (entry.id) {
            setLineItems(getPayrollLineItems(entry.id));
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    const totalGross = entries.reduce((sum, e) => sum + e.gross_amount, 0);
    const totalDeductions = entries.reduce((sum, e) => sum + e.deductions_amount, 0);
    const totalNet = entries.reduce((sum, e) => sum + e.net_amount, 0);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-24 px-4 overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-10">
                <button
                    onClick={onBack}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t('payroll.entryList.payrollDetail')}</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                        {period.name} • {entries.length} {t('payroll.entryList.employeesProcessed')}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px]"></div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20 uppercase">{t('payroll.entryList.totalEarned')}</span>
                    <h3 className="text-3xl font-black text-white mt-4 tracking-tighter">{formatCurrency(totalGross)}</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{t('payroll.entryList.sumOfEarnings')}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px]"></div>
                    <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/20 uppercase">{t('payroll.entryList.taxesAndWithholdings')}</span>
                    <h3 className="text-3xl font-black text-white mt-4 tracking-tighter">-{formatCurrency(totalDeductions)}</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{t('payroll.entryList.totalWithholdings')}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px]"></div>
                    <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20 uppercase">{t('payroll.entryList.toPay')}</span>
                    <h3 className="text-3xl font-black text-white mt-4 tracking-tighter">{formatCurrency(totalNet)}</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{t('payroll.entryList.toSettle')}</p>
                </div>
            </div>

            {/* Detail Panel */}
            {selectedEntry && (
                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="px-10 py-6 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('payroll.entryList.conceptBreakdown')}</h3>
                        <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>{t('payroll.entryList.totalGross')}: <span className="text-emerald-400">{formatCurrency(selectedEntry.gross_amount)}</span></span>
                            <span>{t('payroll.entryList.totalNet')}: <span className="text-blue-400">{formatCurrency(selectedEntry.net_amount)}</span></span>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-950">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.typeTh')}</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.category')}</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.description')}</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {lineItems.map(item => (
                                <tr key={item.id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${item.type === 'earning' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'}`}>
                                            {item.type === 'earning' ? t('payroll.entryList.earning') : t('payroll.entryList.deduction')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs font-bold text-slate-400">{item.category}</td>
                                    <td className="px-6 py-3 text-sm font-bold text-white">{item.description}</td>
                                    <td className={`px-6 py-3 text-sm font-black text-right ${item.type === 'earning' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {item.type === 'deduction' ? '-' : ''}{formatCurrency(item.amount)}
                                    </td>
                                </tr>
                            ))}
                            {lineItems.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
                                        {t('payroll.entryList.noConceptsRegistered')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Entries Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="px-10 py-6 border-b border-slate-800">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('payroll.entryList.processedEmployeesList')}</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-950 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.employeeTh')}</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.grossTh')}</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.deductionsTh')}</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.netTh')}</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.statusTh')}</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.entryList.actionsTh')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                        {entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 text-sm font-black text-white">{entry.employee_name || `#${entry.employee_id}`}</td>
                                <td className="px-6 py-4 text-sm font-black text-white text-right">{formatCurrency(entry.gross_amount)}</td>
                                <td className="px-6 py-4 text-sm font-black text-rose-400 text-right">-{formatCurrency(entry.deductions_amount)}</td>
                                <td className="px-6 py-4 text-sm font-black text-emerald-400 text-right">{formatCurrency(entry.net_amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20 uppercase">
                                        {entry.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleViewDetails(entry)}
                                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                            title={t('payroll.entryList.viewDetails')}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                            title={t('payroll.entryList.downloadPaystub')}
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
                                    {t('payroll.entryList.noEntriesForPeriod')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayrollEntryList;