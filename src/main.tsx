import React from 'react';
import ReactDOM from 'react-dom/client';
import { DynamicErrorBoundary } from '@/components/error/DynamicErrorBoundary';
import { DatabaseHealthChecker } from '@/core/DatabaseHealthChecker';
import { NuclearCleanExecution } from '@/core/NuclearCleanExecution';
import { DatabaseReconstructor } from '@/database/DatabaseReconstructor';
import { AIResponseFixer } from '@/services/ai/AIResponseFixer';
import { DashboardRestorer } from '@/core/DashboardRestorer';
import { db, initDB } from '@/database/simple-db';
import { logger } from '@/utils/logger';
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
  const urlParams = new URLSearchParams(window.location.search);

  // VERIFICAR ORDEN NUCLEAR
  if (urlParams.has('nuclear')) {
    await executeNuclearRepair();
    return; // El recargo se encarga de lo demás
  }

  // Comportamiento normal (incluyendo el clean anterior si existe)
  const forceClean = urlParams.has('clean') || localStorage.getItem('force_clean_start');
  if (forceClean) {
    await NuclearCleanExecution.execute();
    localStorage.removeItem('force_clean_start');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('clean');
    window.history.replaceState({}, '', newUrl.pathname);
  }

  // Validar y Cargar
  const dbHealth = await DatabaseHealthChecker.checkHealth();
  if (!dbHealth.healthy) {
    await DatabaseHealthChecker.attemptAutoRepair();
  }

  const App = (await import('./App')).default;

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <DynamicErrorBoundary>
        <App />
      </DynamicErrorBoundary>
    </React.StrictMode>
  );
}

initializeApplication().catch(error => {
  logger.critical('Fallo en inicialización', { error: error.message }, error, 'Main', 'startup_error');
});
