import React, { useState, useEffect } from 'react';
import LoginForm from './auth/LoginForm';
import OnboardingWizard from './auth/OnboardingWizard';
import { useAuth } from '../contexts/AuthContext';
import { isDatabaseReady, hasUsers } from '@/database/simple-db';


interface AppRouterProps {
  children: React.ReactNode;
}

export const AppRouter: React.FC<AppRouterProps> = ({ children }) => {
  const { isAuthenticated, forceAdminBypass } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [initTimeout, setInitTimeout] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // 60 segundos

    const waitForDB = () => {
      attempts++;

      if (isDatabaseReady()) {
        setNeedsSetup(!hasUsers());
        setIsChecking(false);
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.error('[AppRouter] Timeout esperando DB.');
        setIsChecking(false);
        setInitTimeout(true);
        return;
      }

      setTimeout(waitForDB, 500);
    };

    waitForDB();
  }, []);

  // Pantalla de carga mientras inicia la DB
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Iniciando AccountExpress...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error si la DB tardó más de 60 segundos
  if (initTimeout) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 flex flex-col items-center text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-black text-rose-300 mb-2">Error Crítico del Sistema</h3>
          <p className="text-rose-200/70 font-medium mb-6">
            La base de datos no pudo inicializarse después de 60 segundos.
            Recarga la página o limpia el almacenamiento del navegador.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-white font-bold transition-all shadow-lg"
            >
              Reintentar
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={forceAdminBypass}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-300 font-bold transition-all"
              >
                Bypass (Dev)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isPublicPath = ['/terms', '/privacy', '/help'].includes(window.location.pathname);

  // Si es una ruta pública, renderizar children directamente (el layout de App debe manejar el estado limpio)
  if (isPublicPath) {
    return <>{children}</>;
  }

  if (needsSetup) {
    return <OnboardingWizard />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Autenticado → App principal
  return <>{children}</>;
};
