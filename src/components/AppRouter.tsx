import React, { useState, useEffect } from 'react';
import { InitialSetupWizard } from './setup/InitialSetupWizard';
import LoginForm from './auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { hasUsers, isDatabaseReady } from '../database/simple-db';

interface AppRouterProps {
  children: React.ReactNode;
}

export const AppRouter: React.FC<AppRouterProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetupStatus = () => {
      try {
        // Check if setup was completed
        const setupCompleted = localStorage.getItem('initial_setup_completed') === 'true';
        
        if (setupCompleted) {
          setShowSetupWizard(false);
          setIsChecking(false);
          return;
        }

        // Check if database is ready
        if (!isDatabaseReady()) {
          // Wait for database to be ready
          setTimeout(checkSetupStatus, 500);
          return;
        }

        // Check if there are users in the database
        const usersExist = hasUsers();
        
        if (!usersExist) {
          setShowSetupWizard(true);
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking setup status:', error);
        setIsChecking(false);
      }
    };

    checkSetupStatus();
  }, []);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando configuración...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard if no users exist
  if (showSetupWizard) {
    return <InitialSetupWizard />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show main app
  return <>{children}</>;
};
