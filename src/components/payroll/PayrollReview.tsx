import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Eye,
  XCircle,
  Calendar,
  Users,
  FileText,
  Shield,
  Zap,
  Activity
} from 'lucide-react';
import { getPayrolls, getEmployees, Payroll, Employee } from '@/database/simple-db';
import { payrollProcessor } from '../../services/payroll/PayrollProcessor';
import { toast } from 'react-hot-toast';
import { useLocale } from '@/i18n/useLocale';

interface PayrollReviewProps {
  onViewPaystub?: (payrollId: number) => void;
}

export const PayrollReview: React.FC<PayrollReviewProps> = ({ onViewPaystub }) => {
  const { t } = useLocale();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setEmployees(getEmployees());
      loadPayrolls();
    } catch (error) {
      toast.error(t('payroll.review.errorLoading'));
    }
  };

  const loadPayrolls = () => {
    try {
      const filters: any = {};
      if (filterEmployee) filters.employee_id = Number(filterEmployee);
      if (filterStatus) filters.status = filterStatus;
      if (filterYear) filters.year = Number(filterYear);
      setPayrolls(getPayrolls(filters));
    } catch (error) {
      toast.error(t('payroll.review.errorLoading'));
    }
  };

  const handleVoid = (payrollId: number) => {
    if (!confirm(t('payroll.review.confirmVoid'))) return;
    try {
      payrollProcessor.voidPayroll(payrollId);
      toast.success(t('payroll.review.voidedSuccess'));
      loadPayrolls();
    } catch (error) {
      toast.error(t('payroll.review.errorVoiding'));
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'paid': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'voided': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return t('payroll.review.draft');
      case 'approved': return t('payroll.review.approved');
      case 'paid': return t('payroll.review.paid');
      case 'voided': return t('payroll.review.voided');
      default: return status;
    }
  };

  const getEmployeeName = (id: number) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : `#${id}`;
  };

  const years = Array.from(new Set(payrolls.map(p => new Date(p.pay_date).getFullYear()))).sort((a, b) => b - a);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 px-4 overflow-x-hidden">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
            <Activity className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {t('payrollReview.title')}
            </h2>
            <p className="text-slate-500 text-[13px] flex items-center gap-2 mt-1">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('payrollReview.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-emerald-500" /> {t('payroll.review.searchFilters')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('payroll.employee')}</label>
            <select
              value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500"
            >
              <option value="">{t('payroll.review.allEmployees')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('payroll.review.status')}</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500"
            >
              <option value="">{t('payroll.review.allStatuses')}</option>
              <option value="draft">{t('payroll.review.draft')}</option>
              <option value="approved">{t('payroll.review.approved')}</option>
              <option value="paid">{t('payroll.review.paid')}</option>
              <option value="voided">{t('payroll.review.voided')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('payroll.review.year')}</label>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500"
            >
              <option value="">{t('payroll.review.allYears')}</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPayrolls}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-900/40 hover:-translate-y-1"
            >
              <Filter className="w-4 h-4 fill-white" />
              {t('payroll.review.applyFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.employee')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.review.payPeriodCol')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.review.payDateCol')}</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.review.grossPayCol')}</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.review.netPayCol')}</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.review.statusCol')}</th>
              <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('payroll.review.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {payrolls.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-black text-white">{getEmployeeName(p.employee_id)}</td>
                <td className="px-6 py-4 text-xs font-black text-slate-400">{p.pay_period_start} - {p.pay_period_end}</td>
                <td className="px-6 py-4 text-xs font-black text-slate-400">{p.pay_date}</td>
                <td className="px-6 py-4 text-sm font-black text-white text-right">{formatCurrency(p.gross_pay)}</td>
                <td className="px-6 py-4 text-sm font-black text-emerald-400 text-right">{formatCurrency(p.net_pay)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {onViewPaystub && (
                      <button
                        onClick={() => onViewPaystub(p.id!)}
                        className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                        title={t('payroll.review.viewPaystub')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {p.status !== 'voided' && (
                      <button
                        onClick={() => handleVoid(p.id!)}
                        className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title={t('payroll.review.voidPayroll')}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
                  {t('payroll.review.noPayrollsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollReview;
