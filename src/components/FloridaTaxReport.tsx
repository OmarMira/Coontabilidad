/**
 * COMPONENTE DE REPORTES FLORIDA DR-15
 * 
 * Cumple con requisitos legales de Florida para reportes de impuestos sobre ventas
 * - Cálculo automático por período (trimestral/mensual)
 * - Desglose por condado de Florida
 * - Exportación a PDF para presentación oficial
 * - Historial de reportes presentados
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator,
  Printer,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react';
import { 
  calculateFloridaDR15Report, 
  saveDR15Report, 
  getDR15Reports, 
  markDR15ReportAsFiled,
  getAvailableDR15Periods,
  FloridaDR15Report 
} from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

export const FloridaTaxReport: React.FC = () => {
  const [reports, setReports] = useState<FloridaDR15Report[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [currentReport, setCurrentReport] = useState<FloridaDR15Report | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calculate' | 'view'>('list');

  useEffect(() => {
    loadReports();
    loadAvailablePeriods();
  }, []);

  const loadReports = () => {
    try {
      const savedReports = getDR15Reports();
      setReports(savedReports);
      logger.info('FloridaTaxReport', 'load_reports_success', 'Reportes DR-15 cargados', { count: savedReports.length });
    } catch (error) {
      setError('Error al cargar reportes guardados');
      logger.error('FloridaTaxReport', 'load_reports_error', 'Error al cargar reportes', null, error as Error);
    }
  };

  const loadAvailablePeriods = () => {
    try {
      const periods = getAvailableDR15Periods();
      setAvailablePeriods(periods);
      if (periods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(periods[0]);
      }
    } catch (error) {
      setError('Error al cargar períodos disponibles');
      logger.error('FloridaTaxReport', 'load_periods_error', 'Error al cargar períodos', null, error as Error);
    }
  };

  const calculateReport = async () => {
    if (!selectedPeriod) {
      setError('Seleccione un período para calcular');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      logger.info('FloridaTaxReport', 'calculate_start', 'Calculando reporte DR-15', { period: selectedPeriod });
      
      const report = calculateFloridaDR15Report(selectedPeriod);
      
      if (!report) {
        setError('No se pudo calcular el reporte. Verifique que existan facturas para el período.');
        return;
      }

      setCurrentReport(report);
      setViewMode('view');
      
      logger.info('FloridaTaxReport', 'calculate_success', 'Reporte calculado correctamente');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al calcular reporte: ${errorMsg}`);
      logger.error('FloridaTaxReport', 'calculate_error', 'Error en cálculo', { period: selectedPeriod }, error as Error);
    } finally {
      setIsCalculating(false);
    }
  };

  const saveReport = async () => {
    if (!currentReport) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = saveDR15Report(currentReport);
      
      if (result.success) {
        setSuccess(result.message);
        loadReports();
        setViewMode('list');
        setCurrentReport(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al guardar reporte: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsFiled = async (period: string) => {
    try {
      const result = markDR15ReportAsFiled(period);
      
      if (result.success) {
        setSuccess(result.message);
        loadReports();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al marcar reporte como presentado');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'late':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed':
        return 'text-green-400';
      case 'paid':
        return 'text-blue-400';
      case 'late':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const exportToPDF = () => {
    if (!currentReport) return;
    
    // Aquí se implementaría la exportación a PDF
    // Por ahora, mostrar información para implementación futura
    setSuccess('Función de exportación PDF será implementada próximamente');
  };

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (viewMode === 'view' && currentReport) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reporte DR-15 Florida</h1>
            <p className="text-gray-400">Período: {currentReport.period}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={saveReport}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Guardando...' : 'Guardar Reporte'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Resumen del Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ventas Gravables</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(currentReport.totalTaxableSales)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Impuestos Recolectados</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(currentReport.totalTaxCollected)}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ventas Exentas</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(currentReport.exemptSales)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Impuesto Neto a Pagar</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(currentReport.netTaxDue)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Desglose por Condado */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-400" />
            Desglose por Condado de Florida
          </h3>
          
          {currentReport.countyBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">Condado</th>
                    <th className="text-right py-3 px-4 text-gray-300">Tasa</th>
                    <th className="text-right py-3 px-4 text-gray-300">Ventas Gravables</th>
                    <th className="text-right py-3 px-4 text-gray-300">Impuesto</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.countyBreakdown.map((county, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-white">{county.county}</td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {(county.rate * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatCurrency(county.taxableAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-400">
                        {formatCurrency(county.taxAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No hay ventas registradas para este período
            </p>
          )}
        </div>

        {/* Información del Reporte */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Información del Reporte</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Período</p>
              <p className="text-white">{currentReport.period}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Fecha de Vencimiento</p>
              <p className="text-white">{formatDate(currentReport.dueDate)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Estado</p>
              <p className={`capitalize ${getStatusColor(currentReport.status)}`}>
                {currentReport.status === 'pending' ? 'Pendiente' :
                 currentReport.status === 'filed' ? 'Presentado' :
                 currentReport.status === 'paid' ? 'Pagado' : 'Vencido'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Condados Incluidos</p>
              <p className="text-white">{currentReport.countyBreakdown.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'calculate') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Calcular Reporte DR-15</h1>
            <p className="text-gray-400">Generar reporte de impuestos para Florida</p>
          </div>
          <button
            onClick={() => setViewMode('list')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>

        {/* Formulario de Cálculo */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Seleccionar Período</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Período Fiscal
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar período...</option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-xs mt-1">
                Solo se muestran períodos completados
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={calculateReport}
                disabled={!selectedPeriod || isCalculating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {isCalculating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                <span>{isCalculating ? 'Calculando...' : 'Calcular Reporte'}</span>
              </button>
            </div>
          </div>

          {/* Información sobre DR-15 */}
          <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">Sobre el Reporte DR-15</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Reporte oficial de impuestos sobre ventas para el estado de Florida</li>
              <li>• Debe presentarse mensualmente o trimestralmente según el volumen de ventas</li>
              <li>• Incluye desglose por condado de Florida</li>
              <li>• Vencimiento: día 20 del mes siguiente al período reportado</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal - Lista de reportes
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes Florida DR-15</h1>
          <p className="text-gray-400">Gestión de reportes de impuestos sobre ventas</p>
        </div>
        <button
          onClick={() => setViewMode('calculate')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        </div>
      )}

      {/* Lista de Reportes */}
      <div className="bg-gray-800 rounded-lg">
        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-300">Período</th>
                  <th className="text-right py-4 px-6 text-gray-300">Ventas Gravables</th>
                  <th className="text-right py-4 px-6 text-gray-300">Impuestos</th>
                  <th className="text-center py-4 px-6 text-gray-300">Estado</th>
                  <th className="text-center py-4 px-6 text-gray-300">Vencimiento</th>
                  <th className="text-center py-4 px-6 text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{report.period}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-white">
                      {formatCurrency(report.totalTaxableSales)}
                    </td>
                    <td className="py-4 px-6 text-right text-green-400">
                      {formatCurrency(report.totalTaxCollected)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {getStatusIcon(report.status)}
                        <span className={`text-sm capitalize ${getStatusColor(report.status)}`}>
                          {report.status === 'pending' ? 'Pendiente' :
                           report.status === 'filed' ? 'Presentado' :
                           report.status === 'paid' ? 'Pagado' : 'Vencido'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-300 text-sm">
                      {formatDate(report.dueDate)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setCurrentReport(report);
                            setViewMode('view');
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Ver reporte"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {report.status === 'pending' && (
                          <button
                            onClick={() => markAsFiled(report.period)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Marcar como presentado"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                        
                        <button
                          onClick={exportToPDF}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Exportar PDF"
                        >
                          <Download className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No hay reportes DR-15</h3>
            <p className="text-gray-400 mb-6">
              Comience creando su primer reporte de impuestos para Florida
            </p>
            <button
              onClick={() => setViewMode('calculate')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Crear Primer Reporte
            </button>
          </div>
        )}
      </div>

      {/* Información Legal */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-medium mb-1">Aviso Legal</h4>
            <p className="text-yellow-200 text-sm">
              Los reportes DR-15 generados por este sistema son para uso informativo. 
              Siempre verifique los cálculos y consulte con un contador certificado antes de presentar 
              reportes oficiales al Departamento de Ingresos de Florida.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloridaTaxReport;