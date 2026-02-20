import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  User,
  DollarSign,
  Clock,
  ChevronDown,
  FileText,
  Zap,
  CheckCircle2,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react';
import { getEmployees, Employee } from '../../database/simple-db';
import { PayrollProcessor, PayrollResult } from '../../services/payroll/PayrollProcessor';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../i18n/useLocale';

export const PayrollProcessorUI: React.FC = () => {
  const { t } = useLocale();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [payDate, setPayDate] = useState('');
  const [regularHours, setRegularHours] = useState(80);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [preview, setPreview] = useState<PayrollResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processor = useMemo(() => new PayrollProcessor(), []);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    try {
      const allEmployees = getEmployees().filter(e => e.status === 'active');
      setEmployees(allEmployees);
    } catch (error) {
      toast.error(t('payroll.processor.errorLoadingEmployees'));
    }
  };

  const handleCalculatePreview = async () => {
    if (!selectedEmployee) {
      toast.error(t('payroll.processor.pleaseSelectEmployee'));
      return;
    }

    try {
      const result = await processor.calculatePreview({
        employeeId: selectedEmployee.id,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        regularHours,
        overtimeHours,
        bonuses,
        commissions,
        otherDeductions,
        processedBy: user?.id || 0
      });

      if (result.success) {
        setPreview(result);
        toast.success(t('payroll.processor.previewCalculated'));
      } else {
        toast.error(result.error || t('payroll.processor.errorCalculatingPreview'));
      }
    } catch (error) {
      console.error('Payroll calculation error:', error);
      toast.error(t('payroll.processor.errorCalculatingPreview'));
    }
  };

  const handleApproveAndProcess = async () => {
    if (!preview || !selectedEmployee) {
      toast.error(t('payroll.processor.noPayrollToApprove'));
      return;
    }
    if (!user) {
      toast.error(t('payroll.processor.userNotAuthenticated'));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processor.processPayroll({
        employeeId: selectedEmployee.id,
        payPeriodStart,
        payPeriodEnd,
        payDate,
        regularHours,
        overtimeHours,
        bonuses,
        commissions,
        otherDeductions,
        processedBy: user.id
      });

      if (result.success) {
        toast.success(t('payroll.processor.payrollApproved'));
        setPreview(null);
        setSelectedEmployee(null);
      } else {
        toast.error(result.error || t('payroll.processor.errorApproving'));
      }
    } catch (error) {
      toast.error(t('payroll.processor.errorApproving'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 px-4 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
            <Calculator className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('payroll.processor.title')}</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-3">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> {t('payroll.processor.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Config Panel */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>

            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('payroll.processor.payrollInfo')}</h3>
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{t('payroll.processor.flTaxEngine')}</span>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {/* Employee Selection */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {t('payroll.processor.selectedEmployee')} *
                </label>
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find(x => x.id === Number(e.target.value));
                    setSelectedEmployee(emp || null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all cursor-pointer"
                >
                  <option value="">{t('payroll.processor.selectActiveEmployee')}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <>
                  {/* Employee Quick Info */}
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group/card">
                    <div className="p-4 bg-blue-600/10 rounded-2.2xl border border-blue-500/20 shadow-xl group-hover/card:scale-110 transition-transform">
                      <User className="w-8 h-8 text-blue-500 shrink-0" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedEmployee.first_name} {selectedEmployee.last_name}</h4>
                      <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>{t('payroll.processor.type')}: {selectedEmployee.pay_type === 'hourly' ? t('payroll.processor.hourly') : t('payroll.processor.salaried')}</span>
                        <span>{t('payroll.processor.rate')}: {selectedEmployee.pay_type === 'hourly' ? `$${selectedEmployee.hourly_rate}${t('payroll.processor.perHour')}` : `$${selectedEmployee.salary}${t('payroll.processor.perYear')}`}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>{t('payroll.processor.filingStatus')}: {selectedEmployee.filing_status}</span>
                        <span>{t('payroll.processor.allowances')}: {selectedEmployee.allowances}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> {t('payroll.processor.start')}
                      </label>
                      <input type="date" value={payPeriodStart} onChange={e => setPayPeriodStart(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> {t('payroll.processor.end')}
                      </label>
                      <input type="date" value={payPeriodEnd} onChange={e => setPayPeriodEnd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <DollarSign className="w-3.5 h-3.5 text-blue-500" /> {t('payroll.processor.payment')}
                      </label>
                      <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>

                  {/* Hours and Extras */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" /> {t('payroll.processor.regularHours')}
                      </label>
                      <input type="number" value={regularHours} onChange={e => setRegularHours(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> {t('payroll.processor.overtimeHours')}
                      </label>
                      <input type="number" value={overtimeHours} onChange={e => setOvertimeHours(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {t('payroll.processor.bonuses')}
                      </label>
                      <input type="number" value={bonuses} onChange={e => setBonuses(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {t('payroll.processor.commissions')}
                      </label>
                      <input type="number" value={commissions} onChange={e => setCommissions(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> {t('payroll.processor.otherDeductions')}
                      </label>
                      <input type="number" value={otherDeductions} onChange={e => setOtherDeductions(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>

                  {/* Calculate Button */}
                  <button
                    onClick={handleCalculatePreview}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-7 rounded-2.5xl shadow-3xl shadow-blue-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                      <Calculator className="w-5 h-5" />
                      <span>{t('payroll.processor.calculatePreview')}</span>
                    </div>
                  </button>
                </>
              )}

              {!selectedEmployee && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <User className="w-16 h-16 text-slate-700 mb-6" />
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{t('payroll.processor.selectEmployeePrompt')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-10 lg:sticky lg:top-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-500" /> {t('payroll.processor.previewStub')}
            </h3>

            {preview ? (
              <div className="space-y-6">
                {/* Net Pay Highlight */}
                <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-2xl shadow-blue-950/40 relative overflow-hidden group/net">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{t('payroll.processor.netToReceive')}</p>
                  <h2 className="text-4xl font-black tracking-tighter">{formatCurrency(preview.netPay)}</h2>
                  <p className="text-[8px] font-black uppercase tracking-widest mt-3 opacity-40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('payroll.processor.calculationsVerified')}
                  </p>
                </div>

                {/* Earnings */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{t('payroll.processor.earningsConcepts')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                      <span>{t('payroll.processor.grossRegularExtras')}</span>
                      <span className="text-white">{formatCurrency(preview.grossPay - (preview.bonuses || 0) - (preview.commissions || 0))}</span>
                    </div>
                    {(preview.bonuses || 0) > 0 && (
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>{t('payroll.processor.incentivesBonusComm')}</span>
                        <span className="text-white">{formatCurrency((preview.bonuses || 0) + (preview.commissions || 0))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase border-t border-slate-800 pt-2">
                      <span>{t('payroll.processor.grossSubtotal')}</span>
                      <span>{formatCurrency(preview.grossPay)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{t('payroll.processor.deductionsAndTaxes')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                      <span>{t('payroll.processor.socialSecurity')}</span>
                      <span className="text-rose-400">-{formatCurrency(preview.taxes?.socialSecurity || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                      <span>{t('payroll.processor.medicareRate')}</span>
                      <span className="text-rose-400">-{formatCurrency(preview.taxes?.medicare || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                      <span>{t('payroll.processor.federalIncomeTax')}</span>
                      <span className="text-rose-400">-{formatCurrency(preview.taxes?.federalIncomeTax || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-rose-400 uppercase border-t border-slate-800 pt-2">
                      <span>{t('payroll.processor.totalDeductions')}</span>
                      <span>-{formatCurrency((preview.taxes?.totalTaxes || 0) + (otherDeductions || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Approve Button */}
                <button
                  onClick={handleApproveAndProcess}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-3xl shadow-emerald-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('payroll.processor.approveAndProcess')}</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('payroll.processor.noPreview')}</p>
                <p className="text-[9px] text-slate-700 mt-2 font-bold">{t('payroll.processor.configureAndCalculate')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollProcessorUI;
