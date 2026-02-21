import React from 'react';
import {
    FileText,
    User,
    Calendar,
    Building2,
    Printer,
    Download,
    CheckCircle,
    Hash,
    DollarSign,
    Shield,
    X,
    TrendingUp
} from 'lucide-react';
import { PayrollEntry, PayrollLineItem, Employee, PayrollPeriod } from '../../database/simple-db';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useLocale } from '@/i18n/useLocale';

interface PayrollSlipProps {
    entry: PayrollEntry;
    items: PayrollLineItem[];
    employee: Employee;
    period: PayrollPeriod;
    onClose: () => void;
}

export const PayrollSlip: React.FC<PayrollSlipProps> = ({ entry, items, employee, period, onClose }) => {
    const { t } = useLocale();

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
            </div>

            <Card className="w-full max-w-5xl bg-slate-900 border border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
                {/* Protocol Header */}
                <div className="px-10 py-8 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2.5xl flex items-center justify-center shadow-inner group">
                            <Building2 className="w-9 h-9 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Account Express Industrial</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">{t('payroll.slip.payrollPaystub')}</span>
                                <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('payroll.slip.forensicVerification')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95">
                            <Printer className="w-4 h-4" /> {t('payroll.slip.print')}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-800/50 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <CardContent className="p-10 space-y-10">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-950/30 p-8 rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <User className="w-16 h-16 text-blue-500" />
                            </div>
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> {t('payroll.slip.employeeInfo')}
                            </h4>
                            <div className="space-y-4">
                                <InfoRow label={t('payroll.slip.fullName')} value={`${employee.first_name} ${employee.last_name}`} isBlack />
                                <InfoRow label={t('payroll.slip.employeeCode')} value={employee.employee_number} isAccent color="text-blue-500" />
                                <InfoRow label={t('payroll.slip.position')} value={employee.position || 'N/A'} />
                            </div>
                        </div>

                        <div className="bg-slate-950/30 p-8 rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calendar className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5" /> {t('payroll.slip.periodDetails')}
                            </h4>
                            <div className="space-y-4">
                                <InfoRow label={t('payroll.slip.fiscalPeriod')} value={period.name} isBlack />
                                <InfoRow label={t('payroll.slip.dates')} value={`${period.start_date} ${t('payroll.slip.to')} ${period.end_date}`} isMono />
                                <InfoRow label={t('payroll.slip.paymentDate')} value={period.pay_date} isAccent color="text-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Earnings & Deductions Table */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-[3rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('payroll.slip.conceptDescription')}</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('payroll.slip.earnings')}</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('payroll.deductions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-5 text-sm font-black text-white uppercase tracking-tighter">{item.description}</td>
                                        <td className="px-8 py-5 text-right font-mono font-black text-white text-base">
                                            {item.type === 'earning' ? `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono font-black text-rose-500 text-base">
                                            {item.type === 'deduction' ? `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-950 border-t border-slate-800">
                                    <td className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('payroll.slip.payrollTotals')}</td>
                                    <td className="px-8 py-8 text-right text-xl font-black text-white font-mono">${entry.gross_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-8 py-8 text-right text-xl font-black text-rose-500 font-mono">-${entry.deductions_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Net Pay Grand Section */}
                    <div className="flex justify-end relative">
                        <div className="bg-emerald-600 border border-emerald-500 p-10 rounded-[3rem] text-white min-w-[400px] shadow-3xl shadow-emerald-950/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                <DollarSign className="w-32 h-32 text-white" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-70 leading-none">{t('payroll.slip.netToReceive')}</p>
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums">${entry.net_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white/20 rounded-2.5xl flex items-center justify-center mb-2 shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('payroll.slip.paidLabel')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <div className="px-10 py-8 bg-slate-950/80 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    <span className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        {t('payroll.slip.certifiedBy')} Account Express Dev Engine
                    </span>
                    <div className="flex items-center gap-3">
                        <Hash className="w-3 h-3 text-slate-700" />
                        <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-slate-400 font-mono">ID_SYS_PAYROLL_{entry.id}_{new Date().getTime().toString().slice(-6)}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const InfoRow = ({ label, value, isBlack, isAccent, color, isMono }: any) => (
    <div className="flex justify-between items-center group/row">
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight group-hover/row:text-slate-400 transition-colors">{label}:</span>
        <span className={`text-sm ${isBlack ? 'font-black text-white' : isAccent ? `font-black ${color}` : 'font-black text-slate-400'} ${isMono ? 'font-mono' : ''} tracking-tighter uppercase`}>
            {value}
        </span>
    </div>
);
