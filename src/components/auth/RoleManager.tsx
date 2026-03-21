import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Save, X, AlertCircle, Check } from 'lucide-react';
import { getUserRoles, createUserRole, updateUserRole, deleteUserRole } from '@/database/modules/db-users';
import type { UserRole } from '../../types/user.types';
import { useLocale } from '../../i18n/useLocale';

export const RoleManager: React.FC = () => {
    const { t } = useLocale();

    const AVAILABLE_MODULES = [
        {
            id: 'dashboard',
            label: t('roleManager.modules.dashboard'),
            actions: ([{ id: 'view', label: t('roleManager.actions.view') }])
        },
        {
            id: 'customers',
            label: t('roleManager.modules.customers'),
            actions: ([
                { id: 'view', label: t('roleManager.actions.view') },
                { id: 'create', label: t('roleManager.actions.create') },
                { id: 'edit', label: t('roleManager.actions.edit') },
                { id: 'delete', label: t('roleManager.actions.delete') }
            ])
        },
        {
            id: 'suppliers',
            label: t('roleManager.modules.suppliers'),
            actions: ([
                { id: 'view', label: t('roleManager.actions.view') },
                { id: 'create', label: t('roleManager.actions.create') },
                { id: 'edit', label: t('roleManager.actions.edit') },
                { id: 'delete', label: t('roleManager.actions.delete') }
            ])
        },
        {
            id: 'products',
            label: t('roleManager.modules.products'),
            actions: ([
                { id: 'view', label: t('roleManager.actions.view') },
                { id: 'create', label: t('roleManager.actions.create') },
                { id: 'edit', label: t('roleManager.actions.edit') },
                { id: 'delete', label: t('roleManager.actions.delete') }
            ])
        },
        {
            id: 'invoices',
            label: t('roleManager.modules.invoices'),
            actions: ([
                { id: 'view', label: t('roleManager.actions.view') },
                { id: 'create', label: t('roleManager.actions.create') },
                { id: 'edit', label: t('roleManager.actions.edit') },
                { id: 'delete', label: t('roleManager.actions.delete') },
                { id: 'approve', label: t('roleManager.actions.approve') }
            ])
        },
        {
            id: 'bills',
            label: t('roleManager.modules.bills'),
            actions: ([
                { id: 'view', label: t('roleManager.actions.view') },
                { id: 'create', label: t('roleManager.actions.create') },
                { id: 'edit', label: t('roleManager.actions.edit') },
                { id: 'delete', label: t('roleManager.actions.delete') },
                { id: 'approve', label: t('roleManager.actions.approve') }
            ])
        },
        {
            id: 'accounting',
            label: t('roleManager.modules.accounting'),
            actions: ([
                { id: 'view_chart_of_accounts', label: t('roleManager.actions.viewChartOfAccounts') },
                { id: 'create_journal', label: t('roleManager.actions.createJournal') },
                { id: 'edit_journal', label: t('roleManager.actions.editJournal') },
                { id: 'view_reports', label: t('roleManager.actions.viewReports') },
                { id: 'close_period', label: t('roleManager.actions.closePeriod') }
            ])
        },
        {
            id: 'settings',
            label: t('roleManager.modules.settings'),
            actions: ([
                { id: 'view_company', label: t('roleManager.actions.viewCompany') },
                { id: 'manage_users', label: t('roleManager.actions.manageUsers') },
                { id: 'manage_roles', label: t('roleManager.actions.manageRoles') }
            ])
        }
    ];

    const [roles, setRoles] = useState<UserRole[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState<UserRole | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        level: 0,
        permissions: {} as Record<string, string[]>
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);


    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = () => {
        try {
            const allRoles = getUserRoles();
            setRoles(allRoles as UserRole[]);
        } catch (err) {
            setError(t('roleManager.error.load'));
            logger.error('RoleManager', 'error', 'operation_failed', err);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const submissionData = {
            ...formData,
            permissions_json: JSON.stringify(formData.permissions)
        };

        if (editingRole) {
            // Actualizar rol existente
            const result = updateUserRole(editingRole.id, submissionData);
            if (result.success) {
                setSuccess(result.message);
                setShowForm(false);
                setEditingRole(null);
                resetForm();
                loadRoles();
            } else {
                setError(result.message);
            }
        } else {
            // Crear nuevo rol
            const result = createUserRole(submissionData);
            if (result.success) {
                setSuccess(result.message);
                setShowForm(false);
                resetForm();
                loadRoles();
            } else {
                setError(result.message);
            }
        }
    };

    const handleEdit = (role: UserRole) => {
        setEditingRole(role);
        let parsedPermissions = {};
        try {
            parsedPermissions = JSON.parse(role.permissions_json || '{}');
        } catch (e) {
            logger.error('RoleManager', 'error', 'Error parsing permissions JSON', e);
        }

        setFormData({
            name: role.name,
            description: role.description || '',
            level: role.level,
            permissions: parsedPermissions
        });
        setShowForm(true);
    };

    const togglePermission = (moduleId: string, actionId: string) => {
        setFormData(prev => {
            const currentModulePerms = prev.permissions[moduleId] || [];
            let newModulePerms;

            if (currentModulePerms.includes(actionId)) {
                newModulePerms = currentModulePerms.filter(p => p !== actionId);
            } else {
                newModulePerms = [...currentModulePerms, actionId];
            }

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [moduleId]: newModulePerms
                }
            };
        });
    };

    const handleDelete = (role: UserRole) => {
        if (!confirm(`${t('roleManager.deleteConfirm')} "${role.name}"?`)) return;

        const result = deleteUserRole(role.id);
        if (result.success) {
            setSuccess(result.message);
            loadRoles();
        } else {
            setError(result.message);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', level: 0, permissions: {} });
        setEditingRole(null);
    };

    const getLevelBadgeColor = (level: number) => {
        if (level >= 100) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        if (level >= 50) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        return 'bg-gray-500/20 text-slate-400 border-gray-500/30';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">{t('roleManager.title')}</h1>
                        <p className="text-slate-400 text-sm">{t('roleManager.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/50 hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    {t('roleManager.newRole')}
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-400 text-sm">{success}</p>
                </div>
            )}

            {/* Roles Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                {t('roleManager.table.name')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                {t('roleManager.table.description')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">
                                {t('roleManager.table.level')}
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">
                                {t('roleManager.table.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-white font-semibold">{role.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-300">{role.description}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getLevelBadgeColor(role.level)}`}>
                                        {t('roleManager.table.levelBadge').replace('{level}', role.level.toString())}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(role)}
                                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                                            title={t('roleManager.tooltip.editRole')}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {!['admin', 'accountant', 'viewer'].includes(role.name) && (
                                            <button
                                                onClick={() => handleDelete(role)}
                                                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                                title={t('roleManager.tooltip.deleteRole')}
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

                {roles.length === 0 && (
                    <div className="text-center py-12">
                        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg font-semibold">{t('roleManager.empty.title')}</p>
                        <p className="text-slate-500 text-sm mt-2">{t('roleManager.empty.desc')}</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-black text-white">
                                    {editingRole ? t('roleManager.modal.editRole') : t('roleManager.modal.newRole')}
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    {t('roleManager.form.roleName')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder={t('roleManager.form.namePlaceholder')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    {t('roleManager.form.description')}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder={t('roleManager.form.descPlaceholder')}
                                    rows={2}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    {t('roleManager.form.accessLevel')}
                                </label>
                                <input
                                    type="number"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    min="0"
                                    max="100"
                                    required
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    {t('roleManager.form.levelHelp')}
                                </p>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-300 mb-3">
                                    {t('roleManager.form.systemPermissions')}
                                </label>
                                <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                                    {AVAILABLE_MODULES.map((module) => (
                                        <div key={module.id} className="border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                                            <h4 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                {module.label}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {module.actions.map((action) => {
                                                    const isChecked = formData.permissions[module.id]?.includes(action.id);
                                                    return (
                                                        <label
                                                            key={`${module.id}-${action.id}`}
                                                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${isChecked
                                                                ? 'bg-purple-600/20 border-purple-500/50'
                                                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked
                                                                ? 'bg-purple-600 border-purple-500'
                                                                : 'border-slate-500'
                                                                }`}>
                                                                {isChecked && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked || false}
                                                                onChange={() => togglePermission(module.id, action.id)}
                                                            />
                                                            <span className={`text-xs ${isChecked ? 'text-purple-200' : 'text-slate-400'}`}>
                                                                {action.label}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900 border-t border-slate-800 -mx-6 px-6 -mb-6 pb-6 mt-6 z-10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/50"
                                >
                                    <Save className="w-5 h-5" />
                                    {editingRole ? t('roleManager.button.update') : t('roleManager.button.createRole')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
