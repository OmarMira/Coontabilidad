/**
 * PayrollReports.tsx
 * 
 * UI for generating IRS payroll reports:
 * - Form 941 (Quarterly Federal Tax Return)
 * - Form W-2 (Wage and Tax Statement)
 * - Form W-3 (Transmittal of Wage and Tax Statements)
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Shield,
  Zap,
  TrendingUp,
  Activity,
  Search,
  History
} from 'lucide-react';
import { payrollReportGenerator, Form941Data, W2Data, W3Data } from '../../services/payroll/PayrollReportGenerator';
import { getEmployees, Employee } from '@/database/simple-db';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { useLocale } from '@/i18n/useLocale';

interface CompanyData {
  name: string;
  ein: string;
  address: string;
}

export const PayrollReports: React.FC = () => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'form941' | 'w2' | 'w3'>('form941');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form 941 state
  const [quarter, setQuarter] = useState(1);
  const [year941, setYear941] = useState(new Date().getFullYear());
  const [form941Data, setForm941Data] = useState<Form941Data | null>(null);

  // W-2 state
  const [yearW2, setYearW2] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [w2Data, setW2Data] = useState<W2Data | null>(null);

  // W-3 state
  const [yearW3, setYearW3] = useState(new Date().getFullYear());
  const [w3Data, setW3Data] = useState<W3Data | null>(null);

  // Company data
  const companyData: CompanyData = {
    name: 'AccountExpress Industrial',
    ein: '99-8887776',
    address: '123 Enterprise Way, Miami, FL 33101'
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    try {
      const allEmployees = getEmployees();
      setEmployees(allEmployees);
    } catch (err) {
      console.error('Error loading employees:', err);
      showError(t('payroll.reports.errorLoadingEmployees'));
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ==========================================
  // HANDLERS (Preserved Business Logic)
  // ==========================================

  const handleGenerateForm941 = () => {
    try {
      setLoading(true);
      setError(null);
      const data = payrollReportGenerator.generateForm941(quarter, year941, companyData);
      setForm941Data(data);
      showSuccess(t('payroll.reports.form941Generated'));
    } catch (err) {
      showError(t('payroll.reports.errorGenerating941'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForm941PDF = () => {
    if (!form941Data) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(t('payroll.reports.pdfForm941Title'), 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(t('payroll.reports.pdfForm941Subtitle'), 105, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`${t('payroll.reports.pdfEmployer')}: ${form941Data.employerName}`, 20, 45);
      doc.text(`${t('payroll.reports.pdfEIN')}: ${form941Data.ein}`, 20, 52);
      doc.text(`${t('payroll.reports.pdfAddress')}: ${form941Data.address}`, 20, 59);
      doc.text(`${t('payroll.reports.pdfQuarter')}: Q${form941Data.quarter} ${form941Data.year}`, 20, 66);

      const tableData = [
        [t('payroll.reports.pdfNumberOfEmployees'), form941Data.numberOfEmployees.toString()],
        [t('payroll.reports.pdfTotalWages'), payrollReportGenerator.formatCurrency(form941Data.totalWages)],
        [t('payroll.reports.pdfFederalIncomeTax'), payrollReportGenerator.formatCurrency(form941Data.federalIncomeTax)],
        [t('payroll.reports.pdfSocialSecurityWages'), payrollReportGenerator.formatCurrency(form941Data.socialSecurityWages)],
        [t('payroll.reports.pdfSocialSecurityTax'), payrollReportGenerator.formatCurrency(form941Data.socialSecurityTax)],
        [t('payroll.reports.pdfMedicareWages'), payrollReportGenerator.formatCurrency(form941Data.medicareWages)],
        [t('payroll.reports.pdfMedicareTax'), payrollReportGenerator.formatCurrency(form941Data.medicareTax)],
        [t('payroll.reports.pdfAdditionalMedicareTax'), payrollReportGenerator.formatCurrency(form941Data.additionalMedicareTax)],
        [t('payroll.reports.pdfTotalTaxes'), payrollReportGenerator.formatCurrency(form941Data.totalTaxes)],
        [t('payroll.reports.pdfBalanceDue'), payrollReportGenerator.formatCurrency(form941Data.balanceDue)]
      ];

      (doc as any).autoTable({
        startY: 75,
        head: [[t('payroll.reports.pdfDescriptionCol'), t('payroll.reports.pdfAmountCol')]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`Form_941_Q${form941Data.quarter}_${form941Data.year}.pdf`);
      showSuccess(t('payroll.reports.pdfExported'));
    } catch (err) {
      showError(t('payroll.reports.errorExportingPDF'));
    }
  };

  const handleGenerateW2 = () => {
    if (!selectedEmployeeId) {
      showError(t('payroll.reports.selectEmployeeForProtocol'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = payrollReportGenerator.generateW2(selectedEmployeeId, yearW2, companyData);
      if (!data) {
        showError(t('payroll.reports.noDataForPeriod'));
        return;
      }
      setW2Data(data);
      showSuccess(t('payroll.reports.w2Consolidated'));
    } catch (err) {
      showError(t('payroll.reports.errorGeneratingW2'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadW2PDF = () => {
    if (!w2Data) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(t('payroll.reports.pdfW2Title'), 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(t('payroll.reports.pdfW2Subtitle'), 105, 28, { align: 'center' });
      doc.text(`${t('payroll.reports.pdfFiscalYear')} ${w2Data.year}`, 105, 35, { align: 'center' });
      doc.setFontSize(10);
      doc.text(t('payroll.reports.pdfEmployerInfo'), 20, 50);
      doc.text(`${t('payroll.reports.pdfName')}: ${w2Data.employerName}`, 25, 57);
      doc.text(`${t('payroll.reports.pdfEIN')}: ${w2Data.employerEIN}`, 25, 64);
      doc.text(`${t('payroll.reports.pdfAddress')}: ${w2Data.employerAddress}`, 25, 71);
      doc.text(t('payroll.reports.pdfEmployeeInfo'), 20, 85);
      doc.text(`${t('payroll.reports.pdfName')}: ${w2Data.employeeName}`, 25, 92);
      doc.text(`${t('payroll.reports.pdfSSN')}: ${w2Data.employeeSSN}`, 25, 99);
      doc.text(`${t('payroll.reports.pdfAddress')}: ${w2Data.employeeAddress}`, 25, 106);

      const w2Boxes = [
        [t('payroll.reports.pdfBox1'), payrollReportGenerator.formatCurrency(w2Data.wages)],
        [t('payroll.reports.pdfBox2'), payrollReportGenerator.formatCurrency(w2Data.federalIncomeTax)],
        [t('payroll.reports.pdfBox3'), payrollReportGenerator.formatCurrency(w2Data.socialSecurityWages)],
        [t('payroll.reports.pdfBox4'), payrollReportGenerator.formatCurrency(w2Data.socialSecurityTax)],
        [t('payroll.reports.pdfBox5'), payrollReportGenerator.formatCurrency(w2Data.medicareWages)],
        [t('payroll.reports.pdfBox6'), payrollReportGenerator.formatCurrency(w2Data.medicareTax)]
      ];

      (doc as any).autoTable({
        startY: 120,
        head: [[t('payroll.reports.pdfBoxCol'), t('payroll.reports.pdfAmountCol')]],
        body: w2Boxes,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`W2_${w2Data.year}_${w2Data.employeeName.replace(/\s+/g, '_')}.pdf`);
      showSuccess(t('payroll.reports.pdfExported'));
    } catch (err) {
      showError(t('payroll.reports.errorExportingPDF'));
    }
  };

  const handleGenerateW3 = () => {
    try {
      setLoading(true);
      setError(null);
      const data = payrollReportGenerator.generateW3(yearW3, companyData);
      setW3Data(data);
      showSuccess(t('payroll.reports.w3Consolidated'));
    } catch (err) {
      showError(t('payroll.reports.errorGeneratingW3'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadW3PDF = () => {
    if (!w3Data) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(t('payroll.reports.pdfW3Title'), 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(t('payroll.reports.pdfW3Subtitle'), 105, 28, { align: 'center' });
      doc.text(`${t('payroll.reports.pdfFiscalYear')} ${w3Data.year}`, 105, 35, { align: 'center' });
      doc.setFontSize(10);
      doc.text(t('payroll.reports.pdfEmployerInfo'), 20, 50);
      doc.text(`${t('payroll.reports.pdfName')}: ${w3Data.employerName}`, 25, 57);
      doc.text(`${t('payroll.reports.pdfEIN')}: ${w3Data.employerEIN}`, 25, 64);
      doc.text(`${t('payroll.reports.pdfAddress')}: ${w3Data.employerAddress}`, 25, 71);

      const summaryData = [
        [t('payroll.reports.pdfNumberW2Forms'), w3Data.numberOfW2Forms.toString()],
        [t('payroll.reports.pdfTotalWages'), payrollReportGenerator.formatCurrency(w3Data.totalWages)],
        [t('payroll.reports.pdfTotalFederalIncome'), payrollReportGenerator.formatCurrency(w3Data.totalFederalIncomeTax)],
        [t('payroll.reports.pdfTotalSSWages'), payrollReportGenerator.formatCurrency(w3Data.totalSocialSecurityWages)],
        [t('payroll.reports.pdfTotalSSTax'), payrollReportGenerator.formatCurrency(w3Data.totalSocialSecurityTax)],
        [t('payroll.reports.pdfTotalMedicareWages'), payrollReportGenerator.formatCurrency(w3Data.totalMedicareWages)],
        [t('payroll.reports.pdfTotalMedicareTax'), payrollReportGenerator.formatCurrency(w3Data.totalMedicareTax)]
      ];

      (doc as any).autoTable({
        startY: 85,
        head: [[t('payroll.reports.pdfDescriptionCol'), t('payroll.reports.pdfAmountCol')]],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`W3_${w3Data.year}.pdf`);
      showSuccess(t('payroll.reports.pdfExported'));
    } catch (err) {
      showError(t('payroll.reports.errorExportingPDF'));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 px-4 overflow-x-hidden">
      {/* Header Hub */}

      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
            <FileText className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {t('payrollReports.title')}
            </h2>
            <p className="text-slate-500 text-[13px] flex items-center gap-2 mt-1">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('payrollReports.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2.2xl border border-slate-800 shadow-xl overflow-hidden">
        <TabButton
          active={activeTab === 'form941'}
          onClick={() => setActiveTab('form941')}
          label={t('payroll.form941')}
          icon={Calendar}
        />
        <TabButton
          active={activeTab === 'w2'}
          onClick={() => setActiveTab('w2')}
          label={t('payroll.formW2')}
          icon={Users}
        />
        <TabButton
          active={activeTab === 'w3'}
          onClick={() => setActiveTab('w3')}
          label={t('payroll.formW3')}
          icon={DollarSign}
        />
      </div>

      {/* State Indicators */}
      <div className="space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{success}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group min-h-[400px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                {activeTab === 'form941' ? t('payroll.reports.form941Title') :
                  activeTab === 'w2' ? t('payroll.reports.w2Title') :
                    t('payroll.reports.w3Title')}
              </h3>
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{t('payroll.reports.activeConsolidation')}</span>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {activeTab === 'form941' && (
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group">
                    <div className="p-4 bg-emerald-600/10 rounded-2.2xl border border-emerald-500/20 shadow-xl group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> {t('payroll.reports.protocol941')}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">
                        {t('payroll.reports.protocol941Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <PremiumInputMini
                      label={t('payroll.reports.quarterSelection')}
                      type="select"
                      value={quarter}
                      onChange={(v: string) => setQuarter(Number(v))}
                      options={[
                        { label: t('payroll.reports.q1'), value: 1 },
                        { label: t('payroll.reports.q2'), value: 2 },
                        { label: t('payroll.reports.q3'), value: 3 },
                        { label: t('payroll.reports.q4'), value: 4 },
                      ]}
                      icon={Calendar}
                    />

                    <PremiumInputMini
                      label={t('payroll.reports.annualCycle')}
                      type="number"
                      value={year941}
                      onChange={(v: string) => setYear941(Number(v))}
                      icon={History}
                    />
                  </div>

                  <button
                    onClick={handleGenerateForm941}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl shadow-emerald-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                        <Zap className="w-5 h-5 fill-white" />
                        <span>{t('payroll.reports.execute941')}</span>
                      </div>
                    )}
                  </button>

                  {form941Data && (
                    <div className="bg-slate-950/50 rounded-[3rem] border border-slate-800 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">{t('payroll.reports.protocolSummary')}</h3>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">{t('payroll.reports.validated')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{t('payroll.reports.taxEntity')}</p>
                          <p className="text-sm font-black text-white uppercase truncate">{form941Data.employerName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{t('payroll.reports.einKey')}</p>
                          <p className="text-sm font-black text-white font-mono">{form941Data.ein}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-10">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-800/40 font-mono">
                            <PreviewRow label={t('payroll.reports.totalWages')} value={payrollReportGenerator.formatCurrency(form941Data.totalWages)} />
                            <PreviewRow label={t('payroll.reports.fedIncomeTax')} value={payrollReportGenerator.formatCurrency(form941Data.federalIncomeTax)} />
                            <PreviewRow label={t('payroll.reports.socialSecTax')} value={payrollReportGenerator.formatCurrency(form941Data.socialSecurityTax)} />
                            <PreviewRow label={t('payroll.reports.medicareTax')} value={payrollReportGenerator.formatCurrency(form941Data.medicareTax)} />
                            <PreviewRow
                              label={t('payroll.reports.consolidatedTotal')}
                              value={payrollReportGenerator.formatCurrency(form941Data.totalTaxes)}
                              isHighlighted
                            />
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => toast.error(
                          'Para generar formularios oficiales W-2, W-3 y 941, ' +
                          'exporte los datos a CSV y consulte con su contador.'
                        )}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-500 hover:text-white hover:bg-emerald-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                      >
                        <Download className="w-4 h-4" />
                        {t('payroll.reports.exportForensicPDF')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'w2' && (
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group">
                    <div className="p-4 bg-blue-600/10 rounded-2.2xl border border-blue-500/20 shadow-xl group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-blue-500 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> {t('payroll.reports.protocolW2')}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">
                        {t('payroll.reports.protocolW2Desc')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <PremiumInputMini
                      label={t('payroll.reports.selectEmployee')}
                      type="select"
                      value={selectedEmployeeId || ''}
                      onChange={(v: string) => setSelectedEmployeeId(Number(v))}
                      options={[
                        { label: t('payroll.reports.chooseProtocol'), value: '' },
                        ...employees.map(emp => ({
                          label: `${emp.first_name} ${emp.last_name}`,
                          value: emp.id
                        }))
                      ]}
                      icon={Users}
                    />

                    <PremiumInputMini
                      label={t('payroll.reports.fiscalCycle')}
                      type="number"
                      value={yearW2}
                      onChange={(v: string) => setYearW2(Number(v))}
                      icon={History}
                    />
                  </div>

                  <button
                    onClick={handleGenerateW2}
                    disabled={loading || !selectedEmployeeId}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl shadow-blue-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                        <Zap className="w-5 h-5 fill-white" />
                        <span>{t('payroll.reports.generateW2')}</span>
                      </div>
                    )}
                  </button>

                  {w2Data && (
                    <div className="bg-slate-950/50 rounded-[3rem] border border-slate-800 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 shadow-inner">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">{t('payroll.reports.reportSubject')}</p>
                          <p className="text-lg font-black text-white uppercase tracking-tight">{w2Data.employeeName}</p>
                          <p className="text-xs font-black text-blue-500 font-mono mt-2 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> SSN: {w2Data.employeeSSN}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-10">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-800/40 font-mono">
                            <PreviewRow label={t('payroll.reports.box1Wages')} value={payrollReportGenerator.formatCurrency(w2Data.wages)} />
                            <PreviewRow label={t('payroll.reports.box2FedTax')} value={payrollReportGenerator.formatCurrency(w2Data.federalIncomeTax)} />
                            <PreviewRow label={t('payroll.reports.box3SSTax')} value={payrollReportGenerator.formatCurrency(w2Data.socialSecurityWages)} />
                            <PreviewRow label={t('payroll.reports.box4SSWages')} value={payrollReportGenerator.formatCurrency(w2Data.socialSecurityTax)} />
                            <PreviewRow label={t('payroll.reports.box5MedicareWages')} value={payrollReportGenerator.formatCurrency(w2Data.medicareWages)} />
                            <PreviewRow label={t('payroll.reports.box6MedicareTax')} value={payrollReportGenerator.formatCurrency(w2Data.medicareTax)} />
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => toast.error(
                          'Para generar formularios oficiales W-2, W-3 y 941, ' +
                          'exporte los datos a CSV y consulte con su contador.'
                        )}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-blue-500 hover:text-white hover:bg-blue-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                      >
                        <Download className="w-4 h-4" />
                        {t('payroll.reports.exportW2PDF')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'w3' && (
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group">
                    <div className="p-4 bg-emerald-600/10 rounded-2.2xl border border-emerald-500/20 shadow-xl group-hover:scale-110 transition-transform">
                      <DollarSign className="w-8 h-8 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> {t('payroll.reports.w3Transmission')}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">
                        {t('payroll.reports.w3Desc')}
                      </p>
                    </div>
                  </div>

                  <PremiumInputMini
                    label={t('payroll.reports.masterFiscalCycle')}
                    type="number"
                    value={yearW3}
                    onChange={(v: string) => setYearW3(Number(v))}
                    icon={History}
                  />

                  <button
                    onClick={handleGenerateW3}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl shadow-emerald-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                        <Zap className="w-5 h-5 fill-white" />
                        <span>{t('payroll.reports.executeW3')}</span>
                      </div>
                    )}
                  </button>

                  {w3Data && (
                    <div className="bg-slate-950/50 rounded-[3rem] border border-slate-800 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{t('payroll.reports.masterEntity')}</p>
                          <p className="text-sm font-black text-white uppercase truncate">{w3Data.employerName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{t('payroll.reports.consolidatedEIN')}</p>
                          <p className="text-sm font-black text-white font-mono">{w3Data.employerEIN}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{t('payroll.reports.fiscalYear')}</p>
                          <p className="text-sm font-black text-white">{w3Data.year}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{t('payroll.reports.totalW2sTransmitted')}</p>
                          <p className="text-sm font-black text-white uppercase">{w3Data.numberOfW2Forms} {t('payroll.reports.files')}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-10">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-800/40 font-mono">
                            <PreviewRow label={t('payroll.reports.totalAggregatedWages')} value={payrollReportGenerator.formatCurrency(w3Data.totalWages)} />
                            <PreviewRow label={t('payroll.reports.aggregatedFedTax')} value={payrollReportGenerator.formatCurrency(w3Data.totalFederalIncomeTax)} />
                            <PreviewRow label={t('payroll.reports.aggregatedSSTax')} value={payrollReportGenerator.formatCurrency(w3Data.totalSocialSecurityTax)} />
                            <PreviewRow label={t('payroll.reports.aggregatedMedicareTax')} value={payrollReportGenerator.formatCurrency(w3Data.totalMedicareTax)} />
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => toast.error(
                          'Para generar formularios oficiales W-2, W-3 y 941, ' +
                          'exporte los datos a CSV y consulte con su contador.'
                        )}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-500 hover:text-white hover:bg-emerald-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                      >
                        <Download className="w-4 h-4" />
                        {t('payroll.reports.exportTransmissionPDF')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-10 lg:sticky lg:top-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" /> {t('payroll.reports.complianceMonitor')}
            </h3>

            <div className="space-y-6">
              <SupportCard title={t('payroll.reports.federalStatus')} content={t('payroll.reports.federalStatusDesc')} icon={Shield} color="text-emerald-500" />
              <SupportCard title={t('payroll.reports.forensicVerification')} content={t('payroll.reports.forensicVerificationDesc')} icon={Zap} color="text-blue-500" />
            </div>
          </div>

          <div className="bg-emerald-600 border border-emerald-500 rounded-[3rem] p-10 shadow-2xl shadow-emerald-950/40 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700"></div>
            <Activity className="w-12 h-12 text-white mb-6 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{t('payroll.reports.industrialVault')}</h3>
            <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {t('payroll.reports.industrialVaultDesc')}
            </p>
          </div>
        </div>
      </div>
    </div >
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-emerald-100' : 'text-slate-600'}`} />
    {label}
  </button>
);

const PremiumInputMini = ({ label, value, onChange, icon: Icon, type = "text", options }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
      <Icon className="w-3.5 h-3.5 text-emerald-500" /> {label}
    </label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all cursor-pointer"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-slate-950">{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all"
      />
    )}
  </div>
);

const PreviewRow = ({ label, value, isHighlighted }: any) => (
  <tr className={`${isHighlighted ? 'bg-emerald-500/10' : ''} transition-colors`}>
    <td className="py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</td>
    <td className={`py-5 text-base font-black text-right ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{value}</td>
  </tr>
);

const SupportCard = ({ title, content, icon: Icon, color }: any) => (
  <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 shadow-inner group/card hover:border-slate-700 transition-colors">
    <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${color}`}>
      <Icon className="w-4 h-4" /> {title}
    </h4>
    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
      {content}
    </p>
  </div>
);

export default PayrollReports;
