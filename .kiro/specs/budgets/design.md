# Design Document - Budget Management Module

**Feature Name:** budgets  
**Date:** 2026-02-01  
**Status:** Approved  
**Version:** 1.0

---

## Overview

El módulo de Presupuestos (Budgets) permite a las empresas crear, gestionar y analizar presupuestos financieros con comparación automática contra valores reales. El sistema calcula varianzas, genera alertas de desviación, y proporciona reportes detallados para la toma de decisiones.

**Características Principales:**
- Creación de presupuestos anuales con desglose mensual/trimestral
- Vinculación directa con el Plan de Cuentas (Chart of Accounts)
- Cálculo automático de varianzas (Real vs Presupuestado)
- Sistema de alertas por umbrales de desviación
- Reportes de ejecución presupuestaria y análisis de varianza
- Workflow de aprobación (Draft → Approved → Active → Closed)

---

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────┐
│                  Budget Management Module                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Budget     │      │   Budget     │                │
│  │   Service    │◄────►│   UI Layer   │                │
│  └──────┬───────┘      └──────────────┘                │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Database   │◄────►│  Chart of    │                │
│  │   (SQLite)   │      │  Accounts    │                │
│  └──────────────┘      └──────────────┘                │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐                                       │
│  │   Journal    │                                       │
│  │   Entries    │  (for actual amounts)                │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```
BudgetManager (Main Container)
├── BudgetList (List View)
│   ├── BudgetCard (Item Display)
│   └── BudgetFilters (Filtering)
├── BudgetForm (Create/Edit)
│   ├── BudgetLineEditor (Line Items)
│   └── PeriodDistributor (Monthly Breakdown)
├── BudgetDetailView (Detail View)
│   ├── BudgetSummary (Header Info)
│   ├── BudgetLinesTable (Line Items)
│   └── VarianceIndicators (Visual Alerts)
└── BudgetReports (Reporting)
    ├── BudgetVarianceReport (Variance Analysis)
    ├── BudgetPerformanceChart (Charts)
    └── BudgetExecutionReport (Execution Summary)
```

---

## Database Schema

### Table: budgets

Tabla maestra que almacena la información principal de cada presupuesto.

```sql
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_name TEXT NOT NULL,
  description TEXT,
  fiscal_year INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'pending_approval', 'approved', 'active', 'closed', 'cancelled')),
  department TEXT,
  total_budgeted_amount REAL NOT NULL DEFAULT 0,
  alert_threshold_percentage REAL DEFAULT 10.0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER,
  approved_at DATETIME,
  activated_at DATETIME,
  closed_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_department ON budgets(department);
```

### Table: budget_lines

Líneas individuales del presupuesto, una por cada cuenta contable.

```sql
CREATE TABLE IF NOT EXISTS budget_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_id INTEGER NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  budgeted_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
  FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code),
  UNIQUE(budget_id, account_code)
);

CREATE INDEX idx_budget_lines_budget_id ON budget_lines(budget_id);
CREATE INDEX idx_budget_lines_account_code ON budget_lines(account_code);
```

### Table: budget_periods

Desglose mensual/trimestral de cada línea presupuestaria.

```sql
CREATE TABLE IF NOT EXISTS budget_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_line_id INTEGER NOT NULL,
  period_start_date TEXT NOT NULL,
  period_end_date TEXT NOT NULL,
  period_name TEXT NOT NULL,
  budgeted_amount REAL NOT NULL DEFAULT 0,
  actual_amount REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  variance_percentage REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE CASCADE,
  UNIQUE(budget_line_id, period_start_date)
);

CREATE INDEX idx_budget_periods_line_id ON budget_periods(budget_line_id);
CREATE INDEX idx_budget_periods_dates ON budget_periods(period_start_date, period_end_date);
```

---

## Data Models

### TypeScript Interfaces

```typescript
// Core Budget Interface
export interface Budget {
  id?: number;
  budget_name: string;
  description?: string;
  fiscal_year: number;
  start_date: string; // ISO date format
  end_date: string;
  period_type: 'monthly' | 'quarterly' | 'annual';
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'closed' | 'cancelled';
  department?: string;
  total_budgeted_amount: number;
  alert_threshold_percentage: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  approved_by?: number;
  approved_at?: string;
  activated_at?: string;
  closed_at?: string;
}

// Budget Line Interface
export interface BudgetLine {
  id?: number;
  budget_id: number;
  account_code: string;
  account_name: string;
  budgeted_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Budget Period Interface
export interface BudgetPeriod {
  id?: number;
  budget_line_id: number;
  period_start_date: string;
  period_end_date: string;
  period_name: string; // e.g., "January 2026", "Q1 2026"
  budgeted_amount: number;
  actual_amount: number;
  variance: number; // actual - budgeted
  variance_percentage: number; // (variance / budgeted) * 100
  created_at?: string;
  updated_at?: string;
}

// Variance Analysis Interface
export interface BudgetVarianceAnalysis {
  budget_id: number;
  budget_name: string;
  account_code: string;
  account_name: string;
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
  status: 'under_budget' | 'on_budget' | 'over_budget';
  alert_triggered: boolean;
}

// Budget Summary Interface
export interface BudgetSummary {
  budget: Budget;
  total_lines: number;
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
  lines_over_budget: number;
  lines_under_budget: number;
  alerts_count: number;
}
```

---

## Correctness Properties

### Property 1: Balance Invariant

**For any** budget, the sum of all budget line amounts SHALL equal the total_budgeted_amount in the budget header.

```typescript
function verifyBalanceInvariant(budgetId: number): boolean {
  const budget = getBudgetById(budgetId);
  const lines = getBudgetLines(budgetId);
  const sumOfLines = lines.reduce((sum, line) => sum + line.budgeted_amount, 0);
  return Math.abs(sumOfLines - budget.total_budgeted_amount) < 0.01; // Allow 1 cent rounding
}
```

**Validates: Requirements 1.4, 9.5**

### Property 2: Period Distribution Invariant

**For any** budget line, the sum of all period amounts SHALL equal the total budgeted amount for that line.

```typescript
function verifyPeriodDistributionInvariant(budgetLineId: number): boolean {
  const line = getBudgetLineById(budgetLineId);
  const periods = getBudgetPeriods(budgetLineId);
  const sumOfPeriods = periods.reduce((sum, period) => sum + period.budgeted_amount, 0);
  return Math.abs(sumOfPeriods - line.budgeted_amount) < 0.01;
}
```

**Validates: Requirements 1.2, 1.3**

### Property 3: State Transition Validity

**For any** budget status change, the transition SHALL follow the valid state machine: draft → pending_approval → approved → active → closed.

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  'draft': ['pending_approval', 'cancelled'],
  'pending_approval': ['approved', 'draft'],
  'approved': ['active', 'cancelled'],
  'active': ['closed'],
  'closed': [],
  'cancelled': []
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
```

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Referential Integrity

**For any** budget line, the account_code SHALL exist in the chart_of_accounts table and SHALL be of type 'expense' or 'revenue'.

```typescript
function verifyReferentialIntegrity(accountCode: string): boolean {
  const account = getAccountByCode(accountCode);
  if (!account) return false;
  return account.account_type === 'expense' || account.account_type === 'revenue';
}
```

**Validates: Requirements 9.1, 9.2, 9.4**

### Property 5: Temporal Consistency

**For any** budget, the start_date SHALL be before end_date, and all budget periods SHALL fall within the budget date range.

```typescript
function verifyTemporalConsistency(budgetId: number): boolean {
  const budget = getBudgetById(budgetId);
  const startDate = new Date(budget.start_date);
  const endDate = new Date(budget.end_date);
  
  if (startDate >= endDate) return false;
  
  const lines = getBudgetLines(budgetId);
  for (const line of lines) {
    const periods = getBudgetPeriods(line.id!);
    for (const period of periods) {
      const periodStart = new Date(period.period_start_date);
      const periodEnd = new Date(period.period_end_date);
      if (periodStart < startDate || periodEnd > endDate) return false;
    }
  }
  
  return true;
}
```

**Validates: Requirements 1.1, 1.2**

---

## Business Logic Functions

### Budget Creation

```typescript
export function createBudget(
  budgetData: Partial<Budget>,
  lines: Partial<BudgetLine>[],
  userId: number
): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validations
    if (!budgetData.budget_name) return { success: false, message: 'Budget name is required' };
    if (!budgetData.fiscal_year) return { success: false, message: 'Fiscal year is required' };
    if (!budgetData.start_date || !budgetData.end_date) {
      return { success: false, message: 'Start and end dates are required' };
    }

    // Verify dates
    const startDate = new Date(budgetData.start_date);
    const endDate = new Date(budgetData.end_date);
    if (startDate >= endDate) {
      return { success: false, message: 'Start date must be before end date' };
    }

    // Calculate total budgeted amount
    const totalBudgeted = lines.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0);

    db.run('BEGIN TRANSACTION');

    // Insert budget
    const stmt = db.prepare(`
      INSERT INTO budgets (
        budget_name, description, fiscal_year, start_date, end_date,
        period_type, status, department, total_budgeted_amount,
        alert_threshold_percentage, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      budgetData.budget_name,
      budgetData.description || null,
      budgetData.fiscal_year,
      budgetData.start_date,
      budgetData.end_date,
      budgetData.period_type || 'monthly',
      'draft',
      budgetData.department || null,
      totalBudgeted,
      budgetData.alert_threshold_percentage || 10.0,
      userId
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const budgetId = result[0]?.values[0]?.[0] as number;

    // Insert budget lines
    for (const line of lines) {
      if (!line.account_code) continue;

      // Verify account exists
      const account = getAccountByCode(line.account_code);
      if (!account) {
        db.run('ROLLBACK');
        return { success: false, message: `Account ${line.account_code} not found` };
      }

      const lineStmt = db.prepare(`
        INSERT INTO budget_lines (budget_id, account_code, account_name, budgeted_amount, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      lineStmt.run([
        budgetId,
        line.account_code,
        account.account_name,
        line.budgeted_amount || 0,
        line.notes || null
      ]);
      lineStmt.free();

      const lineResult = db.exec('SELECT last_insert_rowid() as id');
      const lineId = lineResult[0]?.values[0]?.[0] as number;

      // Generate periods
      generateBudgetPeriods(lineId, budgetData.start_date!, budgetData.end_date!, 
                           budgetData.period_type || 'monthly', line.budgeted_amount || 0);
    }

    db.run('COMMIT');
    return { success: true, message: 'Budget created successfully', id: budgetId };

  } catch (error: any) {
    db?.run('ROLLBACK');
    return { success: false, message: error.message };
  }
}
```

### Variance Calculation

```typescript
export function calculateBudgetVariance(budgetId: number): BudgetVarianceAnalysis[] {
  if (!db) return [];

  try {
    const query = `
      SELECT 
        b.id as budget_id,
        b.budget_name,
        bl.account_code,
        bl.account_name,
        bl.budgeted_amount as total_budgeted,
        COALESCE(SUM(jd.debit_amount - jd.credit_amount), 0) as total_actual
      FROM budgets b
      JOIN budget_lines bl ON b.id = bl.budget_id
      LEFT JOIN journal_details jd ON bl.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE b.id = ?
        AND je.entry_date BETWEEN b.start_date AND b.end_date
        AND je.status = 'posted'
      GROUP BY b.id, bl.id
    `;

    const result = db.exec(query, [budgetId]);
    if (!result[0]) return [];

    const budget = getBudgetById(budgetId);
    const threshold = budget.alert_threshold_percentage;

    return result[0].values.map((row: any) => {
      const totalBudgeted = row[4] as number;
      const totalActual = row[5] as number;
      const variance = totalActual - totalBudgeted;
      const variancePercentage = totalBudgeted !== 0 ? (variance / totalBudgeted) * 100 : 0;

      let status: 'under_budget' | 'on_budget' | 'over_budget';
      if (Math.abs(variancePercentage) <= 5) status = 'on_budget';
      else if (variance < 0) status = 'under_budget';
      else status = 'over_budget';

      return {
        budget_id: row[0],
        budget_name: row[1],
        account_code: row[2],
        account_name: row[3],
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        total_variance: variance,
        variance_percentage: variancePercentage,
        status,
        alert_triggered: Math.abs(variancePercentage) > threshold
      };
    });

  } catch (error) {
    console.error('Error calculating variance:', error);
    return [];
  }
}
```

### Period Generation

```typescript
function generateBudgetPeriods(
  lineId: number,
  startDate: string,
  endDate: string,
  periodType: 'monthly' | 'quarterly' | 'annual',
  totalAmount: number
): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const periods: Array<{ start: Date; end: Date; name: string }> = [];

  if (periodType === 'monthly') {
    let current = new Date(start);
    while (current <= end) {
      const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const actualEnd = periodEnd > end ? end : periodEnd;
      periods.push({
        start: new Date(current),
        end: actualEnd,
        name: current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  } else if (periodType === 'quarterly') {
    let current = new Date(start);
    let quarter = 1;
    while (current <= end) {
      const periodEnd = new Date(current.getFullYear(), current.getMonth() + 3, 0);
      const actualEnd = periodEnd > end ? end : periodEnd;
      periods.push({
        start: new Date(current),
        end: actualEnd,
        name: `Q${quarter} ${current.getFullYear()}`
      });
      current = new Date(current.getFullYear(), current.getMonth() + 3, 1);
      quarter++;
    }
  } else {
    periods.push({
      start,
      end,
      name: `FY ${start.getFullYear()}`
    });
  }

  // Distribute amount evenly across periods
  const amountPerPeriod = totalAmount / periods.length;

  const stmt = db.prepare(`
    INSERT INTO budget_periods (
      budget_line_id, period_start_date, period_end_date,
      period_name, budgeted_amount, actual_amount, variance, variance_percentage
    ) VALUES (?, ?, ?, ?, ?, 0, 0, 0)
  `);

  for (const period of periods) {
    stmt.run([
      lineId,
      period.start.toISOString().split('T')[0],
      period.end.toISOString().split('T')[0],
      period.name,
      amountPerPeriod
    ]);
  }

  stmt.free();
}
```

---

## Component Specifications

### 1. BudgetManager (Main Container)

**Purpose:** Main container component that manages routing and state for the budget module.

**Props:**
```typescript
interface BudgetManagerProps {
  userId: number;
  userRole: string;
}
```

**State:**
- `selectedBudget: Budget | null`
- `view: 'list' | 'detail' | 'create' | 'edit' | 'reports'`

### 2. BudgetList

**Purpose:** Displays a list of budgets with filtering and search capabilities.

**Props:**
```typescript
interface BudgetListProps {
  onSelectBudget: (budget: Budget) => void;
  onCreateNew: () => void;
}
```

**Features:**
- Filter by status, fiscal year, department
- Search by name
- Sort by date, name, amount
- Status badges with color coding

### 3. BudgetForm

**Purpose:** Form for creating and editing budgets.

**Props:**
```typescript
interface BudgetFormProps {
  budget?: Budget;
  mode: 'create' | 'edit';
  onSave: (budget: Budget, lines: BudgetLine[]) => void;
  onCancel: () => void;
}
```

**Features:**
- Budget header information
- Budget line editor with account selection
- Period distribution (equal or custom)
- Validation and error handling

### 4. BudgetDetailView

**Purpose:** Displays detailed information about a budget with variance analysis.

**Props:**
```typescript
interface BudgetDetailViewProps {
  budgetId: number;
  onEdit: () => void;
  onClose: () => void;
}
```

**Features:**
- Budget summary with key metrics
- Line items table with actual vs budgeted
- Variance indicators (color-coded)
- Action buttons (Edit, Approve, Activate, Close)

### 5. BudgetVarianceReport

**Purpose:** Generates variance analysis reports.

**Props:**
```typescript
interface BudgetVarianceReportProps {
  budgetId: number;
  onExport: (format: 'csv' | 'pdf') => void;
}
```

**Features:**
- Variance by account
- Variance by period
- Alert highlighting
- Export functionality

### 6. BudgetPerformanceChart

**Purpose:** Visual representation of budget performance.

**Props:**
```typescript
interface BudgetPerformanceChartProps {
  budgetId: number;
  chartType: 'bar' | 'line' | 'pie';
}
```

**Features:**
- Budgeted vs Actual comparison
- Trend analysis
- Interactive tooltips

---

## Error Handling

### Validation Errors

```typescript
export class BudgetValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'BudgetValidationError';
  }
}
```

### Common Error Scenarios

1. **Invalid Date Range:** Start date >= End date
2. **Account Not Found:** Referenced account doesn't exist
3. **Invalid Status Transition:** Attempting invalid state change
4. **Balance Mismatch:** Sum of lines ≠ total budgeted
5. **Overlapping Budgets:** Active budget already exists for period
6. **Permission Denied:** User lacks required role

---

## Testing Strategy

### Unit Tests

```typescript
describe('Budget Creation', () => {
  test('should create budget with valid data', () => {
    const result = createBudget(validBudgetData, validLines, userId);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  test('should reject budget with invalid date range', () => {
    const result = createBudget(invalidDateBudget, validLines, userId);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Start date must be before end date');
  });

  test('should verify balance invariant', () => {
    const budgetId = createBudget(validBudgetData, validLines, userId).id!;
    expect(verifyBalanceInvariant(budgetId)).toBe(true);
  });
});
```

### Property-Based Tests

```typescript
describe('Correctness Properties', () => {
  test('Property 1: Balance Invariant holds for all budgets', () => {
    fc.assert(
      fc.property(budgetGenerator(), (budget) => {
        const id = createBudget(budget.data, budget.lines, 1).id!;
        return verifyBalanceInvariant(id);
      })
    );
  });

  test('Property 2: Period Distribution Invariant', () => {
    fc.assert(
      fc.property(budgetLineGenerator(), (line) => {
        const lineId = createBudgetLine(line).id!;
        return verifyPeriodDistributionInvariant(lineId);
      })
    );
  });
});
```

### Integration Tests

```typescript
describe('Budget Workflow', () => {
  test('should complete full budget lifecycle', async () => {
    // Create
    const budget = await createBudget(data, lines, userId);
    expect(budget.success).toBe(true);

    // Approve
    const approved = await approveBudget(budget.id!, approverId);
    expect(approved.success).toBe(true);

    // Activate
    const activated = await activateBudget(budget.id!);
    expect(activated.success).toBe(true);

    // Calculate Variance
    const variance = calculateBudgetVariance(budget.id!);
    expect(variance.length).toBeGreaterThan(0);

    // Close
    const closed = await closeBudget(budget.id!);
    expect(closed.success).toBe(true);
  });
});
```

---

## Performance Considerations

### Query Optimization

1. **Indexes:** Created on frequently queried columns (fiscal_year, status, department, account_code)
2. **Batch Operations:** Use transactions for multi-line inserts
3. **Caching:** Cache chart of accounts lookups
4. **Lazy Loading:** Load periods only when detail view is opened

### Expected Performance

- Budget creation: < 2 seconds (up to 100 lines)
- Variance calculation: < 1 second (up to 1000 transactions)
- Report generation: < 3 seconds (annual budget)

---

## Security Considerations

### Role-Based Access Control

```typescript
const BUDGET_PERMISSIONS = {
  'admin': ['create', 'edit', 'delete', 'approve', 'activate', 'close', 'view'],
  'financial_manager': ['create', 'edit', 'view', 'submit_for_approval'],
  'financial_controller': ['approve', 'view'],
  'accountant': ['view'],
  'user': []
};

function hasPermission(userRole: string, action: string): boolean {
  return BUDGET_PERMISSIONS[userRole]?.includes(action) ?? false;
}
```

### Audit Trail

All budget operations SHALL be logged in the audit_log table:
- Budget creation, modification, deletion
- Status changes (approval, activation, closure)
- Line item changes
- User and timestamp for all operations

---

## Migration Strategy

### Database Migration

```sql
-- Migration: Add budget tables
-- Version: 1.0
-- Date: 2026-02-01

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (...);

-- Create budget_lines table
CREATE TABLE IF NOT EXISTS budget_lines (...);

-- Create budget_periods table
CREATE TABLE IF NOT EXISTS budget_periods (...);

-- Create indexes
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budget_lines_budget_id ON budget_lines(budget_id);
CREATE INDEX idx_budget_periods_line_id ON budget_periods(budget_line_id);
```

---

## Future Enhancements

1. **Budget Templates:** Save and reuse budget structures
2. **Multi-Currency Support:** Handle budgets in different currencies
3. **Budget Consolidation:** Roll up department budgets to company level
4. **What-If Analysis:** Scenario planning with multiple budget versions
5. **AI-Powered Forecasting:** Machine learning for budget predictions
6. **Mobile App:** Native mobile interface for budget approval
7. **Excel Import/Export:** Bulk import from Excel templates

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-01  
**Next Phase:** Implementation (tasks.md)

