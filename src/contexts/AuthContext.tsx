import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
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
        // Validación SIMPLE por ahora (hardcoded)
        // TODO: Conectar con base de datos real
        if (username === 'admin' && password === 'admin123') {
            const userData: User = {
                id: 1,
                username: 'admin',
                email: 'admin@accountexpress.com',
                role: 'admin'
            };
            setUser(userData);
            localStorage.setItem('accountexpress_user', JSON.stringify(userData));
            return true;
        }

        // Usuario demo regular
        if (username === 'demo' && password === 'demo123') {
            const userData: User = {
                id: 2,
                username: 'demo',
                email: 'demo@accountexpress.com',
                role: 'user'
            };
            setUser(userData);
            localStorage.setItem('accountexpress_user', JSON.stringify(userData));
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('accountexpress_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user
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
