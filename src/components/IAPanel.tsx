/**
 * PANEL DE IA NO INTRUSIVA - ORDEN N°1
 * 
 * Implementación material del principio "IA No Intrusiva"
 * - Panel flotante que no interfiere con el flujo de trabajo
 * - Solo muestra datos de vistas _summary (no modifica datos)
 * - Acceso de solo lectura demostrable
 */

import React, { useState } from 'react';
import { 
  Brain, 
  X, 
  Minimize2, 
  Maximize2, 
  BarChart3,
  DollarSign,
  RefreshCw
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

  // Función para obtener resumen financiero - CRITERIO DE ÉXITO
  const obtenerResumenFinanciero = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('IAPanel', 'get_financial_summary', 'Usuario solicitó resumen financiero');
      
      // Llamar al servicio IA con vista _summary - SOLO LECTURA
      const data = iaService.querySummary('financial_summary');
      setFinancialData(data);
      setLastUpdate(new Date());
      
      logger.info('IAPanel', 'financial_summary_success', 'Resumen financiero obtenido exitosamente', { 
        recordsCount: data.length 
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('IAPanel', 'financial_summary_failed', 'Error al obtener resumen financiero', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener resumen de impuestos Florida
  const obtenerResumenImpuestos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('IAPanel', 'get_tax_summary', 'Usuario solicitó resumen de impuestos');
      
      // Llamar al servicio IA con vista _summary - SOLO LECTURA
      const data = iaService.querySummary('tax_summary_florida');
      setTaxData(data);
      setLastUpdate(new Date());
      
      logger.info('IAPanel', 'tax_summary_success', 'Resumen de impuestos obtenido exitosamente', { 
        recordsCount: data.length 
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
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-64 h-16' : 'w-96 h-auto max-h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-t-lg border-b">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">IA No Intrusiva</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-blue-100 rounded"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {/* Botones de acción */}
            <div className="space-y-2">
              <button
                onClick={obtenerResumenFinanciero}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                <span>Obtener Resumen Financiero</span>
              </button>
              
              <button
                onClick={obtenerResumenImpuestos}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                <span>Obtener Resumen Impuestos FL</span>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Datos Financieros */}
            {financialData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Resumen Financiero:</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <table className="w-full text-sm">
                    <tbody>
                      {financialData.map((row, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td className="font-medium">Reporte:</td>
                            <td>{row.reporte}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Total Activos:</td>
                            <td>${(row.total_activos || 0).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Pasivos + Patrimonio:</td>
                            <td>${(row.total_pasivos_patrimonio || 0).toLocaleString()}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Datos de Impuestos */}
            {taxData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Impuestos por Condado:</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left">Condado</th>
                        <th className="text-right">Facturas</th>
                        <th className="text-right">Impuesto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.county}</td>
                          <td className="text-right">{row.facturas}</td>
                          <td className="text-right">${(row.impuesto_calculado || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Última actualización */}
            {lastUpdate && (
              <div className="text-xs text-gray-500 text-center">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};