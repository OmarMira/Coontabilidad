# Plan de Ejecución - Sprint 7: FIX-13, FIX-14, FIX-15

## 🎯 Objetivos
Reducción de deuda técnica mediante limpieza de lint, organización de dependencias de tipos y estandarización de consultas SQL parametrizadas.

## 🛠️ Tareas

### FIX-13: ESLint Cleanup - Sprint 1
- [ ] Generar inventario de lint en `/tmp/lint-report.json`.
- [ ] Categorizar errores y warnings por regla.
- [ ] Corregir instancias de `@typescript-eslint/no-explicit-any`. (Nota: Se evaluará el volumen antes de proceder para asegurar la Regla 4).
- [ ] Reducir `--max-warnings` de 2000 a 1600 en `package.json`.
- [ ] Habilitar `noImplicitAny: true` en `tsconfig.json`.

### FIX-14: Type Dependencies Relocation
- [ ] Mover `@types/big.js`, `@types/papaparse`, `@types/sjcl`, `@types/uuid`, `@types/xml2js` a `devDependencies`.
- [ ] Limpiar la sección `dependencies` de `package.json`.

### FIX-15: Parametrized SQL for Audit Log
- [ ] Implementar la función `insertAuditLog()` en `src/database/simple-db.ts`.
- [ ] Reemplazar concatenaciones dinámicas en `createBankAccount()` y `updateBankAccount()` por llamadas a `insertAuditLog()`.

## 🧪 Pruebas de Completitud
- FIX-13: Reporte de lint categorizado + `npm run lint` exitoso con límite 1600.
- FIX-14: Inspección visual de `package.json` y build exitoso.
- FIX-15: Grep de `db.exec.*audit_log` vacío y verificación funcional de creación de cuenta bancaria.
