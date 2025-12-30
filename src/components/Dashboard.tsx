import React from 'react';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Database,
  Shield
} from 'lucide-react';
import { getCompanyLogoUrl, hasCompanyLogo } from '../utils/logoUtils';

interface DashboardProps {
  stats: {
    customers: number;
    invoices: number;
    revenue: number;
    suppliers: number;
    bills: number;
    expenses: number;
  };
  onNavigate: (section: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onNavigate }) => {
  const quickStats = [
    {
      title: 'Clientes Activos',
      value: stats.customers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Facturas Emitidas',
      value: stats.invoices,
      icon: FileText,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Ingresos Cobrados',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+25%',
      changeType: 'positive'
    },
    {
      title: 'Crecimiento Anual',
      value: '$145,230',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+18%',
      changeType: 'positive'
    }
  ];

  const quickActions = [
    {
      title: 'Gestionar Clientes',
      description: 'Agregar, editar o eliminar clientes',
      icon: Users,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => onNavigate('customers')
    },
    {
      title: 'Gestionar Proveedores',
      description: 'Agregar, editar o eliminar proveedores',
      icon: Package,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => onNavigate('suppliers')
    },
    {
      title: 'Crear Factura',
      description: 'Nueva factura con cálculo de impuestos FL',
      icon: FileText,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => onNavigate('invoices')
    },
    {
      title: 'Reportes Fiscales',
      description: 'Reportes para cumplimiento Florida',
      icon: TrendingUp,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => onNavigate('tax-reports')
    }
  ];

  const recentActivity = [
    {
      type: 'customer',
      message: 'Nuevo cliente agregado: Acme Corp',
      time: 'Hace 2 horas',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      type: 'invoice',
      message: 'Factura #001 generada por $1,250.00',
      time: 'Hace 4 horas',
      icon: FileText,
      color: 'text-green-400'
    },
    {
      type: 'backup',
      message: 'Backup automático completado',
      time: 'Hace 6 horas',
      icon: Database,
      color: 'text-gray-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo de la empresa */}
            {hasCompanyLogo() && (
              <div className="bg-white rounded-lg p-3 shadow-lg">
                <img
                  src={getCompanyLogoUrl()!}
                  alt="Logo de la empresa"
                  className="max-w-24 max-h-16 object-contain"
                />
              </div>
            )}

            <div>
              <h1 className="text-section-title mb-2">
                ¡Bienvenido a <span className="text-blue-500">AccountExpress</span>!
              </h1>
              <p className="text-standard-body">
                Sistema ERP de última generación con cifrado bancario <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-sm">AES-256</span> activo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`${action.color} p-6 rounded-lg text-left transition-colors group`}
            >
              <action.icon className="w-8 h-8 text-white mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-1">{action.title}</h3>
              <p className="text-gray-200 text-sm">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Actividad Reciente y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <activity.icon className={`w-5 h-5 ${activity.color} mt-0.5`} />
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">{activity.message}</p>
                  <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas del Sistema */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Estado del Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-gray-300 text-sm">Base de datos SQLite funcionando</p>
                <p className="text-gray-500 text-xs mt-1">Última sincronización: Ahora</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-gray-300 text-sm">Cifrado AES-256 activo</p>
                <p className="text-gray-500 text-xs mt-1">Datos protegidos localmente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-gray-300 text-sm">Backup automático habilitado</p>
                <p className="text-gray-500 text-xs mt-1">Próximo backup en 25 min</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-gray-300 text-sm">Modo offline activo</p>
                <p className="text-gray-500 text-xs mt-1">Funcionando sin conexión a internet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de Cumplimiento Florida */}
      <div className="bg-slate-900 rounded-xl p-6 border border-emerald-500/20 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/30 flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-white">
                Cumplimiento Fiscal Florida
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter font-bold">Verificado</span>
            </div>
            <p className="text-slate-400 text-sm mb-4 leading-normal">
              Configuración optimizada para el cumplimiento de las regulaciones del <span className="text-white font-semibold">Florida Department of Revenue</span>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-white text-xs font-medium">Sales Tax por condado</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-white text-xs font-medium">Formato DR-15 oficial</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-white text-xs font-medium">67 condados actualizados</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};