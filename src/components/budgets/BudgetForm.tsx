import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle, Save, XCircle, Target, ShieldCheck, Loader2 } from 'lucide-react';
import {
  createBudget,
  updateBudget,
  type Budget,
  type BudgetLine
} from '@/database/modules/db-budgets';
import { getChartOfAccounts } from '@/database/modules/db-journal';
import { BudgetLineEditor } from './BudgetLineEditor';
import { useLocale } from '@/i18n/useLocale';

interface BudgetFormProps {
  budget: Budget | null;
  onSave: () => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ budget, onSave, onCancel }) => {
  const { t } = useLocale();
  const isEditing = !!budget;

  // Form state
  const [budgetName, setBudgetName] = useState(budget?.budget_name || '');
  const [fiscalYear, setFiscalYear] = useState(budget?.fiscal_year || new Date().getFullYear());
  const [startDate, setStartDate] = useState(budget?.start_date || `${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(budget?.end_date || `${new Date().getFullYear()}-12-31`);
  const [department, setDepartment] = useState(budget?.department || '');
  const [notes, setNotes] = useState(budget?.notes || '');
  const [alertThreshold, setAlertThreshold] = useState(budget?.alert_threshold_percentage || 10);

  // Budget lines
  const [lines, setLines] = useState<Partial<BudgetLine>[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-calculate fiscal year from start date
  useEffect(() => {
    if (startDate) {
      const year = new Date(startDate).getFullYear();
      setFiscalYear(year);
    }
  }, [startDate]);

  // Calculate total budget amount
  const totalBudgetAmount = lines.reduce((sum, line) => sum + (line.annual_amount || 0), 0);

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!budgetName.trim()) {
      errors.push(t('budgets.validation.nameRequired'));
    }

    if (!startDate) {
      errors.push(t('budgets.validation.startDateRequired'));
    }

    if (!endDate) {
      errors.push(t('budgets.validation.endDateRequired'));
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      errors.push(t('budgets.validation.endDateAfterStartDate'));
    }

    if (lines.length === 0) {
      errors.push(t('budgets.validation.linesRequired'));
    }

    // Validate lines
    lines.forEach((line, index) => {
      if (!line.account_number) {
        errors.push(t('budgets.validation.lineAccountRequired', { index: index + 1 }));
      }
      if (!line.annual_amount || line.annual_amount <= 0) {
        errors.push(t('budgets.validation.lineAmountPositive', { index: index + 1 }));
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const budgetData = {
        budget_name: budgetName,
        fiscal_year: fiscalYear,
        start_date: startDate,
        end_date: endDate,
        status: 'DRAFT' as const,
        total_budget_amount: totalBudgetAmount,
        department: department || undefined,
        notes: notes || undefined,
        alert_threshold_percentage: alertThreshold,
        created_by: 1 // TODO: Get from auth context
      };

      if (isEditing) {
        const result = updateBudget(budget.id, budgetData, lines as Partial<BudgetLine>[]);
        if (!result.success) {
          throw new Error(result.message);
        }
      } else {
        const result = await createBudget(budgetData, lines as Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[]);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      onSave();
    } catch (err) {
      logger.error('BudgetForm', 'error', 'Error saving budget:', err);
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        {/* Header Hub */}
        <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="text-blue-500">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? t('budgets.editBudget') : t('budgets.newBudget')}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Fiscal Protocol v3.0
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 relative z-10 custom-scrollbar">
          {/* Error Feedback */}
          {(validationErrors.length > 0 || error) && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-[2rem] p-8 space-y-4 animate-in shake duration-500">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
                <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest leading-none">
                  {t('common.error') || 'ERROR DE VALIDACIÃ“N'}
                </p>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="text-[11px] font-bold text-rose-200/70 uppercase tracking-tight">{err}</li>
                ))}
                {error && <li className="text-[11px] font-bold text-rose-200/70 uppercase tracking-tight">{error}</li>}
              </ul>
            </div>
          )}

          {/* Primary Info Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                {t('budgets.budgetName')} *
              </label>
              <input
                type="text"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                placeholder={t('budgets.placeholders.budgetName')}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2.5xl px-8 py-5 text-white focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[11px] placeholder:text-slate-800"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('budgets.startDate')} *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2.5xl px-8 py-5 text-white focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[11px]"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('budgets.endDate')} *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2.5xl px-8 py-5 text-white focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[11px]"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('budgets.department')}</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={t('budgets.placeholders.department')}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2.5xl px-8 py-5 text-white focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[11px] placeholder:text-slate-800"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('budgets.fiscalYear')}</label>
              <div className="w-full bg-slate-950/30 border border-slate-800/30 rounded-2.5xl px-8 py-5 text-slate-600 font-black uppercase tracking-widest text-[11px]">
                {fiscalYear}
              </div>
            </div>
          </div>

          {/* Editor Section */}
          <div className="pt-12 border-t border-slate-800/50">
            <BudgetLineEditor
              lines={lines}
              onChange={setLines}
              totalAmount={totalBudgetAmount}
            />
          </div>
        </div>

        {/* Footer Action Hub */}
        <footer className="p-10 border-t border-slate-800/50 bg-slate-950/30 flex justify-end gap-6 flex-shrink-0 relative z-10">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-10 py-5 text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-2xl border border-transparent hover:border-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || lines.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 text-white px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEditing ? t('budgets.updateBudget') : t('budgets.createBudget')}</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
