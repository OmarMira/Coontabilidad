import React, { useState, useEffect } from 'react';
import { Save, X, User as UserIcon, Lock, Shield } from 'lucide-react';
import UserService from '../../services/UserService';
import type { User, UserRole } from '../../types/user.types';
import { useAuth } from '../../contexts/AuthContext';

interface UserFormProps {
    user?: User | null;
    onSave: () => void;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
    const { user: currentUser } = useAuth();
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        display_name: '',
        role_id: 0
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const isEditing = !!user;

    useEffect(() => {
        // Cargar roles disponibles
        const availableRoles = UserService.getRoles();
        setRoles(availableRoles);

        // Si estamos editando, cargar datos del usuario
        if (user) {
            setFormData({
                username: user.username,
                password: '',
                confirmPassword: '',
                display_name: user.display_name,
                role_id: user.role_id
            });
        }
    }, [user]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username || formData.username.length < 3) {
            newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
        }

        if (!isEditing) {
            if (!formData.password || formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        if (!formData.display_name || formData.display_name.length < 2) {
            newErrors.display_name = 'El nombre para mostrar es requerido';
        }

        if (!formData.role_id || formData.role_id === 0) {
            newErrors.role_id = 'Debe seleccionar un rol';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            if (isEditing && user) {
                // Actualizar usuario existente
                const result = UserService.updateUser(
                    user.id,
                    {
                        display_name: formData.display_name,
                        role_id: formData.role_id
                    },
                    currentUser?.id
                );

                if (result.success) {
                    onSave();
                } else {
                    setErrors({ submit: result.message });
                }
            } else {
                // Crear nuevo usuario
                const result = await UserService.createUser(
                    {
                        username: formData.username,
                        password: formData.password,
                        display_name: formData.display_name,
                        role_id: formData.role_id
                    },
                    currentUser?.id
                );

                if (result.success) {
                    onSave();
                } else {
                    setErrors({ submit: result.message });
                }
            }
        } catch (error) {
            setErrors({ submit: 'Error al guardar el usuario' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">
                                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {isEditing ? 'Modificar información del usuario' : 'Crear un nuevo usuario del sistema'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error general */}
                    {errors.submit && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                            <p className="text-red-400 text-sm font-semibold">{errors.submit}</p>
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            disabled={isEditing}
                            className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.username ? 'border-red-500' : 'border-slate-700'
                                } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                            placeholder="usuario123"
                        />
                        {errors.username && (
                            <p className="mt-2 text-sm text-red-400">{errors.username}</p>
                        )}
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Nombre para Mostrar
                        </label>
                        <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.display_name ? 'border-red-500' : 'border-slate-700'
                                } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="Juan Pérez"
                        />
                        {errors.display_name && (
                            <p className="mt-2 text-sm text-red-400">{errors.display_name}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Rol del Usuario
                        </label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.role_id ? 'border-red-500' : 'border-slate-700'
                                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        >
                            <option value={0}>Seleccionar rol...</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name} - {role.description}
                                </option>
                            ))}
                        </select>
                        {errors.role_id && (
                            <p className="mt-2 text-sm text-red-400">{errors.role_id}</p>
                        )}
                    </div>

                    {/* Password (solo para nuevo usuario) */}
                    {!isEditing && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.password ? 'border-red-500' : 'border-slate-700'
                                        } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                                )}
                                <p className="mt-2 text-xs text-slate-500">Mínimo 6 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                                        } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="••••••••"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
