import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Loader2, Info, FileText, ChevronRight, User, Calendar, CheckCircle2, Activity } from 'lucide-react';
import { ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService, AccountingPeriod } from '../../../services/accounting/AccountingPeriodService';
import ClosureReport, { ClosureReportData } from '../ClosureReport';
import { generateClosureReportPDF } from '../../../utils/pdfGenerator';

interface ConfirmationStepProps {
  periodId: number;
  period: AccountingPeriod;
  validationResults: ValidationResult[];
  onComplete: () => void;
}

import { useLocale } from '../../../i18n/useLocale';

export default function ConfirmationStep({
  periodId,
  period,
  validationResults,
  onComplete
}: ConfirmationStepProps) {
  const { t } = useLocale();
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ClosureReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalChecks = validationResults.reduce((sum, result) => sum + result.checks.length, 0);
  const passedChecks = validationResults.reduce((sum, result) => sum + result.checks.filter(c => c.status === 'passed').length, 0);
  const warningChecks = validationResults.reduce((sum, result) => sum + result.checks.filter(c => c.status === 'warning').length, 0);
  const errorChecks = validationResults.reduce((sum, result) => sum + result.checks.filter(c => c.status === 'error').length, 0);

  const hasErrors = errorChecks > 0;
  const canClose = !hasErrors && confirmed;

  const handleClosePeriod = async () => {
    if (!canClose) return;
    setIsClosing(true);
    setError(null);

    try {
      const summary = accountingPeriodService.getPeriodSummary(periodId);
      if (!summary) throw new Error(t('accounting.periods.errorLoading'));

      const result = accountingPeriodService.closePeriod(periodId, 1, notes || undefined);
      if (!result.success) throw new Error(result.message);

      const reportData: ClosureReportData = {
        period: { ...period, status: 'closed', closed_at: new Date().toISOString(), notes: notes || period.notes },
        validationResults,
        summary: {
          totalTransactions: summary.totalTransactions,
          totalRevenue: summary.totalRevenue,
          totalExpenses: summary.totalExpenses,
          netIncome: summary.netIncome,
          totalDebit: 0,
          totalCredit: 0
        },
        closedBy: 'Administrador del Sistema',
        closedAt: new Date().toISOString()
      };

      setReportData(reportData);
      setShowReport(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorUnknown'));
      setIsClosing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (reportData) generateClosureReportPDF(reportData);
  };

  const handleCloseReport = () => {
    setShowReport(false);
    onComplete();
  };

  if (showReport && reportData) {
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
        <ClosureReport
          data={reportData}
          onDownloadPDF={handleDownloadPDF}
          onClose={handleCloseReport}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-emerald-600/10 border-l-4 border-emerald-500 rounded-xl p-5 flex items-start gap-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-emerald-200/80 leading-relaxed">
          <span className="text-white font-bold tracking-tight mr-2">{t('accounting.closure.steps.confirmation.phaseTitle')}:</span>
          {t('accounting.closure.steps.confirmation.phaseDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Period Info Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition-all">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            {t('accounting.closure.steps.confirmation.metaInfo')}
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('accounting.closure.steps.confirmation.periodName')}</p>
              <p className="text-sm font-bold text-white">{period.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('accounting.closure.steps.confirmation.execution')}</p>
              <p className="text-sm font-bold text-white capitalize">{period.period_type}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('accounting.closure.steps.confirmation.start')}</p>
              <p className="text-sm font-bold text-slate-400">{new Date(period.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('accounting.closure.steps.confirmation.end')}</p>
              <p className="text-sm font-bold text-slate-400">{new Date(period.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Validation Stats Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            {t('accounting.closure.steps.confirmation.auditPerformance')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passed</p>
              <p className="text-xl font-bold text-emerald-400">{passedChecks}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-white">{totalChecks}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Advertencia</p>
              <p className="text-xl font-bold text-orange-400">{warningChecks}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Error</p>
              <p className="text-xl font-bold text-red-500">{errorChecks}</p>
            </div>
          </div>
        </div>
      </div>

      {hasErrors && (
        <div className="bg-red-900/10 border-2 border-red-500/30 p-6 rounded-2xl flex items-center gap-4 animate-pulse">
          <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{t('accounting.closure.steps.confirmation.securityLock')}</p>
            <p className="text-sm font-bold text-red-200/80">
              {t('accounting.closure.steps.confirmation.lockMsg', { count: errorChecks })}
            </p>
          </div>
        </div>
      )}

      {/* Manual Notes Area */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          {t('accounting.closure.steps.confirmation.notesLabel')}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('accounting.closure.steps.confirmation.notesPlaceholder')}
          className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700 resize-none"
          rows={4}
          disabled={isClosing}
        />
      </div>

      {/* Confirmation Checkbox */}
      {!hasErrors && (
        <label className="flex items-start gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl cursor-pointer group hover:bg-slate-900 transition-all">
          <div className="relative flex items-center justify-center mt-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={isClosing}
              className="peer appearance-none w-6 h-6 border-2 border-slate-800 rounded-lg checked:bg-blue-600 checked:border-blue-500 transition-all cursor-pointer"
            />
            <CheckCircle2 className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">{t('accounting.closure.steps.confirmation.certify')}</p>
            <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
              {t('accounting.closure.steps.confirmation.certifyDesc')}
            </p>
          </div>
        </label>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-center pt-4">
        <button
          onClick={handleClosePeriod}
          disabled={!canClose || isClosing}
          className={`group relative flex items-center justify-center gap-3 px-12 py-4 rounded-2xl font-bold uppercase text-sm tracking-widest transition-all duration-300 shadow-2xl ${canClose && !isClosing
            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40 active:scale-95'
            : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed grayscale'
            }`}
        >
          {isClosing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {t('accounting.closure.steps.confirmation.consolidating')}
            </>
          ) : (
            <>
              <CheckCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              {t('accounting.closure.steps.confirmation.confirmFinal')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
