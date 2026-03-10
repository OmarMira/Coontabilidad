import React from 'react';
import { createRoot } from 'react-dom/client';
import { DynamicErrorBoundary } from '@/components/error/DynamicErrorBoundary';
import { DatabaseHealthChecker } from '@/core/DatabaseHealthChecker';
import { NuclearCleanExecution } from '@/core/NuclearCleanExecution';
import { DatabaseReconstructor } from '@/database/DatabaseReconstructor';
import { AIResponseFixer } from '@/services/ai/AIResponseFixer';
import { DashboardRestorer } from '@/core/DashboardRestorer';
import { db, initDB, getDBEngine } from '@/database/simple-db';
import { MigrationEngine } from '@/core/migrations/MigrationEngine';
import { logger } from '@/utils/logger';
import { LanguageProvider } from './i18n/LanguageContext';
import { exhaustiveAuthDiagnostic } from '@/utils/forceInitDB';
import './index.css';
import './styles/error-recovery.css';


async function executeNuclearRepair() {
  try {
    logger.emergency('INICIANDO REPARACIÓN NUCLEAR SOLICITADA', null, undefined, 'System', 'nuclear_repair_init');

    // 1. Limpieza Nuclear
    await NuclearCleanExecution.execute();

    // 2. Reinicializar DB (esto crea el archivo vacío en OPFS)
    const newDb = await initDB();

    // 3. Reconstruir con orden jerárquico correcto
    await DatabaseReconstructor.reconstruct(newDb);

    // 4. Fix IA
    await AIResponseFixer.enforceDataDrivenResponses();

    // 5. Restaurar Dashboard
    DashboardRestorer.restore();

    logger.success('REPARACIÓN NUCLEAR COMPLETADA. REINICIANDO...', null, 'System', 'nuclear_repair_success');

    // Pequeña espera para asegurar que todo se guardó
    await new Promise(r => setTimeout(r, 1000));

    // Limpiar parámetros y recargar
    const url = new URL(window.location.href);
    url.searchParams.delete('nuclear');
    window.location.href = url.pathname;

  } catch (error: any) {
    logger.critical('FALLO CATASTRÓFICO EN REPARACIÓN NUCLEAR', { error: error.message }, error, 'System', 'nuclear_repair_failed');
    alert('Error en reparación nuclear: ' + error.message);
  }
}

async function initializeApplication(): Promise<void> {
  try {
    const urlParams = new URLSearchParams(window.location.search);

    // 4. NuclearClean SOLO si viene el parámetro URL ?nuclear=confirm
    if (urlParams.get('nuclear') === 'confirm') {
      await executeNuclearRepair();
      return;
    }

    // 1. Inicializar la base de datos (solo motor y carga)
    await initDB();

    // 2. Correr migraciones pendientes (MigrationEngine)
    const dbEngineInstance = getDBEngine();
    const migrationEngine = MigrationEngine.getInstance();
    await migrationEngine.migrate(dbEngineInstance);
    await dbEngineInstance.sync();

    // 3. FirstRunSetup / Seeding (CORRE DESPUÉS DE MIGRACIONES)
    try {
      const { seedUsersAndRoles, seedSystemDefaults } = await import('@/database/simple-db');
      await seedUsersAndRoles();
      await seedSystemDefaults();
      await dbEngineInstance.sync();
      console.log('[main] FirstRunSetup completado con éxito.');
    } catch (seedErr) {
      console.error('[main] Error en FirstRunSetup:', seedErr);
    }

    // Health check en BACKGROUND — no bloquea el render
    // Si falla, la app ya está montada y el usuario puede trabajar
    // Fase 5: Health check informativo — sin auto-reparación automática
    setTimeout(async () => {
      try {
        const dbHealth = await DatabaseHealthChecker.checkHealth();
        if (!dbHealth.healthy) {
          console.warn('[main] Health check detectó problemas — revisar manualmente desde panel de administración');
        }
      } catch (healthErr) {
        console.warn('[main] Health check en background falló (no crítico):', healthErr);
      }
    }, 2000);

    const App = (await import('./App')).default;
    const { AuthProvider } = await import('./contexts/AuthContext');
    const { SystemIntegrityGate } = await import('./components/security/SystemIntegrityGate');

    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Failed to find the root element');
    const root = createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <DynamicErrorBoundary>
          <LanguageProvider>
            <SystemIntegrityGate>
              <AuthProvider>
                <App />
              </AuthProvider>
            </SystemIntegrityGate>
          </LanguageProvider>
        </DynamicErrorBoundary>
      </React.StrictMode>
    );

  } catch (error: any) {
    logger.critical('Fallo en inicialización', { error: error.message }, error, 'Main', 'startup_error');

    // Renderizar pantalla de error en lugar de pantalla negra
    const root = document.getElementById('root');
    const isSpanish = (localStorage.getItem('account_express_locale') || 'es') === 'es';

    const messages = {
      title: isSpanish ? 'Error de Inicialización' : 'Initialization Error',
      reload: isSpanish ? 'Recargar Aplicación' : 'Reload Application',
      contact: isSpanish ? 'Si el problema persiste, contacta al soporte técnico' : 'If the problem persists, contact technical support',
      unknown: isSpanish ? 'Error desconocido al inicializar la aplicación' : 'Unknown initialization error'
    };

    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="max-width: 500px; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center;">
            <div style="width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <svg style="width: 40px; height: 40px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">${messages.title}</h1>
            <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.6;">${error.message || messages.unknown}</p>
            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 16px; transition: background 0.2s;">
              ${messages.reload}
            </button>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">${messages.contact}</p>
          </div>
        </div>
      `;
    }
  }
}

initializeApplication();
