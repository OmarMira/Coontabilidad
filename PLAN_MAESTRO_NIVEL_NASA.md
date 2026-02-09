# 🚀 PLAN MAESTRO: SISTEMA NIVEL NASA

**Fecha Inicio**: 8 de febrero de 2026  
**Objetivo**: Sistema AccountExpress a prueba de fallos, nivel NASA  
**Estado Actual**: Funcionalmente completo (100%)  
**Estado Objetivo**: Profesional nivel NASA (100%)

---

## 🎯 VISIÓN

Transformar AccountExpress en un sistema de **clase mundial**:
- ✅ A prueba de fallos
- ✅ Con testing exhaustivo
- ✅ Seguridad nivel bancario
- ✅ Documentación completa
- ✅ Performance optimizado
- ✅ Monitoreo en tiempo real
- ✅ Recuperación ante desastres
- ✅ Calidad NASA

---

## 📊 ESTADO ACTUAL VS OBJETIVO

### Estado Actual (Funcional 100%)
```
✅ Todas las funcionalidades implementadas
✅ 13 módulos completos
✅ 5 fases avanzadas completadas
✅ Sistema de auditoría integrado
⚠️ Sin testing automatizado
⚠️ Validaciones parciales
⚠️ Seguridad básica
⚠️ Sin documentación de usuario
⚠️ Performance no optimizado
⚠️ Sin monitoreo
```

### Estado Objetivo (NASA 100%)
```
✅ Todas las funcionalidades implementadas
✅ Testing exhaustivo (80%+ cobertura)
✅ Validaciones robustas en todo el sistema
✅ Seguridad nivel bancario
✅ Documentación completa (usuario + técnica)
✅ Performance optimizado (<2s páginas)
✅ Monitoreo en tiempo real
✅ Backup automático + recuperación
✅ Manejo de errores robusto
✅ Logging completo
✅ Alertas automáticas
```

---

## 🗓️ PLAN DE EJECUCIÓN (6 FASES)

### FASE 1: TESTING EXHAUSTIVO (5-7 días)
**Objetivo**: Cobertura de tests 80%+

### FASE 2: VALIDACIONES ROBUSTAS (3-4 días)
**Objetivo**: Validación en cada punto de entrada

### FASE 3: SEGURIDAD NIVEL BANCARIO (3-4 días)
**Objetivo**: Sistema impenetrable

### FASE 4: MANEJO DE ERRORES + LOGGING (2-3 días)
**Objetivo**: Sistema que nunca crashea

### FASE 5: BACKUP + RECUPERACIÓN (2-3 días)
**Objetivo**: Datos siempre seguros

### FASE 6: DOCUMENTACIÓN + MONITOREO (5-7 días)
**Objetivo**: Sistema observable y documentado

**TOTAL**: 20-28 días (4-6 semanas)

---

## 📋 FASE 1: TESTING EXHAUSTIVO

### Objetivo
- 80%+ cobertura de código
- Tests unitarios para todos los servicios
- Tests de integración para flujos críticos
- Tests E2E para casos de uso principales

### Estructura de Testing
```
tests/
├── unit/                    # Tests unitarios
│   ├── services/
│   │   ├── payroll/
│   │   │   ├── PayrollProcessor.test.ts
│   │   │   ├── PayrollTaxCalculator.test.ts
│   │   │   └── PayrollJournalService.test.ts
│   │   ├── banking/
│   │   │   ├── BankImportService.test.ts
│   │   │   ├── AICategorizerService.test.ts
│   │   │   └── DuplicateDetector.test.ts
│   │   ├── accounting/
│   │   │   ├── AccountingPeriodService.test.ts
│   │   │   └── DoubleEntryValidator.test.ts
│   │   └── ...
│   ├── utils/
│   │   ├── systemAudit.test.ts
│   │   ├── pdfGenerator.test.ts
│   │   └── validation.test.ts
│   └── components/
│       ├── PayrollProcessor.test.tsx
│       └── BankImportWizard.test.tsx
├── integration/             # Tests de integración
│   ├── payroll-flow.test.ts
│   ├── bank-import-flow.test.ts
│   ├── accounting-closure.test.ts
│   ├── invoice-payment-flow.test.ts
│   └── reconciliation-flow.test.ts
├── e2e/                     # Tests end-to-end
│   ├── user-workflows/
│   │   ├── create-invoice.test.ts
│   │   ├── process-payroll.test.ts
│   │   ├── close-period.test.ts
│   │   └── bank-reconciliation.test.ts
│   └── admin-workflows/
│       ├── user-management.test.ts
│       └── system-configuration.test.ts
└── fixtures/                # Datos de prueba
    ├── invoices.json
    ├── employees.json
    └── transactions.json
```

### Tareas Detalladas

#### 1.1 Setup de Testing Framework
- [ ] Instalar Vitest + Testing Library
- [ ] Configurar vitest.config.ts
- [ ] Configurar coverage reporting
- [ ] Setup de mocks para base de datos
- [ ] Setup de fixtures

#### 1.2 Tests Unitarios - Servicios de Nómina
- [ ] PayrollProcessor.test.ts (15 tests)
- [ ] PayrollTaxCalculator.test.ts (20 tests)
- [ ] PayrollJournalService.test.ts (10 tests)
- [ ] PayrollReportGenerator.test.ts (8 tests)
- [ ] TaxBrackets2026.test.ts (5 tests)

#### 1.3 Tests Unitarios - Servicios de Banca
- [ ] BankImportService.test.ts (12 tests)
- [ ] FileParserService.test.ts (15 tests)
- [ ] AICategorizerService.test.ts (10 tests)
- [ ] DuplicateDetector.test.ts (12 tests)
- [ ] TransactionMatcher.test.ts (10 tests)
- [ ] BankReconciliationService.test.ts (15 tests)

#### 1.4 Tests Unitarios - Servicios de Contabilidad
- [ ] AccountingPeriodService.test.ts (12 tests)
- [ ] DoubleEntryValidator.test.ts (15 tests)
- [ ] FinancialReportingService.test.ts (10 tests)
- [ ] JournalManager.test.ts (12 tests)
- [ ] TaxEngine.test.ts (10 tests)

#### 1.5 Tests Unitarios - Servicios de Activos
- [ ] FixedAssetService.test.ts (10 tests)
- [ ] DepreciationCalculator.test.ts (15 tests)
- [ ] AssetDisposalService.test.ts (8 tests)

#### 1.6 Tests Unitarios - Utils
- [ ] systemAudit.test.ts (10 tests)
- [ ] pdfGenerator.test.ts (8 tests)
- [ ] validation.test.ts (20 tests)
- [ ] dateUtils.test.ts (10 tests)

#### 1.7 Tests de Integración
- [ ] payroll-flow.test.ts (flujo completo de nómina)
- [ ] bank-import-flow.test.ts (importación + categorización)
- [ ] accounting-closure.test.ts (cierre de período)
- [ ] invoice-payment-flow.test.ts (factura → pago)
- [ ] reconciliation-flow.test.ts (conciliación bancaria)

#### 1.8 Tests E2E
- [ ] create-invoice.test.ts
- [ ] process-payroll.test.ts
- [ ] close-period.test.ts
- [ ] bank-reconciliation.test.ts
- [ ] generate-reports.test.ts

#### 1.9 Coverage y Reporting
- [ ] Configurar coverage threshold (80%)
- [ ] Setup de CI/CD para tests
- [ ] Generar reporte HTML de coverage
- [ ] Documentar cómo ejecutar tests

### Criterios de Éxito Fase 1
- ✅ 80%+ cobertura de código
- ✅ Todos los tests pasan
- ✅ 0 tests flakey (inestables)
- ✅ Tests ejecutan en < 5 minutos
- ✅ Documentación de testing completa

---

## 📋 FASE 2: VALIDACIONES ROBUSTAS

### Objetivo
Validación exhaustiva en cada punto de entrada del sistema

### Estrategia
1. **Input Validation**: Validar todos los inputs de usuario
2. **Business Rules**: Validar reglas de negocio
3. **Data Integrity**: Validar integridad de datos
4. **Type Safety**: Usar Zod para schemas

### Librería: Zod
```bash
npm install zod
```

### Estructura de Validaciones
```
src/
├── validation/
│   ├── schemas/
│   │   ├── invoice.schema.ts
│   │   ├── employee.schema.ts
│   │   ├── transaction.schema.ts
│   │   ├── account.schema.ts
│   │   └── ...
│   ├── rules/
│   │   ├── accounting.rules.ts
│   │   ├── payroll.rules.ts
│   │   ├── inventory.rules.ts
│   │   └── ...
│   └── validators/
│       ├── InvoiceValidator.ts
│       ├── PayrollValidator.ts
│       └── ...
```

### Tareas Detalladas

#### 2.1 Setup de Validación
- [ ] Instalar Zod
- [ ] Crear estructura de carpetas
- [ ] Definir tipos base
- [ ] Crear utilidades de validación

#### 2.2 Schemas de Validación - Facturas
- [ ] InvoiceSchema (fecha, monto, cliente, items)
- [ ] InvoiceItemSchema (producto, cantidad, precio)
- [ ] Validar: fecha no futura
- [ ] Validar: monto total = suma items
- [ ] Validar: cliente existe y activo
- [ ] Validar: productos tienen stock

#### 2.3 Schemas de Validación - Nómina
- [ ] EmployeeSchema (nombre, SSN, salario)
- [ ] PayrollEntrySchema (período, empleado, deducciones)
- [ ] Validar: período no cerrado
- [ ] Validar: empleado activo
- [ ] Validar: deducciones ≤ salario
- [ ] Validar: impuestos correctos

#### 2.4 Schemas de Validación - Contabilidad
- [ ] JournalEntrySchema (fecha, cuentas, montos)
- [ ] AccountSchema (código, nombre, tipo)
- [ ] Validar: débitos = créditos
- [ ] Validar: cuentas existen
- [ ] Validar: período abierto
- [ ] Validar: montos positivos

#### 2.5 Schemas de Validación - Inventario
- [ ] ProductSchema (código, nombre, precio)
- [ ] MovementSchema (tipo, cantidad, producto)
- [ ] Validar: stock suficiente
- [ ] Validar: precio > 0
- [ ] Validar: cantidad > 0

#### 2.6 Schemas de Validación - Activos Fijos
- [ ] AssetSchema (nombre, costo, vida útil)
- [ ] DepreciationSchema (método, tasa)
- [ ] Validar: costo > 0
- [ ] Validar: vida útil > 0
- [ ] Validar: fecha adquisición ≤ hoy

#### 2.7 Reglas de Negocio
- [ ] accounting.rules.ts (reglas contables)
- [ ] payroll.rules.ts (reglas de nómina)
- [ ] inventory.rules.ts (reglas de inventario)
- [ ] banking.rules.ts (reglas bancarias)

#### 2.8 Integración en Componentes
- [ ] Agregar validación en formularios
- [ ] Mostrar errores claros al usuario
- [ ] Prevenir submit si hay errores
- [ ] Validación en tiempo real

#### 2.9 Integración en Servicios
- [ ] Validar antes de guardar en DB
- [ ] Lanzar errores descriptivos
- [ ] Logging de validaciones fallidas

### Criterios de Éxito Fase 2
- ✅ Todos los formularios validados
- ✅ Todos los servicios validados
- ✅ Errores claros y descriptivos
- ✅ Imposible ingresar datos inválidos
- ✅ Tests de validación completos

---

## 📋 FASE 3: SEGURIDAD NIVEL BANCARIO

### Objetivo
Sistema impenetrable con seguridad de nivel bancario

### Áreas de Seguridad
1. **Autenticación**: 2FA, sesiones seguras
2. **Autorización**: Permisos granulares
3. **Encriptación**: Datos sensibles encriptados
4. **Rate Limiting**: Prevenir ataques
5. **CSRF Protection**: Prevenir ataques CSRF
6. **XSS Protection**: Sanitización de inputs
7. **SQL Injection**: Prepared statements
8. **Security Headers**: CSP, HSTS, etc.

### Tareas Detalladas

#### 3.1 Autenticación Avanzada
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Usar TOTP (Time-based OTP)
- [ ] QR code para configuración
- [ ] Backup codes
- [ ] Forzar 2FA para admins

#### 3.2 Gestión de Sesiones
- [ ] Timeout de sesión (30 min inactividad)
- [ ] Renovación automática de tokens
- [ ] Logout en todos los dispositivos
- [ ] Detección de sesiones concurrentes
- [ ] Logging de inicios de sesión

#### 3.3 Password Policies
- [ ] Mínimo 12 caracteres
- [ ] Mayúsculas + minúsculas + números + símbolos
- [ ] No permitir passwords comunes
- [ ] Expiración cada 90 días
- [ ] Historial de passwords (no repetir últimos 5)
- [ ] Hashing con bcrypt (cost factor 12)

#### 3.4 Rate Limiting
- [ ] Instalar express-rate-limit
- [ ] Login: 5 intentos / 15 min
- [ ] API: 100 requests / 15 min
- [ ] Bloqueo temporal tras intentos fallidos
- [ ] Logging de intentos bloqueados

#### 3.5 CSRF Protection
- [ ] Implementar tokens CSRF
- [ ] Validar en cada POST/PUT/DELETE
- [ ] Tokens únicos por sesión
- [ ] Expiración de tokens

#### 3.6 XSS Protection
- [ ] Instalar DOMPurify
- [ ] Sanitizar todos los inputs
- [ ] Escapar outputs en HTML
- [ ] Content Security Policy (CSP)

#### 3.7 SQL Injection Protection
- [ ] Usar prepared statements siempre
- [ ] Validar inputs antes de queries
- [ ] Nunca concatenar strings en SQL
- [ ] Auditar todas las queries

#### 3.8 Encriptación de Datos
- [ ] Encriptar passwords (bcrypt)
- [ ] Encriptar SSN de empleados (AES-256)
- [ ] Encriptar números de cuenta (AES-256)
- [ ] Encriptar datos sensibles en DB
- [ ] HTTPS obligatorio (TLS 1.3)

#### 3.9 Security Headers
- [ ] Instalar Helmet.js
- [ ] Content-Security-Policy
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security (HSTS)
- [ ] Referrer-Policy: no-referrer

#### 3.10 Auditoría de Seguridad
- [ ] Logging de accesos
- [ ] Logging de cambios sensibles
- [ ] Alertas de actividad sospechosa
- [ ] Reporte de seguridad mensual

### Criterios de Éxito Fase 3
- ✅ 2FA implementado
- ✅ Rate limiting activo
- ✅ Datos sensibles encriptados
- ✅ Security headers configurados
- ✅ 0 vulnerabilidades críticas
- ✅ Auditoría de seguridad pasada

---

## 📋 FASE 4: MANEJO DE ERRORES + LOGGING

### Objetivo
Sistema que nunca crashea y registra todo

### Estrategia
1. **Error Boundaries**: Capturar errores en React
2. **Try-Catch**: En todas las operaciones críticas
3. **Logging Estructurado**: Winston + formato JSON
4. **Error Tracking**: Sentry para producción
5. **Graceful Degradation**: Fallar elegantemente

### Tareas Detalladas

#### 4.1 Error Boundaries en React
- [ ] Crear ErrorBoundary component
- [ ] Envolver toda la app
- [ ] Mostrar UI de error amigable
- [ ] Logging de errores
- [ ] Botón de "Reportar Error"

#### 4.2 Try-Catch en Servicios
- [ ] Envolver todas las operaciones async
- [ ] Logging de errores
- [ ] Rollback de transacciones
- [ ] Mensajes de error claros
- [ ] Códigos de error estandarizados

#### 4.3 Sistema de Logging
- [ ] Instalar Winston
- [ ] Configurar niveles (error, warn, info, debug)
- [ ] Formato JSON estructurado
- [ ] Rotación de logs diaria
- [ ] Logs separados por nivel
- [ ] Logs en archivo + consola

#### 4.4 Estructura de Logs
```
logs/
├── error.log       # Solo errores
├── combined.log    # Todos los niveles
├── audit.log       # Auditoría
└── security.log    # Eventos de seguridad
```

#### 4.5 Error Tracking (Sentry)
- [ ] Crear cuenta en Sentry
- [ ] Instalar @sentry/react
- [ ] Configurar DSN
- [ ] Capturar errores automáticamente
- [ ] Agregar contexto de usuario
- [ ] Alertas por email

#### 4.6 Tipos de Errores
- [ ] ValidationError (400)
- [ ] AuthenticationError (401)
- [ ] AuthorizationError (403)
- [ ] NotFoundError (404)
- [ ] ConflictError (409)
- [ ] DatabaseError (500)
- [ ] ExternalServiceError (502)

#### 4.7 Manejo de Errores por Módulo
- [ ] Facturas: rollback si falla
- [ ] Nómina: notificar admin
- [ ] Contabilidad: prevenir inconsistencias
- [ ] Inventario: alertar stock negativo
- [ ] Activos: prevenir depreciación incorrecta

#### 4.8 Notificaciones de Errores
- [ ] Email a admin en errores críticos
- [ ] Slack webhook para alertas
- [ ] Dashboard de errores en tiempo real

### Criterios de Éxito Fase 4
- ✅ Sistema nunca crashea
- ✅ Todos los errores capturados
- ✅ Logging completo
- ✅ Errores rastreables
- ✅ Notificaciones automáticas

---

## 📋 FASE 5: BACKUP + RECUPERACIÓN

### Objetivo
Datos siempre seguros, recuperación garantizada

### Estrategia
1. **Backup Automático**: Diario + incremental
2. **Backup Remoto**: Cloud (S3, Google Cloud)
3. **Verificación**: Integridad de backups
4. **Recuperación**: Procedimiento documentado
5. **Testing**: Probar recuperación mensualmente

### Tareas Detalladas

#### 5.1 Backup Automático Local
- [ ] Instalar node-cron
- [ ] Backup completo diario (2 AM)
- [ ] Backup incremental cada hora
- [ ] Compresión con gzip
- [ ] Retención: 30 días
- [ ] Limpieza automática de backups antiguos

#### 5.2 Backup Remoto (Cloud)
- [ ] Configurar AWS S3 / Google Cloud Storage
- [ ] Subir backup diario a cloud
- [ ] Encriptar antes de subir (AES-256)
- [ ] Versionado de backups
- [ ] Retención: 90 días en cloud

#### 5.3 Verificación de Integridad
- [ ] Checksum (SHA-256) de cada backup
- [ ] Verificar integridad automáticamente
- [ ] Alertar si backup corrupto
- [ ] Logging de verificaciones

#### 5.4 Procedimiento de Recuperación
- [ ] Documentar paso a paso
- [ ] Script de recuperación automática
- [ ] Probar recuperación mensualmente
- [ ] Medir tiempo de recuperación (RTO)
- [ ] Medir pérdida de datos (RPO)

#### 5.5 Backup de Configuración
- [ ] Backup de .env
- [ ] Backup de configuraciones
- [ ] Backup de certificados
- [ ] Versionado en Git

#### 5.6 Disaster Recovery Plan
- [ ] Documentar escenarios de desastre
- [ ] Procedimientos de recuperación
- [ ] Contactos de emergencia
- [ ] Checklist de recuperación
- [ ] Simulacros trimestrales

### Criterios de Éxito Fase 5
- ✅ Backup automático funcionando
- ✅ Backups en cloud
- ✅ Verificación de integridad
- ✅ Recuperación probada
- ✅ RTO < 4 horas
- ✅ RPO < 1 hora

---

## 📋 FASE 6: DOCUMENTACIÓN + MONITOREO

### Objetivo
Sistema completamente documentado y observable

### Documentación Requerida
1. **Manual de Usuario**: Guías paso a paso
2. **Documentación Técnica**: API, arquitectura
3. **Troubleshooting**: Solución de problemas
4. **Runbooks**: Procedimientos operativos

### Monitoreo Requerido
1. **Métricas**: Performance, errores, uso
2. **Alertas**: Notificaciones automáticas
3. **Dashboards**: Visualización en tiempo real
4. **Health Checks**: Estado del sistema

### Tareas Detalladas

#### 6.1 Manual de Usuario
- [ ] Guía de inicio rápido
- [ ] Módulo: Cuentas por Cobrar
- [ ] Módulo: Cuentas por Pagar
- [ ] Módulo: Contabilidad
- [ ] Módulo: Activos Fijos
- [ ] Módulo: Inventario
- [ ] Módulo: Nómina
- [ ] Módulo: Conciliación Bancaria
- [ ] Módulo: Cierres Contables
- [ ] Módulo: Importación Bancaria
- [ ] FAQ (Preguntas Frecuentes)
- [ ] Videos tutoriales (opcional)

#### 6.2 Documentación Técnica
- [ ] Arquitectura del sistema
- [ ] Diagrama de base de datos
- [ ] API Reference completa
- [ ] Guía de desarrollo
- [ ] Guía de deployment
- [ ] Guía de configuración

#### 6.3 Troubleshooting Guide
- [ ] Problemas comunes y soluciones
- [ ] Códigos de error y significado
- [ ] Logs y cómo interpretarlos
- [ ] Contacto de soporte

#### 6.4 Runbooks Operativos
- [ ] Procedimiento de backup
- [ ] Procedimiento de recuperación
- [ ] Procedimiento de actualización
- [ ] Procedimiento de rollback
- [ ] Procedimiento de escalado

#### 6.5 Monitoreo - Setup
- [ ] Instalar Prometheus (métricas)
- [ ] Instalar Grafana (dashboards)
- [ ] Configurar exporters
- [ ] Configurar alertas

#### 6.6 Métricas a Monitorear
- [ ] Performance:
  - Tiempo de respuesta de API
  - Tiempo de carga de páginas
  - Queries lentas (> 1s)
- [ ] Errores:
  - Tasa de errores (%)
  - Errores por tipo
  - Errores por módulo
- [ ] Uso:
  - Usuarios activos
  - Módulos más usados
  - Transacciones por día
- [ ] Sistema:
  - CPU usage
  - Memory usage
  - Disk usage
  - Database size

#### 6.7 Dashboards en Grafana
- [ ] Dashboard: Overview del sistema
- [ ] Dashboard: Performance
- [ ] Dashboard: Errores
- [ ] Dashboard: Uso
- [ ] Dashboard: Seguridad

#### 6.8 Alertas Automáticas
- [ ] Error rate > 5% → Email + Slack
- [ ] Response time > 5s → Email
- [ ] Disk usage > 80% → Email
- [ ] Backup failed → Email + SMS
- [ ] Security event → Email + SMS

#### 6.9 Health Checks
- [ ] Endpoint /health
- [ ] Verificar DB connection
- [ ] Verificar disk space
- [ ] Verificar servicios externos
- [ ] Responder con status code

### Criterios de Éxito Fase 6
- ✅ Documentación completa
- ✅ Monitoreo activo
- ✅ Dashboards funcionando
- ✅ Alertas configuradas
- ✅ Health checks implementados

---

## 📊 MÉTRICAS DE ÉXITO FINAL

### Para Considerar el Sistema "Nivel NASA"

#### Funcionalidad
- [x] 100% de módulos implementados
- [ ] 80%+ de cobertura de tests
- [ ] 0 bugs críticos
- [ ] 0 bugs altos

#### Performance
- [ ] Páginas cargan en < 2 segundos
- [ ] Reportes generan en < 5 segundos
- [ ] Queries ejecutan en < 1 segundo
- [ ] API responde en < 500ms

#### Seguridad
- [ ] 0 vulnerabilidades críticas
- [ ] 0 vulnerabilidades altas
- [ ] 2FA implementado
- [ ] Datos sensibles encriptados
- [ ] Auditoría de seguridad pasada

#### Confiabilidad
- [ ] Backup automático funcionando
- [ ] Recovery procedure probado
- [ ] Monitoreo activo
- [ ] Uptime > 99.9%
- [ ] RTO < 4 horas
- [ ] RPO < 1 hora

#### Usabilidad
- [ ] Documentación completa
- [ ] Usuarios capacitados
- [ ] Soporte disponible
- [ ] FAQ completo

#### Calidad de Código
- [ ] 0 errores TypeScript
- [ ] Código documentado (JSDoc)
- [ ] Código limpio (ESLint)
- [ ] Arquitectura clara

---

## 🗓️ CRONOGRAMA DETALLADO

### Semana 1-2: Testing + Validaciones
- Días 1-7: Fase 1 (Testing)
- Días 8-11: Fase 2 (Validaciones)

### Semana 3: Seguridad + Errores
- Días 12-15: Fase 3 (Seguridad)
- Días 16-18: Fase 4 (Errores + Logging)

### Semana 4: Backup + Documentación
- Días 19-21: Fase 5 (Backup)
- Días 22-28: Fase 6 (Documentación + Monitoreo)

**TOTAL**: 28 días (4 semanas)

---

## 🚀 INICIO INMEDIATO

### Próximo Paso: FASE 1 - TESTING

¿Quieres que empiece con la Fase 1 (Testing Exhaustivo)?

Voy a:
1. Instalar framework de testing (Vitest)
2. Configurar estructura de tests
3. Crear primeros tests unitarios
4. Documentar cómo ejecutar tests

**¿Empezamos?**

---

**Creado por**: Kiro AI  
**Fecha**: 8 de febrero de 2026  
**Objetivo**: Sistema Nivel NASA  
**Compromiso**: Calidad máxima, sin compromisos
