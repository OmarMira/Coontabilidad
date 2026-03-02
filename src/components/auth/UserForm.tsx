import React, { useState, useEffect } from 'react';
import { XCircle, Save, Lock, Shield, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../i18n/useLocale';
import UserService from '../../services/UserService';
import type { User, UserRole } from '../../types/user.types';

interface UserFormProps {
    user?: User | null;
    onSave: () => void;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
    const { user: currentUser } = useAuth();
    const { t } = useLocale();
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
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
                email: user.email || '',
                full_name: user.full_name || '',
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
            newErrors.username = t('userForm.errorUsernameLength');
        }

        if (!formData.email || !formData.email.includes('@')) {
            newErrors.email = t('userForm.errorEmailInvalid');
        }

        if (!formData.full_name || formData.full_name.length < 2) {
            newErrors.full_name = t('userForm.errorFullNameRequired');
        }

        // Validación de password: obligatoria en creación, opcional en edición
        if (!isEditing) {
            if (!formData.password || formData.password.length < 6) {
                newErrors.password = t('userForm.errorPasswordLength');
            }
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = t('userForm.errorPasswordLength');
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('userForm.errorPasswordMismatch');
        }

        if (!formData.display_name || formData.display_name.length < 2) {
            newErrors.display_name = t('userForm.errorDisplayNameRequired');
        }

        if (!formData.role_id || formData.role_id === 0) {
            newErrors.role_id = t('userForm.errorRoleRequired');
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
                // 1. Actualizar datos básicos
                const result = UserService.updateUser(
                    user.id,
                    {
                        email: formData.email,
                        full_name: formData.full_name,
                        display_name: formData.display_name,
                        role_id: formData.role_id
                    },
                    currentUser?.id
                );

                if (result.success) {
                    // 2. Si hay password, actualizarla administrativamente
                    if (formData.password) {
                        const passResult = await UserService.resetUserPassword(user.id, formData.password);
                        if (!passResult.success) {
                            setErrors({ password: passResult.message });
                            setLoading(false);
                            return;
                        }
                    }
                    onSave();
                } else {
                    setErrors({ submit: result.message });
                }
            } else {
                // Crear nuevo usuario
                const result = await UserService.createUser(
                    {
                        username: formData.username,
                        email: formData.email,
                        full_name: formData.full_name,
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
            setErrors({ submit: t('userForm.errorSaving') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>

                {/* Header Hub */}
                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="text-blue-500">
                            <UserIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {isEditing ? t('userForm.editUser') : t('userForm.newUser')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Control de Acceso v4.2
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 relative z-10 custom-scrollbar">
                    {/* Error general */}
                    {errors.submit && (
                        <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-2">
                            <Shield className="w-6 h-6 text-rose-500 flex-shrink-0" />
                            <p className="text-rose-200 text-sm font-bold uppercase tracking-tight">{errors.submit}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} id="user-form" className="space-y-10">
                        {/* Basic Info */}
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                <UserIcon className="w-4 h-4 text-blue-400" />
                                {t('userForm.basicInfo') || 'INFORMACIÓN BÁSICA'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Username */}
                                <div className="md:col-span-2">
                                    <PremiumInput
                                        label={t('userForm.username')}
                                        value={formData.username}
                                        onChange={(v: string) => setFormData({ ...formData, username: v })}
                                        disabled={isEditing}
                                        error={errors.username}
                                        placeholder={t('userForm.usernamePlaceholder')}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <PremiumInput
                                        label={t('userForm.email')}
                                        type="email"
                                        value={formData.email}
                                        onChange={(v: string) => setFormData({ ...formData, email: v })}
                                        error={errors.email}
                                        placeholder={t('userForm.emailPlaceholder')}
                                    />
                                </div>

                                {/* Full Name */}
                                <div>
                                    <PremiumInput
                                        label={t('userForm.fullName')}
                                        value={formData.full_name}
                                        onChange={(v: string) => setFormData({ ...formData, full_name: v })}
                                        error={errors.full_name}
                                        placeholder={t('userForm.fullNamePlaceholder')}
                                    />
                                </div>

                                {/* Display Name */}
                                <div className="md:col-span-2">
                                    <PremiumInput
                                        label={t('userForm.displayName')}
                                        value={formData.display_name}
                                        onChange={(v: string) => setFormData({ ...formData, display_name: v })}
                                        error={errors.display_name}
                                        placeholder={t('userForm.displayNamePlaceholder')}
                                    />
                                </div>

                                {/* Role */}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        {t('userForm.userRole')}
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={formData.role_id}
                                            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                            className={`w-full bg-slate-950/50 border ${errors.role_id ? 'border-rose-500' : 'border-slate-800/50'} rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold uppercase tracking-widest text-[9px] appearance-none cursor-pointer`}
                                        >
                                            <option value={0}>{t('userForm.selectRole')}</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name} - {role.description}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 font-black">▼</div>
                                    </div>
                                    {errors.role_id && (
                                        <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest px-1">{errors.role_id}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="space-y-8 pt-10 border-t border-slate-800/50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                                    <Lock className="w-4 h-4" />
                                    {isEditing ? t('userForm.changePasswordOptional') : t('userForm.userPassword')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                                        let generated = '';
                                        for (let i = 0; i < 10; i++) {
                                            generated += chars.charAt(Math.floor(Math.random() * chars.length));
                                        }
                                        setFormData({ ...formData, password: generated, confirmPassword: generated });
                                        alert(t('userForm.generatedPasswordAlert', { pwd: generated }));
                                    }}
                                    className="text-[9px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20 transition-all uppercase tracking-widest active:scale-95"
                                >
                                    {t('userForm.generatePassword')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <PremiumInput
                                        label={t('userForm.newPassword')}
                                        type="password"
                                        value={formData.password}
                                        onChange={(v: string) => setFormData({ ...formData, password: v })}
                                        error={errors.password}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <PremiumInput
                                        label={t('userForm.confirmPassword')}
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(v: string) => setFormData({ ...formData, confirmPassword: v })}
                                        error={errors.confirmPassword}
                                        placeholder={t('userForm.passwordPlaceholder')}
                                    />
                                </div>
                            </div>
                            {isEditing && (
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                                    {t('userForm.passwordLeaveBlank')}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer Hub */}
                <footer className="p-10 border-t border-slate-800/50 bg-slate-950/30 flex justify-end gap-6 flex-shrink-0 relative z-10">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-800 active:scale-95"
                    >
                        {t('userForm.cancel')}
                    </button>
                    <button
                        form="user-form"
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40 active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span>{loading ? (isEditing ? t('userForm.updating') : t('userForm.saving')) : (isEditing ? t('userForm.update') : t('userForm.create'))}</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

const PremiumInput = ({ label, value, onChange, type = "text", required, placeholder, error, disabled }: any) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative group/input">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`w-full bg-slate-950/50 border ${error ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800/50 focus:border-blue-500/50'} rounded-2xl px-6 py-4 text-white outline-none transition-all font-black uppercase tracking-widest text-[10px] placeholder:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder={placeholder}
            />
        </div>
        {error && (
            <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest px-1">{error}</p>
        )}
    </div>
);
