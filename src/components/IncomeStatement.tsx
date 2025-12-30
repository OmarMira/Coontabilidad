import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, RefreshCw, Calendar, DollarSign, Printer } from 'lucide-react';
import { generateIncomeStatement, ChartOfAccount } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

interface IncomeStatementData {
  revenue: ChartOfAccount[];
  expenses: ChartOfAccount[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export function IncomeStatement() {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(0, 1); // Primer día del año
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadIncomeStatement = async (from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);

      const fromDateToUse = from || fromDate;
      const toDateToUse = to || toDate;

      logger.info('IncomeStatement', 'load_start', `Generando estado de resultados del ${fromDateToUse} al ${toDateToUse}`);

      const result = generateIncomeStatement(fromDateToUse, toDateToUse);
      setIncomeStatement(result);

      logger.info('IncomeStatement', 'load_success', 'Estado de resultados generado exitosamente', {
        totalRevenue: result.totalRevenue,
        totalExpenses: result.totalExpenses,
        netIncome: result.netIncome,
        fromDate: fromDateToUse,
        toDate: toDateToUse
      });

    } catch (error) {
      logger.error('IncomeStatement', 'load_failed', 'Error al generar estado de resultados', null, error as Error);
      setError('Error al generar el estado de resultados');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    loadIncomeStatement(fromDate, toDate);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateMargins = () => {
    if (!incomeStatement || incomeStatement.totalRevenue === 0) {
      return { grossMargin: 0, netMargin: 0 };
    }

    const grossMargin = (incomeStatement.totalRevenue / incomeStatement.totalRevenue) * 100;
    const netMargin = (incomeStatement.netIncome / incomeStatement.totalRevenue) * 100;

    return { grossMargin, netMargin };
  };

  const renderAccountSection = (title: string, accounts: ChartOfAccount[], total: number, isRevenue: boolean = false) => (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isRevenue ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
            {isRevenue ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-rose-400" />
            )}
          </div>
          <h3 className="text-item-title">{title}</h3>
        </div>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.account_code} className="group flex items-center justify-between py-3 px-4 bg-slate-800/40 hover:bg-slate-800 rounded-xl transition-all border border-slate-800/50 hover:border-slate-700">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-blue-400 font-black bg-blue-900/20 px-2 py-1 rounded">
                {account.account_code}
              </span>
              <span className="text-standard-body group-hover:text-white transition-colors">
                {account.account_name}
              </span>
            </div>
            <span className="font-mono text-white font-black text-lg">
              {formatCurrency(account.balance || 0)}
            </span>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
            <p className="font-medium">Sin movimientos</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total {title}</span>
          <span className={`font-mono text-2xl font-black underline decoration-4 underline-offset-8 ${isRevenue ? 'text-emerald-400 underline-emerald-500/30' : 'text-rose-400 underline-rose-500/30'}`}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    loadIncomeStatement();
  }, []);

  const margins = calculateMargins();

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-section-title">Estado de Resultados</h1>
          <p className="text-standard-body opacity-80">Ingresos y gastos del período seleccionado</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
            <Calendar className="h-5 w-5 text-blue-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-sm"
            />
            <span className="text-slate-600 px-1">al</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-sm"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700 shadow-lg no-print"
          >
            <Printer className="h-5 w-5" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleDateChange}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 no-print"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Generando estado de resultados...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-300">Error</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Income Statement */}
      {incomeStatement && !loading && (
        <>
          {/* Net Income Summary */}
          <div className={`rounded-lg p-6 ${incomeStatement.netIncome >= 0 ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {incomeStatement.netIncome >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-400" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${incomeStatement.netIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {incomeStatement.netIncome >= 0 ? 'Utilidad Neta' : 'Pérdida Neta'}
                  </h3>
                  <p className={incomeStatement.netIncome >= 0 ? 'text-green-200' : 'text-red-200'}>
                    Período: {fromDate} al {toDate}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(incomeStatement.netIncome)}
                </div>
                <div className="text-sm text-gray-400">
                  Margen: {margins.netMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Revenue and Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue */}
            {renderAccountSection('Ingresos', incomeStatement.revenue, incomeStatement.totalRevenue, true)}

            {/* Expenses */}
            {renderAccountSection('Gastos', incomeStatement.expenses, incomeStatement.totalExpenses, false)}
          </div>

          {/* Calculation Summary */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cálculo de Resultados</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-white">Total Ingresos</span>
                <span className="font-mono text-green-400 font-semibold">
                  {formatCurrency(incomeStatement.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-white">Total Gastos</span>
                <span className="font-mono text-red-400 font-semibold">
                  ({formatCurrency(incomeStatement.totalExpenses)})
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-t-2 border-gray-600 font-bold text-lg">
                <span className="text-white">Utilidad/Pérdida Neta</span>
                <span className={`font-mono ${incomeStatement.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(incomeStatement.netIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Indicadores Clave</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(incomeStatement.totalRevenue)}
                </div>
                <div className="text-sm text-gray-400">Ingresos Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(incomeStatement.totalExpenses)}
                </div>
                <div className="text-sm text-gray-400">Gastos Totales</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {margins.netMargin.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Margen Neto</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {incomeStatement.totalExpenses > 0 ? (incomeStatement.totalRevenue / incomeStatement.totalExpenses).toFixed(2) : '∞'}
                </div>
                <div className="text-sm text-gray-400">Ratio Ingresos/Gastos</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}