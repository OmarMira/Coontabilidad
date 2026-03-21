import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { getChartOfAccounts } from '@/database/modules/db-journal';
import type { BudgetLine } from '@/database/modules/db-budgets';
import { useLocale } from '@/i18n/useLocale';

interface BudgetLineEditorProps {
  lines: Partial<BudgetLine>[];
  onChange: (lines: Partial<BudgetLine>[]) => void;
  totalAmount: number;
}

export const BudgetLineEditor: React.FC<BudgetLineEditorProps> = ({
  lines,
  onChange,
  totalAmount
}) => {
  const { t, formatCurrency } = useLocale();
  const [accounts, setAccounts] = useState<Array<{ code: string; name: string; type: string }>>([]);

  useEffect(() => {
    // Load chart of accounts
    const chartOfAccounts = getChartOfAccounts();
    // Filter only expense and revenue accounts (4xxx and 5xxx)
    const budgetableAccounts = chartOfAccounts
      .filter(acc => acc.account_code.startsWith('4') || acc.account_code.startsWith('5'))
      .map(acc => ({
        code: acc.account_code,
        name: acc.account_name,
        type: acc.account_type
      }));
    setAccounts(budgetableAccounts);
  }, []);

  const handleAddLine = () => {
    onChange([
      ...lines,
      {
        account_number: 0,
        annual_amount: 0,
        distribution_type: 'EQUAL',
        notes: ''
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index);
    onChange(newLines);
  };

  const handleLineChange = (index: number, field: keyof BudgetLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      [field]: value
    };
    onChange(newLines);
  };

  const getAccountName = (accountNumber: number): string => {
    const account = accounts.find(acc => Number(acc.code) === accountNumber);
    return account ? account.name : '';
  };

  return (
    <Card className="bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('budgets.lines')}</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={handleAddLine}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {t('budgets.addLine')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-slate-800 rounded-lg bg-slate-900/50">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p>{t('budgets.noLines')}</p>
            <p className="text-sm mt-1">{t('budgets.clickAddLine')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b border-slate-700 font-semibold text-sm text-slate-400">
              <div className="col-span-3">{t('budgets.account')}</div>
              <div className="col-span-3">{t('budgets.account')}</div>
              <div className="col-span-2">{t('budgets.annualAmount')}</div>
              <div className="col-span-2">{t('budgets.distribution')}</div>
              <div className="col-span-1">{t('common.notes')}</div>
              <div className="col-span-1 text-center">{t('common.actions')}</div>
            </div>

            {/* Lines */}
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700"
              >
                {/* Account Selector */}
                <div className="md:col-span-3">
                  <label className="block md:hidden text-sm font-medium text-slate-300 mb-1">
                    {t('budgets.account')}
                  </label>
                  <select
                    value={line.account_number || ''}
                    onChange={(e) => handleLineChange(index, 'account_number', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('budgets.selectAccount')}</option>
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Name (auto-filled) */}
                <div className="md:col-span-3">
                  <label className="block md:hidden text-sm font-medium text-slate-300 mb-1">
                    {t('budgets.account')}
                  </label>
                  <Input
                    type="text"
                    value={getAccountName(line.account_number || 0)}
                    readOnly
                    className="bg-slate-950 border-slate-700 text-slate-400 cursor-not-allowed"
                    placeholder={t('budgets.account')}
                  />
                </div>

                {/* Annual Amount */}
                <div className="md:col-span-2">
                  <label className="block md:hidden text-sm font-medium text-slate-300 mb-1">
                    {t('budgets.annualAmount')}
                  </label>
                  <Input
                    type="number"
                    value={line.annual_amount ? line.annual_amount / 100 : ''}
                    onChange={(e) => handleLineChange(index, 'annual_amount', Math.round(Number(e.target.value) * 100))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:ring-blue-500"
                  />
                </div>

                {/* Distribution Type */}
                <div className="md:col-span-2">
                  <label className="block md:hidden text-sm font-medium text-slate-300 mb-1">
                    {t('budgets.distribution')}
                  </label>
                  <select
                    value={line.distribution_type || 'EQUAL'}
                    onChange={(e) => handleLineChange(index, 'distribution_type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EQUAL">{t('budgets.distributionType.equal')}</option>
                    <option value="CUSTOM">{t('budgets.distributionType.custom')}</option>
                    <option value="ZERO">{t('budgets.distributionType.zero')}</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-1">
                  <label className="block md:hidden text-sm font-medium text-slate-300 mb-1">
                    {t('common.notes')}
                  </label>
                  <Input
                    type="text"
                    value={line.notes || ''}
                    onChange={(e) => handleLineChange(index, 'notes', e.target.value)}
                    placeholder={t('common.notes')}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:ring-blue-500"
                  />
                </div>

                {/* Remove Button */}
                <div className="md:col-span-1 flex items-end md:items-center justify-end md:justify-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveLine(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-700">
              <span className="text-lg font-semibold text-slate-300">{t('budgets.totalBudgeted')}:</span>
              <span className="text-2xl font-black tracking-tight text-blue-400">
                {formatCurrency(totalAmount / 100)}
              </span>
            </div>

            {/* Distribution Info */}
            <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>{t('budgets.distributionType.equal')}:</strong> {t('budgets.distributionHelp.equal')}
              </p>
              <p className="text-sm text-blue-300 mt-1">
                <strong>{t('budgets.distributionType.custom')}:</strong> {t('budgets.distributionHelp.custom')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
