import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import {
  BankTransaction,
  AccountingTransaction,
  Match,
  ReconciliationResult,
  bankReconciliationService
} from '../../services/banking/BankReconciliationService';

interface ReconciliationMatcherProps {
  bankTransactions: BankTransaction[];
  accountingTransactions: AccountingTransaction[];
  onComplete: (result: ReconciliationResult) => void;
}

export const ReconciliationMatcher: React.FC<ReconciliationMatcherProps> = ({
  bankTransactions,
  accountingTransactions,
  onComplete
}) => {
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [selectedBankTx, setSelectedBankTx] = useState<number | null>(null);
  const [selectedAccountingTx, setSelectedAccountingTx] = useState<number | null>(null);
  const [manualMatches, setManualMatches] = useState<Match[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ejecutar reconciliación automática al montar
  useEffect(() => {
    handleAutoReconcile();
  }, [bankTransactions, accountingTransactions]);

  const handleAutoReconcile = () => {
    setIsProcessing(true);
    try {
      const reconciliationResult = bankReconciliationService.reconcile(
        bankTransactions,
        accountingTransactions
      );
      setResult(reconciliationResult);
    } catch (error) {
      console.error('Error en reconciliación automática:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualMatch = () => {
    if (!selectedBankTx || !selectedAccountingTx || !result) return;

    const newMatch = bankReconciliationService.createManualMatch(
      selectedBankTx,
      selectedAccountingTx,
      'Match manual creado por usuario'
    );

    // Agregar match manual
    const updatedMatches = [...result.matches, newMatch];
    
    // Remover de no coincididos
    const updatedUnmatchedBank = result.unmatchedBankTxs.filter(tx => tx.id !== selectedBankTx);
    const updatedUnmatchedAccounting = result.unmatchedAccountingTxs.filter(
      tx => tx.id !== selectedAccountingTx
    );

    // Actualizar resultado
    const updatedResult: ReconciliationResult = {
      ...result,
      matches: updatedMatches,
      unmatchedBankTxs: updatedUnmatchedBank,
      unmatchedAccountingTxs: updatedUnmatchedAccounting,
      summary: {
        ...result.summary,
        matchedCount: updatedMatches.length,
        unmatchedCount: updatedUnmatchedBank.length + updatedUnmatchedAccounting.length,
        matchRate: bankTransactions.length > 0 
          ? (updatedMatches.length / bankTransactions.length) * 100 
          : 0
      }
    };

    setResult(updatedResult);
    setManualMatches([...manualMatches, newMatch]);
    setSelectedBankTx(null);
    setSelectedAccountingTx(null);
  };

  const handleRemoveMatch = (matchIndex: number) => {
    if (!result) return;

    const removedMatch = result.matches[matchIndex];
    const updatedMatches = result.matches.filter((_, i) => i !== matchIndex);

    // Restaurar a no coincididos
    const bankTx = bankTransactions.find(tx => tx.id === removedMatch.bankTxId);
    const accountingTx = accountingTransactions.find(tx => tx.id === removedMatch.accountingTxId);

    const updatedUnmatchedBank = bankTx 
      ? [...result.unmatchedBankTxs, bankTx]
      : result.unmatchedBankTxs;
    
    const updatedUnmatchedAccounting = accountingTx
      ? [...result.unmatchedAccountingTxs, accountingTx]
      : result.unmatchedAccountingTxs;

    const updatedResult: ReconciliationResult = {
      ...result,
      matches: updatedMatches,
      unmatchedBankTxs: updatedUnmatchedBank,
      unmatchedAccountingTxs: updatedUnmatchedAccounting,
      summary: {
        ...result.summary,
        matchedCount: updatedMatches.length,
        unmatchedCount: updatedUnmatchedBank.length + updatedUnmatchedAccounting.length,
        matchRate: bankTransactions.length > 0 
          ? (updatedMatches.length / bankTransactions.length) * 100 
          : 0
      }
    };

    setResult(updatedResult);
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const report = bankReconciliationService.generateReport(
      result,
      `${new Date().toLocaleDateString('es-ES')}`
    );

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conciliacion-bancaria-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Procesando reconciliación...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-8 h-8 text-yellow-600" />
        <span className="ml-3 text-lg">No hay datos para reconciliar</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Resumen de Reconciliación</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight text-blue-600">
              {result.summary.totalBankTransactions}
            </div>
            <div className="text-sm text-slate-700">Transacciones Bancarias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight text-purple-600">
              {result.summary.totalAccountingTransactions}
            </div>
            <div className="text-sm text-slate-700">Registros Contables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight text-green-600">
              {result.summary.matchedCount}
            </div>
            <div className="text-sm text-slate-700">Coincidencias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight text-orange-600">
              {result.summary.unmatchedCount}
            </div>
            <div className="text-sm text-slate-700">Sin Coincidencia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tracking-tight text-red-600">
              {result.summary.discrepancyCount}
            </div>
            <div className="text-sm text-slate-700">Discrepancias</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {result.summary.matchRate.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-700">Tasa de Coincidencia</div>
        </div>
      </div>

      {/* Coincidencias */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Coincidencias ({result.matches.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 uppercase">
                  Confianza
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 uppercase">
                  Razón
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 uppercase">
                  Banco ID
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 uppercase">
                  Contable ID
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.matches.map((match, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        match.matchType === 'exact'
                          ? 'bg-green-100 text-green-800'
                          : match.matchType === 'fuzzy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {match.matchType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            match.confidence >= 90
                              ? 'bg-green-600'
                              : match.confidence >= 70
                              ? 'bg-yellow-600'
                              : 'bg-orange-600'
                          }`}
                          style={{ width: `${match.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm">{match.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{match.reason}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    #{match.bankTxId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    #{match.accountingTxId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRemoveMatch(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar coincidencia"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matching Manual */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Matching Manual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transacciones Bancarias Sin Coincidencia */}
          <div>
            <h4 className="font-medium mb-2 text-blue-600">
              Transacciones Bancarias ({result.unmatchedBankTxs.length})
            </h4>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {result.unmatchedBankTxs.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedBankTx(tx.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${
                    selectedBankTx === tx.id ? 'bg-blue-100 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{tx.description}</div>
                      <div className="text-xs text-slate-600">{tx.date}</div>
                      {tx.reference && (
                        <div className="text-xs text-slate-600">Ref: {tx.reference}</div>
                      )}
                    </div>
                    <div
                      className={`font-semibold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              {result.unmatchedBankTxs.length === 0 && (
                <div className="p-4 text-center text-slate-600 text-sm">
                  No hay transacciones bancarias sin coincidencia
                </div>
              )}
            </div>
          </div>

          {/* Transacciones Contables Sin Coincidencia */}
          <div>
            <h4 className="font-medium mb-2 text-purple-600">
              Registros Contables ({result.unmatchedAccountingTxs.length})
            </h4>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {result.unmatchedAccountingTxs.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedAccountingTx(tx.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-purple-50 ${
                    selectedAccountingTx === tx.id ? 'bg-purple-100 border-purple-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{tx.description}</div>
                      <div className="text-xs text-slate-600">{tx.entry_date}</div>
                      <div className="text-xs text-slate-600">Cuenta: {tx.account_code}</div>
                      {tx.reference && (
                        <div className="text-xs text-slate-600">Ref: {tx.reference}</div>
                      )}
                    </div>
                    <div
                      className={`font-semibold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              {result.unmatchedAccountingTxs.length === 0 && (
                <div className="p-4 text-center text-slate-600 text-sm">
                  No hay registros contables sin coincidencia
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón de Match Manual */}
        <div className="mt-4 text-center">
          <button
            onClick={handleManualMatch}
            disabled={!selectedBankTx || !selectedAccountingTx}
            className={`px-6 py-2 rounded-lg font-medium ${
              selectedBankTx && selectedAccountingTx
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 inline mr-2" />
            Crear Match Manual
          </button>
          {selectedBankTx && selectedAccountingTx && (
            <div className="mt-2 text-sm text-slate-700">
              Coincidiendo transacción bancaria #{selectedBankTx} con registro contable #
              {selectedAccountingTx}
            </div>
          )}
        </div>
      </div>

      {/* Discrepancias */}
      {result.discrepancies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            Discrepancias ({result.discrepancies.length})
          </h3>
          <div className="space-y-3">
            {result.discrepancies.map((disc, index) => (
              <div
                key={index}
                className="border-l-4 border-red-500 bg-red-50 p-4 rounded"
              >
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">
                      {disc.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-red-800 mt-1">{disc.description}</div>
                    {disc.difference && (
                      <div className="text-sm text-red-700 mt-1">
                        Diferencia: ${Math.abs(disc.difference).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleAutoReconcile}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Volver a Reconciliar
        </button>
        <div className="space-x-3">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center inline-flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Reporte
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completar Reconciliación
          </button>
        </div>
      </div>
    </div>
  );
};
