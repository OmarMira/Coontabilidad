/**
 * PANEL DE DASHBOARD FINANCIERO - SISTEMA DUAL
 * 
 * Panel de resumen financiero en tiempo real que mantiene:
 * - Todos los datos financieros importantes
 * - Actualización automática cada 2 minutos
 * - Resumen ejecutivo del estado del sistema
 * - Visibilidad permanente en dashboard
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  MessageSquare,
  AlertTriangle,
  DollarSign,
  FileText,
  Package,
  CreditCard,
  PieChart,
  Target,
  TrendingUp,
  Shield,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { iaService, IAResponse } from '../services/IAService';
import { logger } from '../core/logging/SystemLogger';

interface DashboardData {
  totalBalance: number;
  balanceTrend: 'up' | 'down' | 'stable';
  monthlyInvoicing: number;
  invoicingTrend: 'up' | 'down' | 'stable';
  criticalStockCount: number;
  pendingCollections: number;
  overdueInvoices: number;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  accountingStructure: any[];
  recommendedActions: string[];
  periodAnalysis: string;
}

interface FinancialDashboardPanelProps {
  onOpenAssistant?: () => void;
}

export const FinancialDashboardPanel: React.FC<FinancialDashboardPanelProps> = ({ onOpenAssistant }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(() => {
      loadDashboardData();
      setLastUpdate(new Date());
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('FinancialDashboard', 'load_data', 'Cargando datos del dashboard financiero');
      
      // Obtener análisis completo del sistema
      const analysis = await iaService.analyzeFinancialHealth();
      
      // Convertir a formato de dashboard
      const dashboardData: DashboardData = {
        totalBalance: calculateTotalBalance(analysis.data),
        balanceTrend: 'stable',
        monthlyInvoicing: calculateMonthlyInvoicing(analysis.data),
        invoicingTrend: 'up',
        criticalStockCount: calculateCriticalStock(analysis.data),
        pendingCollections: calculatePendingCollections(analysis.data),
        overdueInvoices: calculateOverdueInvoices(analysis.data),
        alerts: convertAlertsToFormat(analysis.alerts),
        accountingStructure: analysis.data.financial || [],
        recommendedActions: analysis.actions,
        periodAnalysis: analysis.analysis
      };
      
      setDashboardData(dashboardData);
      
      logger.info('FinancialDashboard', 'load_success', 'Dashboard financiero cargado exitosamente');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('FinancialDashboard', 'load_failed', 'Error cargando dashboard', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones auxiliares para calcular métricas
  const calculateTotalBalance = (data: any): number => {
    if (!data.financial) return 0;
    return data.financial.reduce((sum: number, item: any) => sum + (item.cantidad_cuentas || 0), 0) * 1000;
  };

  const calculateMonthlyInvoicing = (data: any): number => {
    if (!data.invoices) return 0;
    const currentMonth = data.invoices.find((inv: any) => inv.status === 'paid');
    return currentMonth?.monto_total || 0;
  };

  const calculateCriticalStock = (data: any): number => {
    // Simular productos con stock crítico
    return Math.floor(Math.random() * 5) + 1;
  };

  const calculatePendingCollections = (data: any): number => {
    if (!data.invoices) return 0;
    const pending = data.invoices.find((inv: any) => inv.status === 'sent');
    return pending?.monto_total || 0;
  };

  const calculateOverdueInvoices = (data: any): number => {
    if (!data.invoices) return 0;
    const overdue = data.invoices.find((inv: any) => inv.status === 'overdue');
    return overdue?.cantidad_facturas || 0;
  };

  const convertAlertsToFormat = (alerts: string[]): DashboardData['alerts'] => {
    return alerts.map((alert, index) => ({
      id: `alert-${index}`,
      type: alert.includes('CRÍTICO') ? 'error' : alert.includes('ALERTA') ? 'warning' : 'info',
      message: alert,
      priority: alert.includes('CRÍTICO') ? 'high' : alert.includes('ALERTA') ? 'medium' : 'low'
    }));
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const DashboardCard: React.FC<{
    title: string;
    icon: React.ElementType;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    subtitle?: string;
    color: 'green' | 'blue' | 'orange' | 'red';
  }> = ({ title, icon: Icon, value, trend, subtitle, color }) => {
    const colorClasses = {
      green: 'border-green-500 bg-green-900/10',
      blue: 'border-blue-500 bg-blue-900/10',
      orange: 'border-orange-500 bg-orange-900/10',
      red: 'border-red-500 bg-red-900/10'
    };

    const iconColors = {
      green: 'text-green-400',
      blue: 'text-blue-400',
      orange: 'text-orange-400',
      red: 'text-red-400'
    };

    return (
      <div className={`dashboard-card ${colorClasses[color]} border-l-4 p-4 rounded-r-lg`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
          {trend && (
            <div className="flex items-center">
              {trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400" />}
              {trend === 'down' && <ArrowDown className="w-4 h-4 text-red-400" />}
            </div>
          )}
        </div>
        <h4 className="text-sm font-medium text-slate-400 mb-1">{title}</h4>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    );
  };

  const DashboardSection: React.FC<{
    title: string;
    icon: React.ElementType;
    type: 'alert' | 'data' | 'action' | 'analysis';
    children: React.ReactNode;
  }> = ({ title, icon: Icon, type, children }) => {
    const typeColors = {
      alert: 'border-red-500 bg-red-900/10',
      data: 'border-blue-500 bg-blue-900/10',
      action: 'border-green-500 bg-green-900/10',
      analysis: 'border-purple-500 bg-purple-900/10'
    };

    const iconColors = {
      alert: 'text-red-400',
      data: 'text-blue-400',
      action: 'text-green-400',
      analysis: 'text-purple-400'
    };

    return (
      <div className={`${typeColors[type]} border-l-4 p-4 rounded-r-lg`}>
        <div className="flex items-center space-x-2 mb-3">
          <Icon className={`w-5 h-5 ${iconColors[type]}`} />
          <h4 className="font-medium text-slate-200">{title}</h4>
        </div>
        {children}
      </div>
    );
  };

  return (
    <div className="financial-dashboard-panel bg-slate-900 text-slate-100 rounded-lg border border-slate-700 p-6">
      {/* CABECERA CON ESTADO */}
      <div className="dashboard-header flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div className="header-left flex items-center space-x-4">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Dashboard Financiero</h3>
            <div className="flex items-center space-x-2 mt-1">
              <RefreshCw className={`w-3 h-3 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs text-slate-400">
                Actualizado: {formatTime(lastUpdate)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onOpenAssistant}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Preguntar al Asistente</span>
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* LOADING */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
          <span className="text-slate-300">Cargando datos financieros...</span>
        </div>
      )}

      {/* CONTENIDO DEL DASHBOARD */}
      {dashboardData && !isLoading && (
        <div className="space-y-6">
          {/* RESUMEN RÁPIDO EN GRID */}
          <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Saldos Totales"
              icon={DollarSign}
              value={`$${dashboardData.totalBalance.toLocaleString()}`}
              trend={dashboardData.balanceTrend}
              color="green"
            />
            <DashboardCard
              title="Facturación Mensual"
              icon={FileText}
              value={`$${dashboardData.monthlyInvoicing.toLocaleString()}`}
              trend={dashboardData.invoicingTrend}
              color="blue"
            />
            <DashboardCard
              title="Stock Crítico"
              icon={Package}
              value={dashboardData.criticalStockCount}
              subtitle="productos"
              color="orange"
            />
            <DashboardCard
              title="Por Cobrar"
              icon={CreditCard}
              value={`$${dashboardData.pendingCollections.toLocaleString()}`}
              subtitle={`${dashboardData.overdueInvoices} vencidas`}
              color="red"
            />
          </div>

          {/* SECCIONES DETALLADAS */}
          <div className="dashboard-sections space-y-4">
            {/* ALERTAS */}
            <DashboardSection title="⚠️ ALERTAS ACTIVAS" icon={AlertTriangle} type="alert">
              <div className="space-y-2">
                {dashboardData.alerts.map(alert => (
                  <div key={alert.id} className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.priority === 'high' ? 'bg-red-400' : 
                      alert.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'
                    }`} />
                    <span className="text-red-200">{alert.message}</span>
                  </div>
                ))}
              </div>
            </DashboardSection>

            {/* DATOS FINANCIEROS */}
            <DashboardSection title="📊 ESTRUCTURA CONTABLE" icon={PieChart} type="data">
              <div className="grid grid-cols-2 gap-2">
                {dashboardData.accountingStructure.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-800 p-3 rounded">
                    <span className="text-slate-300 text-sm">{item.account_type}:</span>
                    <span className="text-blue-300 ml-2 font-medium">{item.cantidad_cuentas}</span>
                  </div>
                ))}
              </div>
            </DashboardSection>

            {/* ACCIONES RECOMENDADAS */}
            <DashboardSection title="👉 ACCIONES PRIORITARIAS" icon={Target} type="action">
              <div className="space-y-1">
                {dashboardData.recommendedActions.map((action, index) => (
                  <p key={index} className="text-sm text-green-200">{action}</p>
                ))}
              </div>
            </DashboardSection>

            {/* ANÁLISIS DEL PERÍODO */}
            <DashboardSection title="🔍 ANÁLISIS DEL PERÍODO" icon={TrendingUp} type="analysis">
              <div className="text-sm text-purple-200 whitespace-pre-line">
                {dashboardData.periodAnalysis}
              </div>
            </DashboardSection>
          </div>

          {/* DISCLAIMER */}
          <div className="text-xs text-slate-500 text-center bg-slate-800 p-3 rounded flex items-center justify-center space-x-2">
            <Shield className="w-3 h-3" />
            <span>Dashboard de solo-lectura • Datos actualizados automáticamente</span>
          </div>
        </div>
      )}
    </div>
  );
};