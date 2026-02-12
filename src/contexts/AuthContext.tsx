import React, { createContext, useContext, useState, useEffect } from 'react';
import { translationEngine } from '../core/i18n/TranslationEngine';
import UserService from '../services/UserService';
import { createUser, getUserByUsername, hasUsers } from '../database/simple-db';
import type { User as DBUser } from '../types/user.types';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    display_name: string;
    role: string;
    role_id: number;
    role_level?: number;
    permissions?: Record<string, string[]>;
    googleId?: string;
    picture?: string;
}

interface GoogleUserInfo {
    email: string;
    name: string;
    picture: string;
    sub: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    loginWithGoogle: (googleUser: GoogleUserInfo) => Promise<boolean>;
    loginAsGuest: () => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
    hasPermission: (module: string, action: string) => boolean;
    checkSystemHasUsers: () => boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Verificar sesión guardada al cargar
    useEffect(() => {
        const savedData = localStorage.getItem('accountexpress_user');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);

                // Check format: New (with expiry) or Legacy (active user)
                if (parsed.expiresAt) {
                    if (Date.now() < parsed.expiresAt) {
                        setUser(parsed.user);
                    } else {
                        console.warn('Session expired (8h limit).');
                        localStorage.removeItem('accountexpress_user');
                    }
                } else if (parsed.id) { // Legacy user object
                    // Migrate legacy session to 8h expiry
                    setUser(parsed);
                    const sessionData = {
                        user: parsed,
                        expiresAt: Date.now() + 8 * 60 * 60 * 1000
                    };
                    localStorage.setItem('accountexpress_user', JSON.stringify(sessionData));
                }
            } catch (error) {
                console.error('Error loading saved session:', error);
                localStorage.removeItem('accountexpress_user');
            }
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            // Autenticar con UserService (base de datos real)
            // NOTA: Los accesos hardcodeados (demo/admin) han sido eliminados por política de seguridad (NIST/ISO 27001).
            // Todo acceso debe pasar por la base de datos cifrada o OAuth2.
            const result = await UserService.authenticateUser(username, password);

            if (result.success && result.data) {
                const dbUser = result.data;

                // Mapear usuario de BD a formato de AuthContext
                const userData: User = {
                    id: dbUser.id,
                    username: dbUser.username,
                    email: dbUser.email,
                    full_name: dbUser.full_name,
                    display_name: dbUser.display_name,
                    role: dbUser.role_name || 'user',
                    role_id: dbUser.role_id,
                    role_level: dbUser.role_level,
                    permissions: (dbUser as any).permissions_json ? JSON.parse((dbUser as any).permissions_json) : {}
                };

                setUser(userData);
                localStorage.setItem('accountexpress_user', JSON.stringify({
                    user: userData,
                    expiresAt: Date.now() + 8 * 60 * 60 * 1000
                }));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const loginWithGoogle = async (googleUser: GoogleUserInfo): Promise<boolean> => {
        try {
            console.log('Procesando login de Google:', googleUser);

            // Buscar si el usuario ya existe por email
            const existingUser = getUserByUsername(googleUser.email);

            if (existingUser) {
                // Usuario existe, hacer login
                const userData: User = {
                    id: existingUser.id,
                    username: existingUser.username,
                    email: existingUser.email,
                    full_name: existingUser.full_name,
                    display_name: existingUser.display_name,
                    role: existingUser.role_name || 'user',
                    role_id: existingUser.role_id,
                    role_level: existingUser.role_level,
                    permissions: (existingUser as any).permissions_json ? JSON.parse((existingUser as any).permissions_json) : {},
                    googleId: googleUser.sub,
                    picture: googleUser.picture
                };

                setUser(userData);
                localStorage.setItem('accountexpress_user', JSON.stringify({
                    user: userData,
                    expiresAt: Date.now() + 8 * 60 * 60 * 1000
                }));
                return true;
            } else {
                // Usuario no existe, determinar rol según si es el primer usuario
                const roles = UserService.getRoles();
                const isFirstUser = !hasUsers();

                // Si es el primer usuario → Admin, si no → Vendedor
                let assignedRole;
                if (isFirstUser) {
                    assignedRole = roles.find(r => r.name === 'admin');
                    console.log('🎯 Primer usuario del sistema - Asignando rol de Administrador');
                } else {
                    assignedRole = roles.find(r => r.name === 'vendedor');
                    console.log('👤 Usuario adicional - Asignando rol de Vendedor');
                }

                // Fallback a viewer si no se encuentra el rol
                if (!assignedRole) {
                    assignedRole = roles.find(r => r.name === 'viewer') || roles[roles.length - 1];
                }

                if (!assignedRole) {
                    console.error('No hay roles disponibles en el sistema');
                    return false;
                }

                // Crear usuario nuevo
                console.log('📝 Creando usuario de Google:', {
                    email: googleUser.email,
                    name: googleUser.name,
                    role: assignedRole.name
                });

                const result = await createUser({
                    username: googleUser.email,
                    email: googleUser.email,
                    full_name: googleUser.name,
                    password: `google_${googleUser.sub}_${Date.now()}`, // Password aleatorio (no se usará)
                    display_name: googleUser.name,
                    display_name: googleUser.name,
                    role_id: assignedRole.id,
                    picture: googleUser.picture
                });

                console.log('📊 Resultado de creación de usuario:', result);

                if (result.success && result.userId) {
                    const userData: User = {
                        id: result.userId,
                        username: googleUser.email,
                        email: googleUser.email,
                        full_name: googleUser.name,
                        display_name: googleUser.name,
                        role: assignedRole.name,
                        role_id: assignedRole.id,
                        role_level: assignedRole.level,
                        permissions: assignedRole.permissions_json ? JSON.parse(assignedRole.permissions_json) : {},
                        googleId: googleUser.sub,
                        picture: googleUser.picture
                    };

                    setUser(userData);
                    localStorage.setItem('accountexpress_user', JSON.stringify({
                        user: userData,
                        expiresAt: Date.now() + 8 * 60 * 60 * 1000
                    }));

                    // Sync Language Preference for New Users
                    const browserLang = navigator.language.split('-')[0]; // 'es-ES' -> 'es'
                    if (browserLang === 'es' || browserLang === 'en') {
                        translationEngine.setLanguage(browserLang as 'es' | 'en');
                        console.log(`🌍 Idioma sincronizado con navegador: ${browserLang}`);
                    }

                    console.log(`✅ Usuario de Google creado exitosamente con rol: ${assignedRole.name}`, userData);
                    return true;
                }

                // Si la creación falla, propagar el error
                console.error('❌ Error al crear usuario de Google:', {
                    mensaje: result.message,
                    datos: { email: googleUser.email, role: assignedRole.name }
                });
                throw new Error(result.message || 'Error desconocido al crear usuario');
            }
        } catch (error) {
            console.error('❌ CRITICAL: Error en login de Google:', error);
            // Propagar el error para que LoginForm lo muestre
            throw error;
        }
    };

    const checkSystemHasUsers = () => {
        return hasUsers();
    };

    const loginAsGuest = async (): Promise<boolean> => {
        try {
            console.log('🔄 Switching to Volatile Demo Mode...');

            // 1. Reset current DB connection to switch modes
            const { resetDB, initDB, createUser } = await import('../database/simple-db');
            await resetDB();

            // 2. Initialize in RAM-ONLY Mode (Volatile)
            // This creates a fresh new SQL.Database() instance
            await initDB(undefined, true);

            // 3. Create Demo User in the Volatile DB
            // We need a user in the DB so relational queries (invoice.userId) work
            const roles = UserService.getRoles();
            const adminRole = roles.find(r => r.name === 'admin') || roles[0];

            if (!adminRole) throw new Error('System roles not initialized in Demo Mode');

            const demoUserFn = {
                username: 'demo.admin',
                email: 'demo@volatile.local',
                full_name: 'Modo Demo Volátil',
                display_name: 'Demo Admin',
                password: 'demo_access_grant',
                role_id: adminRole.id
            };

            const createRes = await createUser(demoUserFn);

            if (createRes.success && createRes.userId) {
                const userData: User = {
                    id: createRes.userId,
                    username: demoUserFn.username,
                    email: demoUserFn.email,
                    full_name: demoUserFn.full_name,
                    display_name: demoUserFn.display_name,
                    role: adminRole.name,
                    role_id: adminRole.id,
                    role_level: adminRole.level,
                    permissions: adminRole.permissions_json ? JSON.parse(adminRole.permissions_json) : {}
                };

                setUser(userData);

                // NOTA CRÍTICA: NO guardamos en localStorage.
                // "Al cerrar la pestaña o refrescar, los datos deben desaparecer por completo".
                // Esto incluye la sesión. Si refrescan, vuelven al login y la DB persistente.

                console.log('✅ Volatile Demo Mode Activated (RAM Only)');
                return true;
            }

            return false;

        } catch (e) {
            console.error('Guest login failed', e);
            return false;
        }
    };

    const logout = () => {
        try {
            setUser(null);
            localStorage.removeItem('accountexpress_user');
            localStorage.removeItem('gdrive_token'); // Ensure this is also cleared

            // Clear everything else
            localStorage.clear();
            sessionStorage.clear();

            console.log('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error durante cierre de sesión:', error);
        } finally {
            // Force hard reload to login page
            window.location.href = '/';
            // Fallback reload if router doesn't pick it up
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const dbUser = UserService.getUserByUsername(user.username);
            if (dbUser) {
                const userData: User = {
                    id: dbUser.id,
                    username: dbUser.username,
                    email: dbUser.email,
                    full_name: dbUser.full_name,
                    display_name: dbUser.display_name,
                    role: dbUser.role_name || 'user',
                    role_id: dbUser.role_id,
                    role_level: dbUser.role_level,
                    permissions: (dbUser as any).permissions_json ? JSON.parse((dbUser as any).permissions_json) : {},
                    googleId: user.googleId,
                    picture: user.picture
                };
                setUser(userData);
                localStorage.setItem('accountexpress_user', JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    const hasPermission = (module: string, action: string): boolean => {
        if (!user || !user.permissions) return false;
        if (user.role === 'admin') return true;

        const modulePerms = user.permissions[module];
        if (!modulePerms) return false;

        return modulePerms.includes(action);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            loginWithGoogle,
            loginAsGuest,
            checkSystemHasUsers,
            logout,
            isAuthenticated: !!user,
            refreshUser,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};
