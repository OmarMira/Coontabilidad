import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  BarChart3,
  Calendar
} from 'lucide-react';
import {
  getBudgets,
  getBudgetSummary,
  getBudgetExecutionStatus,
  type Budget
} from '@/database/simple-db';
import { useAuth } from '@/contexts/AuthContext';
import { BudgetList } from './BudgetList';
import { BudgetForm } from './BudgetForm';
import { BudgetDetailView } from './BudgetDetailView';
import { useLocale } from '@/i18n/useLocale';

/**
 * BudgetManager
 * 
 * Main container for Budget Management module with:
 * - Budget summary KPIs
 * - Budget list with filters
 * - Quick actions (Create Budget, Reports)
 * - Budget detail view
 */
export const BudgetManager: React.FC = () => {
  const { t } = useLocale();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Permission checks
  const canCreate = user ? ['admin', 'contador'].includes(user.role) : false;
  const canEdit = user ? ['admin', 'contador'].includes(user.role) : false;
  const canDelete = user ? ['admin'].includes(user.role) : false;
  const canApprove = user ? ['admin', 'contador'].includes(user.role) : false;
  const canView = user ? ['admin', 'contador', 'auditor'].includes(user.role) : false;

  // Summary stats
  const [stats, setStats] = useState({
    total_budgets: 0,
    active_budgets: 0,
    total_budgeted: 0,
    total_actual: 0,
    budgets_at_risk: 0
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load budgets with filters (include user context for role-based access)
      const filters: any = {};
      if (filterYear) filters.fiscal_year = filterYear;
      if (filterStatus) filters.status = filterStatus;
      if (user) {
        filters.userId = user.id;
        filters.role = user.role;
      }

      const budgetsData = getBudgets(filters);
      setBudgets(budgetsData);

      // Calculate summary stats
      const activeBudgets = budgetsData.filter(b => b.status === 'ACTIVE');
      let totalBudgeted = 0;
      let totalActual = 0;
      let budgetsAtRisk = 0;

      for (const budget of activeBudgets) {
        const summary = getBudgetSummary(budget.id);
        if (summary) {
          totalBudgeted += summary.total_budgeted;
          totalActual += summary.total_actual;

          const status = getBudgetExecutionStatus(budget.id);
          if (status && (status.status === 'at_risk' || status.status === 'over_budget')) {
            budgetsAtRisk++;
          }
        }
      }

      setStats({
        total_budgets: budgetsData.length,
        active_budgets: activeBudgets.length,
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        budgets_at_risk: budgetsAtRisk
      });

    } catch (err) {
      console.error('Error loading budgets:', err);
      setError(err instanceof Error ? err.message : t('budgets.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    if (!canCreate) {
      setError('No tienes permisos para crear presupuestos');
      return;
    }
    setEditingBudget(null);
    setActiveView('create');
  };

  const handleEditBudget = (budget: Budget) => {
    if (!canEdit) {
      setError('No tienes permisos para editar presupuestos');
      return;
    }
    setEditingBudget(budget);
    setActiveView('create');
  };

  const handleViewBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setActiveView('detail');
  };

  const handleBudgetSaved = () => {
    setSuccess(t('budgets.saveSuccess'));
    setActiveView('list');
    loadData();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleBudgetDeleted = () => {
    setSuccess(t('budgets.deleteSuccess'));
    setActiveView('list');
    loadData();
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedBudget(null);
    setEditingBudget(null);
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-700">{t('budgets.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('budgets.title')}</h1>
          <p className="text-slate-400 mt-1">{t('budgets.subtitle')}</p>
        </div>
        {activeView === 'list' && canCreate && (
          <Button onClick={handleCreateBudget} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('budgets.new')}
          </Button>
        )}
        {activeView !== 'list' && (
          <Button onClick={handleBackToList} variant="outline">
            {t('common.back')}
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">{t('common.success')}</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary KPIs - Only show in list view */}
      {activeView === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{t('budgets.total')}</p>
                  <p className="text-2xl font-black tracking-tight text-white">{stats.total_budgets}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{t('budgets.active')}</p>
                  <p className="text-2xl font-black tracking-tight text-green-400">{stats.active_budgets}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{t('budgets.totalBudgeted')}</p>
                  <p className="text-2xl font-black tracking-tight text-white">
                    ${(stats.total_budgeted / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{t('budgets.executed')}</p>
                  <p className="text-2xl font-black tracking-tight text-white">
                    ${(stats.total_actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{t('budgets.atRisk')}</p>
                  <p className="text-2xl font-black tracking-tight text-red-400">{stats.budgets_at_risk}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {activeView === 'list' && (
        <BudgetList
          budgets={budgets}
          onViewBudget={handleViewBudget}
          onEditBudget={handleEditBudget}
          onDeleteBudget={handleBudgetDeleted}
          filterStatus={filterStatus}
          filterYear={filterYear}
          onFilterStatusChange={setFilterStatus}
          onFilterYearChange={setFilterYear}
        />
      )}

      {activeView === 'create' && (
        <BudgetForm
          budget={editingBudget}
          onSave={handleBudgetSaved}
          onCancel={handleBackToList}
        />
      )}

      {activeView === 'detail' && selectedBudget && (
        <BudgetDetailView
          budget={selectedBudget}
          onEdit={handleEditBudget}
          onDelete={handleBudgetDeleted}
          onBack={handleBackToList}
          canEdit={canEdit}
          canDelete={canDelete}
          canApprove={canApprove}
        />
      )}
    </div>
  );
};
