import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  getBudgetSummary,
  getBudgetExecutionStatus,
  approveBudget,
  type Budget
} from '@/database/simple-db';
import { BudgetLinesTable } from './BudgetLinesTable';
import { BudgetVarianceReport } from './reports/BudgetVarianceReport';
import { BudgetPerformanceChart } from './reports/BudgetPerformanceChart';

interface BudgetDetailViewProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: () => void;
  onBack: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
}

export const BudgetDetailView: React.FC<BudgetDetailViewProps> = ({
  budget,
  onEdit,
  onDelete,
  onBack,
  canEdit = false,
  canDelete = false,
  canApprove = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'reports' | 'charts'>('overview');
  const [summary, setSummary] = useState<any>(null);
  const [executionStatus, setExecutionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [budget.id]);

  const loadData = () => {
    try {
      setLoading(true);
      const summaryData = getBudgetSummary(budget.id);
      const statusData = getBudgetExecutionStatus(budget.id);
      setSummary(summaryData);
      setExecutionStatus(statusData);
    } catch (err) {
      console.error('Error loading budget details:', err);
      setError('Error al cargar detalles del presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBudget = () => {
    if (!confirm('¿Está seguro de aprobar este presupuesto? Una vez aprobado, no podrá editarse.')) {
      return;
    }

    const result = approveBudget(budget.id, 1); // TODO: Get user ID from auth
    if (result.success) {
      setSuccess('Presupuesto aprobado exitosamente');
      setTimeout(() => {
        window.location.reload(); // Reload to update status
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: { label: 'Borrador', color: 'bg-slate-800 text-slate-300 border border-slate-700', icon: AlertTriangle },
      APPROVED: { label: 'Aprobado', color: 'bg-blue-900/40 text-blue-300 border border-blue-800', icon: CheckCircle },
      ACTIVE: { label: 'Activo', color: 'bg-green-900/40 text-green-300 border border-green-800', icon: CheckCircle },
      CLOSED: { label: 'Cerrado', color: 'bg-red-900/40 text-red-300 border border-red-800', icon: XCircle }
    };

    const badge = badges[status as keyof typeof badges] || badges.DRAFT;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </span>
    );
  };

  const getExecutionStatusBadge = (status: string) => {
    const badges = {
      on_track: { label: 'En Curso', color: 'bg-green-900/40 text-green-300 border border-green-800', icon: CheckCircle },
      at_risk: { label: 'En Riesgo', color: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800', icon: AlertTriangle },
      over_budget: { label: 'Sobre Presupuesto', color: 'bg-red-900/40 text-red-300 border border-red-800', icon: XCircle }
    };

    const badge = badges[status as keyof typeof badges] || badges.on_track;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">{budget.budget_name}</h2>
            <p className="text-slate-400">Año Fiscal {budget.fiscal_year}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {budget.status === 'DRAFT' && canEdit && (
            <>
              <Button variant="outline" onClick={() => onEdit(budget)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {canApprove && (
                <Button onClick={handleApproveBudget} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900/20 border-green-900 text-green-200">
          <AlertDescription className="text-green-300">{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Estado</p>
                <div className="mt-2">{getStatusBadge(budget.status)}</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Presupuestado</p>
                <p className="text-2xl font-bold text-white">
                  ${summary ? (summary.total_budgeted / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Ejecutado</p>
                <p className="text-2xl font-bold text-white">
                  ${summary ? (summary.total_actual / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
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
                <p className="text-sm font-medium text-slate-400">Varianza</p>
                <p className={`text-2xl font-bold ${summary && summary.total_variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ${summary ? Math.abs(summary.total_variance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {summary && summary.total_variance > 0 ? 'Sobre' : 'Bajo'} presupuesto
                </p>
              </div>
              {summary && summary.total_variance > 0 ? (
                <TrendingUp className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Status */}
      {executionStatus && (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle>Estado de Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Estado General</p>
                {getExecutionStatusBadge(executionStatus.status)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Progreso Temporal</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">{executionStatus.period_progress_percent.toFixed(1)}%</p>
                  <p className="text-sm text-slate-500">del período</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {executionStatus.days_elapsed} días transcurridos, {executionStatus.days_remaining} restantes
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Consumo del Presupuesto</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-white">{executionStatus.budget_consumed_percent.toFixed(1)}%</p>
                  <p className="text-sm text-slate-500">consumido</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Ritmo de Ejecución</p>
                <div className="flex items-center gap-2">
                  {executionStatus.pace_indicator === 'ahead' && (
                    <span className="text-red-400 font-semibold">Acelerado</span>
                  )}
                  {executionStatus.pace_indicator === 'on_pace' && (
                    <span className="text-green-400 font-semibold">Normal</span>
                  )}
                  {executionStatus.pace_indicator === 'behind' && (
                    <span className="text-blue-400 font-semibold">Lento</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('lines')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lines'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
          >
            Líneas de Presupuesto
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
          >
            Reporte de Varianza
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'charts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
          >
            Gráficos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && summary && (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-3">Detalles del Presupuesto</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Período:</dt>
                    <dd className="font-medium text-slate-200">
                      {new Date(budget.start_date).toLocaleDateString('es-ES')} - {new Date(budget.end_date).toLocaleDateString('es-ES')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Departamento:</dt>
                    <dd className="font-medium text-slate-200">{budget.department || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Líneas:</dt>
                    <dd className="font-medium text-slate-200">{summary.lines_count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Umbral de Alerta:</dt>
                    <dd className="font-medium text-slate-200">{budget.alert_threshold_percentage || 10}%</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3">Análisis de Líneas</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Sobre Presupuesto:</dt>
                    <dd className="font-medium text-red-400">{summary.lines_over_budget}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Bajo Presupuesto:</dt>
                    <dd className="font-medium text-green-400">{summary.lines_under_budget}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">En Presupuesto:</dt>
                    <dd className="font-medium text-white">{summary.lines_on_budget}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Alertas Activas:</dt>
                    <dd className="font-medium text-orange-400">{summary.alert_count}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {budget.notes && (
              <div className="pt-4 border-t border-slate-800">
                <h3 className="font-semibold text-white mb-2">Notas</h3>
                <p className="text-slate-300">{budget.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'lines' && (
        <BudgetLinesTable budgetId={budget.id} />
      )}

      {activeTab === 'reports' && (
        <BudgetVarianceReport budgetId={budget.id} />
      )}

      {activeTab === 'charts' && (
        <BudgetPerformanceChart budgetId={budget.id} />
      )}
    </div>
  );
};
