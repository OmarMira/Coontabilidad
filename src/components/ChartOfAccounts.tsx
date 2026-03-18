import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Eye, Search,
  Building, TrendingUp, DollarSign, CreditCard,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { logger } from '../core/logging/SystemLogger';
import type { ChartOfAccount } from '@/database/modules/db-types';
import { getChartOfAccounts } from '@/database/modules/db-journal';
import { createChartOfAccount, updateChartOfAccount, deleteChartOfAccount } from '@/database/modules/db-chart-of-accounts';
import { useLocale } from '../i18n/useLocale';
import { suggestAccountNumber, validateAccountNumber } from '../utils/accountingUtils';
import { DoubleEntryValidator } from '../services/accounting/DoubleEntryValidator';

// Extender la interfaz para incluir propiedades de jerarquía
interface ChartOfAccountWithHierarchy extends ChartOfAccount {
  children?: ChartOfAccountWithHierarchy[];
  level?: number;
}

export function ChartOfAccounts() {
  const { t } = useLocale();
  const [accounts, setAccounts] = useState<ChartOfAccountWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1000', '2000', '3000', '4000', '5000']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  // Estados para CRUD
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  // detail_type options grouped by account_type
  const DETAIL_TYPE_OPTIONS: Record<string, string[]> = {
    asset: ['Cash', 'Checking Account', 'Accounts Receivable', 'Inventory'],
    liability: ['Accounts Payable', 'Credit Card Payable', 'Sales Tax Payable (DR-15)', 'Reemployment Tax Payable (RT-6)'],
    equity: ["Owner's Equity", 'Retained Earnings'],
    revenue: ['Sales', 'Service Income'],
    expense: ['Cost of Goods Sold', 'Direct Labor', 'Office Supplies', 'Utilities', 'Rent', 'Advertising', 'Payroll Expenses', 'Bank Fees']
  };

  const [formData, setFormData] = useState<Partial<ChartOfAccount>>({
    account_code: '',
    number: '',
    account_name: '',
    account_type: 'asset',
    normal_balance: 'debit',
    parent_account: '',
    is_active: true,
    detail_type: ''
  });
  const [numberWarning, setNumberWarning] = useState<string | null>(null);
  // Warning de clasificación preventiva (Fase 4)
  const [classificationAlert, setClassificationAlert] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'create' | 'update' | null>(null);

  useEffect(() => {
    if (showForm && !editingAccount && !formData.number && formData.account_type) {
      setFormData(prev => ({ ...prev, number: suggestAccountNumber(prev.account_type || 'asset') }));
    }
  }, [showForm, editingAccount, formData.account_type]);

  useEffect(() => {
    const warning = validateAccountNumber(formData.number || '', formData.account_type || 'asset');
    setNumberWarning(warning);
  }, [formData.number, formData.account_type]);

  useEffect(() => {
    loadChartOfAccounts();
  }, []);

  const loadChartOfAccounts = async () => {
    try {
      setLoading(true);
      logger.info('ChartOfAccounts', 'load_start', 'Iniciando carga del plan de cuentas');

      // Usar función real de la base de datos
      const flatAccounts = getChartOfAccounts();
      const hierarchicalAccounts = buildAccountHierarchy(flatAccounts);
      setAccounts(hierarchicalAccounts);

      logger.info('ChartOfAccounts', 'load_success', `Chart of accounts loaded: ${hierarchicalAccounts.length} root accounts`);
    } catch (error) {
      logger.error('ChartOfAccounts', 'load_failed', 'Error loading chart of accounts', null, error as Error);
      setError(t('chartOfAccounts.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (force = false) => {
    // Validación preventiva de clasificación
    if (!force && formData.detail_type) {
      const warn = DoubleEntryValidator.validateAccountDefinition(
        formData.account_type || 'asset',
        formData.detail_type
      );
      if (warn) {
        setClassificationAlert(warn.reason);
        setPendingAction('create');
        return;
      }
    }
    setClassificationAlert(null);
    setPendingAction(null);

    try {
      logger.info('ChartOfAccounts', 'create_start', 'Iniciando creación de nueva cuenta', { accountCode: formData.account_code });
      console.info(`[INFO] Cuenta guardada con detail_type: ${formData.detail_type || null}`);

      const result = await createChartOfAccount(formData);

      if (result.success) {
        logger.info('ChartOfAccounts', 'create_success', 'Account created successfully', { accountCode: formData.account_code, detailType: formData.detail_type || null });
        setShowForm(false);
        setFormData({
          account_code: '',
          number: '',
          account_name: '',
          account_type: 'asset',
          normal_balance: 'debit',
          parent_account: '',
          is_active: true,
          detail_type: ''
        });
        await loadChartOfAccounts();
      } else {
        logger.error('ChartOfAccounts', 'create_failed', 'Error al crear cuenta', { error: result.message });
        setError(result.message);
      }
    } catch (error) {
      logger.error('ChartOfAccounts', 'create_error', 'Exception creating account', null, error as Error);
      setError(t('chartOfAccounts.unexpectedError'));
    }
  };

  const handleEditAccount = (account: ChartOfAccount) => {
    logger.info('ChartOfAccounts', 'edit_start', 'Iniciando edición de cuenta', { accountCode: account.account_code });
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      number: account.number || '',
      account_name: account.account_name,
      account_type: account.account_type,
      normal_balance: account.normal_balance,
      parent_account: account.parent_account || '',
      is_active: account.is_active,
      detail_type: account.detail_type || ''
    });
    setShowForm(true);
  };

  const handleUpdateAccount = async (force = false) => {
    if (!editingAccount) return;

    // Validación preventiva de clasificación
    if (!force && formData.detail_type) {
      const warn = DoubleEntryValidator.validateAccountDefinition(
        formData.account_type || 'asset',
        formData.detail_type
      );
      if (warn) {
        setClassificationAlert(warn.reason);
        setPendingAction('update');
        return;
      }
    }
    setClassificationAlert(null);
    setPendingAction(null);

    try {
      logger.info('ChartOfAccounts', 'update_start', 'Iniciando actualización de cuenta', { accountCode: editingAccount.account_code });
      console.info(`[INFO] Cuenta guardada con detail_type: ${formData.detail_type || null}`);

      const result = await updateChartOfAccount(editingAccount.account_code, formData);

      if (result.success) {
        logger.info('ChartOfAccounts', 'update_success', 'Account updated successfully', { accountCode: editingAccount.account_code, detailType: formData.detail_type || null });
        setShowForm(false);
        setEditingAccount(null);
        setFormData({
          account_code: '',
          number: '',
          account_name: '',
          account_type: 'asset',
          normal_balance: 'debit',
          parent_account: '',
          is_active: true,
          detail_type: ''
        });
        await loadChartOfAccounts();
      } else {
        logger.error('ChartOfAccounts', 'update_failed', 'Error al actualizar cuenta', { error: result.message });
        setError(result.message);
      }
    } catch (error) {
      logger.error('ChartOfAccounts', 'update_error', 'Exception updating account', null, error as Error);
      setError(t('chartOfAccounts.unexpectedError'));
    }
  };

  const handleDeleteAccount = async (account: ChartOfAccount) => {
    if (!confirm(t('chartOfAccounts.deleteConfirm', { code: account.account_code, name: account.account_name }))) {
      return;
    }

    try {
      logger.info('ChartOfAccounts', 'delete_start', 'Iniciando eliminación de cuenta', { accountCode: account.account_code });

      const result = await deleteChartOfAccount(account.account_code);

      if (result.success) {
        logger.info('ChartOfAccounts', 'delete_success', 'Cuenta eliminada exitosamente', { accountCode: account.account_code });
        await loadChartOfAccounts(); // Recargar datos
      } else {
        logger.error('ChartOfAccounts', 'delete_failed', 'Error al eliminar cuenta', { error: result.message });
        setError(result.message);
      }
    } catch (error) {
      logger.error('ChartOfAccounts', 'delete_error', 'Exception deleting account', null, error as Error);
      setError(t('chartOfAccounts.unexpectedError'));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      handleUpdateAccount();
    } else {
      handleCreateAccount();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAccount(null);
    setFormData({
      account_code: '',
      number: '',
      account_name: '',
      account_type: 'asset',
      normal_balance: 'debit',
      parent_account: '',
      is_active: true,
      detail_type: ''
    });
  };

  const buildAccountHierarchy = (flatAccounts: ChartOfAccount[]): ChartOfAccountWithHierarchy[] => {
    const accountMap = new Map<string, ChartOfAccountWithHierarchy>();
    const rootAccounts: ChartOfAccountWithHierarchy[] = [];

    // Crear mapa de cuentas
    flatAccounts.forEach(account => {
      accountMap.set(account.account_code, { ...account, children: [], level: 0 });
    });

    // Construir jerarquía
    flatAccounts.forEach(account => {
      const accountNode = accountMap.get(account.account_code)!;

      if (account.parent_account) {
        const parent = accountMap.get(account.parent_account);
        if (parent) {
          parent.children!.push(accountNode);
          accountNode.level = (parent.level || 0) + 1;
        }
      } else {
        rootAccounts.push(accountNode);
      }
    });

    return rootAccounts;
  };

  const toggleNode = (accountCode: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(accountCode)) {
      newExpanded.delete(accountCode);
    } else {
      newExpanded.add(accountCode);
    }
    setExpandedNodes(newExpanded);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Building className="h-4 w-4 text-green-400" />;
      case 'liability': return <CreditCard className="h-4 w-4 text-red-400" />;
      case 'equity': return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'revenue': return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'expense': return <TrendingUp className="h-4 w-4 text-orange-400 rotate-180" />;
      default: return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-green-400';
      case 'liability': return 'text-red-400';
      case 'equity': return 'text-blue-400';
      case 'revenue': return 'text-emerald-400';
      case 'expense': return 'text-orange-400';
      default: return 'text-slate-500';
    }
  };

  const renderAccount = (account: ChartOfAccountWithHierarchy, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.account_code);
    const indent = level * 24;

    // Filtros
    if (filterType !== 'ALL' && account.account_type !== filterType) return null;
    if (!showInactive && !account.is_active) return null;
    if (searchTerm && !account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !account.account_code.includes(searchTerm)) return null;

    return (
      <div key={account.account_code}>
        <div
          className={`flex items-center py-2 px-4 hover:bg-white/5 border-l-2 ${account.is_active ? 'border-transparent' : 'border-white/10'
            }`}
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          {/* Expand/Collapse */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(account.account_code)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Icono de tipo */}
          <div className="mr-3">
            {getAccountTypeIcon(account.account_type)}
          </div>

          {/* Código de cuenta */}
          <div className="w-20 font-mono text-slate-400 flex flex-col justify-center leading-tight">
            <span className="text-sm font-bold text-blue-400">{account.number || 'N/A'}</span>
            <span className="text-[10px] opacity-70">{account.account_code}</span>
          </div>

          {/* Nombre de cuenta */}
          <div className={`flex-1 text-white font-black uppercase tracking-tight ${level === 0 ? 'text-sm' : 'text-xs opacity-90 font-bold'}`}>
            {account.account_name}
          </div>

          {/* Tipo de cuenta */}
          <div className={`text-xs px-2 py-1 rounded ${getAccountTypeColor(account.account_type)} bg-white/5`}>
            {t(`chartOfAccounts.type${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}`)}
          </div>

          {/* Balance normal */}
          <div className="w-20 text-[10px] font-black uppercase text-center text-slate-600">
            {t(`chartOfAccounts.${account.normal_balance}`)}
          </div>

          {/* Estado */}
          <div className="w-16 text-center">
            {account.is_active ? (
              <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-600 mx-auto" />
            )}
          </div>

          {/* Acciones */}
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => handleEditAccount(account)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              title={t('chartOfAccounts.editAccount')}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteAccount(account)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title={t('chartOfAccounts.deleteAccount')}
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cuentas hijas */}
        {hasChildren && isExpanded && (
          <div>
            {account.children!.map(child => renderAccount(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/10 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-500">{t('chartOfAccounts.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
          <p className="text-red-200">{error}</p>
          <button
            onClick={loadChartOfAccounts}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition-all font-bold shadow-lg shadow-red-900/40 active:scale-95"
          >
            {t('chartOfAccounts.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
            <Building className="w-8 h-8 text-blue-500" />
            {t('chartOfAccounts.title')}
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            {t('chartOfAccounts.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/40 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{t('chartOfAccounts.newAccount')}</span>
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder={t('chartOfAccounts.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800/50 text-white pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-950/50 border border-slate-800/50 text-slate-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500/50"
            >
              <option value="ALL" className="bg-slate-900">{t('chartOfAccounts.filterAll')}</option>
              <option value="asset" className="bg-slate-900">{t('chartOfAccounts.typeAsset')}</option>
              <option value="liability" className="bg-slate-900">{t('chartOfAccounts.typeLiability')}</option>
              <option value="equity" className="bg-slate-900">{t('chartOfAccounts.typeEquity')}</option>
              <option value="revenue" className="bg-slate-900">{t('chartOfAccounts.typeRevenue')}</option>
              <option value="expense" className="bg-slate-900">{t('chartOfAccounts.typeExpense')}</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-blue-600"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('chartOfAccounts.showInactive')}</span>
          </label>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950/30 px-4 py-3 border-b border-slate-800/50">
          <div className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ paddingLeft: '40px' }}>
            <div className="w-20 pl-2">{t('chartOfAccounts.colCode')}</div>
            <div className="flex-1 ml-3">{t('chartOfAccounts.colName')}</div>
            <div className="w-24 text-center">{t('chartOfAccounts.colType')}</div>
            <div className="w-20 text-center">{t('chartOfAccounts.colBalance')}</div>
            <div className="w-16 text-center">{t('chartOfAccounts.colStatus')}</div>
            <div className="w-20 text-center">{t('chartOfAccounts.colActions')}</div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{t('chartOfAccounts.noAccountsFound')}</p>
            </div>
          ) : (
            accounts.map(account => renderAccount(account))
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
          const count = accounts.reduce((acc, account) => {
            const countInTree = (acc: ChartOfAccountWithHierarchy): number => {
              let count = acc.account_type === type ? 1 : 0;
              if (acc.children) {
                count += acc.children.reduce((sum, child) => sum + countInTree(child), 0);
              }
              return count;
            };
            return acc + countInTree(account);
          }, 0);

          return (
            <div key={type} className="bg-white/10 rounded-lg p-4 text-center">
              <div className="mb-2">{getAccountTypeIcon(type)}</div>
              <div className="text-2xl font-black tracking-tight text-white">{count}</div>
              <div className={`text-sm ${getAccountTypeColor(type)}`}>
                {type === 'asset' ? t('chartOfAccounts.typeAsset') :
                  type === 'liability' ? t('chartOfAccounts.typeLiability') :
                    type === 'equity' ? t('chartOfAccounts.typeEquity') :
                      type === 'revenue' ? t('chartOfAccounts.typeRevenue') : t('chartOfAccounts.typeExpense')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300 relative group">
            <div className="flex items-start justify-between mb-10">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">
                {editingAccount ? t('chartOfAccounts.editAccount') : t('chartOfAccounts.newAccount')}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                      {t('chartOfAccounts.formCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.account_code}
                      onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800/50 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                      placeholder="e.g. 1000"
                      required
                      disabled={!!editingAccount}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                      NÚMERO GAAP
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={formData.number || ''}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value.replace(/\D/g, '') })}
                      className={`w-full bg-slate-950/50 border text-white px-4 py-3 rounded-2xl focus:outline-none transition-all font-mono text-sm ${numberWarning ? 'border-orange-500/50 focus:border-orange-500/50' : 'border-slate-800/50 focus:border-blue-500/50'}`}
                      placeholder="e.g. 10100"
                    />
                    {numberWarning && (
                      <div className="flex items-center gap-1 mt-2 text-orange-400">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[9px] font-medium">{numberWarning}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                    {t('chartOfAccounts.formName')}
                  </label>
                  <input
                    type="text"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800/50 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all uppercase font-bold text-xs"
                    placeholder={t('chartOfAccounts.formName')}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                    {t('chartOfAccounts.formType')}
                  </label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                    className="w-full bg-slate-950/50 border border-slate-800/50 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all"
                    required
                  >
                    <option value="asset" className="bg-slate-900">{t('chartOfAccounts.activo')}</option>
                    <option value="liability" className="bg-slate-900">{t('chartOfAccounts.pasivo')}</option>
                    <option value="equity" className="bg-slate-900">{t('chartOfAccounts.patrimonio')}</option>
                    <option value="revenue" className="bg-slate-900">{t('chartOfAccounts.ingreso')}</option>
                    <option value="expense" className="bg-slate-900">{t('chartOfAccounts.gasto')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                    {t('chartOfAccounts.formBalance')}
                  </label>
                  <select
                    value={formData.normal_balance}
                    onChange={(e) => setFormData({ ...formData, normal_balance: e.target.value as any })}
                    className="w-full bg-slate-950/50 border border-slate-800/50 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all"
                    required
                  >
                    <option value="debit" className="bg-slate-900">{t('chartOfAccounts.debito')}</option>
                    <option value="credit" className="bg-slate-900">{t('chartOfAccounts.credito')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  {t('chartOfAccounts.formParent')}
                </label>
                <input
                  type="text"
                  value={formData.parent_account}
                  onChange={(e) => setFormData({ ...formData, parent_account: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800/50 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  placeholder="1000"
                />
              </div>

              {/* Detail Type — filtrado dinámicamente por account_type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  DETAIL TYPE
                  <span className="ml-2 text-slate-600 normal-case font-normal">(opcional)</span>
                </label>
                <select
                  id="detail_type"
                  value={formData.detail_type || ''}
                  onChange={(e) => setFormData({ ...formData, detail_type: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800/50 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                >
                  <option value="" className="bg-slate-900 text-slate-400">— Sin clasificar —</option>
                  {(DETAIL_TYPE_OPTIONS[formData.account_type || 'asset'] || []).map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">
                      {opt}
                    </option>
                  ))}
                </select>
                {formData.detail_type && (
                  <p className="mt-1.5 text-[10px] text-blue-400 px-1">
                    ✓ Detail type: <span className="font-bold">{formData.detail_type}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 px-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="is_active" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                  {t('chartOfAccounts.formActive')}
                </label>
              </div>

              {/* ── ALERTA DE CLASIFICACIÓN PREVENTIVA (Fase 4) ── */}
              {classificationAlert && (
                <div className="bg-orange-900/20 border border-orange-500/40 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-orange-500/10 rounded-lg shrink-0">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1.5">
                        Alerta de Clasificación
                      </p>
                      <p className="text-xs text-orange-200 font-bold leading-relaxed italic">
                        {classificationAlert}
                      </p>
                      <div className="flex gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => setClassificationAlert(null)}
                          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                        >
                          Corregir
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (pendingAction === 'create') handleCreateAccount(true);
                            if (pendingAction === 'update') handleUpdateAccount(true);
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          Continuar de todas formas
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-900/40 active:scale-95"
                >
                  {editingAccount ? t('chartOfAccounts.update') : t('chartOfAccounts.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3.5 px-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  {t('chartOfAccounts.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}