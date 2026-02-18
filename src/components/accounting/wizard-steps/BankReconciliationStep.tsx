import React, { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Info, Lightbulb, Landmark } from 'lucide-react';

interface BankReconciliationStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

import { useLocale } from '../../../i18n/useLocale';

export default function BankReconciliationStep({
  periodId,
  onValidationComplete
}: BankReconciliationStepProps) {
  const { t } = useLocale();
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'bank-reconciliation-complete',
      label: t('accounting.closure.steps.reconciliation.checks.reconciliationComplete'),
      status: 'pending',
      message: undefined,
      action: {
        label: t('accounting.closure.steps.reconciliation.checks.openPanel'),
        onClick: () => window.location.href = '/banking/reconciliation'
      }
    },
    {
      id: 'no-unmatched-transactions',
      label: t('accounting.closure.steps.reconciliation.checks.noUnmatched'),
      status: 'pending',
      message: undefined
    },
    {
      id: 'bank-balance-matches',
      label: t('accounting.closure.steps.reconciliation.checks.balanceMatches'),
      status: 'pending',
      message: undefined
    }
  ]);

  useEffect(() => {
    const runValidations = async () => {
      const result = accountingPeriodService.validateBankReconciliation(periodId);

      const updatedChecks = result.checks.map(check => ({
        ...check,
        ...check,
        action: check.id === 'bank-reconciliation-complete' ? {
          label: t('accounting.closure.steps.reconciliation.checks.openPanel'),
          onClick: () => window.location.href = '/banking/reconciliation'
        } : undefined
      }));

      setChecks(updatedChecks);

      onValidationComplete({
        stepId: 2,
        status: result.status,
        checks: updatedChecks,
        timestamp: result.timestamp
      });
    };

    runValidations();
  }, [periodId, onValidationComplete, t]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-emerald-600/10 border-l-4 border-emerald-500 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-emerald-950/20">
        <Landmark className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-emerald-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">{t('accounting.closure.steps.reconciliation.phaseTitle')}:</span>
          {t('accounting.closure.steps.reconciliation.phaseDesc')}
        </p>
      </div>

      <ClosureChecklist
        periodId={periodId}
        stepId={2}
        checks={checks}
        autoRun={false}
        onValidationComplete={onValidationComplete}
      />

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{t('accounting.closure.steps.reconciliation.protocolTitle')}</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t<string[]>('accounting.closure.steps.reconciliation.tips').map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
