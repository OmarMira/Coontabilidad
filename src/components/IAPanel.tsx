/**
 * PANEL DE IA NO INTRUSIVA - ORDEN N°1 IMPLEMENTACIÓN MATERIAL
 * 
 * Componente que conecta con IAService para mostrar datos reales de vistas _summary
 * - Botón "Obtener Resumen Financiero" que llama a querySummary('financial_summary')
 * - Botón "Obtener Resumen Impuestos Florida" que llama a querySummary('tax_summary_florida')
 * - Muestra resultados en tablas con datos numéricos reales
 */

import React, { useState } from 'react';
import { 
  Brain, 
  X, 
  Minimize2, 
  Maximize2, 
  RefreshCw,
  Shield,
  DollarSign,
  FileText
} from 'lucide-react';
import { iaService } from '../services/IAService';
import { logger } from '../core/logging/SystemLogger';

interface IAPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IAPanel: React.FC<IAPanelProps> = ({ isVisible, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleGetFinancialSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('IAPanel', 'financial_summary_request', 'Usuario solicitó resumen financiero via IA');
      
      const result = await iaService.querySummary('financial_summary');
      setFinancialData(result);
      setLastUpdate(new Date());
      
      logger.info('IAPanel', 'financial_summary_success', 'Resumen financiero obtenido exitosamente', { 
        recordsReturned: result.length
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('IAPanel', 'financial_summary_failed', 'Error al obtener resumen financiero', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTaxSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('IAPanel', 'tax_summary_request', 'Usuario solicitó resumen de impuestos Florida via IA');
      
      const result = await iaService.querySummary('tax_summary_florida');
      setTaxData(result);
      setLastUpdate(new Date());
      
      logger.info('IAPanel', 'tax_summary_success', 'Resumen de impuestos Florida obtenido exitosamente', { 
        recordsReturned: result.length
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('IAPanel', 'tax_summary_failed', 'Error al obtener resumen de impuestos', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-slate-900 text-slate-100 rounded-lg shadow-2xl border border-slate-700 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-auto max-h-[600px]'
      }`}>
        {/* CABECERA CON ICONO */}
        <div className="flex items-center justify-between p-4 bg-slate-800 rounded-t-lg border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="font-semibold text-slate-100">IA No Intrusiva</h3>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Solo-Lectura</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-slate-400" /> : <Minimize2 className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        {!isMinimized && (
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {/* ERROR */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* BOTONES DE ACCIÓN - ORDEN N°1 */}
            <div className="space-y-3">
              <button
                onClick={handleGetFinancialSummary}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                <span>Obtener Resumen Financiero</span>
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              </button>

              <button
                onClick={handleGetTaxSummary}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Obtener Resumen Impuestos Florida</span>
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              </button>
            </div>

            {/* RESULTADOS FINANCIEROS */}
            {financialData.length > 0 && (
              <div className="bg-blue-900/10 border border-blue-700 rounded-lg p-3">
                <h4 className="font-medium text-blue-300 mb-2">📊 Resumen Financiero</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-blue-700">
                        {Object.keys(financialData[0]).map((key) => (
                          <th key={key} className="text-left p-2 text-blue-200">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.map((row, index) => (
                        <tr key={index} className="border-b border-blue-800">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="p-2 text-blue-100">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RESULTADOS DE IMPUESTOS */}
            {taxData.length > 0 && (
              <div className="bg-green-900/10 border border-green-700 rounded-lg p-3">
                <h4 className="font-medium text-green-300 mb-2">🏛️ Resumen Impuestos Florida</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-700">
                        {Object.keys(taxData[0]).map((key) => (
                          <th key={key} className="text-left p-2 text-green-200">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.map((row, index) => (
                        <tr key={index} className="border-b border-green-800">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="p-2 text-green-100">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ÚLTIMA ACTUALIZACIÓN */}
            {lastUpdate && (
              <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
                Última consulta: {lastUpdate.toLocaleTimeString()}
              </div>
            )}

            {/* DISCLAIMER */}
            <div className="text-xs text-slate-500 text-center bg-slate-800 p-2 rounded">
              🔒 Acceso exclusivo a vistas _summary • No modifica datos del sistema
            </div>
          </div>
        )}
      </div>
    </div>
  );
};