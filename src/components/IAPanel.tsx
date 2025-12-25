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
  AlertCircle,
  BarChart3,
  ArrowRight,
  Search,
  RefreshCw,
  Shield
} from 'lucide-react';
import { iaService, IAResponse } from '../services/IAService';
import { logger } from '../core/logging/SystemLogger';

interface IAPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IAPanel: React.FC<IAPanelProps> = ({ isVisible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-refresh cada 2 minutos para análisis completo
  useEffect(() => {
    if (isVisible) {
      loadAnalysis();
      
      const interval = setInterval(() => {
        loadAnalysis();
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

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



  if (!isVisible) return null;

  return (
    <div className="space-y-4">
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
          <span className="ml-2 text-white">Analizando datos financieros...</span>
        </div>
      )}

      {/* Botón de actualización */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalysis}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          title="Actualizar análisis completo"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Análisis</span>
        </button>
      </div>



      {/* ANÁLISIS COMPLETO ESTRUCTURADO */}
      {analysis && !isLoading && (
        <div className="space-y-4">
          {/* SECCIÓN DE ALERTAS */}
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-300" />
              <h4 className="font-semibold text-white text-base">⚠️ ALERTAS</h4>
            </div>
            <div className="space-y-2">
              {analysis.alerts.map((alert, index) => (
                <p key={index} className="text-sm text-white bg-red-800/30 p-2 rounded">{alert}</p>
              ))}
            </div>
          </div>

          {/* SECCIÓN DE DATOS */}
          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-300" />
              <h4 className="font-semibold text-white text-base">📊 DATOS</h4>
            </div>
            <div className="space-y-3">
              {analysis.data.financial && analysis.data.financial.length > 0 && (
                <div>
                  <p className="text-sm text-white font-medium mb-2">Estructura Contable:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {analysis.data.financial.map((item: any, index: number) => (
                      <div key={index} className="bg-blue-800/30 p-3 rounded">
                        <span className="text-white font-medium">{item.reporte || item.account_type}:</span>
                        <span className="text-blue-200 ml-1 font-semibold">{item.total_activos || item.cantidad_cuentas}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analysis.data.invoices && analysis.data.invoices.length > 0 && (
                <div>
                  <p className="text-sm text-white font-medium mb-2">Estado de Facturas:</p>
                  <div className="space-y-2 text-sm">
                    {analysis.data.invoices.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between bg-blue-800/30 p-3 rounded">
                        <span className="text-white font-medium">{item.status}:</span>
                        <span className="text-blue-200 font-semibold">{item.cantidad_facturas} facturas</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN DE ACCIONES */}
          <div className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-center space-x-2 mb-3">
              <ArrowRight className="w-5 h-5 text-green-300" />
              <h4 className="font-semibold text-white text-base">👉 ACCIONES RECOMENDADAS</h4>
            </div>
            <div className="space-y-2">
              {analysis.actions.map((action, index) => (
                <p key={index} className="text-sm text-white bg-green-800/30 p-2 rounded">{action}</p>
              ))}
            </div>
          </div>

          {/* SECCIÓN DE ANÁLISIS */}
          <div className="bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="w-5 h-5 text-purple-300" />
              <h4 className="font-semibold text-white text-base">🔍 ANÁLISIS DETALLADO</h4>
            </div>
            <div className="text-sm text-white bg-purple-800/30 p-3 rounded whitespace-pre-line">
              {analysis.analysis}
            </div>
          </div>
        </div>
      )}

      {/* ÚLTIMA ACTUALIZACIÓN */}
      {lastUpdate && (
        <div className="text-sm text-white text-center pt-3 border-t border-gray-500 bg-gray-700/50 p-2 rounded">
          ⏰ Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* DISCLAIMER */}
      <div className="text-sm text-white text-center bg-gray-600 p-3 rounded font-medium">
        🔒 Acceso exclusivo a vistas _summary • No modifica datos del sistema
      </div>
    </div>
  );
};