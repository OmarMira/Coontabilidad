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
import { LanguageSwitcher } from './LanguageSwitcher';
import { saveDatabase } from '../database/simple-db';

import toast from 'react-hot-toast';


import { useLocale } from '../i18n/useLocale';

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

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: Home
    },
    {
      id: 'archivo',
      label: t('navigation.archive'),
      icon: FileText,
      children: [
        { id: 'company-data', label: t('navigation.companyData'), icon: Building2 },
        { id: 'admin-users', label: t('navigation.usersSecurity'), icon: UserCheck },
        { id: 'role-manager', label: t('navigation.roleManager'), icon: Shield },
        { id: 'audit-trail', label: t('navigation.auditTrail'), icon: History },
        { id: 'banks', label: t('navigation.bankAccounts'), icon: Building2 },
        { id: 'payment-methods', label: t('navigation.paymentMethods'), icon: CreditCard }
      ]
    },
    {
      id: 'cuentas-pagar',
      label: t('navigation.accountsPayable'),
      icon: Receipt,
      children: [
        { id: 'dashboard-suppliers', label: t('navigation.suppliersDashboard'), icon: Building2 },
        { id: 'suppliers', label: t('navigation.suppliers'), icon: Building2 },
        { id: 'bills', label: t('navigation.purchaseInvoices'), icon: FileText },
        { id: 'supplier-payments', label: t('navigation.supplierPayments'), icon: CreditCard },
        { id: 'purchase-orders', label: t('navigation.purchaseOrders'), icon: ShoppingCart },
        { id: 'payable-reports', label: t('navigation.supplierReports'), icon: BarChart3 }
      ]
    },
    {
      id: 'cuentas-cobrar',
      label: t('navigation.accountsReceivable'),
      icon: TrendingUp,
      children: [
        { id: 'dashboard-customers', label: t('navigation.customersDashboard'), icon: Users },
        { id: 'ard-module', label: t('navigation.ardAnalysis'), icon: ScanSearch },
        { id: 'customers', label: t('navigation.customers'), icon: Users },
        { id: 'invoices', label: t('navigation.salesInvoices'), icon: FileText },
        { id: 'customer-payments', label: t('navigation.customerPayments'), icon: CreditCard },
        { id: 'quotes', label: t('navigation.quotes'), icon: FileText },
        { id: 'receivable-reports', label: t('navigation.customerReports'), icon: BarChart3 }
      ]
    },
    {
      id: 'libro-mayor',
      label: t('navigation.accounting'),
      icon: Calculator,
      children: [
        { id: 'dashboard-financial', label: t('navigation.financialDashboard'), icon: TrendingUp },
        { id: 'reports-dashboard', label: t('navigation.reportsDashboard'), icon: BarChart3 },
        { id: 'accounting-periods', label: t('navigation.closuresPeriods'), icon: Lock },
        { id: 'ledger-hub', label: t('navigation.ledgerAuxiliaries'), icon: Database },
        { id: 'chart-accounts', label: t('navigation.chartOfAccounts'), icon: FileText },
        { id: 'journal-entries', label: t('navigation.journalEntries'), icon: FileText },
        { id: 'bank-reconciliation', label: t('navigation.bankReconciliation'), icon: FileText },
        { id: 'discrepancy-analysis', label: t('navigation.discrepancyAnalysis'), icon: BarChart3 },
        { id: 'bank-smart-import', label: t('navigation.iaBankImport'), icon: Bot },
        { id: 'general-ledger', label: t('navigation.generalLedger'), icon: FileText },
        { id: 'trial-balance', label: t('navigation.trialBalance'), icon: BarChart3 },
        { id: 'account-ledger', label: t('navigation.accountAuxiliaries'), icon: PieChart },
        { id: 'balance-sheet', label: t('navigation.balanceSheet'), icon: ShieldCheck },
        { id: 'income-statement', label: t('navigation.incomeStatement'), icon: TrendingUp },
        { id: 'cash-flow', label: t('navigation.cashFlow'), icon: DollarSign },
        { id: 'aging-report', label: t('navigation.agingReport'), icon: Clock },
        { id: 'fixed-assets', label: t('navigation.assetManagement'), icon: Package },
        { id: 'budgets', label: t('navigation.budgets'), icon: BarChart3 }
      ]
    },
    {
      id: 'payroll',
      label: t('navigation.payroll'),
      icon: Users,
      children: [
        { id: 'dashboard-payroll', label: t('navigation.payrollDashboard'), icon: PieChart },
        { id: 'employee-mgr', label: t('navigation.employeeManagement'), icon: UserCheck },
        { id: 'payroll-process', label: t('navigation.processPayroll'), icon: Calculator },
        { id: 'payroll-review', label: t('navigation.reviewPayroll'), icon: ShieldCheck },
        { id: 'payroll-reports', label: t('navigation.payrollReports'), icon: BarChart3 }
      ]
    },
    {
      id: 'inventario',
      label: t('navigation.inventory'),
      icon: Package,
      children: [
        { id: 'dashboard-inventory', label: t('navigation.inventoryDashboard'), icon: PieChart },
        { id: 'products', label: t('navigation.productsServices'), icon: Package },
        { id: 'inventory-movements', label: t('navigation.movements'), icon: TrendingUp },
        { id: 'inventory-adjustments', label: t('navigation.inventoryAdjustments'), icon: Settings },
        { id: 'inventory-reports', label: t('navigation.inventoryReports'), icon: BarChart3 },
        { id: 'product-categories', label: t('navigation.categories'), icon: Package2 },
        { id: 'locations', label: t('navigation.locations'), icon: MapPin }
      ]
    },
    {
      id: 'impuestos',
      label: t('navigation.taxes'),
      icon: Receipt,
      children: [
        { id: 'tax-config', label: t('navigation.taxConfig'), icon: Settings },
        { id: 'florida-dr15', label: t('navigation.dr15Report'), icon: FileText },
        { id: 'tax-calendar', label: t('navigation.taxCalendar'), icon: FileText },
        { id: 'tax-rates', label: t('navigation.countyRates'), icon: MapPin },
        { id: 'tax-reports', label: t('navigation.taxReports'), icon: BarChart3 }
      ]
    },
    {
      id: 'herramientas',
      label: t('navigation.tools'),
      icon: HelpCircle,
      children: [
        { id: 'accounting-diagnosis', label: t('navigation.accountingDiagnosis'), icon: Activity },
        { id: 'journal-entry-test', label: t('navigation.journalEntryTest'), icon: FileText },
        { id: 'backups', label: t('navigation.backupsRestoration'), icon: HardDrive },
        { id: 'system-logs', label: t('navigation.systemLogs'), icon: Activity },
        { id: 'auditoria', label: t('navigation.transactionAudit'), icon: Search },
        { id: 'verify', label: t('navigation.ironCoreVerify'), icon: Shield },
        { id: 'help', label: t('navigation.helpCenter'), icon: HelpCircle }
      ]
    },
    {
      id: 'ai-assistant',
      label: t('navigation.aiAssistant'),
      icon: Bot
    }
  ];

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
            ${level > 0 ? 'text-lg font-bold' : 'text-lg font-black uppercase tracking-wider'}
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
              <span className={`flex-1 ${level === 0 ? 'text-lg font-black' : 'text-lg font-semibold'}`}>
                {item.label}
              </span>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
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
              <h1 className="text-white font-black text-xl tracking-tighter leading-none">AccountExpress</h1>
              <p className="text-blue-500/70 text-[10px] uppercase font-black tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
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
        {/* Manual Save Button - Iron Clad Persistence */}
        <button
          onClick={async () => {
            const loadingToast = toast.loading(t('common.savingChanges'));
            try {
              await saveDatabase();
              toast.success(t('common.dataSaved'), { id: loadingToast });
            } catch (error) {
              toast.error(t('common.saveError'), { id: loadingToast });
            }
          }}

          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border group uppercase text-xs
            bg-slate-900/50 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border-slate-800 hover:border-blue-500/30 shadow-inner`}
          title={t('sidebar.forceSaveTooltip')}
        >
          <HardDrive className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span>{t('sidebar.saveLocal')}</span>}
        </button>

        {user && (

          <button
            onClick={() => onNavigate('my-profile')}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border group uppercase text-xs
              ${currentSection === 'my-profile'
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                : 'bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
          >
            {user.picture ? (
              <img src={user.picture} alt="Profile" className="w-5 h-5 rounded-full object-cover border border-white/20 group-hover:scale-110 transition-transform" />
            ) : (
              <UserIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            {!isCollapsed && <span>{t('navigation.myProfile')}</span>}
          </button>
        )}

        {/* Language Switcher */}
        {!isCollapsed && <LanguageSwitcher variant="sidebar" />}

        <button
          onClick={() => {
            console.log('🚪 Logout initiated by user');
            logout();
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold transition-all border border-red-600/20 group uppercase text-xs"
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