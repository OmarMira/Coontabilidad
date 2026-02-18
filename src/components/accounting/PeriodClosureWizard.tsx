import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Calendar, Flag, Settings, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { accountingPeriodService } from '../../services/accounting/AccountingPeriodService';
import type { AccountingPeriod } from '../../services/accounting/AccountingPeriodService';
import TransactionValidationStep from './wizard-steps/TransactionValidationStep';
import BankReconciliationStep from './wizard-steps/BankReconciliationStep';
import PayrollValidationStep from './wizard-steps/PayrollValidationStep';
import AdjustmentsStep from './wizard-steps/AdjustmentsStep';
import TrialBalanceStep from './wizard-steps/TrialBalanceStep';
import ConfirmationStep from './wizard-steps/ConfirmationStep';

// ============================================================================
import { useLocale } from '../../i18n/useLocale';

// INTERFACES Y TIPOS
// ============================================================================

interface WizardState {
  currentStep: number;
  totalSteps: number;
  periodId: number;
  validationResults: Map<number, ValidationResult>;
  canProceed: boolean;
  isProcessing: boolean;
}

interface ValidationResult {
  stepId: number;
  status: 'pending' | 'passed' | 'warning' | 'error';
  checks: CheckResult[];
  timestamp: string;
}

interface CheckResult {
  id: string;
  label: string;
  status: 'pending' | 'passed' | 'warning' | 'error';
  message?: string;
  details?: any;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  canSkip: boolean;
}

interface PeriodClosureWizardProps {
  periodId: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// ============================================================================
// DEFINICIÓN DE PASOS
// ============================================================================

//   {
//     id: 6,
//     title: 'Confirmación y Cierre',
//     description: 'Revisar resumen y confirmar el cierre del período',
//     canSkip: false
//   }
// ];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PeriodClosureWizard({
  periodId,
  isOpen,
  onClose,
  onComplete
}: PeriodClosureWizardProps) {
  const { t } = useLocale();

  // ============================================================================
  // DEFINICIÓN DE PASOS (Inside component to use 't')
  // ============================================================================
  const WIZARD_STEPS: WizardStep[] = [
    {
      id: 1,
      title: t('accounting.closure.steps.transactions.title'),
      description: t('accounting.closure.steps.transactions.desc'),
      canSkip: false
    },
    {
      id: 2,
      title: t('accounting.closure.steps.reconciliation.title'),
      description: t('accounting.closure.steps.reconciliation.desc'),
      canSkip: false
    },
    {
      id: 3,
      title: t('accounting.closure.steps.payroll.title'),
      description: t('accounting.closure.steps.payroll.desc'),
      canSkip: false
    },
    {
      id: 4,
      title: t('accounting.closure.steps.adjustments.title'),
      description: t('accounting.closure.steps.adjustments.desc'),
      canSkip: false
    },
    {
      id: 5,
      title: t('accounting.closure.steps.trialBalance.title'),
      description: t('accounting.closure.steps.trialBalance.desc'),
      canSkip: false
    },
    {
      id: 6,
      title: t('accounting.closure.steps.confirmation.title'),
      description: t('accounting.closure.steps.confirmation.desc'),
      canSkip: false
    }
  ];

  // Estado del wizard
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    totalSteps: WIZARD_STEPS.length,
    periodId,
    validationResults: new Map(),
    canProceed: false,
    isProcessing: false
  });

  const [period, setPeriod] = useState<AccountingPeriod | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del período
  useEffect(() => {
    if (isOpen && periodId) {
      loadPeriodData();
    }
  }, [isOpen, periodId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !wizardState.isProcessing) {
        onClose();
      }
      if (e.key === 'ArrowLeft' && wizardState.currentStep > 1 && !wizardState.isProcessing) {
        handlePreviousStep();
      }
      if (e.key === 'ArrowRight' && wizardState.currentStep < wizardState.totalSteps && wizardState.canProceed && !wizardState.isProcessing) {
        handleNextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, wizardState, onClose]);

  const loadPeriodData = () => {
    const periods = accountingPeriodService.getPeriods({ id: periodId });
    if (periods.length > 0) {
      setPeriod(periods[0]);
    } else {
      setError(t('accounting.periods.errorLoading'));
    }
  };

  const handleNextStep = () => {
    if (wizardState.currentStep < wizardState.totalSteps) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        canProceed: false
      }));
    }
  };

  const handlePreviousStep = () => {
    if (wizardState.currentStep > 1) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const handleStepValidation = (result: ValidationResult) => {
    const newResults = new Map(wizardState.validationResults);
    newResults.set(result.stepId, result);

    const canProceed = result.status === 'passed' || result.status === 'warning';

    setWizardState(prev => ({
      ...prev,
      validationResults: newResults,
      canProceed
    }));
  };

  const handleClosePeriod = async () => {
    setWizardState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = accountingPeriodService.closePeriod(
        periodId,
        1,
        t('accounting.closure.steps.confirmation.check')
      );

      if (result.success) {
        onComplete();
      } else {
        setError(result.message || t('common.error'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorUnknown'));
    } finally {
      setWizardState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  if (!isOpen) return null;

  const currentStepData = WIZARD_STEPS[wizardState.currentStep - 1];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 bg-slate-950/50 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                {t('accounting.closure.title')}: <span className="text-blue-500 font-serif italic lowercase tracking-tight">{period?.name || t('accounting.periods.sync')}</span>
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('accounting.closure.wizard.integrity')} • {period && `${period.start_date} a ${period.end_date}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all active:scale-90"
            disabled={wizardState.isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-8 py-6 bg-slate-900/50 border-b border-slate-800/50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-300 shadow-lg ${wizardState.currentStep === step.id
                      ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-500/20'
                      : wizardState.currentStep > step.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                      }`}
                  >
                    {wizardState.currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`text-[9px] mt-3 font-black uppercase tracking-widest text-center max-w-[80px] ${wizardState.currentStep === step.id ? 'text-blue-400' : 'text-slate-600'
                    }`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${wizardState.currentStep > step.id
                      ? 'bg-emerald-600'
                      : 'bg-slate-800'
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-grid-slate-950/20 custom-scrollbar">
          <div className="mb-8 animate-in slide-in-from-left-4 duration-500">
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              {currentStepData.title}
            </h3>
            <p className="text-slate-400 font-bold mt-2 text-lg italic">{currentStepData.description}</p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-red-900/10 border-2 border-red-500/30 rounded-2xl flex items-start animate-in slide-in-from-top-4 shadow-xl shadow-red-950/20">
              <AlertCircle className="w-6 h-6 text-red-500 mr-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-red-500 uppercase tracking-widest">{t('common.error')}</p>
                <p className="text-sm font-bold text-red-200 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Render Step Components with Theme Support */}
          <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-1 shadow-inner backdrop-blur-sm">
            {wizardState.currentStep === 1 && (
              <TransactionValidationStep
                periodId={periodId}
                onValidationComplete={handleStepValidation}
              />
            )}
            {wizardState.currentStep === 2 && (
              <BankReconciliationStep
                periodId={periodId}
                onValidationComplete={handleStepValidation}
              />
            )}
            {wizardState.currentStep === 3 && (
              <PayrollValidationStep
                periodId={periodId}
                onValidationComplete={handleStepValidation}
              />
            )}
            {wizardState.currentStep === 4 && (
              <AdjustmentsStep
                periodId={periodId}
                onValidationComplete={handleStepValidation}
              />
            )}
            {wizardState.currentStep === 5 && (
              <TrialBalanceStep
                periodId={periodId}
                onValidationComplete={handleStepValidation}
              />
            )}
            {wizardState.currentStep === 6 && period && (
              <ConfirmationStep
                periodId={periodId}
                period={period}
                validationResults={Array.from(wizardState.validationResults.values())}
                onComplete={onComplete}
              />
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between p-8 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={handlePreviousStep}
            disabled={wizardState.currentStep === 1 || wizardState.isProcessing}
            className="group flex items-center px-6 py-3 text-slate-400 font-black uppercase text-xs tracking-widest bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('accounting.closure.back')}
          </button>

          <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
            {t('accounting.closure.wizard.phase')} {wizardState.currentStep} <span className="mx-2 text-slate-800">/</span> {wizardState.totalSteps}
          </div>

          {wizardState.currentStep < wizardState.totalSteps ? (
            <button
              onClick={handleNextStep}
              disabled={!wizardState.canProceed || wizardState.isProcessing}
              className="flex items-center px-8 py-3.5 text-white bg-blue-600 font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-blue-700 disabled:opacity-20 disabled:grayscale transition-all active:scale-95 shadow-xl shadow-blue-900/30 group"
            >
              {t('accounting.closure.next')}
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleClosePeriod}
              disabled={!wizardState.canProceed || wizardState.isProcessing}
              className="flex items-center px-10 py-4 text-white bg-emerald-600 font-black uppercase text-sm tracking-[0.2em] rounded-2xl hover:bg-emerald-500 disabled:opacity-20 transition-all active:scale-95 shadow-2xl shadow-emerald-900/40 relative overflow-hidden group"
            >
              {wizardState.isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  {t('accounting.periods.sync')}
                </>
              ) : (
                <>
                  <Flag className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                  {t('accounting.closure.finish')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
