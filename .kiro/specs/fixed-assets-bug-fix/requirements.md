# Requirements Document - Fixed Assets Bug Fix

## Introduction

Este documento especifica los requisitos para corregir el bug crítico en el módulo de Fixed Assets donde el servicio `FixedAssetService` no puede acceder a los métodos de la base de datos debido a una incompatibilidad de tipos entre `sql.js` (tipo `any`) y `SQLiteEngine`.

## Glossary

- **FixedAssetService**: Servicio que gestiona el ciclo de vida completo de activos fijos
- **SQLiteEngine**: Clase wrapper que proporciona una interfaz tipada sobre sql.js
- **simple-db**: Módulo de base de datos que exporta la instancia global `db`
- **FixedAssetsController**: Controlador facade que unifica todas las operaciones de activos fijos
- **sql.js**: Biblioteca JavaScript que implementa SQLite en el navegador

## Requirements

### Requirement 1: Inicialización Correcta de SQLiteEngine

**User Story:** Como desarrollador, quiero que el sistema inicialice correctamente una instancia de SQLiteEngine, para que los servicios de Fixed Assets puedan acceder a los métodos tipados de la base de datos.

#### Acceptance Criteria

1. WHEN el sistema inicializa la base de datos, THE System SHALL crear una instancia de SQLiteEngine envolviendo la instancia de sql.js
2. WHEN se exporta la instancia de base de datos desde simple-db.ts, THE System SHALL exportar tanto la instancia raw de sql.js como la instancia de SQLiteEngine
3. THE System SHALL mantener compatibilidad con código existente que usa la instancia raw de sql.js

### Requirement 2: Acceso Correcto a Métodos de Base de Datos

**User Story:** Como servicio de Fixed Assets, quiero acceder a métodos tipados de base de datos (select, run, etc.), para que pueda ejecutar consultas SQL sin errores de tipo.

#### Acceptance Criteria

1. WHEN FixedAssetService llama a this.db.select(), THE System SHALL ejecutar la consulta y retornar resultados
2. WHEN FixedAssetService llama a this.db.run(), THE System SHALL ejecutar el comando SQL y retornar el resultado
3. WHEN cualquier servicio de Fixed Assets accede a métodos de db, THE System SHALL proporcionar tipos correctos de TypeScript

### Requirement 3: Compatibilidad con Código Existente

**User Story:** Como desarrollador, quiero que la corrección del bug no rompa código existente, para que otros módulos del sistema continúen funcionando sin cambios.

#### Acceptance Criteria

1. WHEN se actualiza la exportación de db, THE System SHALL mantener la exportación de la instancia raw para compatibilidad
2. WHEN componentes existentes usan `db` directamente, THE System SHALL continuar funcionando sin errores
3. THE System SHALL proporcionar una función `getDBEngine()` para obtener la instancia de SQLiteEngine

### Requirement 4: Actualización del Controlador

**User Story:** Como componente UI, quiero obtener un controlador de Fixed Assets correctamente inicializado, para que pueda realizar operaciones sin errores.

#### Acceptance Criteria

1. WHEN se llama a getFixedAssetsController(), THE System SHALL aceptar tanto instancias de sql.js como de SQLiteEngine
2. WHEN el controlador se inicializa, THE System SHALL crear servicios con la instancia correcta de SQLiteEngine
3. THE System SHALL mantener el patrón singleton del controlador

### Requirement 5: Validación de Funcionamiento

**User Story:** Como usuario del sistema, quiero que el módulo de Fixed Assets funcione correctamente, para que pueda gestionar activos sin errores.

#### Acceptance Criteria

1. WHEN se carga el componente FixedAssetsManager, THE System SHALL cargar datos sin errores de "this.db.select is not a function"
2. WHEN se ejecutan operaciones CRUD de activos, THE System SHALL completar las operaciones exitosamente
3. WHEN se ejecuta depreciación mensual, THE System SHALL procesar sin errores de base de datos

---

**Documento creado:** 2026-02-02  
**Autor:** Kiro AI Assistant  
**Versión:** 1.0  
**Estado:** ✅ COMPLETO
