/**
 * PANEL DE IA NO INTRUSIVA
 * 
 * Cumple con Documento Técnico Oficial Sección 7: "IA No Intrusiva"
 * - Panel flotante que no interfiere con el flujo de trabajo
 * - Solo muestra análisis y recomendaciones (no modifica datos)
 * - Acceso de solo lectura a vistas _summary
 * - Interfaz minimalista y no intrusiva
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  X, 
  Minimize2, 
  Maximize2, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  Shield,
  RefreshCw,
  Eye,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { iaService, IAAnalysis, BusinessInsight } from '../services/IAService';
import { logger } from '../core/logging/SystemLogger';

interface IAPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IAPanel: React.FC<IAPanelProps> = ({ isVisible, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IAAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    if (isVisible && !isMinimized) {
      loadAnalysis();
      
      const interval = setInterval(() => {
        loadAnalysis();
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [isVisible, isMinimized]);

  const loadAnalysis = async () => {
    if (!iaService.isAvailable()) {
      setError('Servicio de IA no disponible');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('IAPanel', 'analysis_request', 'Solicitando análisis de IA');
      
      const result = await iaService.generateCompleteAnalysis();
      setAnalysis(result);
      setLastUpdate(new Date());
      
      logger.info('IAPanel', 'analysis_success', 'Análisis de IA cargado correctamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('IAPanel', 'analysis_error', 'Error al cargar análisis de IA', { error: errorMsg }, err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="w-4 h-4" />;
      case 'tax':
        return <BarChart3 className="w-4 h-4" />;
      case 'operational':
        return <TrendingUp className="w-4 h-4" />;
      case 'compliance':
        return <Shield className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-gray-900 border border-gray-700 rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-64 h-12' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Asistente IA</span>
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => loadAnalysis()}
              disabled={isLoading}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Actualizar análisis"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? 'Maximizar' : 'Minimizar'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-400">Analizando datos...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}

            {analysis && !isLoading && (
              <div className="space-y-4">
                {/* Resumen */}
                <div className="bg-gray-800 rounded-lg p-3">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-purple-400" />
                    Resumen Ejecutivo
                  </h3>
                  <p className="text-gray-300 text-sm whitespace-pre-line">
                    {analysis.summary}
                  </p>
                </div>

                {/* Alertas Críticas */}
                {analysis.alerts.length > 0 && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <h3 className="text-red-300 font-medium mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Alertas Críticas
                    </h3>
                    <ul className="space-y-1">
                      {analysis.alerts.map((alert, index) => (
                        <li key={index} className="text-red-200 text-sm">
                          • {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Insights */}
                {analysis.insights.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-purple-400" />
                      Análisis Inteligente
                    </h3>
                    <div className="space-y-2">
                      {analysis.insights.slice(0, 5).map((insight, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 ${getPriorityColor(insight.priority)}`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex items-center space-x-1 mt-0.5">
                              {getPriorityIcon(insight.priority)}
                              {getTypeIcon(insight.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-medium mb-1">
                                {insight.title}
                              </h4>
                              <p className="text-gray-300 text-xs mb-2">
                                {insight.description}
                              </p>
                              <p className="text-gray-400 text-xs">
                                💡 {insight.recommendation}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 capitalize">
                                  {insight.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {insight.confidence}% confianza
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recomendaciones */}
                {analysis.recommendations.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                    <h3 className="text-blue-300 font-medium mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Recomendaciones
                    </h3>
                    <ul className="space-y-1">
                      {analysis.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="text-blue-200 text-sm">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    IA No Intrusiva • Solo Lectura • Datos Locales
                  </p>
                </div>
              </div>
            )}

            {!analysis && !isLoading && !error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">Asistente IA Listo</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Haz clic en actualizar para obtener análisis inteligente
                  </p>
                  <button
                    onClick={loadAnalysis}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Generar Análisis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IAPanel;