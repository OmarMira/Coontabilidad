import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, DollarSign, User, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { getPayroll, getEmployeeById } from '@/database/simple-db';
import type { Payroll, Employee } from '@/database/simple-db';
import { useLocale } from '@/i18n/useLocale';

interface EmployeePaystubProps {
  payrollId?: number;
  onBack?: () => void;
}

export const EmployeePaystub: React.FC<EmployeePaystubProps> = ({ payrollId, onBack }) => {
  const { t } = useLocale();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaystub();
  }, [payrollId]);

  const loadPaystub = () => {
    if (!payrollId) return;

    try {
      setLoading(true);
      const payrollData = getPayroll(payrollId);
      if (payrollData) {
        setPayroll(payrollData);
        const empData = getEmployeeById(payrollData.employee_id);
        setEmployee(empData);
      }
    } catch (error) {
      console.error('Error loading paystub:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Download paystub as PDF');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!payroll || !employee) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-400" />
          <p className="text-red-400 font-black">{t('payroll.paystub.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white font-black transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t('payroll.paystub.backToReview')}
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-lg transition-all border border-slate-700 active:scale-95"
          >
            <Printer className="w-5 h-5" />
            {t('payroll.paystub.print')}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Download className="w-5 h-5" />
            {t('payroll.paystub.downloadPDF')}
          </button>
        </div>
      </div>

      {/* Paystub Document */}
      <div className="bg-slate-900/50 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 print:bg-white print:text-black print:rounded-none print:shadow-none print:border-none">
        {/* Company Header */}
        <div className="bg-slate-950/50 p-8 border-b border-slate-800 print:bg-white print:border-gray-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase print:text-black">{t('payroll.paystub.payStubTitle')}</h1>
              <div className="flex items-center gap-2 text-slate-400 font-black text-sm print:text-slate-700">
                <Calendar className="w-4 h-4" />
                {t('payroll.paystub.period')}: {formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-600">{t('payroll.paystub.payDateLabel')}</p>
              <p className="text-xl font-black text-white print:text-black">{formatDate(payroll.pay_date)}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest print:hidden">
                <CheckCircle2 className="w-3 h-3" />
                {t('payroll.paystub.processed')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Employee & Pay Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-950/30 p-6 rounded-xl border border-slate-800/50 print:bg-gray-50 print:border-gray-200">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 print:text-slate-600">
                <User className="w-4 h-4 text-blue-500" />
                {t('payroll.paystub.employeeInfo')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest print:text-slate-500">{t('payroll.paystub.name')}</p>
                  <p className="text-sm font-black text-white print:text-black">{employee.first_name} {employee.last_name}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest print:text-slate-500">{t('payroll.paystub.employeeId')}</p>
                  <p className="text-sm font-black text-white print:text-black">#{employee.id}</p>
                </div>
                {employee.ssn && (
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest print:text-slate-500">SSN</p>
                    <p className="text-sm font-black text-white print:text-black">***-**-{employee.ssn.slice(-4)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest print:text-slate-500">{t('payroll.paystub.department')}</p>
                  <p className="text-sm font-black text-white print:text-black">{employee.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/30 p-6 rounded-xl border border-slate-800/50 print:bg-gray-50 print:border-gray-200">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 print:text-slate-600">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                {t('payroll.paystub.salaryDetails')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest print:text-slate-500">{t('payroll.paystub.payType')}</p>
                  <p className="text-sm font-black text-white capitalize print:text-black">{employee.pay_type === 'salaried' ? t('payroll.paystub.fixedSalary') : t('payroll.paystub.hourlyPay')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest print:text-slate-500">{t('payroll.paystub.payRate')}</p>
                  <p className="text-sm font-black text-white print:text-black">
                    {employee.pay_type === 'hourly'
                      ? `${formatCurrency(employee.hourly_rate || 0)}${t('payroll.paystub.perHour')}`
                      : `${formatCurrency(employee.salary || 0)}${t('payroll.paystub.perYear')}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Earnings Table */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('payroll.paystub.earnings')}</h2>
              <div className="bg-slate-950/40 rounded-xl overflow-hidden border border-slate-800/50">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/60 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase">{t('payroll.paystub.concept')}</th>
                      <th className="px-4 py-2 text-right text-[9px] font-black text-slate-500 uppercase">{t('payroll.paystub.amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr className="text-sm">
                      <td className="px-4 py-3 text-slate-400 font-black">{t('payroll.paystub.regularPay')} ({payroll.regular_hours}h @ {formatCurrency(payroll.hourly_rate || 0)})</td>
                      <td className="px-4 py-3 text-right font-black text-white">{formatCurrency(payroll.regular_pay)}</td>
                    </tr>
                    {payroll.overtime_hours > 0 && (
                      <tr className="text-sm bg-blue-500/5">
                        <td className="px-4 py-3 text-blue-400 font-black">{t('payroll.paystub.overtime')} ({payroll.overtime_hours}h @ {formatCurrency((payroll.hourly_rate || 0) * 1.5)})</td>
                        <td className="px-4 py-3 text-right font-black text-blue-400">{formatCurrency(payroll.overtime_pay)}</td>
                      </tr>
                    )}
                    {(payroll.bonuses || 0) > 0 && (
                      <tr className="text-sm">
                        <td className="px-4 py-3 text-slate-400 font-black">{t('payroll.paystub.bonuses')}</td>
                        <td className="px-4 py-3 text-right font-black text-white">{formatCurrency(payroll.bonuses || 0)}</td>
                      </tr>
                    )}
                    {(payroll.commissions || 0) > 0 && (
                      <tr className="text-sm">
                        <td className="px-4 py-3 text-slate-400 font-black">{t('payroll.paystub.commissions')}</td>
                        <td className="px-4 py-3 text-right font-black text-white">{formatCurrency(payroll.commissions || 0)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-950 border-t border-slate-800">
                    <tr className="text-sm">
                      <td className="px-4 py-3 font-black text-white uppercase tracking-wider">{t('payroll.paystub.totalGross')}</td>
                      <td className="px-4 py-3 text-right font-black text-white underline decoration-blue-500 decoration-2 underline-offset-4">{formatCurrency(payroll.gross_pay)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Deductions Table */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('payroll.paystub.deductionsTitle')}</h2>
              <div className="bg-slate-950/40 rounded-xl overflow-hidden border border-slate-800/50">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/60 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase">{t('payroll.paystub.concept')}</th>
                      <th className="px-4 py-2 text-right text-[9px] font-black text-slate-500 uppercase">{t('payroll.paystub.amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr className="text-sm text-red-400/80">
                      <td className="px-4 py-3 font-black">{t('payroll.paystub.federalIncomeTax')}</td>
                      <td className="px-4 py-3 text-right font-black">-{formatCurrency(payroll.federal_income_tax)}</td>
                    </tr>
                    <tr className="text-sm text-red-400/80">
                      <td className="px-4 py-3 font-black">{t('payroll.paystub.socialSecurityFICA')}</td>
                      <td className="px-4 py-3 text-right font-black">-{formatCurrency(payroll.social_security_tax)}</td>
                    </tr>
                    <tr className="text-sm text-red-400/80">
                      <td className="px-4 py-3 font-black">{t('payroll.paystub.medicareLabel')}</td>
                      <td className="px-4 py-3 text-right font-black">-{formatCurrency(payroll.medicare_tax)}</td>
                    </tr>
                    {(payroll.medicare_additional_tax || 0) > 0 && (
                      <tr className="text-sm text-red-400/80">
                        <td className="px-4 py-3 font-black">{t('payroll.paystub.additionalMedicare')}</td>
                        <td className="px-4 py-3 text-right font-black">-{formatCurrency(payroll.medicare_additional_tax || 0)}</td>
                      </tr>
                    )}
                    {(payroll.other_deductions || 0) > 0 && (
                      <tr className="text-sm text-red-400/80">
                        <td className="px-4 py-3 font-black">{t('payroll.paystub.otherDeductionsLabel')}</td>
                        <td className="px-4 py-3 text-right font-black">-{formatCurrency(payroll.other_deductions || 0)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-950 border-t border-slate-800">
                    <tr className="text-sm">
                      <td className="px-4 py-3 font-black text-white uppercase tracking-wider">{t('payroll.paystub.totalDeductions')}</td>
                      <td className="px-4 py-3 text-right font-black text-red-400 decoration-red-500 decoration-2 underline-offset-4">-{formatCurrency(payroll.total_deductions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Summary Totals */}
          <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-8 relative overflow-hidden group print:bg-gray-100 print:border-gray-300 print:border-dashed">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-all">
              <DollarSign className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('payroll.paystub.totalToReceive')}</p>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase print:text-black">{t('payroll.paystub.netToPay')}</h3>
              </div>
              <div className="text-center md:text-right">
                <span className="text-4xl md:text-5xl font-black text-emerald-400 tabular-nums print:text-black">{formatCurrency(payroll.net_pay)}</span>
                <p className="text-xs text-emerald-500/60 font-black mt-1">{t('payroll.paystub.directDepositsProcessed')}</p>
              </div>
            </div>
          </div>

          {/* YTD Section */}
          <div className="border-t border-slate-800 pt-8 print:border-gray-200">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 print:text-slate-600">{t('payroll.paystub.yearlyResume')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 print:bg-gray-50 print:border-gray-200">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('payroll.paystub.grossYTD')}</p>
                <p className="text-base font-black text-white print:text-black">{formatCurrency(employee.ytd_gross_pay || 0)}</p>
              </div>
              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 print:bg-gray-50 print:border-gray-200">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('payroll.paystub.fedTaxYTD')}</p>
                <p className="text-base font-black text-red-400 print:text-black">{formatCurrency(employee.ytd_federal_tax || 0)}</p>
              </div>
              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 print:bg-gray-50 print:border-gray-200">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('payroll.paystub.ficaYTD')}</p>
                <p className="text-base font-black text-red-400 print:text-black">{formatCurrency(employee.ytd_fica || 0)}</p>
              </div>
              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 print:bg-gray-50 print:border-gray-200">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('payroll.paystub.medicareYTD')}</p>
                <p className="text-base font-black text-red-400 print:text-black">{formatCurrency(employee.ytd_medicare || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/50 p-6 border-t border-slate-800 text-center print:bg-white print:border-gray-200">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {t('payroll.paystub.computerGenerated')}
          </p>
          <p className="text-[9px] text-slate-600 font-black mt-1 uppercase tracking-wider">
            {t('payroll.paystub.contactPayroll')}
          </p>
        </div>
      </div>
    </div>
  );
};
