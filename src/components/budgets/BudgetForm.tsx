import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle, Save, X } from 'lucide-react';
import {
  createBudget,
  updateBudget,
  getChartOfAccounts,
  type Budget,
  type BudgetLine
} from '@/database/simple-db';
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
      console.error('Error saving budget:', err);
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>{isEditing ? t('budgets.editBudget') : t('budgets.newBudget')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('budgets.budgetName')} *
              </label>
              <Input
                type="text"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                placeholder={t('budgets.placeholders.budgetName')}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('budgets.startDate')} *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('budgets.endDate')} *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
              />
            </div>

            {/* Fiscal Year (auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('budgets.fiscalYear')}
              </label>
              <Input
                type="number"
                value={fiscalYear}
                readOnly
                className="bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('budgets.department')}
              </label>
              <Input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={t('budgets.placeholders.department')}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
              />
            </div>

            {/* Alert Threshold */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('budgets.alertThreshold')}
              </label>
              <Input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                min="0"
                max="100"
                step="1"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('budgets.alertThresholdHelp')}
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('common.notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('budgets.placeholders.notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Lines Editor */}
      <BudgetLineEditor
        lines={lines}
        onChange={setLines}
        totalAmount={totalBudgetAmount}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="h-4 w-4 mr-2" />
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading || lines.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('common.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? t('budgets.updateBudget') : t('budgets.createBudget')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
