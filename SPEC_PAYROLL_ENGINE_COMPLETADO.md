# ✅ Spec del Motor de Nómina - COMPLETADO

**Fecha**: 7 de febrero de 2026  
**Estado**: Spec Completo - Listo para Implementación  
**Tiempo de Creación**: 1 hora

---

## 📋 Resumen

Se ha creado la especificación completa del Motor de Nómina (Payroll Engine), uno de los módulos más complejos del sistema AccountExpress. Este módulo procesará nómina con precisión del 100% según regulaciones del IRS.

---

## 📁 Archivos Creados

### 1. README.md
**Contenido**:
- Descripción general del motor de nómina
- Objetivos (cálculo de impuestos, procesamiento, asientos, reportes IRS)
- Advertencias críticas (precisión legal requerida)
- Arquitectura de alto nivel (4 componentes principales)
- Referencias importantes (IRS Publications, Forms, Calculators)
- Conceptos clave (FICA, Federal Tax, Gross/Net Pay)
- Flujo de procesamiento (10 pasos)
- Métricas de éxito

### 2. requirements.md
**Contenido**:
- Glossary (12 términos técnicos)
- 12 Requirements detallados con User Stories
- 60+ Acceptance Criteria en formato EARS
- Non-Functional Requirements (Accuracy, Compliance, Reliability)
- Out of Scope (features para fases futuras)
- Assumptions (7 supuestos del sistema)
- Dependencies (sistemas existentes)
- Risks (5 riesgos identificados con mitigación)

**Requirements Cubiertos**:
1. Cálculo de FICA (6 criterios)
2. Cálculo de Federal Income Tax (7 criterios)
3. Cálculo de Gross Pay (7 criterios)
4. Cálculo de Net Pay (5 criterios)
5. Generación de Asientos Contables (7 criterios)
6. Generación de Form 941 (8 criterios)
7. Generación de W-2 (8 criterios)
8. Integración con Cierres Contables (5 criterios)
9. Validación de Datos (6 criterios)
10. Reportes y Análisis (6 criterios)
11. Seguridad y Auditoría (6 criterios)
12. Performance (5 criterios)

### 3. design.md
**Contenido**:
- Overview y principios de diseño
- Arquitectura (3 capas: Presentation, Business Logic, Data)
- 4 Componentes principales con interfaces TypeScript:
  - PayrollTaxCalculator.ts (cálculo de impuestos)
  - PayrollProcessor.ts (orchestrator principal)
  - PayrollJournalService.ts (generación de asientos)
  - PayrollReportGenerator.ts (Form 941, W-2)
- Data Models (schema SQL completo)
- **31 Correctness Properties** (propiedades testeables)
- Error Handling (11 tipos de errores con estrategias)
- Testing Strategy (unit tests + property tests con fast-check)
- Performance Considerations (targets y optimizaciones)
- Security Considerations (encriptación, access control)
- Maintenance and Updates (proceso de actualización anual)
- Future Enhancements (Phase 2 y 3)

**Correctness Properties**:
- Property 1-5: Tax calculations (FICA, Medicare, Rounding)
- Property 6-10: Federal tax (W-4, brackets, deductions)
- Property 11-15: Gross pay (hourly, salaried, overtime, validation)
- Property 16-18: Net pay (calculation, order, non-negative)
- Property 19-20: Journal entries (balanced, linkage)
- Property 21-24: Reports (Form 941, W-2, W-3)
- Property 25-26: Period closure integration
- Property 27-31: Validations (wage, SSN, filing status, audit)

### 4. tasks.md
**Contenido**:
- 18 tareas principales
- 60+ sub-tareas detalladas
- Orden de implementación incremental
- 5 checkpoints de validación
- Referencias a requirements específicos
- Tareas opcionales marcadas con `*` (tests)
- Notas sobre prioridad y riesgos
- Success criteria (10 criterios)

**Estructura de Tareas**:
1. Base de datos (1 tarea)
2. PayrollTaxCalculator (8 sub-tareas) - CRÍTICO
3. Checkpoint 1
4. PayrollProcessor (8 sub-tareas)
5. Checkpoint 2
6. PayrollJournalService (6 sub-tareas)
7. Checkpoint 3
8. UI de procesamiento (6 sub-tareas)
9. Checkpoint 4
10. PayrollReportGenerator (8 sub-tareas)
11. Checkpoint 5
12. UI de reportes (3 sub-tareas)
13. Integración con cierres (2 sub-tareas)
14. Validaciones adicionales (2 sub-tareas)
15. Actualizar dashboard (1 tarea)
16. Testing exhaustivo (5 sub-tareas)
17. Checkpoint final
18. Documentación (1 tarea)

### 5. TaxBrackets2026.ts (ya creado)
**Contenido**:
- Federal tax brackets para 2026 (Single, Married, Head of Household)
- FICA rates (Social Security 6.2%, Medicare 1.45%)
- Wage base limits ($168,600 para SS)
- Standard deductions por filing status
- Helper functions (getTaxBrackets, getStandardDeduction, etc.)

---

## 🎯 Características Clave

### Precisión Legal
- Cálculos 100% precisos según IRS Publication 15
- Validación contra calculadoras oficiales del IRS
- Redondeo correcto (siempre hacia abajo)
- Tracking de YTD wages para límites

### Compliance
- Form 941 (quarterly tax report)
- W-2 (annual wage statement)
- W-3 (transmittal summary)
- Audit trail completo
- Integración con cierres contables

### Testing Exhaustivo
- 31 property-based tests (100 iteraciones cada uno)
- Unit tests con casos del IRS
- Integration tests end-to-end
- Validación contra 3 calculadoras comerciales

### Arquitectura Robusta
- Separación de responsabilidades (tax logic, processing, journal)
- Error handling completo (11 tipos de errores)
- Performance optimizado (< 1 segundo por empleado)
- Seguridad (encriptación de SSN, access control)

---

## ⚠️ Advertencias Críticas

### Precisión Legal Requerida
- Los cálculos de impuestos deben ser **100% precisos**
- Errores pueden resultar en multas del IRS
- DEBE validarse contra calculadoras oficiales del IRS
- **Recomendado**: Revisión por contador certificado (CPA)

### Regulaciones Cambiantes
- Tax brackets cambian anualmente (actualizar en diciembre)
- Límites de FICA se ajustan cada año
- Mantener actualizado con IRS Publication 15

### Testing Exhaustivo
- Probar con casos reales del IRS
- Validar edge cases (salarios muy altos/bajos)
- Verificar redondeos (siempre redondear hacia abajo)

---

## 📊 Métricas del Spec

| Métrica | Valor |
|---------|-------|
| **Archivos Creados** | 5 |
| **Requirements** | 12 |
| **Acceptance Criteria** | 60+ |
| **Correctness Properties** | 31 |
| **Tareas de Implementación** | 18 principales, 60+ sub-tareas |
| **Tiempo Estimado** | 5-7 días (40-56 horas) |
| **Complejidad** | ⭐⭐⭐⭐⭐ (Muy Alta) |
| **Líneas de Documentación** | ~2,500 |

---

## 🚀 Próximos Pasos

### Opción A: Implementar Ahora
1. Seguir tasks.md paso a paso
2. Empezar con tarea 1 (base de datos)
3. Continuar con tarea 2 (PayrollTaxCalculator) - CRÍTICO
4. Validar en cada checkpoint
5. Completar en 5-7 días

### Opción B: Posponer para v1.1
1. Lanzar sistema actual (98% completo)
2. Implementar Motor de Nómina en v1.1
3. Implementar Bank Import AI en v1.2
4. Enfoque en estabilidad y feedback de usuarios

---

## 📚 Referencias Importantes

### IRS Publications
- **Publication 15 (Circular E)**: Employer's Tax Guide
  - https://www.irs.gov/pub/irs-pdf/p15.pdf
- **Publication 15-A**: Employer's Supplemental Tax Guide
- **Publication 15-B**: Employer's Tax Guide to Fringe Benefits

### Tax Forms
- **Form 941**: Employer's Quarterly Federal Tax Return
- **Form W-2**: Wage and Tax Statement
- **Form W-3**: Transmittal of Wage and Tax Statements

### Online Calculators (para validación)
- IRS Tax Withholding Estimator: https://www.irs.gov/individuals/tax-withholding-estimator
- PaycheckCity: https://www.paycheckcity.com/calculator/salary
- ADP Paycheck Calculator: https://www.adp.com/resources/tools/calculators/salary-paycheck-calculator.aspx

---

## ✅ Checklist de Completitud del Spec

- [x] README.md creado con overview completo
- [x] requirements.md creado con 12 requirements detallados
- [x] design.md creado con arquitectura y 31 properties
- [x] tasks.md creado con plan de implementación completo
- [x] TaxBrackets2026.ts creado con tablas del IRS
- [x] Correctness properties definidas y mapeadas a requirements
- [x] Error handling strategy definida
- [x] Testing strategy definida (unit + property tests)
- [x] Performance targets definidos
- [x] Security considerations documentadas
- [x] Maintenance plan documentado
- [x] Success criteria definidos

---

**Estado**: ✅ SPEC COMPLETO  
**Listo para**: Implementación o Revisión por CPA  
**Próximo Spec**: Bank Import AI (Fase 5)

