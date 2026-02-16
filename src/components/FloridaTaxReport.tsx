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
import { getFloridaCountyNames } from '../data/floridaCounties';
import { logger } from '../core/logging/SystemLogger';
import { useLocale } from '../i18n/useLocale';

export const FloridaTaxReport: React.FC = () => {
  const { t, language } = useLocale();
  const [reports, setReports] = useState<FloridaDR15Report[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [floridaCounties, setFloridaCounties] = useState<string[]>([]);
  const [currentReport, setCurrentReport] = useState<FloridaDR15Report | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calculate' | 'view'>('list');

  useEffect(() => {
    loadReports();
    loadAvailablePeriods();
    loadFloridaCounties();
  }, []);

  const loadFloridaCounties = () => {
    try {
      const counties = getFloridaCountyNames();
      setFloridaCounties(counties);
      // Seleccionar Miami-Dade por defecto
      if (!selectedCounty && counties.length > 0) {
        setSelectedCounty('Miami-Dade');
      }
      logger.info('FloridaTaxReport', 'load_counties_success', 'Condados de Florida cargados', { count: counties.length });
    } catch (error) {
      setError(t('floridaTaxReport.loadCountiesError'));
      logger.error('FloridaTaxReport', 'load_counties_error', 'Error al cargar condados', null, error as Error);
    }
  };

  const loadReports = () => {
    try {
      const savedReports = getDR15Reports();
      setReports(savedReports);
      logger.info('FloridaTaxReport', 'load_reports_success', 'Reportes DR-15 cargados', { count: savedReports.length });
    } catch (error) {
      setError(t('floridaTaxReport.loadReportsError'));
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
      setError(t('floridaTaxReport.loadPeriodsError'));
      logger.error('FloridaTaxReport', 'load_periods_error', 'Error al cargar períodos', null, error as Error);
    }
  };

  const calculateReport = async () => {
    if (!selectedPeriod) {
      setError(t('floridaTaxReport.selectPeriodError'));
      return;
    }

    if (!selectedCounty) {
      setError(t('floridaTaxReport.selectCountyError'));
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      logger.info('FloridaTaxReport', 'calculate_start', 'Calculando reporte DR-15', {
        period: selectedPeriod,
        county: selectedCounty
      });

      const report = calculateFloridaDR15Report(selectedPeriod);

      if (!report) {
        setError(t('floridaTaxReport.noCalculatedReportError'));
        return;
      }

      // Filtrar por condado si se especifica
      if (selectedCounty && selectedCounty !== 'Todos') {
        report.countyBreakdown = report.countyBreakdown.filter(
          county => county.county === selectedCounty
        );

        // Recalcular totales para el condado específico
        report.totalTaxableSales = report.countyBreakdown.reduce(
          (sum, county) => sum + county.taxableAmount, 0
        );
        report.totalTaxCollected = report.countyBreakdown.reduce(
          (sum, county) => sum + county.taxAmount, 0
        );
        report.netTaxDue = report.totalTaxCollected;
      }

      setCurrentReport(report);
      setViewMode('view');

      logger.info('FloridaTaxReport', 'calculate_success', 'Reporte calculado correctamente', {
        county: selectedCounty,
        totalSales: report.totalTaxableSales,
        totalTax: report.totalTaxCollected
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setError(t('floridaTaxReport.calculateError', { message: errorMsg }));
      logger.error('FloridaTaxReport', 'calculate_error', 'Error en cálculo', {
        period: selectedPeriod,
        county: selectedCounty
      }, error as Error);
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
      setError(t('floridaTaxReport.saveError', { message: errorMsg }));
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
      setError(t('floridaTaxReport.markFiledError'));
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
    return new Intl.NumberFormat(language === 'es' ? 'es-US' : 'en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  /* 
   * Configuración de Worker Orchestrator para procesamiento off-main-thread
   */
  // Lazy load del orchestrator solo cuando se necesite
  const [orchestrator, setOrchestrator] = useState<any>(null);

  useEffect(() => {
    // Cargar dinámicamente el orchestrator
    import('../core/workers/WorkerOrchestrator').then(module => {
      setOrchestrator(new module.WorkerOrchestrator());
    });
  }, []);

  const exportToCSV = async () => {
    if (!currentReport) {
      setError(t('floridaTaxReport.noReportToExport'));
      return;
    }

    if (!selectedPeriod) {
      setError(t('floridaTaxReport.selectPeriodError'));
      return;
    }

    setIsExporting(true);

    try {
      logger.info('FloridaTaxReport', 'csv_export_start', 'Iniciando exportación CSV', {
        period: currentReport.period,
        counties: currentReport.countyBreakdown.length
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `reporte_dr15_${currentReport.period}_${timestamp}.csv`;

      // Preparar datos para el worker
      const headers = [
        t('floridaTaxReport.period'),
        t('floridaTaxReport.county'),
        `${t('floridaTaxReport.rate')} (%)`,
        `${t('floridaTaxReport.taxableSales')} ($)`,
        `${t('floridaTaxReport.taxes')} ($)`,
        `${t('floridaTaxReport.exemptSales')} ($)`,
        `${t('floridaTaxReport.netTaxDue')} ($)`
      ];

      const rows = currentReport.countyBreakdown.map(county => [
        currentReport.period,
        county.county,
        (county.rate * 100).toFixed(2),
        county.taxableAmount.toFixed(2),
        county.taxAmount.toFixed(2),
        currentReport.exemptSales.toFixed(2),
        currentReport.netTaxDue.toFixed(2)
      ]);

      // Agregar fila de totales
      rows.push([
        t('common.total').toUpperCase(),
        `${currentReport.countyBreakdown.length} ${t('floridaTaxReport.countiesIncluded')}`,
        '',
        currentReport.totalTaxableSales.toFixed(2),
        currentReport.totalTaxCollected.toFixed(2),
        currentReport.exemptSales.toFixed(2),
        currentReport.netTaxDue.toFixed(2)
      ]);

      if (orchestrator) {
        // Usar Worker para generar CSV si está disponible
        const result = await orchestrator.executeTask('CSV_PROCESSING', {
          headers,
          rows,
          filename
        });

        // Descargar el blob recibido del worker
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccess(t('floridaTaxReport.exportSuccess', { filename }));
      } else {
        // Fallback a generación síncrona si worker no está listo
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccess(t('floridaTaxReport.exportSuccess', { filename }));
      }

      logger.info('FloridaTaxReport', 'csv_export_success', 'CSV exportado exitosamente');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setError(t('floridaTaxReport.exportError', { message: errorMsg }));
      logger.error('FloridaTaxReport', 'csv_export_error', 'Error en exportación CSV', null, error as Error);
    } finally {
      setIsExporting(false);
    }
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
            <h1 className="text-2xl font-black tracking-tight text-white">{t('floridaTaxReport.title')}</h1>
            <p className="text-slate-500">{t('floridaTaxReport.period')}: {currentReport.period}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExporting ? t('floridaTaxReport.exporting') : t('floridaTaxReport.exportCsv')}</span>
            </button>
            <button
              onClick={saveReport}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{isSaving ? t('floridaTaxReport.saving') : t('floridaTaxReport.saveReport')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="bg-gray-600 hover:bg-white/5 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('floridaTaxReport.back')}
            </button>
          </div>
        </div>

        {/* Resumen del Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">{t('floridaTaxReport.taxableSales')}</p>
                <p className="text-2xl font-black tracking-tight text-white">
                  {formatCurrency(currentReport.totalTaxableSales)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">{t('floridaTaxReport.taxesCollected')}</p>
                <p className="text-2xl font-black tracking-tight text-white">
                  {formatCurrency(currentReport.totalTaxCollected)}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">{t('floridaTaxReport.exemptSales')}</p>
                <p className="text-2xl font-black tracking-tight text-white">
                  {formatCurrency(currentReport.exemptSales)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">{t('floridaTaxReport.netTaxDue')}</p>
                <p className="text-2xl font-black tracking-tight text-white">
                  {formatCurrency(currentReport.netTaxDue)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Desglose por Condado */}
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-400" />
            {t('floridaTaxReport.countyBreakdown')}
          </h3>

          {currentReport.countyBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400">{t('floridaTaxReport.county')}</th>
                    <th className="text-right py-3 px-4 text-slate-400">{t('floridaTaxReport.rate')}</th>
                    <th className="text-right py-3 px-4 text-slate-400">{t('floridaTaxReport.taxableSales')}</th>
                    <th className="text-right py-3 px-4 text-slate-400">{t('floridaTaxReport.tax')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.countyBreakdown.map((county, index) => (
                    <tr key={index} className="border-b border-white/10/50">
                      <td className="py-3 px-4 text-white">{county.county}</td>
                      <td className="py-3 px-4 text-right text-slate-400">
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
            <p className="text-slate-500 text-center py-8">
              {t('floridaTaxReport.noSalesForPeriod')}
            </p>
          )}
        </div>

        {/* Información del Reporte */}
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('floridaTaxReport.reportInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-sm">{t('floridaTaxReport.period')}</p>
              <p className="text-white">{currentReport.period}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">{t('floridaTaxReport.dueDateLabel')}</p>
              <p className="text-white">{formatDate(currentReport.dueDate)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">{t('floridaTaxReport.status')}</p>
              <p className={`capitalize ${getStatusColor(currentReport.status)}`}>
                {currentReport.status === 'pending' ? t('floridaTaxReport.pending') :
                  currentReport.status === 'filed' ? t('floridaTaxReport.filed') :
                    currentReport.status === 'paid' ? t('floridaTaxReport.paid') : t('floridaTaxReport.late')}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">{t('floridaTaxReport.countiesIncluded')}</p>
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
            <h1 className="text-2xl font-black tracking-tight text-white">{t('floridaTaxReport.calculateTitle')}</h1>
            <p className="text-slate-500">{t('floridaTaxReport.calculateSubtitle')}</p>
          </div>
          <button
            onClick={() => setViewMode('list')}
            className="bg-gray-600 hover:bg-white/5 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('floridaTaxReport.back')}
          </button>
        </div>

        {/* Formulario de Cálculo */}
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('floridaTaxReport.selectPeriodAndCounty')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">
                {t('floridaTaxReport.fiscalPeriod')}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('floridaTaxReport.selectPeriod')}</option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
              <p className="text-slate-500 text-xs mt-1">
                {t('floridaTaxReport.completedPeriodsOnly')}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-2">
                {t('floridaTaxReport.floridaCounty')}
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('floridaTaxReport.selectCounty')}</option>
                <option value="Todos">{t('floridaTaxReport.allCounties')}</option>
                {floridaCounties.map(county => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              <p className="text-slate-500 text-xs mt-1">
                {floridaCounties.length} {t('floridaTaxReport.countiesAvailable')}
              </p>
            </div>

            <div className="flex items-end">
              <button
                onClick={calculateReport}
                disabled={!selectedPeriod || !selectedCounty || isCalculating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {isCalculating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                <span>{isCalculating ? t('floridaTaxReport.calculating') : t('floridaTaxReport.generateReport')}</span>
              </button>
            </div>
          </div>

          {/* Información sobre DR-15 */}
          <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">{t('floridaTaxReport.aboutDr15')}</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• {t('floridaTaxReport.dr15OfficialDesc')}</li>
              <li>• {t('floridaTaxReport.dr15Frequency')}</li>
              <li>• {t('floridaTaxReport.dr15Breakdown')}</li>
              <li>• {t('floridaTaxReport.dr15DueDate')}</li>
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
          <h1 className="text-2xl font-black tracking-tight text-white">{t('floridaTaxReport.title')}</h1>
          <p className="text-slate-500">{t('floridaTaxReport.subtitle')}</p>
        </div>
        <button
          onClick={() => setViewMode('calculate')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{t('floridaTaxReport.newReport')}</span>
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
      <div className="bg-white/10 rounded-lg">
        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-slate-400">{t('floridaTaxReport.period')}</th>
                  <th className="text-right py-4 px-6 text-slate-400">{t('floridaTaxReport.taxableSales')}</th>
                  <th className="text-right py-4 px-6 text-slate-400">{t('floridaTaxReport.taxes')}</th>
                  <th className="text-center py-4 px-6 text-slate-400">{t('floridaTaxReport.status')}</th>
                  <th className="text-center py-4 px-6 text-slate-400">{t('floridaTaxReport.dueDate')}</th>
                  <th className="text-center py-4 px-6 text-slate-400">{t('floridaTaxReport.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="border-b border-white/10/50 hover:bg-white/5/30">
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
                          {report.status === 'pending' ? t('floridaTaxReport.pending') :
                            report.status === 'filed' ? t('floridaTaxReport.filed') :
                              report.status === 'paid' ? t('floridaTaxReport.paid') : t('floridaTaxReport.late')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-400 text-sm">
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
                          title={t('floridaTaxReport.viewReport')}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>

                        {report.status === 'pending' && (
                          <button
                            onClick={() => markAsFiled(report.period)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                            title={t('floridaTaxReport.markAsFiled')}
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setCurrentReport(report);
                            exportToCSV();
                          }}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title={t('floridaTaxReport.exportCsv')}
                        >
                          <Download className="w-4 h-4 text-green-400" />
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
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-black tracking-tight text-white mb-2">{t('floridaTaxReport.noReports')}</h3>
            <p className="text-slate-500 mb-6">
              {t('floridaTaxReport.noReportsDesc')}
            </p>
            <button
              onClick={() => setViewMode('calculate')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {t('floridaTaxReport.createFirstReport')}
            </button>
          </div>
        )}
      </div>

      {/* Información Legal */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-medium mb-1">{t('floridaTaxReport.legalNotice')}</h4>
            <p className="text-yellow-200 text-sm">
              {t('floridaTaxReport.legalNoticeDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloridaTaxReport;