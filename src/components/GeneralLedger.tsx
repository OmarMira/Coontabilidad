import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, BarChart3, Download } from 'lucide-react';
import { ChartOfAccount } from '../database/simple-db';

interface LedgerEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  source_type: 'invoice' | 'bill' | 'journal_entry' | 'payment';
  source_id: number;
}

interface AccountLedger {
  account: ChartOfAccount;
  opening_balance: number;
  entries: LedgerEntry[];
  closing_balance: number;
  total_debits: number;
  total_credits: number;
}

interface GeneralLedgerProps {
  chartOfAccounts: ChartOfAccount[];
}

export const GeneralLedger: React.FC<GeneralLedgerProps> = ({ chartOfAccounts }) => {
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [accountLedger, setAccountLedger] = useState<AccountLedger | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      loadAccountLedger();
    }
  }, [selectedAccount, dateFrom, dateTo]);

  const loadAccountLedger = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    try {
      // En una implementación real, esto vendría de la base de datos
      // const ledger = await getAccountLedger(selectedAccount.id, dateFrom, dateTo);
      
      // Simulamos datos del libro mayor
      const mockEntries: LedgerEntry[] = [
        {
          id: 1,
          date: '2024-12-01',
          reference: 'INV-001',
          description: 'Venta de productos',
          debit: selectedAccount.account_type === 'asset' || selectedAccount.account_type === 'expense' ? 1500 : 0,
          credit: selectedAccount.account_type === 'liability' || selectedAccount.account_type === 'equity' || selectedAccount.account_type === 'revenue' ? 1500 : 0,
          balance: 1500,
          source_type: 'invoice',
          source_id: 1
        },
        {
          id: 2,
          date: '2024-12-05',
          reference: 'BILL-001',
          description: 'Compra de suministros',
          debit: selectedAccount.account_type === 'asset' || selectedAccount.account_type === 'expense' ? 800 : 0,
          credit: selectedAccount.account_type === 'liability' || selectedAccount.account_type === 'equity' || selectedAccount.account_type === 'revenue' ? 800 : 0,
          balance: selectedAccount.account_type === 'asset' || selectedAccount.account_type === 'expense' ? 2300 : 700,
          source_type: 'bill',
          source_id: 1
        }
      ];

      const openingBalance = 0;
      let runningBalance = openingBalance;
      
      const entriesWithBalance = mockEntries.map(entry => {
        if (selectedAccount.account_type === 'asset' || selectedAccount.account_type === 'expense') {
          runningBalance += entry.debit - entry.credit;
        } else {
          runningBalance += entry.credit - entry.debit;
        }
        return { ...entry, balance: runningBalance };
      });

      const totalDebits = mockEntries.reduce((sum, entry) => sum + entry.debit, 0);
      const totalCredits = mockEntries.reduce((sum, entry) => sum + entry.credit, 0);

      setAccountLedger({
        account: selectedAccount,
        opening_balance: openingBalance,
        entries: entriesWithBalance,
        closing_balance: runningBalance,
        total_debits: totalDebits,
        total_credits: totalCredits
      });
    } catch (error) {
      console.error('Error loading account ledger:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = chartOfAccounts.filter(account => {
    const matchesSearch = account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && account.account_type === filterType;
  });

  const getAccountTypeColor = (account_type: string) => {
    switch (account_type) {
      case 'asset': return 'bg-blue-100 text-blue-800';
      case 'liability': return 'bg-red-100 text-red-800';
      case 'equity': return 'bg-purple-100 text-purple-800';
      case 'revenue': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'invoice': return <FileText className="w-4 h-4 text-green-500" />;
      case 'bill': return <FileText className="w-4 h-4 text-red-500" />;
      case 'journal_entry': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'payment': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportLedger = () => {
    if (!accountLedger) return;
    
    // En una implementación real, esto generaría un archivo Excel o PDF
    const csvContent = [
      ['Fecha', 'Referencia', 'Descripción', 'Débito', 'Crédito', 'Balance'],
      ...accountLedger.entries.map(entry => [
        entry.date,
        entry.reference,
        entry.description,
        entry.debit.toFixed(2),
        entry.credit.toFixed(2),
        entry.balance.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `libro_mayor_${accountLedger.account.account_code}_${dateFrom}_${dateTo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Libro Mayor</h2>
          <p className="text-gray-300">Consulta el detalle de movimientos por cuenta contable</p>
        </div>
        {accountLedger && (
          <button
            onClick={exportLedger}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Buscar Cuenta
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Código o nombre de cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Tipo de Cuenta
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="asset">Activos</option>
              <option value="liability">Pasivos</option>
              <option value="equity">Patrimonio</option>
              <option value="revenue">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Fecha Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Fecha Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de cuentas */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Plan de Cuentas</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`px-6 py-3 cursor-pointer border-b border-gray-700 hover:bg-gray-700 ${
                    selectedAccount?.id === account.id ? 'bg-blue-900 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {account.account_code} - {account.account_name}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.account_type)}`}>
                        {account.account_type}
                      </span>
                    </div>
                    {selectedAccount?.id === account.id && (
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalle del libro mayor */}
        <div className="lg:col-span-2">
          {selectedAccount ? (
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {selectedAccount.account_code} - {selectedAccount.account_name}
                    </h3>
                    <p className="text-sm text-gray-300">
                      Período: {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getAccountTypeColor(selectedAccount.account_type)}`}>
                    {selectedAccount.account_type}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : accountLedger ? (
                <>
                  {/* Resumen */}
                  <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Saldo Inicial
                        </p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          ${accountLedger.opening_balance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Total Débitos
                        </p>
                        <p className="mt-1 text-lg font-semibold text-green-400">
                          ${accountLedger.total_debits.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Total Créditos
                        </p>
                        <p className="mt-1 text-lg font-semibold text-red-400">
                          ${accountLedger.total_credits.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Saldo Final
                        </p>
                        <p className={`mt-1 text-lg font-semibold ${
                          accountLedger.closing_balance >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${accountLedger.closing_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Movimientos */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-600">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Referencia
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Débito
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Crédito
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-600">
                        {accountLedger.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getSourceTypeIcon(entry.source_type)}
                                <span className="ml-2 text-sm font-medium text-white">
                                  {entry.reference}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-white">
                              {entry.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={entry.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                                ${entry.balance.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {accountLedger.entries.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">No hay movimientos</h3>
                      <p className="mt-1 text-sm text-gray-300">
                        No se encontraron movimientos para esta cuenta en el período seleccionado
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 flex items-center justify-center h-96">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-white">Selecciona una cuenta</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Elige una cuenta del plan de cuentas para ver su libro mayor
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};