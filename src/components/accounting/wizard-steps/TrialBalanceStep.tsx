import React, { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Download, Table, Lightbulb, Info, CheckCircle2 } from 'lucide-react';

interface TrialBalanceStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

import { useLocale } from '../../../i18n/useLocale';

export default function TrialBalanceStep({
  periodId,
  onValidationComplete
}: TrialBalanceStepProps) {
  const { t } = useLocale();
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'trial-balance-generated',
      label: t('accounting.closure.steps.trialBalance.checks.generated'),
      status: 'pending',
      message: undefined
    },
    {
      id: 'debits-equal-credits',
      label: t('accounting.closure.steps.trialBalance.checks.balanced'),
      status: 'pending',
      message: undefined
    },
    {
      id: 'no-unbalanced-accounts',
      label: t('accounting.closure.steps.trialBalance.checks.noUnbalanced'),
      status: 'pending',
      message: undefined
    },
    {
      id: 'all-accounts-classified',
      label: t('accounting.closure.steps.trialBalance.checks.classified'),
      status: 'pending',
      message: undefined
    }
  ]);

  useEffect(() => {
    const runValidations = async () => {
      const result = accountingPeriodService.validateTrialBalance(periodId);
      setChecks(result.checks);
      if (result.checks.length > 1 && result.checks[1].details) {
        setTrialBalance(result.checks[1].details);
      }
      onValidationComplete({
        stepId: 4,
        status: result.status,
        checks: result.checks,
        timestamp: result.timestamp
      });
    };
    runValidations();
  }, [periodId, onValidationComplete, t]);

  const handleDownloadTrialBalance = () => {
    alert(t('accounting.closure.steps.trialBalance.download') + ' - Beta');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-600/10 border-l-4 border-blue-500 rounded-xl p-5 flex items-start gap-4">
        <Table className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-blue-200/80 leading-relaxed">
          <span className="text-white font-bold tracking-tight mr-2">{t('accounting.closure.steps.trialBalance.phaseTitle')}:</span>
          {t('accounting.closure.steps.trialBalance.phaseDesc')}
        </p>
      </div>

      <ClosureChecklist
        periodId={periodId}
        stepId={4}
        checks={checks}
        autoRun={false}
        onValidationComplete={onValidationComplete}
      />

      {/* Preview del Balance de Comprobación */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('accounting.closure.steps.trialBalance.preview')}</h5>
          </div>
          <button
            onClick={handleDownloadTrialBalance}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            {t('accounting.closure.steps.trialBalance.download')}
          </button>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="text-left py-4 px-6">{t('accounting.closure.steps.trialBalance.mainAccount')}</th>
                  <th className="text-right py-4 px-6">{t('accounting.trialBalance.debits')}</th>
                  <th className="text-right py-4 px-6">{t('accounting.trialBalance.credits')}</th>
                  <th className="text-right py-4 px-6">{t('accounting.closure.steps.trialBalance.netPosition')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {trialBalance ? (
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium italic" colSpan={4}>
                      {t('accounting.closure.steps.trialBalance.successMsg')}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-8 px-6 text-center text-slate-600 font-bold text-xs" colSpan={4}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                        {t('accounting.closure.steps.trialBalance.validating')}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-950/40">
                <tr className="font-bold text-white border-t-2 border-slate-700">
                  <td className="py-5 px-6 uppercase tracking-wider text-[10px] text-slate-500">{t('accounting.closure.steps.trialBalance.periodTotals')}</td>
                  <td className="text-right py-5 px-6 font-mono text-lg">
                    ${trialBalance?.totalDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="text-right py-5 px-6 font-mono text-lg">
                    ${trialBalance?.totalCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className={`text-right py-5 px-6 font-mono text-lg ${Math.abs(trialBalance?.difference || 0) < 0.01 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    ${trialBalance?.difference?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">{t('accounting.closure.steps.trialBalance.controlPoints')}</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t<string[]>('accounting.closure.steps.trialBalance.tips').map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
