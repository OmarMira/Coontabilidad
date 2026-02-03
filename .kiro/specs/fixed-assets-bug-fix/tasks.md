# Implementation Plan: Fixed Assets Bug Fix

## Overview

Plan de implementación para corregir el bug crítico en Fixed Assets donde `FixedAssetService` no puede acceder a métodos de base de datos debido a incompatibilidad de tipos.

## Tasks

- [ ] 1. Actualizar simple-db.ts para exportar SQLiteEngine
  - Agregar exportación de `dbEngine: SQLiteEngine | null`
  - Agregar función `getDBEngine(): SQLiteEngine`
  - Inicializar `dbEngine` en `initDB()` envolviendo la instancia de sql.js
  - Mantener exportación de `db` para compatibilidad
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Actualizar FixedAssetsController para aceptar ambos tipos
  - [ ] 2.1 Modificar constructor para aceptar `db: any | SQLiteEngine`
    - Agregar lógica de conversión: si es `any`, crear `new SQLiteEngine(db)`
    - Pasar instancia de SQLiteEngine a todos los servicios
    - _Requirements: 4.1, 4.2_

  - [ ] 2.2 Actualizar función `getFixedAssetsController()`
    - Modificar firma para aceptar `db: any | SQLiteEngine`
    - Mantener patrón singleton
    - _Requirements: 4.1, 4.3_

- [ ] 3. Verificar funcionamiento con componente FixedAssetsManager
  - Cargar componente en navegador
  - Verificar que no hay error "this.db.select is not a function"
  - Probar operaciones CRUD básicas
  - _Requirements: 5.1, 5.2_

- [ ] 4. Checkpoint - Verificar que el bug está corregido
  - Ensure all manual tests pass, ask the user if questions arise.

- [ ] 5. Escribir unit tests
  - [ ] 5.1 Test: dbEngine is exported
    - Verificar que `dbEngine` existe después de `initDB()`
    - Verificar que es instancia de SQLiteEngine
    - _Requirements: 1.2_

  - [ ] 5.2 Test: getDBEngine() works
    - Verificar que retorna SQLiteEngine
    - Verificar que lanza error si no está inicializado
    - _Requirements: 3.3_

  - [ ] 5.3 Test: Controller accepts sql.js instance
    - Crear controlador con `db` raw
    - Verificar que servicios se crean correctamente
    - _Requirements: 4.1_

  - [ ] 5.4 Test: Controller accepts SQLiteEngine instance
    - Crear controlador con `dbEngine`
    - Verificar que servicios se crean correctamente
    - _Requirements: 4.1_

  - [ ] 5.5 Test: FixedAssetService.select() works
    - Llamar método select()
    - Verificar que retorna resultados sin error
    - _Requirements: 2.1_

  - [ ] 5.6 Test: FixedAssetService.run() works
    - Llamar método run()
    - Verificar que ejecuta sin error
    - _Requirements: 2.2_

  - [ ] 5.7 Test: Depreciation batch runs
    - Ejecutar depreciación mensual
    - Verificar que completa sin errores de base de datos
    - _Requirements: 5.3_

- [ ] 6. Escribir property-based tests
  - [ ] 6.1 Property test: Backward Compatibility
    - **Property 1: Backward Compatibility**
    - **Validates: Requirements 1.3, 3.2**
    - Generar consultas SQL aleatorias
    - Ejecutar con `db` y `dbEngine`
    - Verificar mismos resultados

  - [ ] 6.2 Property test: Controller Accepts Both Types
    - **Property 2: Controller Accepts Both Types**
    - **Validates: Requirements 4.1**
    - Generar instancias aleatorias de db
    - Crear controlador con cada una
    - Verificar que todas las operaciones funcionan

  - [ ] 6.3 Property test: Singleton Pattern
    - **Property 3: Singleton Pattern Maintained**
    - **Validates: Requirements 4.3**
    - Llamar getFixedAssetsController() múltiples veces
    - Verificar que retorna la misma instancia

  - [ ] 6.4 Property test: CRUD Operations
    - **Property 4: CRUD Operations Work**
    - **Validates: Requirements 5.2**
    - Generar datos de activos aleatorios
    - Ejecutar operaciones CRUD
    - Verificar que todas completan exitosamente

- [ ] 7. Checkpoint final - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Actualizar componentes para usar dbEngine (Opcional)
  - Actualizar FixedAssetsManager.tsx para usar `dbEngine`
  - Actualizar otros componentes que usan Fixed Assets
  - Esta tarea es opcional y puede hacerse gradualmente
  - _Requirements: 3.1_

## Notes

- La tarea 8 es opcional y puede hacerse gradualmente después
- La corrección del bug crítico se completa en las tareas 1-4
- Los tests (tareas 5-6) validan la corrección y aseguran calidad
- Todas las tareas 1-7 son requeridas para una implementación completa

---

**Documento creado:** 2026-02-02  
**Autor:** Kiro AI Assistant  
**Versión:** 1.0  
**Estado:** ✅ COMPLETO
