import React, { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Info, Lightbulb, Settings2, ArrowRight } from 'lucide-react';

interface AdjustmentsStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

import { useLocale } from '../../../i18n/useLocale';

export default function AdjustmentsStep({
  periodId,
  onValidationComplete
}: AdjustmentsStepProps) {
  const { t } = useLocale();
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'depreciation-calculated',
      label: t('accounting.closure.steps.adjustments.checks.depreciation'),
      status: 'pending',
      message: undefined,
      action: {
        label: t('accounting.closure.steps.adjustments.checks.calcDepreciation'),
        onClick: () => window.location.href = '/assets/fixed-assets'
      }
    },
    {
      id: 'adjustment-entries-recorded',
      label: t('accounting.closure.steps.adjustments.checks.entriesRecorded'),
      status: 'pending',
      message: undefined,
      action: {
        label: t('accounting.closure.steps.adjustments.checks.createEntry'),
        onClick: () => window.location.href = '/accounting/journal-entries'
      }
    },
    {
      id: 'accruals-recorded',
      label: t('accounting.closure.steps.adjustments.checks.accruals'),
      status: 'pending',
      message: undefined
    },
    {
      id: 'inventory-reconciled',
      label: t('accounting.closure.steps.adjustments.checks.inventory'),
      status: 'pending',
      message: undefined,
      action: {
        label: t('accounting.closure.steps.adjustments.checks.goToInventory'),
        onClick: () => window.location.href = '/inventory'
      }
    }
  ]);

  useEffect(() => {
    const runValidations = async () => {
      const result = accountingPeriodService.validateAdjustments(periodId);

      const updatedChecks = result.checks.map(check => {
        const originalCheck = checks.find(c => c.id === check.id);
        return {
          ...check,
          action: originalCheck?.action
        };
      });

      setChecks(updatedChecks);

      onValidationComplete({
        stepId: 3,
        status: result.status,
        checks: updatedChecks,
        timestamp: result.timestamp
      });
    };

    runValidations();
  }, [periodId, onValidationComplete, t]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-purple-600/10 border-l-4 border-purple-500 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-purple-950/20">
        <Settings2 className="w-6 h-6 text-purple-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-purple-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">{t('accounting.closure.steps.adjustments.phaseTitle')}:</span>
          {t('accounting.closure.steps.adjustments.phaseDesc')}
        </p>
      </div>

      <ClosureChecklist
        periodId={periodId}
        stepId={3}
        checks={checks}
        autoRun={false}
        onValidationComplete={onValidationComplete}
      />

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{t('accounting.closure.steps.adjustments.bestPractices')}</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t<string[]>('accounting.closure.steps.adjustments.tips').map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30 group-hover:bg-purple-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
