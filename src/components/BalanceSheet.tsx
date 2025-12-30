import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Calendar, Printer } from 'lucide-react';
import { generateBalanceSheet, ChartOfAccount } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

interface BalanceSheetData {
  assets: ChartOfAccount[];
  liabilities: ChartOfAccount[];
  equity: ChartOfAccount[];
  totalAssets: number;
  totalLiabilitiesEquity: number;
  isBalanced: boolean;
}

export function BalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadBalanceSheet = async (date?: string) => {
    try {
      setLoading(true);
      setError(null);

      const dateToUse = date || asOfDate;
      logger.info('BalanceSheet', 'load_start', `Generando balance general al ${dateToUse}`);

      const result = generateBalanceSheet(dateToUse);
      setBalanceSheet(result);

      logger.info('BalanceSheet', 'load_success', 'Balance general generado exitosamente', {
        totalAssets: result.totalAssets,
        totalLiabilitiesEquity: result.totalLiabilitiesEquity,
        isBalanced: result.isBalanced,
        asOfDate: dateToUse
      });

      if (!result.isBalanced) {
        logger.warn('BalanceSheet', 'unbalanced_sheet', 'Balance general desbalanceado', {
          difference: Math.abs(result.totalAssets - result.totalLiabilitiesEquity)
        });
      }

    } catch (error) {
      logger.error('BalanceSheet', 'load_failed', 'Error al generar balance general', null, error as Error);
      setError('Error al generar el balance general');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setAsOfDate(newDate);
    loadBalanceSheet(newDate);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'liability': return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'equity': return <DollarSign className="h-4 w-4 text-blue-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderAccountSection = (title: string, accounts: ChartOfAccount[], total: number, type: string) => (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            {getAccountTypeIcon(type)}
          </div>
          <h3 className="text-item-title">{title}</h3>
        </div>
        <div className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2 py-1 rounded">
          {accounts.length} Cuentas
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
            <p className="font-medium">No hay cuentas activas</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total {title}</span>
          <span className="font-mono text-2xl text-white font-black underline decoration-blue-500/30 decoration-4 underline-offset-8">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    loadBalanceSheet();
  }, []);

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-section-title">Balance General</h1>
          <p className="text-standard-body opacity-80">Estado de situación financiera profesional</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
            <Calendar className="h-5 w-5 text-blue-400" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
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
            onClick={() => loadBalanceSheet()}
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
            <p className="text-gray-400">Generando balance general...</p>
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

      {/* Balance Sheet */}
      {balanceSheet && !loading && (
        <>
          {/* Balance Status */}
          <div className={`rounded-lg p-6 ${balanceSheet.isBalanced ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {balanceSheet.isBalanced ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-400" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${balanceSheet.isBalanced ? 'text-green-300' : 'text-red-300'}`}>
                    {balanceSheet.isBalanced ? 'Balance Cuadrado' : 'Balance Descuadrado'}
                  </h3>
                  <p className={balanceSheet.isBalanced ? 'text-green-200' : 'text-red-200'}>
                    {balanceSheet.isBalanced
                      ? 'Activos = Pasivos + Patrimonio'
                      : `Diferencia: ${formatCurrency(Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesEquity))}`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Al {asOfDate}</div>
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(balanceSheet.totalAssets)}
                </div>
              </div>
            </div>
          </div>

          {/* Balance Sheet Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Assets */}
            <div className="space-y-6">
              {renderAccountSection('Activos', balanceSheet.assets, balanceSheet.totalAssets, 'asset')}
            </div>

            {/* Right Side - Liabilities and Equity */}
            <div className="space-y-6">
              {renderAccountSection('Pasivos', balanceSheet.liabilities,
                balanceSheet.liabilities.reduce((sum, acc) => sum + (acc.balance || 0), 0), 'liability')}

              {renderAccountSection('Patrimonio', balanceSheet.equity,
                balanceSheet.equity.reduce((sum, acc) => sum + (acc.balance || 0), 0), 'equity')}

              {/* Total Liabilities + Equity */}
              <div className="bg-gray-700 rounded-lg p-4 border-2 border-blue-500">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span className="text-white">Total Pasivos + Patrimonio</span>
                  <span className="font-mono text-blue-400">
                    {formatCurrency(balanceSheet.totalLiabilitiesEquity)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen Ejecutivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(balanceSheet.totalAssets)}
                </div>
                <div className="text-sm text-gray-400">Total Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(balanceSheet.liabilities.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                </div>
                <div className="text-sm text-gray-400">Total Pasivos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(balanceSheet.equity.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                </div>
                <div className="text-sm text-gray-400">Total Patrimonio</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}