# Plan de Ejecución - Sprint 6: FIX-10, FIX-11, FIX-12

## 🎯 Objetivos
Optimizar el rendimiento del monitoreo de integridad, limpiar dependencias redundantes de base de datos y asegurar el flujo de inicialización de la aplicación.

## 🛠️ Tareas

### FIX-10: IntegrityMonitor Optimization
- [ ] Analizar `src/monitoring/IntegrityMonitor.ts` y `src/core/workers/WorkerOrchestrator.ts`.
- [ ] Implementar la **Opción B** (`requestIdleCallback`) para evitar la complejidad de un worker que delega de vuelta al hilo principal, cumpliendo con la "Regla de Oro" de simplicidad.
- [ ] Cambiar el intervalo de ejecución a 5 minutos (300,000ms).
- [ ] Verificar que no existan bloqueos de UI mediante auditoría visual del código.

### FIX-11: Dependecy Cleanup (sql.js & sqlite3)
- [ ] Buscar imports de `sql.js` y `sqlite3`.
- [ ] Verificar uso de `sql.js` en entorno de tests (`NODE_ENV === 'test'`).
- [ ] Reemplazar imports en código de producción.
- [ ] Ejecutar `npm run build` y `npm run test`.
- [ ] Desinstalar `sqlite3` y mover `sql.js` a `devDependencies` si es necesario.

### FIX-12: AppRouter Security (hasUsers)
- [ ] Modificar `src/components/AppRouter.tsx`.
- [ ] Cambiar el check de `localStorage` por la función `hasUsers()` de `simple-db.ts`.
- [ ] Eliminar toda referencia a `initial_setup_completed` en el codebase.

## 🧪 Pruebas de Completitud
- FIX-10: Verificación de `CHECK_INTERVAL` y ausencia de bloqueos.
- FIX-11: Grep negativo en producción y build exitoso.
- FIX-12: Bypass de localStorage fallido y validación real de usuarios.
