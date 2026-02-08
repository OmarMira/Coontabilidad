# Spec: Motor de Nómina (Payroll Engine)

**Fecha de Creación**: 7 de febrero de 2026  
**Estado**: Not Started  
**Prioridad**: Alta  
**Complejidad**: ⭐⭐⭐⭐⭐ (Muy Alta)  
**Tiempo Estimado**: 5-7 días (40-56 horas)

---

## 📋 Descripción General

Implementar un motor completo de procesamiento de nómina que cumpla con las regulaciones federales de EE.UU. y del estado de Florida. El sistema debe calcular impuestos con precisión del 100%, generar asientos contables automáticos, y producir reportes para el IRS.

---

## 🎯 Objetivos

1. **Cálculo Preciso de Impuestos**: FICA, Medicare, Federal Income Tax
2. **Procesamiento de Nómina**: Salarios, horas extra, bonos, deducciones
3. **Asientos Contables**: Generación automática de journal entries
4. **Reportes IRS**: Form 941 (quarterly), W-2 (annual)
5. **Integración**: Con cierres contables y dashboard de nómina

---

## 📁 Archivos de la Spec

- `requirements.md` - Requisitos funcionales detallados
- `design.md` - Diseño técnico y arquitectura
- `tasks.md` - Lista de tareas de implementación

---

## 🚨 ADVERTENCIAS CRÍTICAS

### ⚠️ Precisión Legal Requerida
- Los cálculos de impuestos deben ser **100% precisos**
- Errores pueden resultar en multas del IRS
- DEBE validarse contra calculadoras oficiales del IRS
- Recomendado: Revisión por contador certificado (CPA)

### ⚠️ Regulaciones Cambiantes
- Tax brackets cambian anualmente
- Límites de FICA se ajustan cada año
- Mantener actualizado con IRS Publication 15

### ⚠️ Testing Exhaustivo
- Probar con casos reales del IRS
- Validar edge cases (salarios muy altos/bajos)
- Verificar redondeos (siempre redondear hacia abajo)

---

## 📊 Alcance del Proyecto

### ✅ Incluido
- Cálculo de FICA (Social Security + Medicare)
- Cálculo de Federal Income Tax
- Procesamiento de nómina quincenal/mensual
- Horas regulares y overtime
- Bonos y comisiones
- Deducciones pre-tax y post-tax
- Generación de asientos contables
- Reportes Form 941 y W-2
- Integración con cierres contables

### ❌ NO Incluido (Fase Futura)
- Impuestos estatales (Florida no tiene income tax)
- Beneficios complejos (401k, HSA, FSA)
- Garnishments (embargos salariales)
- Multi-state payroll
- Direct deposit automation
- Time tracking integration

---

## 🏗️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    Payroll Engine                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Tax Calculator  │  │ Payroll Processor│                │
│  │                  │  │                  │                │
│  │ - FICA           │  │ - Gross Pay      │                │
│  │ - Medicare       │  │ - Deductions     │                │
│  │ - Federal Tax    │  │ - Net Pay        │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      │                                       │
│           ┌──────────▼───────────┐                          │
│           │  Journal Generator   │                          │
│           │                      │                          │
│           │ - Payroll Entry      │                          │
│           │ - Tax Liability      │                          │
│           └──────────────────────┘                          │
│                      │                                       │
│           ┌──────────▼───────────┐                          │
│           │   Report Generator   │                          │
│           │                      │                          │
│           │ - Form 941           │                          │
│           │ - W-2                │                          │
│           └──────────────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

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

## 🎓 Conceptos Clave

### FICA (Federal Insurance Contributions Act)
- **Social Security**: 6.2% (employee) + 6.2% (employer)
  - Wage base limit: $168,600 (2026)
- **Medicare**: 1.45% (employee) + 1.45% (employer)
  - No wage limit
  - Additional 0.9% for high earners (>$200k single, >$250k married)

### Federal Income Tax Withholding
- Basado en W-4 del empleado
- 7 tax brackets (10%, 12%, 22%, 24%, 32%, 35%, 37%)
- Considera filing status y allowances

### Gross Pay vs Net Pay
- **Gross Pay**: Salario bruto (antes de deducciones)
- **Net Pay**: Salario neto (después de deducciones)
- Formula: `Net Pay = Gross Pay - (FICA + Medicare + Federal Tax + Other Deductions)`

---

## 🔄 Flujo de Procesamiento

1. **Input**: Horas trabajadas, rate, bonos
2. **Calculate Gross Pay**: Regular + Overtime + Bonos
3. **Calculate Pre-Tax Deductions**: 401k, HSA (si aplica)
4. **Calculate Taxable Income**: Gross - Pre-Tax Deductions
5. **Calculate FICA**: Social Security + Medicare
6. **Calculate Federal Tax**: Basado en W-4 y brackets
7. **Calculate Post-Tax Deductions**: Garnishments (si aplica)
8. **Calculate Net Pay**: Gross - All Deductions
9. **Generate Journal Entry**: Débitos y créditos
10. **Update Records**: Guardar en base de datos

---

## 📈 Métricas de Éxito

- [ ] Cálculos validados contra IRS calculators (100% match)
- [ ] Todos los test cases del IRS pasan
- [ ] Form 941 genera correctamente
- [ ] W-2 genera correctamente
- [ ] Asientos contables balancean
- [ ] Integración con cierres contables funciona
- [ ] Dashboard de nómina usa datos reales
- [ ] Performance < 2 segundos para procesar nómina
- [ ] Sin errores TypeScript
- [ ] Código revisado por CPA (recomendado)

---

## 🚀 Próximos Pasos

1. Leer `requirements.md` para entender requisitos funcionales
2. Leer `design.md` para entender arquitectura técnica
3. Seguir `tasks.md` para implementación paso a paso
4. Validar cada componente contra calculadoras del IRS
5. Testing exhaustivo con casos reales
6. Revisión por contador certificado (altamente recomendado)

---

**Creado por**: Kiro AI  
**Última Actualización**: 7 de febrero de 2026
