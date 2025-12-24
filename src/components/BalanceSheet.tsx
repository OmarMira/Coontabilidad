import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
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
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        {getAccountTypeIcon(type)}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {accounts.map((account) => (
          <div key={account.account_code} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm text-gray-300">{account.account_code}</span>
              <span className="text-white">{account.account_name}</span>
            </div>
            <span className="font-mono text-white">
              {formatCurrency(account.balance || 0)}
            </span>
          </div>
        ))}
        
        {accounts.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No hay cuentas en esta categoría
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-600 mt-4 pt-4">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-white">Total {title}</span>
          <span className="font-mono text-lg text-white">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Balance General</h1>
          <p className="text-gray-400">Estado de situación financiera</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => loadBalanceSheet()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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