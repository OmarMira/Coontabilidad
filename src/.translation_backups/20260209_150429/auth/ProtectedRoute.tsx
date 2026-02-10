import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';

import { InitialSetupWizard } from '../setup/InitialSetupWizard';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, checkSystemHasUsers } = useAuth();

    if (!isAuthenticated) {
        // If system has no users, redirect to Initial Setup Wizard
        // Note: checkSystemHasUsers is synchronous because DB is initialized globally before App mounts
        if (!checkSystemHasUsers()) {
            return <InitialSetupWizard />;
        }
        return <LoginForm />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
