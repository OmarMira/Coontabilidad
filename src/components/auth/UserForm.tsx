import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../i18n/useLocale';

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
                                {isEditing ? t('userForm.editUser') : t('userForm.newUser')}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {isEditing ? t('userForm.editUserDesc') : t('userForm.newUserDesc')}
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
                            {t('userForm.username')}
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            disabled={isEditing}
                            className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.username ? 'border-red-500' : 'border-slate-700'
                                } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                            placeholder={t('userForm.usernamePlaceholder')}
                        />
                        {errors.username && (
                            <p className="mt-2 text-sm text-red-400">{errors.username}</p>
                        )}
                    </div>

                    {/* Email and Full Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                {t('userForm.email')}
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.email ? 'border-red-500' : 'border-slate-700'
                                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder={t('userForm.emailPlaceholder')}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                {t('userForm.fullName')}
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.full_name ? 'border-red-500' : 'border-slate-700'
                                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder={t('userForm.fullNamePlaceholder')}
                            />
                            {errors.full_name && (
                                <p className="mt-2 text-sm text-red-400">{errors.full_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            {t('userForm.displayName')}
                        </label>
                        <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.display_name ? 'border-red-500' : 'border-slate-700'
                                } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder={t('userForm.displayNamePlaceholder')}
                        />
                        {errors.display_name && (
                            <p className="mt-2 text-sm text-red-400">{errors.display_name}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {t('userForm.userRole')}
                        </label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.role_id ? 'border-red-500' : 'border-slate-700'
                                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        >
                            <option value={0}>{t('userForm.selectRole')}</option>
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

                    {/* Password Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
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
                                    // Cambiar el tipo de input temporalmente podría ser buena idea, pero por ahora solo lo seteamos
                                    alert(t('userForm.generatedPasswordAlert', { pwd: generated }));
                                }}
                                className="text-[10px] font-black bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/20 transition-all uppercase tracking-tighter"
                            >
                                {t('userForm.generatePassword')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                                    {t('userForm.newPassword')}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.password ? 'border-red-500' : 'border-slate-700'
                                        } rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                                    {t('userForm.confirmPassword')}
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                                        } rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder={t('userForm.passwordPlaceholder')}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>
                        {isEditing && (
                            <p className="text-[10px] text-slate-500 italic">
                                {t('userForm.passwordLeaveBlank')}
                            </p>
                        )}
                    </div>


                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            {t('userForm.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? (isEditing ? t('userForm.updating') : t('userForm.saving')) : (isEditing ? t('userForm.update') : t('userForm.create'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
