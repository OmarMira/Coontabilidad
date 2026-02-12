import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Eye, Search,
  Building, TrendingUp, DollarSign, CreditCard,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle
} from 'lucide-react';
import { logger } from '../core/logging/SystemLogger';
import { getChartOfAccounts, ChartOfAccount, createChartOfAccount, updateChartOfAccount, deleteChartOfAccount } from '../database/simple-db';
import { useLocale } from '../i18n/useLocale';

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
  const [formData, setFormData] = useState<Partial<ChartOfAccount>>({
    account_code: '',
    account_name: '',
    account_type: 'asset',
    normal_balance: 'debit',
    parent_account: '',
    is_active: true
  });

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

  const handleCreateAccount = async () => {
    try {
      logger.info('ChartOfAccounts', 'create_start', 'Iniciando creación de nueva cuenta', { accountCode: formData.account_code });

      const result = await createChartOfAccount(formData);

      if (result.success) {
        logger.info('ChartOfAccounts', 'create_success', 'Account created successfully', { accountCode: formData.account_code });
        setShowForm(false);
        setFormData({
          account_code: '',
          account_name: '',
          account_type: 'asset',
          normal_balance: 'debit',
          parent_account: '',
          is_active: true
        });
        await loadChartOfAccounts(); // Recargar datos
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
      account_name: account.account_name,
      account_type: account.account_type,
      normal_balance: account.normal_balance,
      parent_account: account.parent_account || '',
      is_active: account.is_active
    });
    setShowForm(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    try {
      logger.info('ChartOfAccounts', 'update_start', 'Iniciando actualización de cuenta', { accountCode: editingAccount.account_code });

      const result = await updateChartOfAccount(editingAccount.account_code, formData);

      if (result.success) {
        logger.info('ChartOfAccounts', 'update_success', 'Account updated successfully', { accountCode: editingAccount.account_code });
        setShowForm(false);
        setEditingAccount(null);
        setFormData({
          account_code: '',
          account_name: '',
          account_type: 'asset',
          normal_balance: 'debit',
          parent_account: '',
          is_active: true
        });
        await loadChartOfAccounts(); // Recargar datos
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
      account_name: '',
      account_type: 'asset',
      normal_balance: 'debit',
      parent_account: '',
      is_active: true
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
          <div className="w-20 text-sm font-mono text-slate-400">
            {account.account_code}
          </div>

          {/* Nombre de cuenta */}
          <div className="flex-1 text-white font-medium">
            {account.account_name}
          </div>

          {/* Tipo de cuenta */}
          <div className={`text-xs px-2 py-1 rounded ${getAccountTypeColor(account.account_type)} bg-white/5`}>
            {account.account_type.toUpperCase()}
          </div>

          {/* Balance normal */}
          <div className="w-16 text-xs text-center text-slate-500">
            {account.normal_balance.toUpperCase()}
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
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">{t('chartOfAccounts.title')}</h1>
          <p className="text-slate-500">{t('chartOfAccounts.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{t('chartOfAccounts.newAccount')}</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white/10 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
              <input
                type="text"
                placeholder={t('chartOfAccounts.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">{t('chartOfAccounts.filterAll')}</option>
              <option value="asset">{t('chartOfAccounts.typeAsset')}</option>
              <option value="liability">{t('chartOfAccounts.typeLiability')}</option>
              <option value="equity">{t('chartOfAccounts.typeEquity')}</option>
              <option value="revenue">{t('chartOfAccounts.typeRevenue')}</option>
              <option value="expense">{t('chartOfAccounts.typeExpense')}</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-slate-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">{t('chartOfAccounts.showInactive')}</span>
          </label>
        </div>
      </div>

      {/* Tabla de cuentas */}
      <div className="bg-white/10 rounded-lg overflow-hidden">
        <div className="bg-white/5 px-4 py-3 border-b border-white/10">
          <div className="flex items-center text-sm font-medium text-slate-400" style={{ paddingLeft: '40px' }}>
            <div className="w-20">{t('chartOfAccounts.colCode')}</div>
            <div className="flex-1 ml-3">{t('chartOfAccounts.colName')}</div>
            <div className="w-20 text-center">{t('chartOfAccounts.colType')}</div>
            <div className="w-16 text-center">{t('chartOfAccounts.colBalance')}</div>
            <div className="w-16 text-center">{t('chartOfAccounts.colStatus')}</div>
            <div className="w-20 text-center">{t('chartOfAccounts.colActions')}</div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingAccount ? t('chartOfAccounts.editAccount') : t('chartOfAccounts.newAccount')}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('chartOfAccounts.formCode')}
                </label>
                <input
                  type="text"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="1000"
                  required
                  disabled={!!editingAccount} // No permitir cambiar código al editar
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('chartOfAccounts.formName')}
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder={t('chartOfAccounts.formName')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('chartOfAccounts.formType')}
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="asset">{t('chartOfAccounts.activo')}</option>
                  <option value="liability">{t('chartOfAccounts.pasivo')}</option>
                  <option value="equity">{t('chartOfAccounts.patrimonio')}</option>
                  <option value="revenue">{t('chartOfAccounts.ingreso')}</option>
                  <option value="expense">{t('chartOfAccounts.gasto')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('chartOfAccounts.formBalance')}
                </label>
                <select
                  value={formData.normal_balance}
                  onChange={(e) => setFormData({ ...formData, normal_balance: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="debit">{t('chartOfAccounts.debito')}</option>
                  <option value="credit">{t('chartOfAccounts.credito')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('chartOfAccounts.formParent')}
                </label>
                <input
                  type="text"
                  value={formData.parent_account}
                  onChange={(e) => setFormData({ ...formData, parent_account: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="1000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-slate-400">
                  {t('chartOfAccounts.formActive')}
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {editingAccount ? t('chartOfAccounts.update') : t('chartOfAccounts.create')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 bg-gray-600 hover:bg-white/5 text-white py-2 px-4 rounded-lg transition-colors"
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