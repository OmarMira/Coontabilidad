# Implementation Plan: Motor de Nómina

**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0  
**Tiempo Estimado**: 5-7 días (40-56 horas)

---

## Overview

Este plan implementa un motor completo de procesamiento de nómina con cálculo preciso de impuestos federales, generación de asientos contables, y reportes para el IRS. La implementación sigue un enfoque incremental, validando cada componente antes de continuar.

**Orden de Implementación**:
1. Base de datos y modelos
2. Calculadora de impuestos (componente crítico)
3. Procesador de nómina
4. Generación de asientos contables
5. UI de procesamiento
6. Reportes (Form 941, W-2)
7. Integración con cierres contables

---

## Tasks

- [x] 1. Configurar estructura de base de datos
  - Agregar campos de nómina a tabla `employees`
  - Crear tabla `payroll` con todos los campos necesarios
  - Crear índices para optimizar consultas
  - _Requirements: 3.1, 3.2, 4.1, 11.1_

- [x] 2. Implementar PayrollTaxCalculator (CRÍTICO)
  - [x] 2.1 Implementar cálculo de FICA (Social Security)
    - Aplicar 6.2% hasta wage base de $168,600
    - Trackear YTD wages para determinar límite
    - Redondear hacia abajo al centavo más cercano
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [ ]* 2.2 Escribir property test para FICA
    - **Property 1: Social Security Tax Calculation**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Implementar cálculo de Medicare
    - Aplicar 1.45% a todos los salarios sin límite
    - Aplicar 0.9% adicional para ingresos > threshold
    - Considerar filing status para threshold
    - _Requirements: 1.3, 1.4_

  - [ ]* 2.4 Escribir property tests para Medicare
    - **Property 2: Medicare Tax Calculation**
    - **Property 3: Additional Medicare Tax**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 2.5 Implementar cálculo de Federal Income Tax
    - Obtener tax brackets según filing status
    - Restar standard deduction
    - Restar allowances ($4,800 cada uno)
    - Aplicar progressive tax brackets
    - Dividir por pay periods para obtener withholding
    - Agregar additional withholding si existe
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.6 Escribir property tests para Federal Tax
    - **Property 6: W-4 Information Usage**
    - **Property 7: Filing Status Support**
    - **Property 8: Standard Deduction Application**
    - **Property 9: Progressive Tax Brackets**
    - **Property 10: Per-Period Withholding**
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6**

  - [ ]* 2.7 Escribir unit tests con casos del IRS
    - Usar ejemplos de IRS Publication 15
    - Validar contra calculadoras oficiales del IRS
    - Probar edge cases (wage base limit, thresholds)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1-2.7_

  - [ ]* 2.8 Escribir property test para rounding
    - **Property 5: Tax Rounding**
    - **Validates: Requirements 1.6, 2.7**

- [ ] 3. Checkpoint - Validar cálculos de impuestos
  - Asegurar que todos los tests pasen
  - Validar contra calculadoras del IRS
  - Preguntar al usuario si hay dudas


- [x] 4. Implementar PayrollProcessor
  - [x] 4.1 Implementar validación de inputs
    - Validar hours ≥ 0 y ≤ 168
    - Validar rate ≥ $7.25 (minimum wage)
    - Validar employee data completo
    - Validar período contable abierto
    - _Requirements: 3.6, 8.1, 9.1, 9.2, 9.5_

  - [ ]* 4.2 Escribir property tests para validaciones
    - **Property 15: Hours Validation**
    - **Property 27: Minimum Wage Validation**
    - **Property 30: Complete Employee Data**
    - **Validates: Requirements 3.6, 9.1, 9.2, 9.5**

  - [x] 4.3 Implementar cálculo de gross pay
    - Calcular regular pay (hours × rate)
    - Calcular overtime pay (hours > 40 × rate × 1.5)
    - Agregar bonuses y commissions
    - Redondear a centavo más cercano
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

  - [ ]* 4.4 Escribir property tests para gross pay
    - **Property 11: Hourly Gross Pay**
    - **Property 12: Salaried Gross Pay**
    - **Property 13: Overtime Calculation**
    - **Property 14: Bonuses and Commissions Inclusion**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 4.5 Implementar cálculo de net pay
    - Calcular total taxes usando PayrollTaxCalculator
    - Restar taxes y other deductions de gross pay
    - Asegurar net pay ≥ 0
    - Aplicar deductions en orden correcto
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.6 Escribir property tests para net pay
    - **Property 16: Net Pay Calculation**
    - **Property 17: Deduction Order**
    - **Property 18: Non-Negative Net Pay**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 4.7 Implementar guardado en base de datos
    - Guardar registro de payroll
    - Actualizar YTD totals del employee
    - Crear audit log entry
    - Usar transacción para atomicidad
    - _Requirements: 1.5, 11.1, 11.2_

  - [ ]* 4.8 Escribir property test para YTD tracking
    - **Property 4: YTD Wage Tracking**
    - **Validates: Requirements 1.5**

- [ ] 5. Checkpoint - Validar procesamiento de nómina
  - Asegurar que todos los tests pasen
  - Probar con diferentes tipos de empleados
  - Verificar YTD totals se actualizan correctamente
  - Preguntar al usuario si hay dudas

- [x] 6. Implementar PayrollJournalService
  - [x] 6.1 Implementar generación de asiento de nómina
    - DR: Payroll Expense (gross pay)
    - CR: Cash (net pay)
    - CR: FICA Payable (SS + Medicare)
    - CR: Federal Tax Payable (federal tax)
    - CR: Other Liabilities (other deductions)
    - Asegurar debits = credits
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.2 Escribir property test para journal entry balanceado
    - **Property 19: Balanced Journal Entry**
    - **Validates: Requirements 5.1, 5.6**

  - [x] 6.3 Implementar generación de asiento de impuestos patronales
    - DR: Payroll Tax Expense (employer FICA)
    - CR: FICA Payable (employer portion)
    - Employer portion = employee portion (matching)
    - _Requirements: 6.6_

  - [x] 6.4 Implementar linkage entre payroll y journal entry
    - Guardar journal_entry_id en payroll record
    - Crear foreign key constraint
    - _Requirements: 5.7_

  - [ ]* 6.5 Escribir property test para journal linkage
    - **Property 20: Journal Entry Linkage**
    - **Validates: Requirements 5.7**

  - [ ]* 6.6 Escribir unit tests para journal entries
    - Verificar estructura de asientos
    - Verificar cuentas correctas (account codes)
    - Verificar montos correctos
    - _Requirements: 5.1-5.7_

- [ ] 7. Checkpoint - Validar generación de asientos
  - Asegurar que todos los tests pasen
  - Verificar que asientos balancean
  - Verificar linkage con payroll records
  - Preguntar al usuario si hay dudas

- [x] 8. Implementar UI de procesamiento de nómina
  - [ ] 8.1 Crear PayrollProcessor.tsx
    - Formulario para seleccionar employee
    - Inputs para pay period dates
    - Inputs para regular hours, overtime hours
    - Inputs para bonuses, commissions, other deductions
    - Botón para calcular preview
    - Mostrar preview de cálculos (gross, taxes, net)
    - Botón para aprobar y procesar
    - _Requirements: 3.1-3.7, 4.1-4.5, 9.1-9.6_

  - [ ] 8.2 Crear PayrollReview.tsx
    - Mostrar lista de payroll procesado
    - Filtros por employee, date range, status
    - Mostrar detalles de cada payroll
    - Opción para ver journal entry asociado
    - Opción para void payroll (si período abierto)
    - _Requirements: 10.1, 10.2_

  - [ ] 8.3 Crear EmployeePaystub.tsx
    - Mostrar pay stub detallado
    - Incluir todas las deducciones
    - Incluir YTD totals
    - Opción para descargar como PDF
    - _Requirements: 4.5, 10.4_

  - [ ] 8.4 Agregar rutas en App.tsx y Sidebar
    - Ruta /payroll/process
    - Ruta /payroll/review
    - Ruta /payroll/paystub/:id
    - Agregar sección "Nómina" en Sidebar

  - [ ] 8.5 Integrar con AccountingPeriodService
    - Validar que período esté abierto antes de procesar
    - Mostrar error si período cerrado
    - _Requirements: 8.1, 8.2_

  - [ ]* 8.6 Escribir property test para closed period validation
    - **Property 25: Closed Period Validation**
    - **Validates: Requirements 8.1, 8.2**

- [ ] 9. Checkpoint - Validar UI de nómina
  - Probar flujo completo de procesamiento
  - Verificar que validaciones funcionan
  - Verificar que preview es correcto
  - Verificar que journal entry se crea
  - Preguntar al usuario si hay dudas

- [ ] 10. Implementar PayrollReportGenerator
  - [ ] 10.1 Implementar generación de Form 941
    - Obtener todos los payrolls del quarter
    - Sumar total wages, federal tax, FICA, Medicare
    - Calcular employer portion (matching)
    - Generar estructura de datos Form941Data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 10.2 Escribir property tests para Form 941
    - **Property 21: Form 941 Quarterly Totals**
    - **Property 22: Employer FICA Matching**
    - **Validates: Requirements 6.2-6.6**

  - [ ] 10.3 Implementar exportación de Form 941 a PDF
    - Usar jsPDF y jspdf-autotable
    - Seguir formato oficial del IRS
    - Incluir todos los campos requeridos
    - _Requirements: 6.7, 6.8_

  - [ ] 10.4 Implementar generación de W-2
    - Obtener todos los payrolls del employee en el año
    - Sumar total wages, federal tax, FICA, Medicare
    - Generar estructura de datos W2Data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 10.5 Escribir property test para W-2
    - **Property 23: W-2 Annual Totals**
    - **Validates: Requirements 7.2-7.5**

  - [ ] 10.6 Implementar exportación de W-2 a PDF
    - Usar jsPDF
    - Seguir formato oficial del IRS
    - Incluir todos los boxes requeridos
    - _Requirements: 7.6, 7.7_

  - [ ] 10.7 Implementar generación de W-3
    - Obtener todos los W-2s del año
    - Sumar totales de todos los W-2s
    - Generar estructura de datos W3Data
    - _Requirements: 7.8_

  - [ ]* 10.8 Escribir property test para W-3
    - **Property 24: W-3 Summary**
    - **Validates: Requirements 7.8**

- [ ] 11. Checkpoint - Validar reportes
  - Asegurar que todos los tests pasen
  - Verificar que totales son correctos
  - Verificar que PDFs se generan correctamente
  - Comparar con formatos oficiales del IRS
  - Preguntar al usuario si hay dudas

- [ ] 12. Implementar UI de reportes
  - [ ] 12.1 Crear PayrollReports.tsx
    - Sección para Form 941 (quarterly)
    - Selector de quarter y year
    - Preview de datos del Form 941
    - Botón para descargar PDF
    - Sección para W-2 (annual)
    - Selector de year
    - Lista de employees con opción para generar W-2
    - Botón para generar W-3 (summary)
    - _Requirements: 6.1-6.8, 7.1-7.8, 10.1-10.6_

  - [ ] 12.2 Crear sección de análisis de costos laborales
    - Gráfico de costos por departamento
    - Gráfico de tendencias mensuales
    - Tabla de resumen por employee
    - Exportar a Excel
    - _Requirements: 10.1-10.6_

  - [ ] 12.3 Agregar ruta en App.tsx y Sidebar
    - Ruta /payroll/reports
    - Agregar en sección "Nómina" del Sidebar

- [ ] 13. Integrar con sistema de cierres contables
  - [ ] 13.1 Extender AccountingPeriodService
    - Agregar validación de payroll en validatePeriodClosure()
    - Verificar que todos los payrolls del período estén procesados
    - Agregar warning si hay payroll pendiente
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 13.2 Escribir property test para period closure validation
    - **Property 26: Period Closure Validation**
    - **Validates: Requirements 8.4**

  - [ ] 13.2 Actualizar PeriodClosureWizard
    - Agregar paso de validación de nómina
    - Mostrar lista de payrolls procesados en el período
    - Mostrar warning si falta procesar nómina
    - _Requirements: 8.3, 8.4, 8.5_

- [ ] 14. Implementar validaciones adicionales
  - [ ]* 14.1 Escribir property tests para validaciones de input
    - **Property 28: SSN Format Validation**
    - **Property 29: Filing Status Validation**
    - **Validates: Requirements 9.3, 9.4**

  - [ ]* 14.2 Escribir property test para audit logging
    - **Property 31: Audit Logging**
    - **Validates: Requirements 11.1, 11.2**

- [ ] 15. Actualizar PayrollDashboard con datos reales
  - Conectar con PayrollService en lugar de datos mock
  - Actualizar cálculos para usar datos reales
  - Remover banner de "datos de demostración"
  - Verificar que todos los gráficos funcionan
  - _Requirements: 10.1-10.6_

- [ ] 16. Testing exhaustivo y validación final
  - [ ]* 16.1 Ejecutar todos los property tests (31 properties)
    - Verificar que todos pasen con 100 iteraciones
    - Documentar cualquier fallo

  - [ ]* 16.2 Ejecutar todos los unit tests
    - Verificar casos del IRS
    - Verificar edge cases
    - Verificar error handling

  - [ ] 16.3 Validar contra calculadoras del IRS
    - Crear casos de prueba con inputs conocidos
    - Calcular con nuestro sistema
    - Calcular con IRS Tax Withholding Estimator
    - Calcular con PaycheckCity
    - Calcular con ADP Calculator
    - Comparar resultados (deben coincidir al centavo)
    - Documentar cualquier discrepancia

  - [ ] 16.4 Testing de integración end-to-end
    - Procesar nómina completa
    - Verificar journal entry
    - Cerrar período
    - Generar Form 941
    - Generar W-2
    - Verificar todos los datos

  - [ ] 16.5 Testing de performance
    - Procesar 1 employee: < 1 segundo
    - Procesar 100 employees: < 30 segundos
    - Generar Form 941: < 5 segundos
    - Generar W-2: < 2 segundos

- [ ] 17. Checkpoint final - Revisión completa
  - Todos los tests pasan (unit + property + integration)
  - Validado contra calculadoras del IRS (100% match)
  - Performance cumple con targets
  - UI es intuitiva y fácil de usar
  - Documentación completa
  - Código revisado (idealmente por CPA)
  - Preguntar al usuario si está listo para producción

- [ ] 18. Actualizar documentación
  - Actualizar PROGRESO_IMPLEMENTACION.md
  - Marcar Fase 4 como completada
  - Actualizar completitud del sistema (98% → 99%)
  - Crear documento de resumen de implementación
  - Documentar cualquier decisión técnica importante

---

## Notes

### Tareas Opcionales (marcadas con *)
- Las tareas marcadas con `*` son tests y pueden ser opcionales para un MVP rápido
- Sin embargo, para un sistema de nómina, se recomienda FUERTEMENTE implementar todos los tests
- Los cálculos de impuestos deben ser 100% precisos para evitar multas del IRS

### Orden de Prioridad
1. **CRÍTICO**: PayrollTaxCalculator (tareas 2.x) - Debe ser 100% preciso
2. **ALTA**: PayrollProcessor (tareas 4.x) - Core business logic
3. **ALTA**: PayrollJournalService (tareas 6.x) - Integridad contable
4. **MEDIA**: UI de procesamiento (tareas 8.x) - Usabilidad
5. **MEDIA**: Reportes (tareas 10.x, 12.x) - Compliance con IRS
6. **BAJA**: Integración con cierres (tareas 13.x) - Nice to have

### Validación Crítica
- **DEBE** validarse contra calculadoras oficiales del IRS
- **DEBE** probarse con casos reales del IRS Publication 15
- **RECOMENDADO**: Revisión por contador certificado (CPA)
- **RECOMENDADO**: Testing con datos de nómina real (anonimizados)

### Riesgos
- **Alto**: Errores en cálculos de impuestos → Multas del IRS
- **Medio**: Performance con muchos empleados → Optimizar queries
- **Bajo**: Cambios en regulaciones del IRS → Monitorear publicaciones

---

## Success Criteria

- [ ] Todos los tests pasan (unit + property + integration)
- [ ] Cálculos validados contra IRS calculators (100% match)
- [ ] Form 941 genera correctamente
- [ ] W-2 genera correctamente
- [ ] Asientos contables balancean
- [ ] Integración con cierres contables funciona
- [ ] Dashboard de nómina usa datos reales
- [ ] Performance < 2 segundos para procesar nómina
- [ ] Sin errores TypeScript
- [ ] Código revisado por CPA (recomendado)

---

**Total Tasks**: 18 main tasks, 60+ sub-tasks  
**Estimated Time**: 5-7 days (40-56 hours)  
**Complexity**: ⭐⭐⭐⭐⭐ (Very High)  
**Priority**: High (but can be postponed for v1.0 launch)

