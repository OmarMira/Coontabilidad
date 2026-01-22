import React, { createContext, useContext, useState, useEffect } from 'react';
import UserService from '../services/UserService';
import type { User as DBUser } from '../types/user.types';

interface User {
    id: number;
    username: string;
    display_name: string;
    role: string;
    role_id: number;
    role_level?: number;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
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

    const logout = () => {
        setUser(null);
        localStorage.removeItem('accountexpress_user');
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
                    role_level: dbUser.role_level
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
