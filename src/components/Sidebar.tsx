import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, Users, Building2, Package, MapPin, ShoppingCart, TrendingUp,
  Package2, Calculator, FileText, BarChart3, Settings, Receipt, Search,
  ScanSearch, HardDrive, UserCheck, User as UserIcon, Lock, Bot, Activity,
  HelpCircle, ChevronDown, ChevronRight, Database, CreditCard, Shield,
  History, PieChart, ShieldCheck, Clock, DollarSign, Zap, Cpu, Scan, Landmark,
  CheckCircle
} from 'lucide-react';
// import { LanguageSwitcher } from './LanguageSwitcher';
import { saveDatabase } from '../database/simple-db';

import toast from 'react-hot-toast';


import { useLocale } from '../i18n/useLocale';
import { NAVIGATION_CONFIG } from '../config/NavigationConfig';

interface SidebarProps {
  currentSection: string;
  onNavigate: (section: string) => void;
}

interface MenuItem {
  id: string;
  labelKey: string;
  icon: any;
  children?: MenuItem[];
  badge?: string;
  isNew?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = NAVIGATION_CONFIG;


  // Definir acceso por rol
  const hasAccess = (itemId: string): boolean => {
    if (!user) return false;
    const role = user.role;

    if (role === 'admin') return true;

    switch (itemId) {
      case 'dashboard':
      case 'ai-assistant':
        return true;

      case 'archivo':
        return role === 'auditor';

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

      case 'system-audit':
      case 'audit':
        return ['admin', 'auditor', 'contador'].includes(role);

      case 'herramientas':
        return role === 'auditor';

      default:
        return false;
    }
  };

  const filteredMenuItems = menuItems.filter(item => hasAccess(item.id));

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const isAlreadyExpanded = prev.has(itemId);
      if (isAlreadyExpanded) {
        return new Set();
      } else {
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
            ${level > 0 ? 'text-xs font-bold tracking-tight' : 'text-sm font-bold uppercase tracking-wider'}
          `}
        >
          {isActive && !hasChildren && (
            <div className="absolute left-0 top-0 w-1 h-full bg-white"></div>
          )}

          <item.icon className={`
            w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110
            ${isActive && !hasChildren ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}
            ${isParentCategory ? 'w-3.5 h-3.5' : ''}
          `} />

          {!isCollapsed && (
            <>
              <span className={`flex-1 ${level === 0 ? 'text-sm font-bold' : 'text-xs font-bold'}`}>
                {t(item.labelKey)}
              </span>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {item.badge}
                </span>
              )}

              {hasChildren && (
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                </div>
              )}
            </>
          )}
        </div>

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
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>

      <div className="p-6 mb-2 border-b border-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-500/30 group cursor-default">
            <Calculator className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="text-white font-bold text-xl tracking-tight leading-none">AccountExpress</h1>
              <p className="text-blue-500/70 text-[10px] uppercase font-bold tracking-wider mt-1.5 flex items-center gap-1.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                {t('common.systemVersion')}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar relative px-3">
        <div className="space-y-1">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-900/50 mt-auto space-y-2">

        {/* Language Switcher deshabilitado por simplificación i18n */}
        {/* {!isCollapsed && <LanguageSwitcher variant="sidebar" />} */}

        <button
          onClick={async () => {
            const loadToast = toast.loading('Guardando base de datos...');
            try {
              const { forceSaveDB } = await import('../database/simple-db');
              await forceSaveDB();
              toast.success('Base de datos guardada localmente', { id: loadToast });
            } catch (error) {
              toast.error('Error al guardar base de datos', { id: loadToast });
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl font-bold transition-all border border-blue-600/20 group uppercase text-xs tracking-widest"
        >
          <Database className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          {!isCollapsed && <span>Guardar Local</span>}
        </button>

        <button
          onClick={() => {
            console.log('🚪 Logout initiated by user');
            logout();
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold transition-all border border-red-600/20 group uppercase text-xs tracking-widest"
        >
          <Lock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          {!isCollapsed && <span>{t('navigation.logout')}</span>}
        </button>
      </div>

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