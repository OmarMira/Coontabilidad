# Audit Implementation Plan: Hardcoded Text Elimination

## Phase 1: Core Layout and Logic
- [ ] `src/App.tsx` (Critical: Modals, Success/Error messages, Alerts)
- [ ] `src/components/Sidebar.tsx` (Final check)
- [ ] `src/components/Header.tsx`
- [ ] `src/components/Dashboard.tsx`

## Phase 2: Accounting & Reports
- [ ] `src/components/ChartOfAccounts.tsx` (Heavily hardcoded)
- [ ] `src/components/GeneralLedger.tsx`
- [ ] `src/components/reports/FloridaTaxReport.tsx`
- [ ] `src/components/reports/ReportsDashboard.tsx`
- [ ] `src/components/accounting/FinancialStatements.tsx`

## Phase 3: Customers & Suppliers
- [ ] `src/components/customers/CustomerDetailView.tsx`
- [ ] `src/components/customers/CustomerFormAdvanced.tsx`
- [ ] `src/components/SupplierForm.tsx`
- [ ] `src/components/SupplierList.tsx`

## Phase 4: Invoices & Bills
- [ ] `src/components/InvoiceForm.tsx`
- [ ] `src/components/BillForm.tsx`
- [ ] `src/components/BillList.tsx`

## Phase 5: System & Settings
- [ ] `src/components/system/UserRoleManager.tsx`
- [ ] `src/components/system/CompanyInfoForm.tsx`
- [ ] `src/components/BackupPanel.tsx`
- [ ] `src/components/BackupRestore.tsx`

## Execution Protocol
1. Extract hardcoded strings per file.
2. Define semantic keys (e.g., `chartOfAccounts.loading`, `customer.deleteConfirm`).
3. Update `es.json` (original) and `en.json` (translated).
4. Inject `useLocale` and replace strings in `.tsx`.
5. Verify build/lint.
