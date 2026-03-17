import React, { useState, useEffect } from 'react';
import {
    Calculator,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    FileText,
    Play,
    Save,
    User,
    ArrowRight,
    Settings,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    Zap,
    Activity,
    Cpu,
    Target,
    Layers,
    Info,
    History,
    FileSearch,
    BrainCircuit
} from 'lucide-react';
import type { Employee, PayrollPeriod, PayrollSetting, TaxBracket } from '@/database/modules/db-types';
import { getEmployees, getPayrollPeriods, getPayrollSettings, getTaxBrackets, createPayrollPeriod, createPayrollEntry } from '@/database/modules/db-payroll';
import { createJournalEntry } from '@/database/modules/db-journal';
import { calculateEmployeePayroll, CalculationResult } from '../../utils/payroll-tax-calculator';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { PayrollSettings as PayrollSettingsTab } from './PayrollSettings';
import { PayrollEntryList } from './PayrollEntryList';
import { useLocale } from '../../i18n/useLocale';

export const PayrollProcessor: React.FC = () => {
    const { t, language } = useLocale();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [settings, setSettings] = useState<PayrollSetting[]>([]);
    const [brackets, setBrackets] = useState<TaxBracket[]>([]);

    const [activeTab, setActiveTab] = useState<'periods' | 'process' | 'settings'>('periods');
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Selection and Form State
    const [selectedEmployees, setSelectedEmployees] = useState<Record<number, boolean>>({});
    const [periodMeta, setPeriodMeta] = useState({
        name: `${t('accounting.payroll') || 'Payroll'} - ${new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })} ${new Date().getFullYear()}`,
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        pay_date: new Date().toISOString().split('T')[0],
        reference: `PAY-${Date.now().toString().slice(-4)}`
    });

    const loadData = () => {
        setEmployees(getEmployees());
        setPeriods(getPayrollPeriods());
        setSettings(getPayrollSettings());
        setBrackets(getTaxBrackets());
    };

    useEffect(() => {
        loadData();
    }, []);

    // Initialize all active employees as selected
    useEffect(() => {
        const initial: Record<number, boolean> = {};
        employees.filter(e => e.status === 'active').forEach(e => {
            initial[e.id] = true;
        });
        setSelectedEmployees(initial);
    }, [employees]);

    const toggleEmployee = (id: number) => {
        setSelectedEmployees(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Calculations for current selection
    const getCurrentPeriodTotals = () => {
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;

        employees.filter(e => selectedEmployees[e.id] && e.status === 'active').forEach(e => {
            const calc = calculateEmployeePayroll(e, settings, brackets);
            totalGross += calc.grossAmount;
            totalDeductions += calc.deductionsAmount;
            totalNet += calc.netAmount;
        });

        return { totalGross, totalDeductions, totalNet };
    };

    const { totalGross, totalDeductions, totalNet } = getCurrentPeriodTotals();

    const handleProcessPayroll = async () => {
        if (Object.values(selectedEmployees).filter(v => v).length === 0) {
            toast.error(t('payrollProcessor.messages.selectEmployee'));
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Period
            const periodRes = createPayrollPeriod({
                name: periodMeta.name,
                start_date: periodMeta.start_date,
                end_date: periodMeta.end_date,
                pay_date: periodMeta.pay_date,
                status: 'closed', // For demo simplicity we close it immediately
                total_gross: totalGross,
                total_net: totalNet
            });

            if (!periodRes.success || !periodRes.id) throw new Error(periodRes.message);
            const periodId = periodRes.id;

            // 2. Process each employee
            for (const emp of employees.filter(e => selectedEmployees[e.id] && e.status === 'active')) {
                const calc = calculateEmployeePayroll(emp, settings, brackets);
                createPayrollEntry({
                    employee_id: emp.id,
                    period_id: periodId,
                    gross_amount: calc.grossAmount,
                    deductions_amount: calc.deductionsAmount,
                    net_amount: calc.netAmount,
                    status: 'paid',
                    notes: `${t('common.payment')} - ${periodMeta.name}`
                }, calc.lineItems);
            }

            // 3. Accounting Integration
            await createJournalEntry({
                entry_date: periodMeta.pay_date,
                description: `ASIENTO NÓMINA: ${periodMeta.name} - Ref: ${periodMeta.reference}`,
                reference_number: periodMeta.reference,
                total_debit: totalGross,
                total_credit: totalGross,
                is_balanced: true
            }, [
                { account_code: '5101', debit_amount: totalGross, credit_amount: 0, description: 'Gasto de Sueldos y Salarios' },
                { account_code: '2105', debit_amount: 0, credit_amount: totalDeductions, description: 'Retenciones por Pagar (Seguridad Social/ISR)' },
                { account_code: '1101', debit_amount: 0, credit_amount: totalNet, description: 'Sueldos por Pagar / Banco' }
            ]);

            toast.success(t('payrollProcessor.messages.success'));
            setActiveTab('periods');
            loadData();
        } catch (error: any) {
            toast.error(`${t('payrollProcessor.messages.error')}: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <div className='bg-yellow-50 border border-yellow-400 p-3 rounded mb-4'>
                <p className='text-sm font-bold text-yellow-800'>
                    ⚠️ Los cálculos de nómina son estimaciones basadas en proyecciones IRS.
                    Valide todos los montos con un CPA certificado antes de presentar
                    declaraciones al IRS. Account Express no garantiza exactitud fiscal.
                </p>
            </div>
            {/* Header Hub */}
            <div className="mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <Calculator className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {t('payrollProcessor.title')}
                        </h2>
                        <p className="text-slate-500 text-[13px] flex items-center gap-2 mt-1">
                            <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('payrollProcessor.subtitle')}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2.2xl border border-slate-800 shadow-xl overflow-hidden">
                <TabButton active={activeTab === 'periods'} onClick={() => { setActiveTab('periods'); setSelectedPeriodId(null); }} label={t('payrollProcessor.tabs.history')} icon={History} />
                <TabButton active={activeTab === 'process'} onClick={() => { setActiveTab('process'); setSelectedPeriodId(null); }} label={t('payrollProcessor.tabs.process')} icon={Play} />
                <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setSelectedPeriodId(null); }} label={t('payrollProcessor.tabs.settings')} icon={Settings} />
            </div>

            {activeTab === 'settings' ? (
                <PayrollSettingsTab />
            ) : activeTab === 'periods' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

                        <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('payrollProcessor.historyTitle')}</h3>
                            <button onClick={() => setActiveTab('process')} className="px-6 py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-600 hover:text-white transition-all">
                                {t('payrollProcessor.newCycle')}
                            </button>
                        </div>

                        {selectedPeriodId && periods.find(p => p.id === selectedPeriodId) ? (
                            <PayrollEntryList
                                period={periods.find(p => p.id === selectedPeriodId)!}
                                onBack={() => setSelectedPeriodId(null)}
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/50">
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                            <th className="px-8 py-5">{t('payrollProcessor.table.period')}</th>
                                            <th className="px-8 py-5">{t('payrollProcessor.table.range')}</th>
                                            <th className="px-8 py-5">{t('payrollProcessor.table.dueDate')}</th>
                                            <th className="px-8 py-5">{t('payrollProcessor.table.status')}</th>
                                            <th className="px-8 py-5 text-right">{t('payrollProcessor.table.totalLiquidation')}</th>
                                            <th className="px-8 py-5">{t('payrollProcessor.table.file')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {periods.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t('payrollProcessor.table.noData')}</div>
                                                </td>
                                            </tr>
                                        ) : (
                                            periods.map(period => (
                                                <tr key={period.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                                    <td className="px-8 py-6">
                                                        <span className="text-sm font-black text-white uppercase tracking-tighter group-hover/row:text-emerald-400 transition-colors">{period.name}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 font-mono">
                                                            <span>{period.start_date}</span>
                                                            <ChevronRight className="w-3 h-3 text-slate-700" />
                                                            <span>{period.end_date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{period.pay_date}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                                            {period.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-mono font-black text-white text-base">
                                                        ${period.total_net.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button onClick={() => setSelectedPeriodId(period.id)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all shadow-lg">
                                                            <FileSearch className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

                            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('payrollProcessor.preview.title')}</h3>
                                <div className="flex items-center gap-3">
                                    <BrainCircuit className="w-4 h-4 text-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{t('payrollProcessor.preview.heuristic')}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/50">
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                            <th className="px-8 py-5">{t('payrollProcessor.preview.collab')}</th>
                                            <th className="px-8 py-5 text-right">{t('payrollProcessor.preview.gross')}</th>
                                            <th className="px-8 py-5 text-right">{t('payrollProcessor.preview.deductions')}</th>
                                            <th className="px-8 py-5 text-right">{t('payrollProcessor.preview.net')}</th>
                                            <th className="px-8 py-5 text-center">{t('payrollProcessor.preview.protocol')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {employees.filter(e => e.status === 'active').map(emp => {
                                            const calc = calculateEmployeePayroll(emp, settings, brackets);
                                            const isSelected = !!selectedEmployees[emp.id];
                                            return (
                                                <tr key={emp.id} className={`hover:bg-white/[0.02] transition-all group/row ${!isSelected ? 'opacity-30 grayscale' : ''}`}>
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-white uppercase tracking-tighter text-sm mb-1 group-hover/row:text-emerald-400 transition-colors">{emp.first_name} {emp.last_name}</div>
                                                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{emp.position}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-mono font-black text-slate-400 text-sm">${calc.grossAmount.toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-right font-mono font-black text-rose-500 text-sm">-${calc.deductionsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-8 py-6 text-right font-mono font-black text-emerald-400 text-base tracking-tighter">${calc.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer group/toggle mx-auto">
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleEmployee(emp.id)} className="sr-only" />
                                                            <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${isSelected ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}></div>
                                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isSelected ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                        </label>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] flex gap-6 group">
                            <div className="p-4 bg-amber-500/10 rounded-2.2xl border border-amber-500/20 shadow-xl group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5" /> {t('payrollProcessor.alerts.integrity')}
                                </h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                    {t('payrollProcessor.alerts.integrityDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10 lg:sticky lg:top-8">
                        <Card className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] shadow-3xl overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] pointer-events-none"></div>

                            <div className="p-8 border-b border-slate-800">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-2">{t('payrollProcessor.alerts.closing')}</span>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t('payrollProcessor.alerts.consolidate')}</h3>
                            </div>

                            <CardContent className="p-8 space-y-8 relative z-10">
                                <PremiumInputMini label={t('payrollProcessor.form.descriptor')} value={periodMeta.name} onChange={(v: any) => setPeriodMeta(p => ({ ...p, name: v }))} icon={FileText} />

                                <div className="grid grid-cols-2 gap-6">
                                    <PremiumInputMini label={t('payrollProcessor.form.payDate')} value={periodMeta.pay_date} onChange={(v: any) => setPeriodMeta(p => ({ ...p, pay_date: v }))} icon={Calendar} type="date" />
                                    <PremiumInputMini label={t('payrollProcessor.form.reference')} value={periodMeta.reference} onChange={(v: any) => setPeriodMeta(p => ({ ...p, reference: v }))} icon={ShieldCheck} />
                                </div>

                                <div className="p-8 bg-slate-950/50 rounded-[3rem] border border-slate-800 space-y-6 shadow-inner relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/[0.02] animate-pulse"></div>
                                    <div className="relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('payrollProcessor.form.totals.gross')}</span>
                                            <span className="text-sm font-black text-white font-mono">${totalGross.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('payrollProcessor.form.totals.deductions')}</span>
                                            <span className="text-sm font-black text-rose-500 font-mono">-${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="h-px bg-slate-800 mb-6"></div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] block mb-2">{t('payrollProcessor.form.totals.net')}</span>
                                                <span className="text-3xl font-black text-emerald-400 tracking-tighter font-mono">${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                                <DollarSign className="w-6 h-6 text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProcessPayroll}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-7 rounded-2.5xl shadow-3xl shadow-emerald-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-4 text-sm tracking-tighter">
                                            <Play className="w-5 h-5 fill-white" />
                                            <span>{t('payrollProcessor.form.execute')}</span>
                                        </div>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-3 text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    {t('payrollProcessor.form.sync')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-emerald-100' : 'text-slate-600'}`} />
        {label}
    </button>
);

const PremiumInputMini = ({ label, value, onChange, icon: Icon, type = "text" }: any) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Icon className="w-3.5 h-3.5 text-emerald-500" /> {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-4 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all transition-duration-300"
        />
    </div>
);
