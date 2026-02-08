# Requirements: Motor de Nómina

**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0  
**Estado**: Draft

---

## Glossary

- **Payroll_Engine**: Sistema completo de procesamiento de nómina
- **Tax_Calculator**: Módulo que calcula impuestos federales
- **FICA**: Federal Insurance Contributions Act (Social Security + Medicare)
- **Gross_Pay**: Salario bruto antes de deducciones
- **Net_Pay**: Salario neto después de todas las deducciones
- **Withholding**: Retención de impuestos del salario
- **W-4**: Formulario de retención de impuestos del empleado
- **Form_941**: Reporte trimestral de impuestos al IRS
- **W-2**: Reporte anual de salarios e impuestos
- **Pay_Period**: Período de pago (quincenal, mensual, etc.)
- **Overtime**: Horas extra (>40 horas/semana)
- **YTD**: Year-to-Date (acumulado del año)

---

## Requirements

### Requirement 1: Cálculo de FICA

**User Story**: Como empleador, quiero calcular FICA correctamente, para cumplir con regulaciones federales.

#### Acceptance Criteria

1. WHEN calculating Social Security tax, THE Tax_Calculator SHALL apply 6.2% rate to wages up to $168,600 annual limit
2. WHEN wages exceed Social Security limit, THE Tax_Calculator SHALL stop withholding Social Security tax
3. WHEN calculating Medicare tax, THE Tax_Calculator SHALL apply 1.45% rate to all wages without limit
4. WHEN wages exceed $200,000 (single) or $250,000 (married), THE Tax_Calculator SHALL apply additional 0.9% Medicare tax
5. THE Tax_Calculator SHALL track YTD wages to determine when limits are reached
6. THE Tax_Calculator SHALL round all tax amounts down to nearest cent

---

### Requirement 2: Cálculo de Federal Income Tax

**User Story**: Como empleador, quiero calcular retención de impuestos federales, para cumplir con el IRS.

#### Acceptance Criteria

1. WHEN calculating federal tax, THE Tax_Calculator SHALL use employee's W-4 information (filing status, allowances)
2. WHEN applying tax brackets, THE Tax_Calculator SHALL use 2026 IRS tax tables
3. THE Tax_Calculator SHALL support filing statuses: Single, Married, Married Separate, Head of Household
4. WHEN calculating taxable income, THE Tax_Calculator SHALL subtract standard deduction based on filing status
5. THE Tax_Calculator SHALL apply progressive tax brackets correctly (10%, 12%, 22%, 24%, 32%, 35%, 37%)
6. THE Tax_Calculator SHALL calculate withholding per pay period (not annual)
7. THE Tax_Calculator SHALL round withholding down to nearest cent

---

### Requirement 3: Cálculo de Gross Pay

**User Story**: Como empleador, quiero calcular salario bruto, para procesar nómina correctamente.

#### Acceptance Criteria

1. WHEN employee is hourly, THE Payroll_Engine SHALL calculate gross pay as: hours × hourly_rate
2. WHEN employee is salaried, THE Payroll_Engine SHALL calculate gross pay as: annual_salary ÷ pay_periods_per_year
3. WHEN employee works overtime (>40 hours/week), THE Payroll_Engine SHALL calculate overtime at 1.5× regular rate
4. WHEN employee receives bonuses, THE Payroll_Engine SHALL add bonuses to gross pay
5. WHEN employee receives commissions, THE Payroll_Engine SHALL add commissions to gross pay
6. THE Payroll_Engine SHALL validate that hours worked ≥ 0 and ≤ 168 (hours in week)
7. THE Payroll_Engine SHALL round gross pay to nearest cent

---

### Requirement 4: Cálculo de Net Pay

**User Story**: Como empleado, quiero ver mi salario neto, para saber cuánto recibiré.

#### Acceptance Criteria

1. THE Payroll_Engine SHALL calculate net pay as: Gross_Pay - FICA - Medicare - Federal_Tax - Other_Deductions
2. WHEN calculating net pay, THE Payroll_Engine SHALL apply deductions in order: Pre-tax, Taxes, Post-tax
3. THE Payroll_Engine SHALL ensure net pay ≥ 0 (never negative)
4. THE Payroll_Engine SHALL round net pay to nearest cent
5. THE Payroll_Engine SHALL generate detailed pay stub showing all deductions

---

### Requirement 5: Generación de Asientos Contables

**User Story**: Como contador, quiero asientos contables automáticos, para mantener libros actualizados.

#### Acceptance Criteria

1. WHEN processing payroll, THE Payroll_Engine SHALL generate journal entry with balanced debits and credits
2. THE Payroll_Engine SHALL debit Payroll_Expense account for gross pay
3. THE Payroll_Engine SHALL credit Cash account for net pay
4. THE Payroll_Engine SHALL credit Tax_Liability accounts for withheld taxes
5. THE Payroll_Engine SHALL credit Other_Liability accounts for other deductions
6. THE Payroll_Engine SHALL ensure total debits = total credits
7. THE Payroll_Engine SHALL link journal entry to payroll record for audit trail

---

### Requirement 6: Generación de Form 941

**User Story**: Como empleador, quiero generar Form 941, para reportar impuestos trimestralmente al IRS.

#### Acceptance Criteria

1. THE Payroll_Engine SHALL generate Form 941 for each calendar quarter
2. THE Form_941 SHALL include total wages paid in quarter
3. THE Form_941 SHALL include total federal income tax withheld
4. THE Form_941 SHALL include total Social Security wages and tax
5. THE Form_941 SHALL include total Medicare wages and tax
6. THE Form_941 SHALL calculate employer's portion of FICA (matching employee portion)
7. THE Form_941 SHALL be downloadable as PDF
8. THE Form_941 SHALL match IRS official format exactly

---

### Requirement 7: Generación de W-2

**User Story**: Como empleador, quiero generar W-2, para reportar salarios anuales a empleados y al IRS.

#### Acceptance Criteria

1. THE Payroll_Engine SHALL generate W-2 for each employee at year end
2. THE W-2 SHALL include total wages, tips, and compensation (Box 1)
3. THE W-2 SHALL include federal income tax withheld (Box 2)
4. THE W-2 SHALL include Social Security wages (Box 3) and tax (Box 4)
5. THE W-2 SHALL include Medicare wages (Box 5) and tax (Box 6)
6. THE W-2 SHALL be downloadable as PDF
7. THE W-2 SHALL match IRS official format exactly
8. THE Payroll_Engine SHALL generate W-3 (transmittal) summarizing all W-2s

---

### Requirement 8: Integración con Cierres Contables

**User Story**: Como contador, quiero que nómina se integre con cierres, para asegurar integridad contable.

#### Acceptance Criteria

1. WHEN accounting period is closed, THE Payroll_Engine SHALL prevent processing payroll for dates in that period
2. WHEN processing payroll, THE Payroll_Engine SHALL validate that period is open
3. THE Payroll_Engine SHALL be included in period closure checklist
4. WHEN closing period, THE System SHALL validate that all payroll for period is processed
5. THE System SHALL show warning if payroll is pending for period being closed

---

### Requirement 9: Validación de Datos

**User Story**: Como empleador, quiero validación de datos, para prevenir errores en nómina.

#### Acceptance Criteria

1. WHEN entering hours, THE Payroll_Engine SHALL validate hours ≥ 0 and ≤ 168
2. WHEN entering rate, THE Payroll_Engine SHALL validate rate ≥ minimum wage ($7.25 federal)
3. WHEN entering employee data, THE Payroll_Engine SHALL validate SSN format (XXX-XX-XXXX)
4. WHEN entering W-4 data, THE Payroll_Engine SHALL validate filing status is valid
5. THE Payroll_Engine SHALL prevent processing payroll with incomplete employee data
6. THE Payroll_Engine SHALL show clear error messages for validation failures

---

### Requirement 10: Reportes y Análisis

**User Story**: Como gerente, quiero reportes de nómina, para analizar costos laborales.

#### Acceptance Criteria

1. THE Payroll_Engine SHALL generate payroll summary report by pay period
2. THE Payroll_Engine SHALL generate payroll detail report by employee
3. THE Payroll_Engine SHALL generate department cost analysis
4. THE Payroll_Engine SHALL generate YTD summary for each employee
5. THE Payroll_Engine SHALL show trends over time (monthly, quarterly, annual)
6. THE Payroll_Engine SHALL export reports to PDF and Excel

---

### Requirement 11: Seguridad y Auditoría

**User Story**: Como administrador, quiero auditoría completa, para cumplir con regulaciones.

#### Acceptance Criteria

1. THE Payroll_Engine SHALL log all payroll processing actions with timestamp and user
2. THE Payroll_Engine SHALL log all changes to employee data
3. THE Payroll_Engine SHALL restrict access to payroll data to authorized users only
4. THE Payroll_Engine SHALL encrypt sensitive data (SSN, bank accounts)
5. THE Payroll_Engine SHALL maintain audit trail for minimum 7 years
6. THE Payroll_Engine SHALL allow viewing audit log by date range and user

---

### Requirement 12: Performance

**User Story**: Como usuario, quiero procesamiento rápido, para eficiencia operativa.

#### Acceptance Criteria

1. THE Payroll_Engine SHALL process payroll for single employee in < 1 second
2. THE Payroll_Engine SHALL process payroll for 100 employees in < 30 seconds
3. THE Payroll_Engine SHALL generate Form 941 in < 5 seconds
4. THE Payroll_Engine SHALL generate W-2 for single employee in < 2 seconds
5. THE Payroll_Engine SHALL load payroll history in < 2 seconds

---

## Non-Functional Requirements

### Accuracy
- All tax calculations MUST be accurate to the cent
- MUST validate against IRS official calculators
- MUST match results from commercial payroll software (ADP, Paychex)

### Compliance
- MUST comply with IRS Publication 15 (Circular E)
- MUST comply with FLSA (Fair Labor Standards Act)
- MUST comply with Florida labor laws
- MUST maintain records for 7 years minimum

### Reliability
- MUST have 99.9% uptime during payroll processing windows
- MUST have automatic backup before each payroll run
- MUST have rollback capability if errors detected

### Usability
- MUST be usable by non-accountants
- MUST have clear error messages
- MUST have inline help and tooltips
- MUST have step-by-step wizard for first-time setup

### Maintainability
- MUST be easy to update tax tables annually
- MUST have clear separation of tax logic from UI
- MUST have comprehensive unit tests
- MUST have integration tests with IRS test cases

---

## Out of Scope (Future Phases)

- State income tax (Florida has none, but for multi-state)
- 401(k) and retirement plan contributions
- Health insurance and benefits
- Garnishments and child support
- Multi-currency payroll
- International payroll
- Time tracking integration
- Direct deposit automation
- Mobile app for employees

---

## Assumptions

1. All employees are W-2 employees (not 1099 contractors)
2. All employees are paid in USD
3. All employees work in Florida (no state income tax)
4. Company uses semi-monthly pay periods (24 per year)
5. Overtime is calculated weekly (not daily)
6. Company has < 500 employees
7. Company files Form 941 quarterly (not monthly)

---

## Dependencies

- Existing accounting system (journal entries)
- Existing employee management system
- Existing period closure system
- IRS tax tables (updated annually)
- PDF generation library (jsPDF)

---

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Tax calculation errors | High | Medium | Extensive testing, CPA review |
| IRS regulation changes | High | Low | Monitor IRS publications, annual updates |
| Performance issues | Medium | Low | Optimize queries, use indexes |
| Data loss | High | Low | Regular backups, audit trail |
| Security breach | High | Low | Encryption, access controls |

---

**Approved by**: [Pending]  
**Date**: [Pending]
