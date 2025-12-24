import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Database, Activity } from 'lucide-react';
import { diagnoseAccountingSystem } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

export function AccountingDiagnosis() {
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info('AccountingDiagnosis', 'user_initiated', 'Usuario inició diagnóstico del sistema contable');
      const result = await diagnoseAccountingSystem();
      setDiagnosis(result);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('AccountingDiagnosis', 'diagnosis_error', 'Error en componente de diagnóstico', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnóstico del Sistema Contable</h1>
          <p className="text-gray-400">Verificación de integridad y estado del sistema</p>
        </div>
        <button
          onClick={runDiagnosis}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Ejecutar Diagnóstico</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Ejecutando diagnóstico...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-300">Error en Diagnóstico</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {diagnosis && !loading && (
        <div className="space-y-4">
          {/* Status Overview */}
          <div className={`rounded-lg p-6 ${diagnosis.success ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
            <div className="flex items-center space-x-3">
              {diagnosis.success ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-400" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${diagnosis.success ? 'text-green-300' : 'text-red-300'}`}>
                  {diagnosis.success ? 'Sistema Funcionando Correctamente' : 'Problemas Detectados'}
                </h3>
                <p className={diagnosis.success ? 'text-green-200' : 'text-red-200'}>
                  {diagnosis.message}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {diagnosis.details && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tables Status */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  <h4 className="font-semibold text-white">Tablas</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {diagnosis.details.existingTables?.length || 0}/3
                </div>
                <div className="text-sm text-gray-400">
                  {diagnosis.details.tablesExist ? 'Todas las tablas existen' : 'Faltan tablas'}
                </div>
                {diagnosis.details.existingTables && (
                  <div className="mt-2 text-xs text-gray-500">
                    {diagnosis.details.existingTables.join(', ')}
                  </div>
                )}
              </div>

              {/* Accounts Count */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-white">Cuentas</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {diagnosis.details.accountsCount || 0}
                </div>
                <div className="text-sm text-gray-400">
                  Plan de cuentas
                </div>
              </div>

              {/* Main Accounts */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-purple-400" />
                  <h4 className="font-semibold text-white">Principales</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {diagnosis.details.mainAccounts || 0}/5
                </div>
                <div className="text-sm text-gray-400">
                  Cuentas principales
                </div>
              </div>

              {/* Journal Entries */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-5 w-5 text-yellow-400" />
                  <h4 className="font-semibold text-white">Asientos</h4>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {diagnosis.details.journalCount || 0}
                </div>
                <div className="text-sm text-gray-400">
                  Asientos contables
                </div>
              </div>
            </div>
          )}

          {/* Main Accounts Details */}
          {diagnosis.details?.mainAccountsData && diagnosis.details.mainAccountsData.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Cuentas Principales Detectadas</h4>
              <div className="space-y-2">
                {diagnosis.details.mainAccountsData.map((account: any[], index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm text-gray-300">{account[0]}</span>
                      <span className="text-white">{account[1]}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-600 rounded text-gray-300">
                      {account[2]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Details (for debugging) */}
          <details className="bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer text-white font-semibold mb-2">
              Detalles Técnicos (Debug)
            </summary>
            <pre className="text-xs text-gray-400 overflow-auto">
              {JSON.stringify(diagnosis.details, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}