import React, { useState, useEffect } from 'react';
import { Shield, User, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createUser, seedUsersAndRoles, getUserRoles, hasActiveUsers } from '../../database/simple-db';
import { logger } from '../../core/logging/SystemLogger';

interface FirstTimeSetupProps {
    onComplete: () => void;
}

export const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [adminRoleId, setAdminRoleId] = useState<number | null>(null);

    useEffect(() => {
        const initSetup = async () => {
            setIsInitializing(true);
            // Asegurarse de que los roles existan
            try {
                // Pequeña espera para asegurar que la base de datos esté lista
                await new Promise(resolve => setTimeout(resolve, 800));

                await seedUsersAndRoles();
                const roles = getUserRoles();
                logger.info('Setup', 'roles_loaded', `Roles encontrados: ${roles.length}`);

                // Buscar rol admin de forma robusta
                const adminRole = roles.find(r =>
                    r.name.toLowerCase() === 'admin' ||
                    r.name.toLowerCase() === 'administrador' ||
                    r.level >= 100
                );

                if (adminRole) {
                    setAdminRoleId(adminRole.id);
                    logger.info('Setup', 'admin_role_found', `ID de rol admin: ${adminRole.id}`);
                } else {
                    console.error('Roles disponibles:', roles);
                    setError('No se pudo inicializar el rol de administrador. Por favor, recargue la página o contacte a soporte.');
                }
            } catch (err) {
                setError('Error inicializando el sistema de roles: ' + (err instanceof Error ? err.message : 'Error desconocido'));
            } finally {
                setIsInitializing(false);
            }
        };
        initSetup();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isInitializing) return;

        setIsLoading(true);
        setError(null);

        // Validaciones básicas
        if (!formData.fullName || !formData.email || !formData.username || !formData.password) {
            setError('Todos los campos son obligatorios');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setIsLoading(false);
            return;
        }

        let finalRoleId = adminRoleId;

        if (!finalRoleId) {
            setError('Error de configuración del sistema: Rol Admin no encontrado. Reintentando carga...');
            // Intentar recargar roles si falló
            const roles = getUserRoles();
            const adminRole = roles.find(r => r.name.toLowerCase() === 'admin' || r.level >= 100);
            if (adminRole) {
                setAdminRoleId(adminRole.id);
                finalRoleId = adminRole.id;
            } else {
                setIsLoading(false);
                return;
            }
        }

        try {
            const result = await createUser({
                username: formData.username,
                email: formData.email,
                full_name: formData.fullName,
                display_name: formData.fullName,
                password: formData.password,
                role_id: finalRoleId as number
            });

            if (result.success) {
                setSuccess(true);
                logger.info('Setup', 'admin_created', `Administrador ${formData.username} creado exitosamente`);
                setTimeout(() => {
                    onComplete();
                }, 2000);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Error al crear el administrador: ' + (err instanceof Error ? err.message : 'Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#1e293b] border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">¡Configuración Exitosa!</h2>
                    <p className="text-slate-400">El administrador ha sido creado correctamente. Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0f172a] to-[#0f172a] flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">AccountExpress</h1>
                    <p className="text-blue-100 font-medium">Configuración Inicial del Sistema</p>
                </div>

                <div className="p-8">
                    <div className="mb-8 text-center">
                        <h2 className="text-xl font-bold text-white">Bienvenido</h2>
                        <p className="text-slate-400 text-sm mt-1">No hay usuarios registrados. Configurá el administrador del sistema.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="Ej. Juan Pérez"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="admin@empresa.com"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre de Usuario</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isInitializing}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : isInitializing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando sistema...
                                </>
                            ) : (
                                'Crear Administrador'
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-slate-900/50 p-4 text-center border-t border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">AccountExpress Enterprise Management System v1.1</p>
                </div>
            </div>
        </div>
    );
};
