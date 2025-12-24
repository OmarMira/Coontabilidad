import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, FileText, Calculator } from 'lucide-react';
import { 
  createJournalEntry, 
  getJournalEntries, 
  generateSalesJournalEntry,
  generatePurchaseJournalEntry,
  JournalEntry,
  getInvoiceById,
  getBillById
} from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

export function JournalEntryTest() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const loadJournalEntries = async () => {
    try {
      setLoading(true);
      logger.info('JournalEntryTest', 'load_start', 'Cargando asientos contables');
      
      const entries = getJournalEntries(20);
      setJournalEntries(entries);
      
      logger.info('JournalEntryTest', 'load_success', `Asientos cargados: ${entries.length}`);
    } catch (error) {
      logger.error('JournalEntryTest', 'load_failed', 'Error al cargar asientos', null, error as Error);
      setError('Error al cargar asientos contables');
    } finally {
      setLoading(false);
    }
  };

  const testManualJournalEntry = async () => {
    try {
      logger.info('JournalEntryTest', 'manual_test_start', 'Probando creación manual de asiento');
      
      const testEntry = {
        entry_date: new Date().toISOString().split('T')[0],
        reference_number: `TEST-${Date.now()}`,
        description: 'Asiento de prueba manual'
      };

      const testDetails = [
        {
          account_code: '1111', // Caja Chica
          debit_amount: 1000,
          credit_amount: 0,
          description: 'Entrada de efectivo'
        },
        {
          account_code: '4110', // Ventas
          debit_amount: 0,
          credit_amount: 1000,
          description: 'Venta de servicios'
        }
      ];

      const result = await createJournalEntry(testEntry, testDetails);
      
      const testResult = {
        test: 'Manual Journal Entry',
        success: result.success,
        message: result.message,
        entryId: result.entryId,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);
      
      if (result.success) {
        logger.info('JournalEntryTest', 'manual_test_success', 'Asiento manual creado exitosamente', { entryId: result.entryId });
        await loadJournalEntries(); // Recargar
      } else {
        logger.error('JournalEntryTest', 'manual_test_failed', 'Error en asiento manual', { error: result.message });
      }

      return result;
    } catch (error) {
      logger.error('JournalEntryTest', 'manual_test_error', 'Excepción en prueba manual', null, error as Error);
      const testResult = {
        test: 'Manual Journal Entry',
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [testResult, ...prev]);
      return { success: false, message: 'Error en prueba manual' };
    }
  };

  const testSalesJournalEntry = async () => {
    try {
      logger.info('JournalEntryTest', 'sales_test_start', 'Probando asiento automático de venta');
      
      // Obtener la primera factura disponible
      const invoice = getInvoiceById(1);
      if (!invoice) {
        const testResult = {
          test: 'Sales Journal Entry',
          success: false,
          message: 'No hay facturas disponibles para probar',
          timestamp: new Date().toISOString()
        };
        setTestResults(prev => [testResult, ...prev]);
        return;
      }

      const result = generateSalesJournalEntry(invoice);
      
      const testResult = {
        test: 'Sales Journal Entry',
        success: result.success,
        message: result.message,
        entryId: result.entryId,
        invoiceNumber: invoice.invoice_number,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);
      
      if (result.success) {
        logger.info('JournalEntryTest', 'sales_test_success', 'Asiento de venta creado exitosamente', { 
          entryId: result.entryId,
          invoiceNumber: invoice.invoice_number 
        });
        await loadJournalEntries(); // Recargar
      } else {
        logger.error('JournalEntryTest', 'sales_test_failed', 'Error en asiento de venta', { error: result.message });
      }

    } catch (error) {
      logger.error('JournalEntryTest', 'sales_test_error', 'Excepción en prueba de venta', null, error as Error);
      const testResult = {
        test: 'Sales Journal Entry',
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [testResult, ...prev]);
    }
  };

  const testPurchaseJournalEntry = async () => {
    try {
      logger.info('JournalEntryTest', 'purchase_test_start', 'Probando asiento automático de compra');
      
      // Obtener la primera factura de compra disponible
      const bill = getBillById(1);
      if (!bill) {
        const testResult = {
          test: 'Purchase Journal Entry',
          success: false,
          message: 'No hay facturas de compra disponibles para probar',
          timestamp: new Date().toISOString()
        };
        setTestResults(prev => [testResult, ...prev]);
        return;
      }

      const result = generatePurchaseJournalEntry(bill);
      
      const testResult = {
        test: 'Purchase Journal Entry',
        success: result.success,
        message: result.message,
        entryId: result.entryId,
        billNumber: bill.bill_number,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);
      
      if (result.success) {
        logger.info('JournalEntryTest', 'purchase_test_success', 'Asiento de compra creado exitosamente', { 
          entryId: result.entryId,
          billNumber: bill.bill_number 
        });
        await loadJournalEntries(); // Recargar
      } else {
        logger.error('JournalEntryTest', 'purchase_test_failed', 'Error en asiento de compra', { error: result.message });
      }

    } catch (error) {
      logger.error('JournalEntryTest', 'purchase_test_error', 'Excepción en prueba de compra', null, error as Error);
      const testResult = {
        test: 'Purchase Journal Entry',
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [testResult, ...prev]);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testManualJournalEntry();
    await testSalesJournalEntry();
    await testPurchaseJournalEntry();
  };

  useEffect(() => {
    loadJournalEntries();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pruebas de Asientos Contables</h1>
          <p className="text-gray-400">Verificación del sistema de doble entrada</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadJournalEntries}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recargar</span>
          </button>
          <button
            onClick={runAllTests}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Calculator className="h-4 w-4" />
            <span>Ejecutar Pruebas</span>
          </button>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={testManualJournalEntry}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left transition-colors"
        >
          <div className="font-semibold">Asiento Manual</div>
          <div className="text-sm opacity-90">Crear asiento de prueba</div>
        </button>
        
        <button
          onClick={testSalesJournalEntry}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left transition-colors"
        >
          <div className="font-semibold">Asiento de Venta</div>
          <div className="text-sm opacity-90">Generar desde factura</div>
        </button>
        
        <button
          onClick={testPurchaseJournalEntry}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-left transition-colors"
        >
          <div className="font-semibold">Asiento de Compra</div>
          <div className="text-sm opacity-90">Generar desde bill</div>
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resultados de Pruebas</h3>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg ${result.success ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                      {result.test}
                    </div>
                    <div className={`text-sm ${result.success ? 'text-green-200' : 'text-red-200'}`}>
                      {result.message}
                    </div>
                    {result.entryId && (
                      <div className="text-xs text-gray-400 mt-1">
                        Entry ID: {result.entryId}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal Entries List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-700 px-6 py-3 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">Asientos Contables Recientes</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando asientos...</p>
          </div>
        ) : journalEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>No hay asientos contables</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${entry.is_balanced ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <div className="font-semibold text-white">
                        {entry.reference_number || `Asiento #${entry.id}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.entry_date} - {entry.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">
                      ${entry.total_debit.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.is_balanced ? 'Balanceado' : 'Desbalanceado'}
                    </div>
                  </div>
                </div>
                
                {entry.details && entry.details.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {entry.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-gray-400">{detail.account_code}</span>
                          <span className="text-gray-300">{detail.account?.account_name}</span>
                        </div>
                        <div className="flex space-x-4 font-mono">
                          <span className={detail.debit_amount > 0 ? 'text-green-400' : 'text-gray-500'}>
                            D: {detail.debit_amount.toFixed(2)}
                          </span>
                          <span className={detail.credit_amount > 0 ? 'text-blue-400' : 'text-gray-500'}>
                            C: {detail.credit_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}