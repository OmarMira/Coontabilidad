import React, { useState } from 'react';
import { BadgeDollarSign, Edit, Trash2, Search, Plus, Building2, CreditCard } from 'lucide-react';
import { BankAccount } from '../database/simple-db';

interface BankAccountListProps {
    accounts: BankAccount[];
    onAddAccount: () => void;
    onEditAccount: (account: BankAccount) => void;
    onDeleteAccount: (id: number) => void;
}

export const BankAccountList: React.FC<BankAccountListProps> = ({
    accounts,
    onAddAccount,
    onEditAccount,
    onDeleteAccount
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch =
            account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.account_number.includes(searchTerm);

        const matchesType = filterType === 'all' || account.account_type === filterType;

        return matchesSearch && matchesType;
    });

    const getAccountTypeLabel = (type: string) => {
        switch (type) {
            case 'checking': return 'Corriente';
            case 'savings': return 'Ahorros';
            case 'credit': return 'Crédito';
            case 'other': return 'Otro';
            default: return type;
        }
    };

    const getAccountTypeColor = (type: string) => {
        switch (type) {
            case 'checking': return 'text-blue-400';
            case 'savings': return 'text-green-400';
            case 'credit': return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Building2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Cuentas Bancarias</h2>
                        <p className="text-gray-400 text-sm">Gestiona tus cuentas y saldos bancarios</p>
                    </div>
                </div>

                <button
                    onClick={onAddAccount}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Cuenta
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, banco o número..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none min-w-[150px]"
                >
                    <option value="all">Todos los tipos</option>
                    <option value="checking">Corriente</option>
                    <option value="savings">Ahorros</option>
                    <option value="credit">Crédito</option>
                    <option value="other">Otro</option>
                </select>
            </div>

            {filteredAccounts.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
                    <BadgeDollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg font-medium mb-2">
                        {searchTerm || filterType !== 'all' ? 'No se encontraron cuentas' : 'No hay cuentas registradas'}
                    </p>
                    <p className="text-gray-500 text-sm">
                        {searchTerm || filterType !== 'all'
                            ? 'Intenta cambiar los criterios de búsqueda'
                            : 'Registra tu primera cuenta bancaria para comenzar'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccounts.map((account) => (
                        <div
                            key={account.id}
                            className={`relative bg-gray-900 p-6 rounded-xl border transition-all duration-200 group hover:-translate-y-1 hover:shadow-xl ${!account.is_active ? 'border-gray-700 opacity-75' : 'border-gray-700 hover:border-blue-500/50'
                                }`}
                        >
                            {!account.is_active && (
                                <div className="absolute top-4 right-4 px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 font-medium">
                                    Inactiva
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                                    <CreditCard className={`w-6 h-6 ${getAccountTypeColor(account.account_type)}`} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEditAccount(account)}
                                        className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all"
                                        title="Editar cuenta"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteAccount(account.id)}
                                        className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                                        title="Eliminar cuenta"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 truncate">
                                {account.account_name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4 font-medium">
                                {account.bank_name}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-gray-800">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Saldo Actual</span>
                                    <span className={`font-mono font-bold text-lg ${account.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                                        {formatCurrency(account.balance, account.currency)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${getAccountTypeColor(account.account_type).replace('text-', 'bg-')}`}></span>
                                        {getAccountTypeLabel(account.account_type)}
                                    </span>
                                    <span className="font-mono">
                                        •••• {account.account_number.slice(-4)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
