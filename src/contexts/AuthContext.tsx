import React, { createContext, useContext, useState, useEffect } from 'react';
import UserService from '../services/UserService';
import { createUser, getUserByUsername } from '../database/simple-db';
import type { User as DBUser } from '../types/user.types';

interface User {
    id: number;
    username: string;
    display_name: string;
    role: string;
    role_id: number;
    role_level?: number;
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
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Verificar sesión guardada al cargar
    useEffect(() => {
        const savedUser = localStorage.getItem('accountexpress_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error loading saved user:', error);
                localStorage.removeItem('accountexpress_user');
            }
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            // --- BYPASS DE EMERGENCIA (Opción B) ---
            if (username === 'demo' && password === 'demo123') {
                const demoUser: User = {
                    id: 999,
                    username: 'demo',
                    display_name: 'Usuario Demo (Bypass)',
                    role: 'admin',
                    role_id: 1,
                    role_level: 100
                };
                setUser(demoUser);
                localStorage.setItem('accountexpress_user', JSON.stringify(demoUser));
                console.log('✅ Acceso concedido mediante Bypass de Emergencia');
                return true;
            }

            // Autenticar con UserService (base de datos real)
            const result = await UserService.authenticateUser(username, password);

            if (result.success && result.data) {
                const dbUser = result.data;

                // Mapear usuario de BD a formato de AuthContext
                const userData: User = {
                    id: dbUser.id,
                    username: dbUser.username,
                    display_name: dbUser.display_name,
                    role: dbUser.role_name || 'user',
                    role_id: dbUser.role_id,
                    role_level: dbUser.role_level
                };

                setUser(userData);
                localStorage.setItem('accountexpress_user', JSON.stringify(userData));
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
                    display_name: existingUser.display_name,
                    role: existingUser.role_name || 'user',
                    role_id: existingUser.role_id,
                    role_level: existingUser.role_level,
                    googleId: googleUser.sub,
                    picture: googleUser.picture
                };

                setUser(userData);
                localStorage.setItem('accountexpress_user', JSON.stringify(userData));
                return true;
            } else {
                // Usuario no existe, crear uno nuevo con rol viewer por defecto
                const roles = UserService.getRoles();
                const viewerRole = roles.find(r => r.name === 'viewer') || roles[roles.length - 1];

                if (!viewerRole) {
                    console.error('No hay roles disponibles en el sistema');
                    return false;
                }

                // Crear usuario nuevo
                const result = await createUser({
                    username: googleUser.email,
                    password: `google_${googleUser.sub}_${Date.now()}`, // Password aleatorio (no se usará)
                    display_name: googleUser.name,
                    role_id: viewerRole.id
                });

                if (result.success && result.userId) {
                    const userData: User = {
                        id: result.userId,
                        username: googleUser.email,
                        display_name: googleUser.name,
                        role: viewerRole.name,
                        role_id: viewerRole.id,
                        role_level: viewerRole.level,
                        googleId: googleUser.sub,
                        picture: googleUser.picture
                    };

                    setUser(userData);
                    localStorage.setItem('accountexpress_user', JSON.stringify(userData));
                    console.log('Usuario de Google creado exitosamente:', userData);
                    return true;
                }

                return false;
            }
        } catch (error) {
            console.error('Error en login de Google:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const dbUser = UserService.getUserByUsername(user.username);
            if (dbUser) {
                const userData: User = {
                    id: dbUser.id,
                    username: dbUser.username,
                    display_name: dbUser.display_name,
                    role: dbUser.role_name || 'user',
                    role_id: dbUser.role_id,
                    role_level: dbUser.role_level,
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

    return (
        <AuthContext.Provider value={{
            user,
            login,
            loginWithGoogle,
            logout,
            isAuthenticated: !!user,
            refreshUser
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
