/**
 * PANEL DE IA NO INTRUSIVA - SISTEMA COMPLETO RESTAURADO
 * 
 * Asistente Financiero de Solo-Lectura con formato estructurado:
 * - Secciones con iconos (Alertas, Datos, Acciones, Análisis)
 * - Colores legibles en modo oscuro/claro
 * - Acceso exclusivo a vistas _summary
 * - Conexión real a base de datos (ORDEN N°1)
 * - Análisis completo estructurado (Sistema original)
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  X, 
  Minimize2, 
  Maximize2, 
  AlertCircle,
  BarChart3,
  ArrowRight,
  Search,
  RefreshCw,
  Shield,
  DollarSign,
  FileText
} from 'lucide-react';
import { iaService, IAResponse } from '../services/IAService';
import { logger } from '../core/logging/SystemLogger';

interface IAPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IAPanel: React.FC<IAPanelProps> = ({ isVisible, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IAResponse | null>(null);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-refresh cada 2 minutos para análisis completo
  useEffect(() => {
    if (isVisible && !isMinimized) {
      loadAnalysis();
      
      const interval = setInterval(() => {
        loadAnalysis();
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, isMinimized]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('IAPanel', 'analysis_request', 'Usuario solicitó análisis financiero completo');
      
      const result = await iaService.analyzeFinancialHealth();
      setAnalysis(result);
      setLastUpdate(new Date());
      
      logger.info('IAPanel', 'analysis_success', 'Análisis financiero IA completado', { 
        alertsCount: result.alerts.length,
        actionsCount: result.actions.length
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('IAPanel', 'analysis_failed', 'Error en análisis IA', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

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
              <h3 className="font-semibold text-slate-100">Asistente Financiero IA</h3>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Solo-Lectura</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={loadAnalysis}
              disabled={isLoading}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Actualizar análisis completo"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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

            {/* LOADING */}
            {isLoading && (
              <div className="flex items-center justify-center p-6">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="ml-2 text-slate-300">Analizando datos financieros...</span>
              </div>
            )}

            {/* BOTONES DE CONSULTA DIRECTA - ORDEN N°1 */}
            <div className="space-y-2">
              <button
                onClick={handleGetFinancialSummary}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <DollarSign className="w-4 h-4" />
                <span>Consulta Directa: Resumen Financiero</span>
              </button>

              <button
                onClick={handleGetTaxSummary}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Consulta Directa: Impuestos Florida</span>
              </button>
            </div>

            {/* RESULTADOS DE CONSULTAS DIRECTAS */}
            {financialData.length > 0 && (
              <div className="bg-blue-900/10 border border-blue-700 rounded-lg p-3">
                <h4 className="font-medium text-blue-300 mb-2">📊 Datos Financieros (Vista Directa)</h4>
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

            {taxData.length > 0 && (
              <div className="bg-green-900/10 border border-green-700 rounded-lg p-3">
                <h4 className="font-medium text-green-300 mb-2">🏛️ Impuestos Florida (Vista Directa)</h4>
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

            {/* ANÁLISIS COMPLETO ESTRUCTURADO */}
            {analysis && !isLoading && (
              <div className="space-y-4">
                {/* SECCIÓN DE ALERTAS */}
                <div className="bg-red-900/10 border-l-4 border-red-500 p-3 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <h4 className="font-medium text-red-300">⚠️ ALERTAS</h4>
                  </div>
                  <div className="space-y-1">
                    {analysis.alerts.map((alert, index) => (
                      <p key={index} className="text-sm text-red-200">{alert}</p>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN DE DATOS */}
                <div className="bg-blue-900/10 border-l-4 border-blue-500 p-3 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <h4 className="font-medium text-blue-300">📊 DATOS</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.data.financial && analysis.data.financial.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Estructura Contable:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {analysis.data.financial.map((item: any, index: number) => (
                            <div key={index} className="bg-slate-800 p-2 rounded">
                              <span className="text-slate-300">{item.reporte || item.account_type}:</span>
                              <span className="text-blue-300 ml-1">{item.total_activos || item.cantidad_cuentas}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.data.invoices && analysis.data.invoices.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Estado de Facturas:</p>
                        <div className="space-y-1 text-sm">
                          {analysis.data.invoices.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="flex justify-between bg-slate-800 p-2 rounded">
                              <span className="text-slate-300">{item.status}:</span>
                              <span className="text-blue-300">{item.cantidad_facturas} facturas</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN DE ACCIONES */}
                <div className="bg-green-900/10 border-l-4 border-green-500 p-3 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowRight className="w-5 h-5 text-green-400" />
                    <h4 className="font-medium text-green-300">👉 ACCIONES RECOMENDADAS</h4>
                  </div>
                  <div className="space-y-1">
                    {analysis.actions.map((action, index) => (
                      <p key={index} className="text-sm text-green-200">{action}</p>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN DE ANÁLISIS */}
                <div className="bg-purple-900/10 border-l-4 border-purple-500 p-3 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Search className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium text-purple-300">🔍 ANÁLISIS DETALLADO</h4>
                  </div>
                  <div className="text-sm text-purple-200 whitespace-pre-line">
                    {analysis.analysis}
                  </div>
                </div>
              </div>
            )}

            {/* ÚLTIMA ACTUALIZACIÓN */}
            {lastUpdate && (
              <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
                Última actualización: {lastUpdate.toLocaleTimeString()}
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