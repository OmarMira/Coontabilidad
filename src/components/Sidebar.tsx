import React, { useState } from 'react';
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
  HardDrive,
  UserCheck,
  Lock,
  Bot,
  Activity,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Database,
  CreditCard
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
    label: 'DASHBOARD',
    icon: Home
  },
  {
    id: 'archivo',
    label: 'ARCHIVO',
    icon: FileText,
    children: [
      { id: 'system-config', label: 'Configuración del Sistema', icon: Settings, badge: 'Próximo' },
      { id: 'company-data', label: 'Datos de la Empresa', icon: Building2, badge: 'Activo' },
      { id: 'users', label: 'Usuarios y Roles', icon: UserCheck, badge: 'Próximo' },
      { id: 'backups', label: 'Respaldos y Restauración', icon: HardDrive, badge: 'NEW' },
      { id: 'system-logs', label: 'Logs del Sistema', icon: Activity, badge: 'Activo' },
      { id: 'auditoria', label: 'Auditoría de Transacciones', icon: Search, badge: 'Activo' },
      { id: 'security', label: 'Seguridad y Cifrado', icon: Lock, badge: 'Próximo' }
    ]
  },
  {
    id: 'cuentas-pagar',
    label: 'CUENTAS A PAGAR',
    icon: Receipt,
    children: [
      { id: 'suppliers', label: 'Proveedores', icon: Building2, badge: 'Activo' },
      { id: 'bills-payable', label: 'Facturas de Compra', icon: FileText, badge: 'Activo' },
      { id: 'supplier-payments', label: 'Pagos a Proveedores', icon: CreditCard, badge: 'Próximo' },
      { id: 'purchase-orders', label: 'Órdenes de Compra', icon: ShoppingCart, badge: 'Próximo' },
      { id: 'payable-reports', label: 'Reportes de Proveedores', icon: BarChart3, badge: 'Próximo' }
    ]
  },
  {
    id: 'cuentas-cobrar',
    label: 'CUENTAS POR COBRAR',
    icon: TrendingUp,
    children: [
      { id: 'customers', label: 'Clientes', icon: Users, badge: 'Activo' },
      { id: 'invoices', label: 'Facturas de Venta', icon: FileText, badge: 'Activo' },
      { id: 'customer-payments', label: 'Pagos de Clientes', icon: CreditCard, badge: 'Próximo' },
      { id: 'quotes', label: 'Cotizaciones', icon: FileText, badge: 'Próximo' },
      { id: 'receivable-reports', label: 'Reportes de Clientes', icon: BarChart3, badge: 'Próximo' }
    ]
  },
  {
    id: 'libro-mayor',
    label: 'CONTABILIDAD',
    icon: Calculator,
    children: [
      { id: 'chart-accounts', label: 'Plan de Cuentas', icon: FileText, badge: 'Activo' },
      { id: 'journal-entries', label: 'Asientos Contables', icon: FileText, badge: 'Próximo' },
      { id: 'general-ledger', label: 'Libro Mayor', icon: Database, badge: 'Próximo' },
      { id: 'balance-sheet', label: 'Balance General', icon: BarChart3, badge: 'Activo' },
      { id: 'income-statement', label: 'Estado de Resultados', icon: BarChart3, badge: 'Activo' },
      { id: 'trial-balance', label: 'Balance de Comprobación', icon: BarChart3, badge: 'Próximo' },
      { id: 'financial-reports', label: 'Reportes Financieros', icon: BarChart3, badge: 'Próximo' }
    ]
  },
  {
    id: 'inventario',
    label: 'INVENTARIO',
    icon: Package,
    children: [
      { id: 'products', label: 'Productos y Servicios', icon: Package, badge: 'Activo' },
      { id: 'product-categories', label: 'Categorías', icon: Package2, badge: 'Activo' },
      { id: 'inventory-movements', label: 'Movimientos', icon: TrendingUp, badge: 'Próximo' },
      { id: 'inventory-adjustments', label: 'Ajustes de Inventario', icon: Settings, badge: 'Próximo' },
      { id: 'inventory-reports', label: 'Reportes de Inventario', icon: BarChart3, badge: 'Próximo' },
      { id: 'locations', label: 'Ubicaciones', icon: MapPin, badge: 'Próximo' }
    ]
  },
  {
    id: 'impuestos',
    label: 'IMPUESTOS FLORIDA',
    icon: Receipt,
    children: [
      { id: 'tax-config', label: 'Configuración Fiscal', icon: Settings, badge: 'Activo' },
      { id: 'florida-dr15', label: 'Reporte DR-15', icon: FileText, badge: 'NEW' },
      { id: 'tax-rates', label: 'Tasas por Condado', icon: MapPin, badge: 'Activo' },
      { id: 'tax-reports', label: 'Reportes Fiscales', icon: BarChart3, badge: 'Próximo' },
      { id: 'tax-calendar', label: 'Calendario Fiscal', icon: FileText, badge: 'Próximo' }
    ]
  },
  {
    id: 'herramientas',
    label: 'HERRAMIENTAS',
    icon: HelpCircle,
    children: [
      { id: 'accounting-diagnosis', label: 'Diagnóstico Contable', icon: Activity, badge: 'Activo' },
      { id: 'journal-entry-test', label: 'Pruebas de Asientos', icon: FileText, badge: 'Activo' },
      { id: 'payment-methods', label: 'Métodos de Pago', icon: CreditCard, badge: 'Próximo' },
      { id: 'banks', label: 'Cuentas Bancarias', icon: Building2, badge: 'Próximo' },
      { id: 'help', label: 'Centro de Ayuda', icon: HelpCircle, badge: 'Próximo' }
    ]
  },
  {
    id: 'ai-assistant',
    label: 'ASISTENTE IA',
    icon: Bot,
    badge: 'NEW',
    isNew: true
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
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
      <div key={item.id}>
        <div
          onClick={() => handleItemClick(item)}
          className={`
            flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-200 group
            ${level === 0 ? 'mx-1 rounded-md' : 'mx-4 rounded-sm'}
            ${isActive && !hasChildren 
              ? 'bg-blue-600 text-white shadow-md' 
              : isParentCategory 
                ? 'hover:bg-gray-700 text-gray-200' 
                : 'hover:bg-gray-700 text-gray-300'
            }
            ${isParentCategory ? 'font-medium text-sm uppercase tracking-wide' : ''}
            ${level > 0 ? 'text-sm' : 'text-sm'}
          `}
        >
          {/* Icono */}
          <item.icon className={`
            w-4 h-4 flex-shrink-0
            ${isActive && !hasChildren ? 'text-white' : 'text-gray-400'}
            ${isParentCategory ? 'text-gray-500' : ''}
          `} />
          
          {/* Texto del menú */}
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">
                {item.label}
              </span>
              
              {/* Badge */}
              {item.badge && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-medium
                  ${item.badge === 'Activo' 
                    ? 'bg-green-900 text-green-300 border border-green-700' 
                    : item.badge === 'Próximo'
                      ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
                      : item.badge === 'Debug'
                        ? 'bg-purple-900 text-purple-300 border border-purple-700'
                        : 'bg-blue-900 text-blue-300 border border-blue-700'
                  }
                `}>
                  {item.badge}
                </span>
              )}
              
              {/* Indicador "Nuevo" */}
              {item.isNew && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                  NEW
                </span>
              )}
              
              {/* Flecha para expandir */}
              {hasChildren && (
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Elementos hijos */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-1 border-l border-gray-700">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header del Sidebar */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-base">AccountExpress</h1>
              <p className="text-gray-400 text-xs">Sistema Contable</p>
            </div>
          )}
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <div className="space-y-0.5">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          {!isCollapsed && (
            <div>
              <p>Sistema Activo</p>
              <p className="text-xs">Local + Cifrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Botón para colapsar/expandir */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-gray-800 border border-gray-700 rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4 rotate-90" />
        )}
      </button>
    </div>
  );
};