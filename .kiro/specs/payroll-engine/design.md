# Design Document: Motor de Nómina

**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0  
**Estado**: Draft

---

## Overview

El Motor de Nómina es un sistema completo de procesamiento de nómina que calcula impuestos federales (FICA, Medicare, Federal Income Tax), procesa salarios con precisión del 100%, genera asientos contables automáticos, y produce reportes para el IRS (Form 941, W-2).

El sistema está diseñado para cumplir con todas las regulaciones federales de EE.UU. y del estado de Florida, con énfasis en precisión legal, auditoría completa, y facilidad de uso.

### Key Design Principles

1. **Precisión Legal**: Todos los cálculos deben ser 100% precisos según IRS Publication 15
2. **Auditoría Completa**: Cada acción debe ser registrada con timestamp, usuario, IP
3. **Separación de Responsabilidades**: Tax logic, payroll processing, journal generation separados
4. **Testabilidad**: Cada componente debe ser testeable independientemente
5. **Mantenibilidad**: Tax tables deben ser fáciles de actualizar anualmente

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Payroll Engine                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Presentation Layer                     │  │
│  │  - PayrollProcessor.tsx (UI principal)                    │  │
│  │  - PayrollReview.tsx (preview y aprobación)               │  │
│  │  - PayrollReports.tsx (reportes)                          │  │
│  │  - EmployeePaystub.tsx (recibo de pago)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                    Business Logic Layer                   │  │
│  │  - PayrollProcessor.ts (orchestrator principal)              │  │
│  │  - PayrollTaxCalculator.ts (cálculo de impuestos)         │  │
│  │  - PayrollJournalService.ts (generación de asientos)      │  │
│  │  - PayrollReportGenerator.ts (Form 941, W-2)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                      Data Layer                           │  │
│  │  - PayrollService.ts (CRUD de nómina)                     │  │
│  │  - EmployeeService.ts (datos de empleados)                │  │
│  │  - TaxBrackets2026.ts (tablas de impuestos)               │  │
│  │  - simple-db.ts (base de datos SQLite)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Input (hours, bonuses)
    │
    ▼
PayrollProcessor.tsx (UI)
    │
    ▼
PayrollProcessor.ts (Business Logic)
    │
    ├──► PayrollTaxCalculator.ts ──► Calculate FICA, Medicare, Federal Tax
    │
    ├──► PayrollJournalService.ts ──► Generate Journal Entry
    │
    └──► PayrollService.ts ──► Save to Database
         │
         ▼
    Database (payroll, payroll_items, journal_entries)
```

---

## Components and Interfaces

### 1. PayrollTaxCalculator.ts

**Purpose**: Calcular todos los impuestos federales con precisión del 100%

**Interface**:
```typescript
interface TaxCalculationInput {
  grossPay: number;
  ytdGrossPay: number;
  filingStatus: FilingStatus;
  allowances: number;
  additionalWithholding: number;
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

interface TaxCalculationResult {
  socialSecurity: number;
  medicare: number;
  medicareAdditional: number;
  federalIncomeTax: number;
  totalTaxes: number;
  breakdown: TaxBreakdown;
}

class PayrollTaxCalculator {
  calculateFICA(input: TaxCalculationInput): FICAResult;
  calculateMedicare(input: TaxCalculationInput): MedicareResult;
  calculateFederalTax(input: TaxCalculationInput): FederalTaxResult;
  calculateAllTaxes(input: TaxCalculationInput): TaxCalculationResult;
}
```

**Key Methods**:

- `calculateFICA()`: Calcula Social Security (6.2% hasta $168,600) y Medicare (1.45% sin límite)
- `calculateMedicare()`: Calcula Medicare adicional (0.9% para ingresos > threshold)
- `calculateFederalTax()`: Calcula retención federal usando W-4 y tax brackets
- `calculateAllTaxes()`: Orquesta todos los cálculos y retorna resultado completo

**Algorithm for Federal Tax Withholding**:
```
1. Get annual salary = gross pay × pay periods per year
2. Subtract standard deduction based on filing status
3. Subtract allowances (allowances × $4,800)
4. Calculate taxable income
5. Apply progressive tax brackets
6. Divide by pay periods per year to get withholding per period
7. Add additional withholding if specified
8. Round down to nearest cent
```

---

### 2. PayrollProcessor.ts

**Purpose**: Orquestar el procesamiento completo de nómina

**Interface**:
```typescript
interface PayrollInput {
  employeeId: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  regularHours: number;
  overtimeHours: number;
  bonuses: number;
  commissions: number;
  otherDeductions: number;
}

interface PayrollResult {
  success: boolean;
  payrollId?: number;
  grossPay: number;
  netPay: number;
  taxes: TaxCalculationResult;
  journalEntryId?: number;
  message?: string;
}

class PayrollProcessor {
  processPayroll(input: PayrollInput): Promise<PayrollResult>;
  calculateGrossPay(input: PayrollInput, employee: Employee): number;
  calculateNetPay(grossPay: number, taxes: TaxCalculationResult, deductions: number): number;
  validatePayrollInput(input: PayrollInput): ValidationResult;
}
```

**Processing Flow**:
```
1. Validate input (hours, dates, employee exists)
2. Get employee data (rate, filing status, YTD wages)
3. Calculate gross pay (regular + overtime + bonuses + commissions)
4. Calculate taxes (FICA + Medicare + Federal)
5. Calculate net pay (gross - taxes - deductions)
6. Generate journal entry
7. Save payroll record
8. Update employee YTD totals
9. Return result
```

---

### 3. PayrollJournalService.ts

**Purpose**: Generar asientos contables para nómina

**Interface**:
```typescript
interface PayrollJournalInput {
  payrollId: number;
  grossPay: number;
  netPay: number;
  socialSecurity: number;
  medicare: number;
  federalTax: number;
  otherDeductions: number;
  payDate: string;
}

class PayrollJournalService {
  generatePayrollEntry(input: PayrollJournalInput): Promise<JournalEntry>;
  generateEmployerTaxEntry(payrollId: number): Promise<JournalEntry>;
}
```

**Journal Entry Structure**:
```
Payroll Entry:
  DR: Payroll Expense (5000)         $10,000.00
  CR: Cash (1000)                              $7,347.00
  CR: FICA Payable (2100)                      $1,530.00
  CR: Federal Tax Payable (2110)               $1,123.00
```


```
Employer Tax Entry:
  DR: Payroll Tax Expense (5010)     $1,530.00
  CR: FICA Payable (2100)                      $1,530.00
```

---

### 4. PayrollReportGenerator.ts

**Purpose**: Generar reportes para el IRS (Form 941, W-2)

**Interface**:
```typescript
interface Form941Data {
  quarter: number;
  year: number;
  totalWages: number;
  federalTaxWithheld: number;
  socialSecurityWages: number;
  socialSecurityTax: number;
  medicareWages: number;
  medicareTax: number;
  employerSSN: string;
  employerEIN: string;
}

interface W2Data {
  year: number;
  employeeId: number;
  wages: number;
  federalTaxWithheld: number;
  socialSecurityWages: number;
  socialSecurityTax: number;
  medicareWages: number;
  medicareTax: number;
}

class PayrollReportGenerator {
  generateForm941(quarter: number, year: number): Promise<Form941Data>;
  generateW2(employeeId: number, year: number): Promise<W2Data>;
  exportForm941ToPDF(data: Form941Data): Promise<Blob>;
  exportW2ToPDF(data: W2Data): Promise<Blob>;
}
```

---

## Data Models

### Database Schema

```sql
-- Tabla de empleados (ya existe, agregar campos de nómina)
ALTER TABLE employees ADD COLUMN hourly_rate REAL;
ALTER TABLE employees ADD COLUMN salary REAL;
ALTER TABLE employees ADD COLUMN pay_type TEXT CHECK(pay_type IN('hourly', 'salaried'));
ALTER TABLE employees ADD COLUMN filing_status TEXT CHECK(filing_status IN('single', 'married', 'married_separate', 'head_of_household'));
ALTER TABLE employees ADD COLUMN allowances INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN additional_withholding REAL DEFAULT 0;
ALTER TABLE employees ADD COLUMN ytd_gross_pay REAL DEFAULT 0;
ALTER TABLE employees ADD COLUMN ytd_federal_tax REAL DEFAULT 0;
ALTER TABLE employees ADD COLUMN ytd_fica REAL DEFAULT 0;
ALTER TABLE employees ADD COLUMN ytd_medicare REAL DEFAULT 0;

-- Tabla de nómina procesada
CREATE TABLE IF NOT EXISTS payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  
  -- Horas y tasas
  regular_hours REAL NOT NULL DEFAULT 0,
  overtime_hours REAL NOT NULL DEFAULT 0,
  hourly_rate REAL,
  
  -- Ingresos
  regular_pay REAL NOT NULL DEFAULT 0,
  overtime_pay REAL NOT NULL DEFAULT 0,
  bonuses REAL NOT NULL DEFAULT 0,
  commissions REAL NOT NULL DEFAULT 0,
  gross_pay REAL NOT NULL,
  
  -- Impuestos
  social_security_tax REAL NOT NULL DEFAULT 0,
  medicare_tax REAL NOT NULL DEFAULT 0,
  medicare_additional_tax REAL NOT NULL DEFAULT 0,
  federal_income_tax REAL NOT NULL DEFAULT 0,
  
  -- Deducciones
  other_deductions REAL NOT NULL DEFAULT 0,
  total_deductions REAL NOT NULL,
  
  -- Neto
  net_pay REAL NOT NULL,
  
  -- Asiento contable
  journal_entry_id INTEGER REFERENCES journal_entries(id),
  
  -- Auditoría
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft', 'approved', 'paid', 'voided')),
  processed_by INTEGER REFERENCES users(id),
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_dates ON payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Social Security Tax Calculation
*For any* wage amount and YTD wages, Social Security tax should be 6.2% of wages up to the annual limit of $168,600, and zero for wages exceeding the limit when combined with YTD.
**Validates: Requirements 1.1, 1.2**

### Property 2: Medicare Tax Calculation
*For any* wage amount, Medicare tax should be 1.45% of all wages without any limit.
**Validates: Requirements 1.3**

### Property 3: Additional Medicare Tax
*For any* wage amount and filing status, when YTD wages exceed the threshold ($200k single, $250k married), additional Medicare tax of 0.9% should be applied to the excess amount.
**Validates: Requirements 1.4**

### Property 4: YTD Wage Tracking
*For any* sequence of payroll processing, YTD wages should equal the sum of all gross pay amounts processed in the current year.
**Validates: Requirements 1.5**

### Property 5: Tax Rounding
*For any* tax calculation (FICA, Medicare, Federal), the result should always be rounded down to the nearest cent.
**Validates: Requirements 1.6, 2.7, 3.7, 4.4**

### Property 6: W-4 Information Usage
*For any* federal tax calculation, the employee's W-4 information (filing status, allowances, additional withholding) should be used in the calculation.
**Validates: Requirements 2.1**

### Property 7: Filing Status Support
*For any* of the four filing statuses (Single, Married, Married Separate, Head of Household), the tax calculator should produce a valid federal tax calculation.
**Validates: Requirements 2.3**

### Property 8: Standard Deduction Application
*For any* taxable income calculation, the standard deduction corresponding to the filing status should be subtracted before applying tax brackets.
**Validates: Requirements 2.4**

### Property 9: Progressive Tax Brackets
*For any* taxable income, the federal tax should be calculated using progressive tax brackets (10%, 12%, 22%, 24%, 32%, 35%, 37%) where each bracket applies only to income within that range.
**Validates: Requirements 2.5**

### Property 10: Per-Period Withholding
*For any* annual tax calculation, the withholding amount should be divided by the number of pay periods per year to get the per-period withholding.
**Validates: Requirements 2.6**

### Property 11: Hourly Gross Pay
*For any* hourly employee, gross pay should equal hours worked multiplied by hourly rate.
**Validates: Requirements 3.1**

### Property 12: Salaried Gross Pay
*For any* salaried employee, gross pay should equal annual salary divided by the number of pay periods per year.
**Validates: Requirements 3.2**

### Property 13: Overtime Calculation
*For any* employee working more than 40 hours in a week, overtime pay should be calculated at 1.5× the regular rate for hours exceeding 40.
**Validates: Requirements 3.3**

### Property 14: Bonuses and Commissions Inclusion
*For any* payroll with bonuses or commissions, these amounts should be added to the regular and overtime pay to calculate gross pay.
**Validates: Requirements 3.4, 3.5**

### Property 15: Hours Validation
*For any* hours input, the value should be rejected if it is less than 0 or greater than 168 (hours in a week).
**Validates: Requirements 3.6, 9.1**

### Property 16: Net Pay Calculation
*For any* payroll, net pay should equal gross pay minus all taxes (FICA, Medicare, Federal) minus other deductions.
**Validates: Requirements 4.1**

### Property 17: Deduction Order
*For any* payroll calculation, deductions should be applied in the order: pre-tax deductions, taxes, post-tax deductions.
**Validates: Requirements 4.2**

### Property 18: Non-Negative Net Pay
*For any* payroll calculation, net pay should never be negative (minimum value is 0).
**Validates: Requirements 4.3**

### Property 19: Balanced Journal Entry
*For any* payroll journal entry, the sum of debits should equal the sum of credits.
**Validates: Requirements 5.1, 5.6**

### Property 20: Journal Entry Linkage
*For any* processed payroll, there should exist a corresponding journal entry linked via foreign key.
**Validates: Requirements 5.7**

### Property 21: Form 941 Quarterly Totals
*For any* quarter, Form 941 totals (wages, federal tax, FICA, Medicare) should equal the sum of all payroll records in that quarter.
**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

### Property 22: Employer FICA Matching
*For any* Form 941, the employer's portion of FICA should equal the employee's portion (matching contribution).
**Validates: Requirements 6.6**

### Property 23: W-2 Annual Totals
*For any* employee and year, W-2 totals (wages, federal tax, FICA, Medicare) should equal the sum of all payroll records for that employee in that year.
**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 24: W-3 Summary
*For any* year, W-3 totals should equal the sum of all W-2 forms for that year.
**Validates: Requirements 7.8**

### Property 25: Closed Period Validation
*For any* payroll processing attempt, if the pay date falls within a closed accounting period, the processing should be rejected.
**Validates: Requirements 8.1, 8.2**

### Property 26: Period Closure Validation
*For any* accounting period closure attempt, if there are unprocessed payroll records for that period, the closure should be prevented or warned.
**Validates: Requirements 8.4**

### Property 27: Minimum Wage Validation
*For any* hourly rate input, the value should be rejected if it is less than the federal minimum wage ($7.25).
**Validates: Requirements 9.2**

### Property 28: SSN Format Validation
*For any* SSN input, the value should be rejected if it does not match the format XXX-XX-XXXX.
**Validates: Requirements 9.3**

### Property 29: Filing Status Validation
*For any* filing status input, the value should be rejected if it is not one of: Single, Married, Married Separate, Head of Household.
**Validates: Requirements 9.4**

### Property 30: Complete Employee Data
*For any* payroll processing attempt, if required employee data (rate/salary, filing status, SSN) is missing, the processing should be rejected.
**Validates: Requirements 9.5**

### Property 31: Audit Logging
*For any* payroll processing action, an audit log entry should be created with timestamp, user, and action details.
**Validates: Requirements 11.1, 11.2**

---

## Error Handling

### Input Validation Errors

**Error Type**: `INVALID_HOURS`
- **Trigger**: Hours < 0 or > 168
- **Response**: Return error message "Hours must be between 0 and 168"
- **HTTP Status**: 400 Bad Request

**Error Type**: `INVALID_RATE`
- **Trigger**: Hourly rate < $7.25
- **Response**: Return error message "Hourly rate must be at least $7.25 (federal minimum wage)"
- **HTTP Status**: 400 Bad Request

**Error Type**: `INVALID_SSN`
- **Trigger**: SSN does not match XXX-XX-XXXX format
- **Response**: Return error message "SSN must be in format XXX-XX-XXXX"
- **HTTP Status**: 400 Bad Request

**Error Type**: `INVALID_FILING_STATUS`
- **Trigger**: Filing status not in allowed list
- **Response**: Return error message "Filing status must be: Single, Married, Married Separate, or Head of Household"
- **HTTP Status**: 400 Bad Request

**Error Type**: `INCOMPLETE_EMPLOYEE_DATA`
- **Trigger**: Missing required employee fields
- **Response**: Return error message "Employee data incomplete: missing [field names]"
- **HTTP Status**: 400 Bad Request

### Business Logic Errors

**Error Type**: `PERIOD_CLOSED`
- **Trigger**: Attempting to process payroll for a closed accounting period
- **Response**: Return error message "Cannot process payroll: accounting period is closed"
- **HTTP Status**: 403 Forbidden

**Error Type**: `EMPLOYEE_NOT_FOUND`
- **Trigger**: Employee ID does not exist
- **Response**: Return error message "Employee not found"
- **HTTP Status**: 404 Not Found

**Error Type**: `DUPLICATE_PAYROLL`
- **Trigger**: Payroll already exists for employee and pay period
- **Response**: Return error message "Payroll already processed for this employee and period"
- **HTTP Status**: 409 Conflict

**Error Type**: `JOURNAL_ENTRY_FAILED`
- **Trigger**: Journal entry creation fails
- **Response**: Rollback payroll transaction, return error message "Failed to create journal entry"
- **HTTP Status**: 500 Internal Server Error

### Tax Calculation Errors

**Error Type**: `TAX_CALCULATION_ERROR`
- **Trigger**: Unexpected error during tax calculation
- **Response**: Log detailed error, return generic message "Tax calculation failed"
- **HTTP Status**: 500 Internal Server Error

**Error Type**: `INVALID_TAX_BRACKETS`
- **Trigger**: Tax bracket data is missing or corrupted
- **Response**: Return error message "Tax bracket data unavailable"
- **HTTP Status**: 500 Internal Server Error

### Error Recovery Strategy

1. **Validation Errors**: Return immediately with clear error message, no database changes
2. **Business Logic Errors**: Check before processing, return error if violated
3. **Transaction Errors**: Use database transactions, rollback on failure
4. **Audit All Errors**: Log all errors with timestamp, user, input data (excluding sensitive info)

---

## Testing Strategy

### Dual Testing Approach

The payroll engine requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and IRS test cases
- **Property Tests**: Verify universal properties across all inputs (minimum 100 iterations each)

### Unit Testing

**Focus Areas**:
1. **IRS Test Cases**: Use official IRS examples from Publication 15
2. **Edge Cases**: Minimum wage, maximum SS wage base, threshold boundaries
3. **Specific Scenarios**: Different filing statuses, pay periods, overtime combinations
4. **Error Conditions**: Invalid inputs, closed periods, missing data

**Example Unit Tests**:
```typescript
describe('PayrollTaxCalculator', () => {
  it('should calculate correct federal tax for IRS example 1', () => {
    // IRS Publication 15, Example 1: Single, $500/week
    const result = calculator.calculateFederalTax({
      grossPay: 500,
      ytdGrossPay: 0,
      filingStatus: 'single',
      allowances: 0,
      additionalWithholding: 0,
      payPeriod: 'weekly'
    });
    expect(result.federalIncomeTax).toBe(31.00); // IRS expected value
  });

  it('should stop SS withholding at wage base limit', () => {
    const result = calculator.calculateFICA({
      grossPay: 10000,
      ytdGrossPay: 168600, // Already at limit
      filingStatus: 'single',
      allowances: 0,
      additionalWithholding: 0,
      payPeriod: 'semimonthly'
    });
    expect(result.socialSecurity).toBe(0);
  });
});
```

### Property-Based Testing

**Configuration**:
- Minimum 100 iterations per property test
- Use `fast-check` library for TypeScript
- Tag each test with feature name and property number

**Property Test Examples**:
```typescript
import fc from 'fast-check';

describe('Payroll Engine - Property Tests', () => {
  /**
   * Feature: payroll-engine, Property 5: Tax Rounding
   * For any tax calculation, result should be rounded down to nearest cent
   */
  it('should always round tax amounts down', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000 }), // gross pay
        (grossPay) => {
          const result = calculator.calculateAllTaxes({
            grossPay,
            ytdGrossPay: 0,
            filingStatus: 'single',
            allowances: 0,
            additionalWithholding: 0,
            payPeriod: 'semimonthly'
          });
          
          // All tax amounts should have max 2 decimal places
          expect(result.socialSecurity).toBe(Math.floor(result.socialSecurity * 100) / 100);
          expect(result.medicare).toBe(Math.floor(result.medicare * 100) / 100);
          expect(result.federalIncomeTax).toBe(Math.floor(result.federalIncomeTax * 100) / 100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: payroll-engine, Property 19: Balanced Journal Entry
   * For any payroll, journal entry debits should equal credits
   */
  it('should generate balanced journal entries', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000 }), // gross pay
        fc.float({ min: 0, max: 1000 }), // other deductions
        (grossPay, otherDeductions) => {
          const payrollResult = processor.processPayroll({
            employeeId: 1,
            payPeriodStart: '2026-01-01',
            payPeriodEnd: '2026-01-15',
            regularHours: 80,
            overtimeHours: 0,
            bonuses: 0,
            commissions: 0,
            otherDeductions
          });
          
          const journalEntry = getJournalEntry(payrollResult.journalEntryId);
          const totalDebits = journalEntry.items
            .filter(item => item.type === 'debit')
            .reduce((sum, item) => sum + item.amount, 0);
          const totalCredits = journalEntry.items
            .filter(item => item.type === 'credit')
            .reduce((sum, item) => sum + item.amount, 0);
          
          expect(totalDebits).toBeCloseTo(totalCredits, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Data Generators

**For Property Tests**:
```typescript
// Generator for valid employee data
const employeeGen = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  hourlyRate: fc.float({ min: 7.25, max: 200 }),
  filingStatus: fc.constantFrom('single', 'married', 'married_separate', 'head_of_household'),
  allowances: fc.integer({ min: 0, max: 10 }),
  ytdGrossPay: fc.float({ min: 0, max: 500000 })
});

// Generator for valid payroll input
const payrollInputGen = fc.record({
  regularHours: fc.float({ min: 0, max: 168 }),
  overtimeHours: fc.float({ min: 0, max: 40 }),
  bonuses: fc.float({ min: 0, max: 50000 }),
  commissions: fc.float({ min: 0, max: 50000 })
});
```

### Integration Testing

**Test Scenarios**:
1. **End-to-End Payroll Processing**: Input → Calculation → Journal Entry → Database
2. **Form 941 Generation**: Process multiple payrolls → Generate quarterly report
3. **W-2 Generation**: Process annual payrolls → Generate W-2 for each employee
4. **Period Closure Integration**: Process payroll → Close period → Verify cannot modify

### Validation Against IRS Calculators

**Critical Requirement**: All tax calculations MUST be validated against official IRS calculators:

1. **IRS Tax Withholding Estimator**: https://www.irs.gov/individuals/tax-withholding-estimator
2. **PaycheckCity Calculator**: https://www.paycheckcity.com/calculator/salary
3. **ADP Paycheck Calculator**: https://www.adp.com/resources/tools/calculators/salary-paycheck-calculator.aspx

**Validation Process**:
- Create test cases with known inputs
- Calculate using our system
- Calculate using IRS/commercial calculators
- Compare results (must match to the cent)
- Document any discrepancies

### Test Coverage Goals

- **Unit Test Coverage**: > 90% of code
- **Property Test Coverage**: All 31 correctness properties
- **Integration Test Coverage**: All major workflows
- **IRS Test Cases**: 100% of Publication 15 examples

---

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process multiple employees in a single transaction
2. **Caching**: Cache tax bracket lookups and standard deductions
3. **Indexing**: Database indexes on employee_id, pay_period dates, status
4. **Lazy Loading**: Load employee data only when needed

### Performance Targets

- Single payroll processing: < 1 second
- 100 employees batch: < 30 seconds
- Form 941 generation: < 5 seconds
- W-2 generation (single): < 2 seconds
- Database queries: < 100ms

### Monitoring

- Log processing time for each payroll
- Alert if processing exceeds thresholds
- Track database query performance
- Monitor memory usage during batch processing

---

## Security Considerations

### Data Protection

1. **Sensitive Data**: SSN, bank account numbers, salary information
2. **Encryption**: Encrypt sensitive fields at rest
3. **Access Control**: Restrict payroll access to authorized users only
4. **Audit Trail**: Log all access to payroll data

### Compliance

- **FLSA**: Fair Labor Standards Act compliance
- **IRS**: Publication 15 compliance
- **SOX**: Sarbanes-Oxley audit trail requirements
- **GDPR**: Data privacy (if applicable)

---

## Maintenance and Updates

### Annual Tax Table Updates

**Process**:
1. IRS publishes new tax tables (typically November/December)
2. Update `TaxBrackets2026.ts` → `TaxBrackets2027.ts`
3. Update standard deductions, wage base limits
4. Run full test suite against new tables
5. Validate against IRS calculators
6. Deploy before January 1st

**Files to Update**:
- `src/services/payroll/TaxBrackets[YEAR].ts`
- Update imports in `PayrollTaxCalculator.ts`
- Update test cases with new values

### Regulatory Changes

Monitor IRS publications for mid-year changes:
- IRS Publication 15 (Circular E)
- IRS Publication 15-A
- IRS Notices and Announcements

---

## Dependencies

### External Dependencies

- **jsPDF**: PDF generation for Form 941, W-2
- **jspdf-autotable**: Table formatting in PDFs
- **fast-check**: Property-based testing library
- **date-fns**: Date manipulation

### Internal Dependencies

- **simple-db.ts**: Database layer
- **AccountingPeriodService.ts**: Period closure integration
- **JournalService.ts**: Journal entry creation
- **EmployeeService.ts**: Employee data management

---

## Future Enhancements

### Phase 2 (Post-Launch)

1. **State Income Tax**: Support for states with income tax
2. **401(k) Contributions**: Pre-tax retirement contributions
3. **Health Insurance**: Pre-tax health insurance deductions
4. **Garnishments**: Court-ordered wage garnishments
5. **Direct Deposit**: Automated bank transfers
6. **Time Tracking Integration**: Import hours from time tracking system
7. **Multi-State Payroll**: Support for employees in different states

### Phase 3 (Advanced Features)

1. **Payroll Forecasting**: Predict future payroll costs
2. **Labor Cost Analysis**: Analyze labor costs by department, project
3. **Compliance Dashboard**: Monitor compliance with labor laws
4. **Mobile App**: Employee self-service for pay stubs
5. **API Integration**: Connect with external payroll services

---

**Document Status**: Complete  
**Next Step**: Review design document, then create tasks.md  
**Estimated Implementation Time**: 5-7 days (40-56 hours)

