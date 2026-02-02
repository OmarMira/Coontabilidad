# Requirements Document - Budget Management Module

**Feature Name:** budgets  
**Date:** 2026-02-01  
**Status:** Draft  
**Priority:** High (Blocker for 100% completeness)

---

## Introduction

El módulo de Presupuestos (Budgets) permite a las empresas planificar, controlar y analizar sus gastos e ingresos futuros. Este sistema compara los valores presupuestados contra los valores reales, genera alertas de desviación, y proporciona análisis de varianza para mejorar la toma de decisiones financieras.

---

## Glossary

- **Budget**: Plan financiero que establece los ingresos y gastos esperados para un período específico
- **Budget_Period**: Período de tiempo para el cual se crea un presupuesto (mensual, trimestral, anual)
- **Budget_Line**: Línea individual dentro de un presupuesto que especifica una cuenta contable y su monto presupuestado
- **Actual_Amount**: Monto real gastado o ingresado según los registros contables
- **Budgeted_Amount**: Monto planificado o esperado según el presupuesto
- **Variance**: Diferencia entre el monto presupuestado y el monto real (Actual - Budgeted)
- **Variance_Percentage**: Porcentaje de desviación calculado como (Variance / Budgeted_Amount) × 100
- **Budget_Template**: Plantilla reutilizable de presupuesto basada en períodos anteriores
- **Department**: Departamento o centro de costos al que se asigna un presupuesto
- **Account_Code**: Código de cuenta del plan de cuentas (Chart of Accounts)
- **Budget_Status**: Estado del presupuesto (draft, active, closed, cancelled)
- **Alert_Threshold**: Umbral de desviación que dispara una alerta (ej: 10%, 20%)

---

## Requirements

### Requirement 1: Budget Creation

**User Story:** As a financial manager, I want to create annual and monthly budgets by account categories, so that I can plan and control company expenses and revenues.

#### Acceptance Criteria

1. WHEN a user creates a new budget, THE System SHALL require a budget name, period type (monthly/quarterly/annual), start date, and end date
2. WHEN a user selects a period type, THE System SHALL automatically calculate the number of periods based on start and end dates
3. WHEN a user adds a budget line, THE System SHALL validate that the account code exists in the Chart of Accounts
4. WHEN a user assigns a budgeted amount to an account, THE System SHALL accept positive decimal values with 2 decimal places
5. THE System SHALL allow assigning budgets to specific departments or cost centers
6. WHEN a user saves a budget, THE System SHALL set the initial status to 'draft'
7. THE System SHALL prevent creating overlapping budgets for the same account and department in the same period

### Requirement 2: Budget Templates

**User Story:** As a financial manager, I want to create budget templates from previous periods, so that I can quickly generate new budgets without starting from scratch.

#### Acceptance Criteria

1. WHEN a user selects an existing budget, THE System SHALL provide an option to save it as a template
2. WHEN a user creates a budget from a template, THE System SHALL copy all budget lines with their account codes and amounts
3. WHEN applying a template, THE System SHALL allow the user to adjust amounts by a percentage (e.g., +5% for inflation)
4. THE System SHALL allow users to name and describe templates for easy identification
5. WHEN a user deletes a template, THE System SHALL not affect budgets created from that template

### Requirement 3: Budget Activation and Status Management

**User Story:** As a financial manager, I want to activate budgets and manage their lifecycle, so that I can control which budgets are currently in use.

#### Acceptance Criteria

1. WHEN a user activates a budget, THE System SHALL change its status from 'draft' to 'active'
2. THE System SHALL allow only one active budget per account and department for overlapping periods
3. WHEN a budget period ends, THE System SHALL allow the user to close the budget
4. WHEN a budget is closed, THE System SHALL set its status to 'closed' and prevent further modifications
5. THE System SHALL allow cancelling a draft budget, setting its status to 'cancelled'
6. WHEN a budget is active or closed, THE System SHALL prevent deletion

### Requirement 4: Actual vs Budgeted Comparison

**User Story:** As a financial manager, I want to compare actual expenses and revenues against budgeted amounts, so that I can monitor financial performance.

#### Acceptance Criteria

1. WHEN viewing a budget, THE System SHALL display actual amounts from journal entries for each budget line
2. THE System SHALL calculate variance as (Actual Amount - Budgeted Amount) for each line
3. THE System SHALL calculate variance percentage as (Variance / Budgeted Amount) × 100
4. WHEN actual amount exceeds budgeted amount, THE System SHALL display the variance in red
5. WHEN actual amount is below budgeted amount, THE System SHALL display the variance in green
6. THE System SHALL aggregate variances by account type (revenue, expense) and department
7. THE System SHALL update actual amounts in real-time when new journal entries are posted

### Requirement 5: Variance Alerts

**User Story:** As a financial manager, I want to receive alerts when budget variances exceed defined thresholds, so that I can take corrective action promptly.

#### Acceptance Criteria

1. WHEN a user creates a budget, THE System SHALL allow setting alert thresholds (e.g., 10%, 20%)
2. WHEN variance percentage exceeds the threshold, THE System SHALL generate an alert
3. THE System SHALL display alerts on the budget dashboard with account name, variance amount, and percentage
4. WHEN a user views an alert, THE System SHALL provide details including historical trend and suggested actions
5. THE System SHALL allow users to acknowledge alerts to remove them from the active list
6. THE System SHALL send email notifications for critical alerts (variance > 20%)

### Requirement 6: Budget Reports

**User Story:** As a financial manager, I want to generate budget execution and variance analysis reports, so that I can present financial performance to stakeholders.

#### Acceptance Criteria

1. THE System SHALL provide a Budget Execution Report showing budgeted vs actual amounts for all accounts
2. THE System SHALL provide a Variance Analysis Report highlighting accounts with significant deviations
3. THE System SHALL provide a Budget Performance by Department Report comparing all departments
4. WHEN generating a report, THE System SHALL allow filtering by date range, department, and account type
5. THE System SHALL allow exporting reports to CSV format
6. THE System SHALL display reports with summary totals and subtotals by category
7. WHEN viewing a report, THE System SHALL provide drill-down capability to see transaction details

### Requirement 7: Budget Forecasting

**User Story:** As a financial manager, I want to see projections based on current trends, so that I can anticipate future budget performance.

#### Acceptance Criteria

1. WHEN viewing a budget, THE System SHALL calculate projected year-end amounts based on current spending rate
2. THE System SHALL display a forecast indicator showing if the budget will be over or under by year-end
3. THE System SHALL calculate the average monthly burn rate for each account
4. WHEN the forecast indicates budget overrun, THE System SHALL highlight affected accounts
5. THE System SHALL allow users to adjust forecast assumptions (e.g., expected growth rate)

### Requirement 8: Budget Approval Workflow

**User Story:** As a financial controller, I want to implement an approval workflow for budgets, so that budgets are reviewed before activation.

#### Acceptance Criteria

1. WHEN a user submits a budget for approval, THE System SHALL change its status to 'pending_approval'
2. THE System SHALL notify designated approvers when a budget is submitted
3. WHEN an approver reviews a budget, THE System SHALL allow approving or rejecting with comments
4. WHEN a budget is approved, THE System SHALL change its status to 'approved' and allow activation
5. WHEN a budget is rejected, THE System SHALL return it to 'draft' status with rejection comments
6. THE System SHALL maintain an audit trail of all approval actions

### Requirement 9: Integration with Chart of Accounts

**User Story:** As a financial manager, I want budgets to integrate seamlessly with the Chart of Accounts, so that budget tracking is accurate and consistent.

#### Acceptance Criteria

1. WHEN creating a budget line, THE System SHALL validate that the account code exists in chart_of_accounts
2. THE System SHALL display account name and type when an account code is selected
3. WHEN an account is deactivated in the Chart of Accounts, THE System SHALL prevent creating new budget lines for that account
4. THE System SHALL allow budgeting only for expense and revenue accounts (not assets, liabilities, equity)
5. THE System SHALL aggregate budget lines by account hierarchy (parent accounts)

### Requirement 10: Budget Adjustments and Revisions

**User Story:** As a financial manager, I want to adjust budgets during the period when circumstances change, so that budgets remain relevant and realistic.

#### Acceptance Criteria

1. WHEN a budget is active, THE System SHALL allow creating budget revisions
2. WHEN a revision is created, THE System SHALL copy the current budget and increment the revision number
3. THE System SHALL maintain history of all budget revisions with timestamps and user information
4. WHEN comparing actuals, THE System SHALL use the latest approved revision
5. THE System SHALL allow viewing previous revisions for audit purposes
6. WHEN a revision is activated, THE System SHALL deactivate the previous version

---

## Non-Functional Requirements

### Performance
- Budget calculations SHALL complete within 2 seconds for budgets with up to 1000 lines
- Report generation SHALL complete within 5 seconds for annual budgets

### Usability
- Budget creation workflow SHALL be completable in under 5 minutes for experienced users
- Variance indicators SHALL use color coding (red/yellow/green) for quick visual assessment

### Data Integrity
- All budget amounts SHALL be stored with 2 decimal precision
- Budget periods SHALL not overlap for the same account and department
- Actual amounts SHALL be calculated from posted journal entries only

### Security
- Only users with 'financial_manager' or 'admin' roles SHALL create and modify budgets
- Budget approval SHALL require 'financial_controller' or 'admin' role
- All budget modifications SHALL be logged in the audit trail

---

## Dependencies

- **Chart of Accounts**: Budget lines reference accounts from chart_of_accounts table
- **Journal Entries**: Actual amounts are calculated from journal_entries and journal_details tables
- **User Roles**: Budget permissions depend on user_roles table
- **Departments**: Budget assignments reference departments or cost centers

---

## Success Criteria

1. Users can create, activate, and manage budgets for all account types
2. System accurately calculates variances and generates alerts
3. Reports provide clear visibility into budget performance
4. Budget templates reduce time to create new budgets by 70%
5. Integration with Chart of Accounts ensures data consistency
6. Approval workflow ensures proper budget governance

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-01  
**Next Phase:** Design Document

