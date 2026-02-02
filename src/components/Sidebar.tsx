import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Users,
  Building2,
  Package,
  MapPin,
  ShoppingCart,
  TrendingUp,
  Package2,
  Calculator,
  FileText,
  BarChart3,
  Settings,
  Receipt,
  Search,
  ScanSearch,
  HardDrive,
  UserCheck,
  Lock,
  Bot,
  Activity,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Database,
  CreditCard,
  Shield,
  History,
  PieChart,
  ShieldCheck,
  Clock,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onNavigate: (section: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
  badge?: string;
  isNew?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'PANEL DE CONTROL',
    icon: Home
  },
  {
    id: 'archivo',
    label: 'ARCHIVO',
    icon: FileText,
    children: [
      { id: 'company-data', label: 'Datos de la Empresa', icon: Building2 },
      { id: 'admin-users', label: 'Usuarios y Seguridad', icon: UserCheck },
      { id: 'role-manager', label: 'Gestión de Roles', icon: Shield },
      { id: 'audit-trail', label: 'Trazabilidad (Audit)', icon: History },
      { id: 'banks', label: 'Cuentas Bancarias', icon: Building2 },
      { id: 'payment-methods', label: 'Métodos de Pago', icon: CreditCard }
    ]
  },
  {
    id: 'cuentas-pagar',
    label: 'Cta por Pagar',
    icon: Receipt,
    children: [
      { id: 'suppliers', label: 'Proveedores', icon: Building2 },
      { id: 'bills', label: 'Facturas de Compra', icon: FileText },
      { id: 'supplier-payments', label: 'Pagos a Proveedores', icon: CreditCard },
      { id: 'purchase-orders', label: 'Órdenes de Compra', icon: ShoppingCart },
      { id: 'payable-reports', label: 'Reportes de Proveedores', icon: BarChart3 }
    ]
  },
  {
    id: 'cuentas-cobrar',
    label: 'Cta por Cobrar',
    icon: TrendingUp,
    children: [
      { id: 'ard-module', label: 'Análisis ARD', icon: ScanSearch },
      { id: 'customers', label: 'Clientes', icon: Users },
      { id: 'invoices', label: 'Facturas de Venta', icon: FileText },
      { id: 'customer-payments', label: 'Pagos de Clientes', icon: CreditCard },
      { id: 'quotes', label: 'Cotizaciones', icon: FileText },
      { id: 'receivable-reports', label: 'Reportes de Clientes', icon: BarChart3 }
    ]
  },
  {
    id: 'libro-mayor',
    label: 'Contabilidad',
    icon: Calculator,
    children: [
      { id: 'reports-dashboard', label: 'Dashboard de Reportes', icon: BarChart3 },
      { id: 'accounting-periods', label: 'Cierres y Periodos', icon: Lock },
      { id: 'ledger-hub', label: 'Libros y Auxiliares', icon: Database },
      { id: 'chart-accounts', label: 'Plan de Cuentas', icon: FileText },
      { id: 'journal-entries', label: 'Asientos Contables', icon: FileText },
      { id: 'bank-reconciliation', label: 'Conciliación Bancaria', icon: FileText },
      { id: 'discrepancy-analysis', label: 'Análisis de Discrepancias', icon: BarChart3 },
      { id: 'bank-smart-import', label: 'Importación Bancaria IA', icon: Bot },
      { id: 'general-ledger', label: 'Libro Mayor', icon: FileText },
      { id: 'trial-balance', label: 'Balance de Comprobación', icon: BarChart3 },
      { id: 'account-ledger', label: 'Auxiliares de Cuentas', icon: PieChart },
      { id: 'balance-sheet', label: 'Balance General', icon: ShieldCheck },
      { id: 'income-statement', label: 'Estado de Resultados', icon: TrendingUp },
      { id: 'cash-flow', label: 'Flujo de Efectivo', icon: DollarSign },
      { id: 'aging-report', label: 'Reporte de Antigüedad', icon: Clock },
      { id: 'fixed-assets', label: 'Gestión de Activos', icon: Package }, // MOVIDO AQUÍ
      { id: 'budgets', label: 'Presupuestos', icon: BarChart3 }
    ]
  },
  // SECCIONES MOVIDAS FUERA DE CONTABILIDAD (SOLICITUD USUARIO)
  {
    id: 'payroll',
    label: 'NÓMINA',
    icon: Users,
    children: [
      { id: 'employee-mgr', label: 'Gestión de Empleados', icon: UserCheck },
      { id: 'payroll-process', label: 'Procesar Nómina', icon: Calculator },
      { id: 'payroll-reports', label: 'Reportes de Nómina', icon: BarChart3 }
    ]
  },
  {
    id: 'inventario',
    label: 'INVENTARIO',
    icon: Package,
    children: [
      { id: 'products', label: 'Productos y Servicios', icon: Package },
      { id: 'inventory-movements', label: 'Movimientos', icon: TrendingUp },
      { id: 'inventory-adjustments', label: 'Ajustes de Inventario', icon: Settings },
      { id: 'inventory-reports', label: 'Reportes de Inventario', icon: BarChart3 },
      { id: 'product-categories', label: 'Categorías', icon: Package2 },
      { id: 'locations', label: 'Ubicaciones', icon: MapPin }
    ]
  },
  {
    id: 'impuestos',
    label: 'IMPUESTOS',
    icon: Receipt,
    children: [
      { id: 'tax-config', label: 'Configuración Fiscal', icon: Settings },
      { id: 'florida-dr15', label: 'Reporte DR-15', icon: FileText },
      { id: 'tax-calendar', label: 'Calendario Fiscal', icon: FileText },
      { id: 'tax-rates', label: 'Tasas por Condado', icon: MapPin },
      { id: 'tax-reports', label: 'Reportes Fiscales', icon: BarChart3 }
    ]
  },
  {
    id: 'herramientas',
    label: 'HERRAMIENTAS',
    icon: HelpCircle,
    children: [
      { id: 'accounting-diagnosis', label: 'Diagnóstico Contable', icon: Activity },
      { id: 'journal-entry-test', label: 'Pruebas de Asientos', icon: FileText },
      { id: 'backups', label: 'Respaldos y Restauración', icon: HardDrive },
      { id: 'system-logs', label: 'Logs del Sistema', icon: Activity },
      { id: 'auditoria', label: 'Auditoría de Transacciones', icon: Search },
      { id: 'verify', label: 'Verificación Iron Core', icon: Shield },
      { id: 'help', label: 'Centro de Ayuda', icon: HelpCircle }
    ]
  },
  {
    id: 'ai-assistant',
    label: 'ASISTENTE IA',
    icon: Bot
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Definir acceso por rol
  const hasAccess = (itemId: string): boolean => {
    if (!user) return false;
    const role = user.role;

    if (role === 'admin') return true; // Admin ve todo

    switch (itemId) {
      case 'dashboard':
      case 'ai-assistant':
        return true; // Todos ven dashboard e IA

      case 'archivo':
        return role === 'auditor'; // Solo admin y auditor (admin ya manejado arriba)

      case 'cuentas-pagar':
        return ['contador', 'comprador', 'auditor'].includes(role);

      case 'cuentas-cobrar':
        return ['contador', 'vendedor', 'auditor'].includes(role);

      case 'libro-mayor':
      case 'impuestos':
      case 'bank-smart-import':
        return ['contador', 'auditor'].includes(role);

      case 'inventario':
      case 'payroll':
      case 'fixed-assets-section':
        return ['contador', 'vendedor', 'comprador', 'auditor'].includes(role);

      case 'herramientas':
        return role === 'auditor';

      default:
        return false;
    }
  };

  // Filtrar ítems del menú según rol
  const filteredMenuItems = menuItems.filter(item => hasAccess(item.id));

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const isAlreadyExpanded = prev.has(itemId);
      
      if (isAlreadyExpanded) {
        // Si ya está expandido, lo cerramos (todos quedan cerrados)
        return new Set();
      } else {
        // Si no está expandido, cerramos todos y abrimos solo este
        return new Set([itemId]);
      }
    });
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else {
      onNavigate(item.id);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const isActive = currentSection === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isParentCategory = level === 0 && hasChildren;

    return (
      <div key={item.id} className="relative">
        <div
          onClick={() => handleItemClick(item)}
          className={`
            group flex items-center gap-3 px-4 py-1.5 cursor-pointer transition-all duration-300 relative overflow-hidden
            ${level === 0 ? 'mx-0 rounded-none' : 'mx-1 rounded-xl'}
            ${isActive && !hasChildren
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : isParentCategory
                ? 'text-slate-500 hover:text-white mt-0 border-t border-slate-900/10 pt-1 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }
            ${level > 0 ? 'text-lg font-bold' : 'text-lg font-black uppercase tracking-wider'}
          `}
        >
          {/* Active indicator bar */}
          {isActive && !hasChildren && (
            <div className="absolute left-0 top-0 w-1 h-full bg-white"></div>
          )}

          {/* Icono */}
          <item.icon className={`
            w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110
            ${isActive && !hasChildren ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}
            ${isParentCategory ? 'w-3.5 h-3.5' : ''}
          `} />

          {/* Texto del menú */}
          {!isCollapsed && (
            <>
              <span className={`flex-1 ${level === 0 ? 'text-lg font-black' : 'text-lg font-semibold'}`}>
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {item.badge}
                </span>
              )}

              {/* Flecha para expandir */}
              {hasChildren && (
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Elementos hijos */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      relative h-screen bg-slate-950 border-r border-slate-900 flex flex-col transition-all duration-300 ease-in-out z-[40]
      ${isCollapsed ? 'w-20' : 'w-80'}
    `}>
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>

      {/* Header del Sidebar */}
      <div className="p-6 mb-2 border-b border-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-500/30 group cursor-default">
            <Calculator className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="text-white font-black text-xl tracking-tighter leading-none">AccountExpress</h1>
              <p className="text-blue-500/70 text-[10px] uppercase font-black tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                Enterprise v4.0
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar relative px-3">
        <div className="space-y-1">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>



      {/* Botón de Cerrar Sesión */}
      <div className="p-4 border-t border-slate-900/50 mt-auto">
        <button
          onClick={() => {
            if (confirm('¿Deseas cerrar la sesión?')) {
              logout();
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold transition-all border border-red-600/20 group uppercase text-xs"
        >
          <Lock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          {!isCollapsed && <span>CERRAR SESIÓN</span>}
        </button>
      </div>

      {/* Botón para colapsar/expandir mejorado */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-20 bg-blue-600 w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/50 border border-blue-400/30 z-50 group"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4 rotate-180" />
        )}
      </button>
    </div>
  );
};