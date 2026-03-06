import React, { useState, useEffect } from 'react';
import { FirstTimeSetup } from './auth/FirstTimeSetup';
import LoginForm from './auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { hasActiveUsers, isDatabaseReady } from '../database/simple-db';

interface AppRouterProps {
  children: React.ReactNode;
}

export const AppRouter: React.FC<AppRouterProps> = ({ children }) => {
  const { isAuthenticated, forceAdminBypass } = useAuth();
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Check if database is ready
        if (!isDatabaseReady()) {
          // Wait for database to be ready
          setTimeout(checkSetupStatus, 500);
          return;
        }

        // Check if there are active users in the database
        const usersExist = await hasActiveUsers();

        if (!usersExist) {
          setShowFirstTimeSetup(true);
        } else {
          setShowFirstTimeSetup(false);
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Verificando configuración del sistema...</p>
        </div>
      </div>
    );
  }

  // Show setup or login if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {showFirstTimeSetup ? (
          <FirstTimeSetup onComplete={() => setShowFirstTimeSetup(false)} />
        ) : (
          <LoginForm />
        )}
        <button
          onClick={forceAdminBypass}
          className="fixed bottom-6 right-6 z-[9999] bg-red-600/90 backdrop-blur-xl text-white font-black uppercase text-xs py-3 px-6 rounded-2xl shadow-blue-500/20 shadow-2xl hover:bg-red-500 hover:scale-105 active:scale-95 transition-all border border-red-400/30 flex items-center gap-2 tracking-widest cursor-pointer group"
          title="Forzar entrada como Administrador Global (Saltea chequeos)"
        >
          <span className="group-hover:animate-ping">🚀</span> DEV BYPASS
        </button>
      </>
    );
  }

  // Show main app
  return <>{children}</>;
};
