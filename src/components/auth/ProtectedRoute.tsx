import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import { FirstTimeSetup } from './FirstTimeSetup';
import { hasActiveUsers } from '../../database/simple-db';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [hasUsers, setHasUsers] = useState<boolean | null>(null);

    useEffect(() => {
        const checkUsers = async () => {
            const result = await hasActiveUsers();
            setHasUsers(result);
        };
        checkUsers();
    }, []);

    if (hasUsers === null) return null; // Or a spinner

    if (!isAuthenticated) {
        if (!hasUsers) {
            return <FirstTimeSetup onComplete={() => setHasUsers(true)} />;
        }
        return <LoginForm />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
