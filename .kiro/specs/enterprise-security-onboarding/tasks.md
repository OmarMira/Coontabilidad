# Implementation Plan: Enterprise Security Onboarding

## Overview

Implementación de sistema de onboarding enterprise-grade con eliminación de bypass hardcodeado, modo sandbox seguro, y wizard de configuración inicial.

## Tasks

- [x] 1. Eliminar Bypass Hardcodeado (P0 - CRÍTICO)
  - Eliminar completamente el código de bypass en AuthContext.tsx
  - Asegurar que todas las autenticaciones pasen por UserService
  - _Requirements: REQ-1_

- [ ]* 1.1 Escribir test unitario para verificar eliminación de bypass
  - Test que confirme que admin/admin123 NO funciona sin BD
  - Test que confirme que solo usuarios de BD pueden autenticarse
  - _Requirements: REQ-1_

- [ ] 2. Implementar Modo Sandbox (Demo Seguro)
  - [ ] 2.1 Crear rol GUEST en base de datos
    - Agregar rol 'guest' con level=5 y permisos limitados
    - _Requirements: REQ-2_
  
  - [ ] 2.2 Implementar loginAsGuest() en AuthContext
    - Crear función que establece sesión temporal
    - Configurar timer de expiración (30 minutos)
    - _Requirements: REQ-2_
  
  - [ ] 2.3 Crear interceptor de persistencia en simple-db.ts
    - Implementar enforceGuestLimits()
    - Implementar guestSafeInsert()
    - Definir GUEST_LIMITS para cada entidad
    - _Requirements: REQ-2_
  
  - [ ] 2.4 Agregar botón "Probar Demo" en LoginForm
    - Diseño verde con icono Zap
    - Conectar con loginAsGuest()
    - _Requirements: REQ-2_
  
  - [ ] 2.5 Mostrar badge "MODO DEMO" en header
    - Indicador visual cuando usuario es guest
    - _Requirements: REQ-2_

- [ ]* 2.6 Escribir tests para modo sandbox
  - Test: GUEST no puede crear más de 20 clientes
  - Test: GUEST no puede UPDATE/DELETE usuarios
  - Test: GUEST no puede modificar payroll_settings
  - _Requirements: REQ-2_

- [ ] 3. Checkpoint - Verificar seguridad básica
  - Asegurar que bypass está eliminado
  - Verificar que modo demo funciona
  - Confirmar que tests pasan

- [x] 4. Implementar Initial Setup Wizard
  - [x] 4.1 Crear componente InitialSetupWizard.tsx
    - Estructura de wizard con 5 pasos
    - Barra de progreso
    - Navegación entre pasos
    - _Requirements: REQ-3_
  
  - [x] 4.2 Implementar Step 1: Welcome
    - Pantalla de bienvenida
    - Explicación del proceso
    - Botón "Comenzar Configuración"
    - _Requirements: REQ-3_
  
  - [x] 4.3 Implementar Step 2: Admin Creation
    - Formulario de creación de admin
    - Validación de contraseña (min 12 chars)
    - Indicador de fortaleza de contraseña
    - _Requirements: REQ-3_
  
  - [x] 4.4 Implementar Step 3: Security Configuration
    - Generación de Master Key
    - Mostrar Master Key (solo una vez)
    - Opción de descarga como .txt
    - Checkbox de confirmación
    - _Requirements: REQ-3_
  
  - [x] 4.5 Implementar Step 4: Company Information
    - Formulario de datos de empresa
    - Validaciones
    - _Requirements: REQ-3_
  
  - [x] 4.6 Implementar Step 5: Confirmation
    - Resumen de configuración
    - Botón "Finalizar y Acceder"
    - Guardar flag en localStorage
    - _Requirements: REQ-3_
  
  - [ ] 4.7 Crear tabla company_settings en simple-db.ts
    - Definir esquema SQL
    - Funciones CRUD
    - _Requirements: REQ-3_
    - _Note: Opcional - No crítico para funcionalidad básica_
  
  - [x] 4.8 Integrar wizard en App.tsx
    - Verificar flag initial_setup_completed
    - Mostrar wizard si no está completado
    - Redirect a login después de completar
    - _Requirements: REQ-3_
    - _Completed: AppRouter integrado en App.tsx_

- [ ]* 4.9 Escribir tests para wizard
  - Test E2E: Completar wizard y verificar admin creado
  - Test: Wizard no se muestra si flag existe
  - Test: Validación de contraseña funciona
  - _Requirements: REQ-3_

- [ ] 5. Mejorar Google SSO Integration
  - [ ] 5.1 Documentar configuración de Google Cloud Console
    - Crear guía paso a paso en README
    - _Requirements: REQ-4_
  
  - [ ] 5.2 Crear .env.example con VITE_GOOGLE_CLIENT_ID
    - Documentar variables de entorno
    - _Requirements: REQ-4_
  
  - [ ] 5.3 Validar configuración antes de mostrar botón
    - Verificar que VITE_GOOGLE_CLIENT_ID existe
    - Mostrar mensaje si no está configurado
    - _Requirements: REQ-4_

- [ ]* 5.4 Escribir tests para Google SSO
  - Test: Login con Google crea usuario con rol viewer
  - Test: Login con Google de usuario existente funciona
  - _Requirements: REQ-4_

- [ ] 6. Checkpoint Final - Verificación completa
  - Ejecutar todos los tests
  - Verificar que no hay credenciales hardcodeadas
  - Confirmar que wizard funciona end-to-end
  - Validar que modo demo tiene límites correctos

- [ ] 7. Documentación y Deployment
  - [ ] 7.1 Actualizar README con instrucciones de setup
    - Documentar wizard de configuración inicial
    - Documentar modo demo
    - Documentar Google SSO
  
  - [ ] 7.2 Crear guía de seguridad
    - Documentar mejoras de seguridad
    - Explicar eliminación de bypass
    - Documentar modo sandbox
  
  - [ ] 7.3 Verificar bundle de producción
    - Confirmar que no hay credenciales en dist/
    - Verificar que código está minificado
    - Validar que no hay console.logs

## Notes

- Tasks marcados con `*` son opcionales (tests) pero altamente recomendados
- Prioridad P0 (Crítico): Task 1 debe completarse primero
- Prioridad P1 (Alta): Tasks 2, 3, 4 son críticos para producción
- Prioridad P2 (Media): Task 5 puede completarse después
- Cada task referencia requirements específicos para trazabilidad
- Checkpoints aseguran validación incremental
