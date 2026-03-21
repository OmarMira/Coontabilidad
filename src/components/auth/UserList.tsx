import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import UserService from '../../services/UserService';
import type { User } from '../../types/user.types';
import { useAuth } from '../../contexts/AuthContext';
import { UserForm } from './UserForm';
import { RolesDiagnostic } from './RolesDiagnostic';
import { useLocale } from '../../i18n/useLocale';

export const UserList: React.FC = () => {
    const { t } = useLocale();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        setLoading(true);
        try {
            const allUsers = UserService.getUsers();
            setUsers(allUsers);
        } catch (error) {
            logger.error('UserList', 'error', 'Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (userId: number) => {
        if (!confirm(t('userList.confirmDeactivate'))) return;

        const result = UserService.deactivateUser(userId, currentUser?.id);
        if (result.success) {
            loadUsers();
        } else {
            alert(result.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (roleLevel?: number) => {
        if (roleLevel === 100) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        if (roleLevel === 50) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        return 'bg-gray-500/20 text-slate-400 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">{t('userList.title')}</h1>
                        <p className="text-slate-400 text-sm">{t('userList.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setShowForm(true);
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-95 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    {t('userList.newUser')}
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
                <input
                    type="text"
                    placeholder={t('userList.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {t('userList.table.user')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {t('userList.table.name')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {t('userList.table.role')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {t('userList.table.status')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {t('userList.table.lastAccess')}
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {t('userList.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-slate-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-white font-semibold">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-slate-300">{user.display_name}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeColor(user.role_level)}`}>
                                            {user.role_name || t('userList.noRole')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.is_active ? (
                                            <span className="flex items-center gap-2 text-emerald-400">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{t('userList.status.active')}</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-red-400">
                                                <XCircle className="w-4 h-4" />
                                                <span className="text-sm font-semibold">{t('userList.status.inactive')}</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                                        {user.last_login
                                            ? new Date(user.last_login).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : t('userList.never')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setShowForm(true);
                                                }}
                                                className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl transition-all active:scale-95"
                                                title={t('userList.editUser')}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {user.id !== currentUser?.id && user.is_active && (
                                                <button
                                                    onClick={() => handleDeactivate(user.id)}
                                                    className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition-all active:scale-95"
                                                    title={t('userList.deactivateUser')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg font-semibold">{t('userList.noUsers')}</p>
                        <p className="text-slate-500 text-sm mt-2">
                            {searchTerm ? t('userList.noUsersSearch') : t('userList.noUsersCreate')}
                        </p>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">{t('userList.stats.total')}</p>
                            <p className="text-white text-2xl font-black">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">{t('userList.stats.active')}</p>
                            <p className="text-white text-2xl font-black">
                                {users.filter(u => u.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">{t('userList.stats.admins')}</p>
                            <p className="text-white text-2xl font-black">
                                {users.filter(u => u.role_level === 100).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Form Modal */}
            {showForm && (
                <UserForm
                    user={editingUser}
                    onSave={() => {
                        setShowForm(false);
                        setEditingUser(null);
                        loadUsers();
                    }}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingUser(null);
                    }}
                />
            )}

            {/* Diagnostic Tool Removed */}
        </div>
    );
};
