import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Eye, Search, 
  Building, TrendingUp, DollarSign, CreditCard,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle
} from 'lucide-react';
import { logger } from '../core/logging/SystemLogger';
import { getChartOfAccounts, ChartOfAccount, createChartOfAccount, updateChartOfAccount, deleteChartOfAccount } from '../database/simple-db';

// Extender la interfaz para incluir propiedades de jerarquía
interface ChartOfAccountWithHierarchy extends ChartOfAccount {
  children?: ChartOfAccountWithHierarchy[];
  level?: number;
}

export function ChartOfAccounts() {
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
      
      logger.info('ChartOfAccounts', 'load_success', `Plan de cuentas cargado: ${hierarchicalAccounts.length} cuentas principales`);
    } catch (error) {
      logger.error('ChartOfAccounts', 'load_failed', 'Error al cargar plan de cuentas', null, error as Error);
      setError('Error al cargar el plan de cuentas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      logger.info('ChartOfAccounts', 'create_start', 'Iniciando creación de nueva cuenta', { accountCode: formData.account_code });
      
      const result = await createChartOfAccount(formData);
      
      if (result.success) {
        logger.info('ChartOfAccounts', 'create_success', 'Cuenta creada exitosamente', { accountCode: formData.account_code });
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
      logger.error('ChartOfAccounts', 'create_error', 'Excepción al crear cuenta', null, error as Error);
      setError('Error inesperado al crear la cuenta');
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
        logger.info('ChartOfAccounts', 'update_success', 'Cuenta actualizada exitosamente', { accountCode: editingAccount.account_code });
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
      logger.error('ChartOfAccounts', 'update_error', 'Excepción al actualizar cuenta', null, error as Error);
      setError('Error inesperado al actualizar la cuenta');
    }
  };

  const handleDeleteAccount = async (account: ChartOfAccount) => {
    if (!confirm(`¿Está seguro de que desea eliminar la cuenta ${account.account_code} - ${account.account_name}?`)) {
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
      logger.error('ChartOfAccounts', 'delete_error', 'Excepción al eliminar cuenta', null, error as Error);
      setError('Error inesperado al eliminar la cuenta');
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
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-green-400';
      case 'liability': return 'text-red-400';
      case 'equity': return 'text-blue-400';
      case 'revenue': return 'text-emerald-400';
      case 'expense': return 'text-orange-400';
      default: return 'text-gray-400';
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
          className={`flex items-center py-2 px-4 hover:bg-gray-700 border-l-2 ${
            account.is_active ? 'border-transparent' : 'border-gray-600'
          }`}
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          {/* Expand/Collapse */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(account.account_code)}
                className="text-gray-400 hover:text-white transition-colors"
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
          <div className="w-20 text-sm font-mono text-gray-300">
            {account.account_code}
          </div>

          {/* Nombre de cuenta */}
          <div className="flex-1 text-white font-medium">
            {account.account_name}
          </div>

          {/* Tipo de cuenta */}
          <div className={`text-xs px-2 py-1 rounded ${getAccountTypeColor(account.account_type)} bg-gray-700`}>
            {account.account_type.toUpperCase()}
          </div>

          {/* Balance normal */}
          <div className="w-16 text-xs text-center text-gray-400">
            {account.normal_balance.toUpperCase()}
          </div>

          {/* Estado */}
          <div className="w-16 text-center">
            {account.is_active ? (
              <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-500 mx-auto" />
            )}
          </div>

          {/* Acciones */}
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => handleEditAccount(account)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              title="Editar cuenta"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteAccount(account)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Eliminar cuenta"
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
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando Plan de Cuentas...</p>
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
            Reintentar
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
          <h1 className="text-2xl font-bold text-white">Plan de Cuentas</h1>
          <p className="text-gray-400">Estructura contable jerárquica del sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="asset">Activos</option>
              <option value="liability">Pasivos</option>
              <option value="equity">Patrimonio</option>
              <option value="revenue">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-gray-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Mostrar inactivas</span>
          </label>
        </div>
      </div>

      {/* Tabla de cuentas */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
          <div className="flex items-center text-sm font-medium text-gray-300" style={{ paddingLeft: '40px' }}>
            <div className="w-20">Código</div>
            <div className="flex-1 ml-3">Nombre de la Cuenta</div>
            <div className="w-20 text-center">Tipo</div>
            <div className="w-16 text-center">Balance</div>
            <div className="w-16 text-center">Estado</div>
            <div className="w-20 text-center">Acciones</div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>No se encontraron cuentas</p>
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
            <div key={type} className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="mb-2">{getAccountTypeIcon(type)}</div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className={`text-sm ${getAccountTypeColor(type)}`}>
                {type === 'asset' ? 'Activos' :
                 type === 'liability' ? 'Pasivos' :
                 type === 'equity' ? 'Patrimonio' :
                 type === 'revenue' ? 'Ingresos' : 'Gastos'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Código de Cuenta
                </label>
                <input
                  type="text"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="1000"
                  required
                  disabled={!!editingAccount} // No permitir cambiar código al editar
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre de la Cuenta
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Nombre de la cuenta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="asset">Activo</option>
                  <option value="liability">Pasivo</option>
                  <option value="equity">Patrimonio</option>
                  <option value="revenue">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Balance Normal
                </label>
                <select
                  value={formData.normal_balance}
                  onChange={(e) => setFormData({ ...formData, normal_balance: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cuenta Padre (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.parent_account}
                  onChange={(e) => setFormData({ ...formData, parent_account: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
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
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Cuenta activa
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {editingAccount ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}