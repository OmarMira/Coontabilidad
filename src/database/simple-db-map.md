# Mapa de Módulos — simple-db.ts
**Archivo:** `src/database/simple-db.ts`
**Total líneas:** 14,209
**Fecha de análisis:** 2026-03-12
**Estado del sistema:** v36, motor dual (legacy RAM + persistente IndexedDB)

---

## INSTRUCCIONES DE USO

Cada módulo indica:
- **Líneas:** rango exacto en simple-db.ts
- **Archivo destino:** nombre del nuevo archivo modular
- **Funciones:** lista de exports
- **Pantallas que lo usan:** componentes React afectados
- **Estado:** pendiente / en progreso / completado
- **Notas:** problemas conocidos de columnas o esquema

Cuando algo falla en una pantalla, busca la pantalla en la columna "Pantallas que lo usan" para saber qué módulo tocar.

---

## MÓDULO 00 — Core / Bootstrap
**Líneas:** 1 – 87
**Archivo destino:** `src/database/modules/db-core.ts`
**Estado:** pendiente
**Funciones:**
- `getDB`
- `dbExec`
- `dbRun`
- `getDBEngine`
**Pantallas que lo usan:** toda la aplicación (bootstrap)
**Notas:** contiene las dos instancias de motor (`db` legacy y `dbEngine` persistente). Este módulo se toca ÚLTIMO en la unificación.

---

## MÓDULO 01 — Tipos e Interfaces
**Líneas:** 88 – 1826
**Archivo destino:** `src/database/modules/db-types.ts`
**Estado:** completado
**Interfaces exportadas:**
- `MonthlySummary`, `Employee`, `PayrollPeriod`, `PayrollEntry`, `PayrollLineItem`, `PayrollSetting`, `Payroll`, `TaxBracket`
- `AssetCategory`, `FixedAsset`, `AssetDepreciation`
- `FiscalYear`, `AccountingPeriod`
- `Customer`, `Supplier`, `KardexFilters`, `Product`, `ProductCategory`
- `Invoice`, `InvoiceItem`, `Bill`, `BillItem`, `Payment`
- `Quote`, `QuoteLine`, `SupplierPayment`
- `ChartOfAccount`, `JournalEntry`, `JournalDetail`
- `FloridaDR15Report`, `FinancialSummary`, `TaxSummary`
- `BankAccount`, `BankTransaction`, `ReconciliationStatement`, `ReconciliationMatch`
- `PaymentMethod`, `AuditEntry`, `UserSession`
- `Budget`, `BudgetLine`, `BudgetPeriod`, `BudgetVarianceAnalysis`
- `CompanyData`, `TrialBalanceRow`, `IncomeStatementItem`
- `PurchaseOrder`, `PurchaseOrderItem`, `StockMovement`, `KardexEntry`
- `PayrollFilter`, `FiscalSettings`
**Pantallas que lo usan:** todos los módulos dependen de estos tipos
**Notas:** solo tipos, sin lógica. Migrar primero para que todos los demás módulos puedan importar desde aquí.

---

## MÓDULO 02 — Inicialización y Schema
**Líneas:** 1849 – 3722
**Archivo destino:** `src/database/modules/db-init.ts`
**Estado:** pendiente
**Funciones:**
- `resetDB`
- `initDB`
- `initializeSchema` (función interna, ~1750 líneas — contiene el CREATE TABLE completo del legacy)
**Pantallas que lo usan:** `main.tsx`, `App.tsx`
**Notas:** ⚠️ CRÍTICO. `initializeSchema` crea todas las tablas en el motor legacy. Es la función más larga del archivo. No tocar hasta que todos los módulos estén migrados al motor persistente.

---

## MÓDULO 03 — Persistencia y Cifrado
**Líneas:** 3723 – 3877
**Archivo destino:** `src/database/modules/db-persistence.ts`
**Estado:** completado
**Funciones:**
- `saveDatabase`
- `forceSaveDB`
- `isEncryptionEnabled`
- `changeEncryptionPassword`
- `enableEncryption`
- `disableEncryption`
- `isDatabaseReady`
**Pantallas que lo usan:** `App.tsx`, `SettingsPage`
**Notas:** sin problemas de esquema conocidos.

---

## MÓDULO 04 — Customers (Clientes)
**Líneas:** 3878 – 4317
**Archivo destino:** `src/database/modules/db-customers.ts`
**Estado:** completado
**Funciones:**
- `addCustomer`
- `getCustomers`
- `getCustomerById`
- `updateCustomer`
- `canDeleteCustomer`
- `deleteCustomer`
**Pantallas que lo usan:** `ClientesPage`, `InvoiceForm`, `QuoteForm`, `AgingReport`
**Notas:** verificar columnas contra migración 001. Posibles nombres legacy: `customer_name` vs `name`.

---

## MÓDULO 05 — Auditoría
**Líneas:** 4318 – 4509
**Archivo destino:** `src/database/modules/db-audit.ts`
**Estado:** completado
**Funciones:**
- `generateSimpleHash`
- `generateAuditHash` (interna)
- `logAuditEvent` (interna)
- `getAuditLog`
- `getDatabaseInfo`
- `createBackup`
- `getStats`
**Pantallas que lo usan:** `AuditPage`, `SettingsPage`
**Notas:** `audit_chain` usa columnas específicas — verificar contra migración.

---

## MÓDULO 06 — Invoices (Facturas de Venta)
**Líneas:** 4510 – 5078
**Archivo destino:** `src/database/modules/db-invoices.ts`
**Estado:** completado
**Funciones:**
- `FLORIDA_COUNTIES` (constante)
- `generateInvoiceNumber`
- `getInvoices`
- `getInvoiceById`
- `createInvoice`
- `updateInvoice`
- `deleteInvoice`
- `getActiveProducts`
- `getFloridaTaxRate`
- `calculateTaxAmount`
- `validateFinancialCalculation`
- `getStatsWithInvoices`
**Pantallas que lo usan:** `InvoicesPage`, `InvoiceForm`, `Dashboard`
**Notas:** ⚠️ NO tocar lógica de cálculo fiscal. Solo cambiar motor de DB.

---

## MÓDULO 07 — Quotes (Cotizaciones)
**Líneas:** 5079 – 5557
**Archivo destino:** `src/database/modules/db-quotes.ts`
**Estado:** completado
**Funciones:**
- `getQuotes`
- `getQuoteById`
- `createQuote`
- `updateQuote`
- `deleteQuote`
- `convertQuoteToInvoice`
**Pantallas que lo usan:** `QuotesPage`, `QuoteForm`
**Notas:** tabla `quotes` ya fue agregada al motor persistente en migración 035.

---

## MÓDULO 08 — Suppliers (Proveedores)
**Líneas:** 5558 – 5912
**Archivo destino:** `src/database/modules/db-suppliers.ts`
**Estado:** completado
**Funciones:**
- `addSupplier`
- `getSuppliers`
- `getSupplierById`
- `updateSupplier`
- `canDeleteSupplier`
- `deleteSupplier`
**Pantallas que lo usan:** `ProveedoresPage`, `BillForm`, `AgingReport`
**Notas:** verificar columnas contra migración.

---

## MÓDULO 09 — Bills (Facturas de Compra)
**Líneas:** 5913 – 6429
**Archivo destino:** `src/database/modules/db-bills.ts`
**Estado:** completado
**Funciones:**
- `generateBillNumber`
- `getBills`
- `getBillById`
- `createBill`
- `getStatsWithSuppliers`
- `updateBill`
- `deleteBill`
**Pantallas que lo usan:** `BillsPage`, `BillForm`
**Notas:** `bill_lines` fue agregada al motor persistente en migración 031.

---

## MÓDULO 10 — Chart of Accounts (Plan de Cuentas)
**Líneas:** 6430 – 7026
**Archivo destino:** `src/database/modules/db-chart-of-accounts.ts`
**Estado:** pendiente
**Funciones:**
- `createChartOfAccount`
- `getChartOfAccountByCode`
- `updateChartOfAccount`
- `deleteChartOfAccount`
- `insertInitialChartOfAccounts`
- `verifyAuditIntegrity`
- `getAuditStats`
**Pantallas que lo usan:** `ChartOfAccountsPage`, `JournalForm`, todos los reportes
**Notas:** ⚠️ columnas legacy `account_code`/`account_name`/`account_type` deben ser `code`/`name`/`type`. Ya corregido en `getChartOfAccounts` — verificar resto de funciones.

---

## MÓDULO 11 — Journal (Asientos Contables)
**Líneas:** 7027 – 7417
**Archivo destino:** `src/database/modules/db-journal.ts`
**Estado:** completado
**Funciones:**
- `getChartOfAccounts`
- `getAccountBalance`
- `diagnoseAccountingSystem`
- `createJournalEntry`
- `getJournalEntries`
- `getJournalEntryDetails`
**Pantallas que lo usan:** `JournalPage`, `JournalForm`, todos los reportes contables
**Notas:** ⚠️ CRÍTICO. Núcleo de doble entrada. `journal_details` usa `journal_id` (no `entry_id`), `debit`/`credit` (no `debit_amount`/`credit_amount`).

---

## MÓDULO 12 — Journal Entries Automáticos
**Líneas:** 7418 – 7527
**Archivo destino:** `src/database/modules/db-journal-auto.ts`
**Estado:** completado
**Funciones:**
- `generateSalesJournalEntry`
- `generatePurchaseJournalEntry`
- `generatePaymentReceivedJournalEntry`
**Pantallas que lo usan:** llamadas automáticas desde `createInvoice`, `createBill`, `createPayment`
**Notas:** depende de MÓDULO 11. Migrar después de Journal.

---

## MÓDULO 13 — Payments (Pagos)
**Líneas:** 7528 – 7800
**Archivo destino:** `src/database/modules/db-payments.ts`
**Estado:** completado
**Funciones:**
- `generatePaymentNumber`
- `generateSupplierPaymentNumber`
- `createPayment`
- `generatePaymentSentJournalEntry`
- `addPayment`
- `createSupplierPayment` (alias)
**Pantallas que lo usan:** `PaymentsPage`, `PaymentForm`
**Notas:** depende de Customers, Suppliers y Journal.

---

## MÓDULO 14 — Financial Reports (Reportes Financieros)
**Líneas:** 7797 – 8090
**Archivo destino:** `src/database/modules/db-reports-financial.ts`
**Estado:** completado
**Funciones:**
- `generateBalanceSheet`
- `generateIncomeStatement`
- `generateClosingEntry`
- `getCashFlowStatement`
**Pantallas que lo usan:** `ReportsPage`, `BalanceSheetPage`, `IncomeStatementPage`
**Notas:** ⚠️ NO tocar lógica de cálculo. Solo cambiar motor.

---

## MÓDULO 15 — Company Data y Aging Reports
**Líneas:** 8087 – 8874
**Archivo destino:** `src/database/modules/db-company.ts`
**Estado:** completado
**Funciones:**
- `getAgingReport`
- `getAccountLedger`
- `getCompanyData`
- `updateCompanyData`
- `getARDDocuments`, `saveARDDocument`, `updateARDDocumentStatus`, `deleteARDDocument`
- `assignCustomerToARDDocument`, `getARDCustomerSummary`
- `checkAccountingDataAssociation`
- `initializeCompanyData`
**Pantallas que lo usan:** `CompanySettingsPage`, `AgingReportPage`, `LedgerPage`
**Notas:** `company_data` tiene mismatch de columnas — `seedCompanyData` falla silenciosamente.

---

## MÓDULO 16 — Products y Categorías
**Líneas:** 8875 – 9576
**Archivo destino:** `src/database/modules/db-products.ts`
**Estado:** completado
**Funciones:**
- `getProductCategories`, `createProductCategory`, `updateProductCategory`, `deleteProductCategory`
- `getProducts`, `createProduct`, `updateProduct`, `deleteProduct`
- `getProductById`, `updateProductStock`, `getProductsLowStock`
**Pantallas que lo usan:** `ProductsPage`, `ProductForm`, `InvoiceForm`, `BillForm`
**Notas:** sin problemas de esquema conocidos.

---

## MÓDULO 17 — Florida Tax / DR15
**Líneas:** 9577 – 9940
**Archivo destino:** `src/database/modules/db-florida-tax.ts`
**Estado:** completado
**Funciones:**
- `calculateFloridaDR15Report`
- `saveDR15Report`
- `getDR15Reports`
- `getAllFloridaTaxRates`
- `updateFloridaTaxRate`
- `markDR15ReportAsFiled`
**Pantallas que lo usan:** `TaxPage`, `DR15Page`, `ComplianceHistory`
**Notas:** ⚠️ NO tocar lógica fiscal. `florida_tax_rates` ya tiene `county_code` desde migración 032.

---

## MÓDULO 18 — DR15 Periods y Payment Methods
**Líneas:** 9941 – 10473
**Archivo destino:** `src/database/modules/db-payment-methods.ts`
**Estado:** completado
**Funciones:**
- `getAvailableDR15Periods`
- `getPaymentMethods`, `getAllPaymentMethods`
- `createPaymentMethod`, `updatePaymentMethod`, `deletePaymentMethod`
- `getPaymentMethodById`, `canDeletePaymentMethod`
**Pantallas que lo usan:** `PaymentMethodsPage`, `InvoiceForm`, `BillForm`
**Notas:** sin problemas de esquema conocidos.

---

## MÓDULO 19 — Bank Accounts
**Líneas:** 10474 – 10768
**Archivo destino:** `src/database/modules/db-bank-accounts.ts`
**Estado:** completado
**Funciones:**
- `getBankAccounts`
- `getBankAccountById`
- `getBankAccountTransactionCount`
- `findBankAccountsByNumber`
- `findBankAccountByNumber`
- `createBankAccount`
- `updateBankAccount`
- `deleteBankAccount`
**Pantallas que lo usan:** `BankAccountsPage`, `ReconciliationPage`
**Notas:** `is_active` fue agregada en migración 034.

---

## MÓDULO 20 — Bank Reconciliation
**Líneas:** 10769 – 11025
**Archivo destino:** `src/database/modules/db-reconciliation.ts`
**Estado:** completado
**Funciones:**
- `getReconciliationStatements`
- `getLastReconciliationStatement`
- `createReconciliationStatement`
- `getUnreconciledTransactions`
- `findSimilarJournalEntries`
- `createReconciliationMatch`
- `autoMatchTransactions`
- `getInventoryMovements`
**Pantallas que lo usan:** `ReconciliationPage`
**Notas:** depende de Bank Accounts y Journal.

---

## MÓDULO 21 — Trial Balance e Income Statement Reports
**Líneas:** 11026 – 11278
**Archivo destino:** `src/database/modules/db-reports-trial.ts`
**Estado:** completado
**Funciones:**
- `getTrialBalanceReport`
- `getAccountMovementsDetails`
- `validateAccountingIntegrity`
- `getIncomeStatementReport`
**Pantallas que lo usan:** `TrialBalancePage`, `IncomeStatementPage`
**Notas:** verificar columnas de `journal_details`.

---

## MÓDULO 22 — Bank Transactions e Import
**Líneas:** 11279 – 11538
**Archivo destino:** `src/database/modules/db-bank-transactions.ts`
**Estado:** completado
**Funciones:**
- `insertBankTransactions`
- `getBankTransactions`
- `findPotentialMatches`
- `confirmMatch`
- `unmatchTransaction`
- `restoreDatabaseFromBackup`
**Pantallas que lo usan:** `BankImportPage`, `ReconciliationPage`
**Notas:** `transaction_date` fue agregada en migración 036.

---

## MÓDULO 23 — Users y Roles
**Líneas:** 11539 – 12404
**Archivo destino:** `src/database/modules/db-users.ts`
**Estado:** completado
**Funciones:**
- `hasActiveUsers`
- `seedUsersAndRoles`
- `seedCompanyData` (interna)
- `seedChartOfAccounts` (interna)
- `seedSystemDefaults`
- `hashPassword`, `verifyPassword`
- `createUser`, `getUsers`, `getUserByUsername`
- `updateUser`, `deactivateUser`
- `getUserRoles`
- `updateUserPassword`
- `createUserRole`, `updateUserRole`, `deleteUserRole`
**Pantallas que lo usan:** `UsersPage`, `LoginPage`, `AuthContext`
**Notas:** ⚠️ `seedCompanyData` falla — `company_data` no tiene columna `company_name`. `seedChartOfAccounts` falla — usa `account_code`. Ambos son los seeds del Nivel 4 Fase 1.

---

## MÓDULO 24 — Purchase Orders e Inventory
**Líneas:** 12405 – 12738
**Archivo destino:** `src/database/modules/db-purchase-orders.ts`
**Estado:** pendiente
**Funciones:**
- `getPurchaseOrders`, `createPurchaseOrder`, `receivePurchaseOrder`
- `getStockMovements`
- `getKardexMovements`
**Pantallas que lo usan:** `PurchaseOrdersPage`, `KardexPage`
**Notas:** sin problemas de esquema conocidos.

---

## MÓDULO 25 — Inventory Movements y Locations
**Líneas:** 12739 – 13090
**Archivo destino:** `src/database/modules/db-inventory.ts`
**Estado:** pendiente
**Funciones:**
- `createInventoryMovement`
- `getInventoryMovementsWithFilters`
- `createLocation`, `getLocations`, `updateLocation`, `deleteLocation`
- `createInitialLocations`
**Pantallas que lo usan:** `InventoryPage`, `LocationsPage`
**Notas:** sin problemas de esquema conocidos.

---

## MÓDULO 26 — Budgets (Presupuestos)
**Líneas:** 13091 – 13938
**Archivo destino:** `src/database/modules/db-budgets.ts`
**Estado:** pendiente
**Funciones:**
- `createBudget`, `getBudgets`, `getBudgetById`
- `getBudgetLines`, `getBudgetPeriods`
- `updateBudget`, `deleteBudget`, `approveBudget`
- `calculateActualsByAccount`
- `getBudgetVarianceAnalysis`
- `updatePeriodActuals`, `getBudgetSummary`
- `generateBudgetAlerts`, `getBudgetExecutionStatus`
**Pantallas que lo usan:** `BudgetsPage`, `BudgetForm`
**Notas:** sin problemas de esquema conocidos.

---

## MÓDULO 27 — Payroll (Nómina)
**Líneas:** 289 – 1124 y 13939 – 14209
**Archivo destino:** `src/database/modules/db-payroll.ts`
**Estado:** completado
**Funciones:**
- `getMonthlyFinancialSummary`
- `getEmployees`, `getEmployeeById`, `createEmployee`, `updateEmployee`
- `getPayrollPeriods`, `getPayrollSettings`, `updatePayrollSetting`
- `getTaxBrackets`, `createTaxBracket`, `updateTaxBracket`, `deleteTaxBracket`
- `getAssetCategories`, `createAssetCategory`
- `getFixedAssets`, `getFixedAssetById`, `createFixedAsset`, `updateFixedAsset`
- `disposeAsset`, `getAssetDepreciations`, `recordDepreciation`
- `calculateMonthlyDepreciation`
- `createPayrollPeriod`, `getPayrollEntries`, `createPayrollEntry`
- `getPayrollLineItems`, `getPayrolls`
- `hasUsers`
- `getPayroll`, `getEmployeePayrolls`, `getAllPayrolls`
- `getQuarterlyPayrolls`, `getAnnualPayrolls`
- `getFiscalSettings`, `updateFiscalSettings`
**Pantallas que lo usan:** `PayrollPage`, `EmployeesPage`, `FixedAssetsPage`
**Notas:** ⚠️ módulo dividido — hay funciones al inicio (líneas 289-1124) y al final (13939-14209) del archivo. Al crear el módulo hay que consolidarlas.

---

## RESUMEN DE ESTADO

| Módulo | Archivo destino | Estado | Prioridad |
|--------|----------------|--------|-----------|
| 00 Core | db-core.ts | pendiente | ÚLTIMO |
| 01 Tipos | db-types.ts | completado | PRIMERO |
| 02 Init/Schema | db-init.ts | pendiente | PENÚLTIMO |
| 03 Persistencia | db-persistence.ts | completado | baja |
| 04 Customers | db-customers.ts | completado | alta |
| 05 Auditoría | db-audit.ts | completado | media |
| 06 Invoices | db-invoices.ts | completado | alta |
| 07 Quotes | db-quotes.ts | completado | media |
| 08 Suppliers | db-suppliers.ts | completado | alta |
| 09 Bills | db-bills.ts | completado | alta |
| 10 Chart of Accounts | db-chart-of-accounts.ts | pendiente | ⚠️ alta |
| 11 Journal | db-journal.ts | completado | ⚠️ crítico |
| 12 Journal Auto | db-journal-auto.ts | completado | alta |
| 13 Payments | db-payments.ts | completado | alta |
| 14 Reports Financial | db-reports-financial.ts | completado | media |
| 15 Company | db-company.ts | completado | ⚠️ alta |
| 16 Products | db-products.ts | completado | media |
| 17 Florida Tax | db-florida-tax.ts | completado | ⚠️ alta |
| 18 Payment Methods | db-payment-methods.ts | completado | baja |
| 19 Bank Accounts | db-bank-accounts.ts | completado | media |
| 20 Reconciliation | db-reconciliation.ts | completado | media |
| 21 Trial Balance | db-reports-trial.ts | completado | media |
| 22 Bank Transactions | db-bank-transactions.ts | completado | media |
| 23 Users | db-users.ts | completado | ⚠️ alta |
| 24 Purchase Orders | db-purchase-orders.ts | pendiente | baja |
| 25 Inventory | db-inventory.ts | pendiente | baja |
| 26 Budgets | db-budgets.ts | pendiente | baja |
| 27 Payroll | db-payroll.ts | completado | media |

---

## ORDEN DE EJECUCIÓN RECOMENDADO

1. **MÓDULO 01** — Tipos (sin lógica, sin riesgo)
2. **MÓDULO 23** — Users/Seeds (Fase 1 del Nivel 4)
3. **MÓDULO 10** — Chart of Accounts (base de todo)
4. **MÓDULO 11** — Journal (núcleo contable)
5. **MÓDULO 04** — Customers
6. **MÓDULO 08** — Suppliers
7. **MÓDULO 06** — Invoices
8. **MÓDULO 09** — Bills
9. **MÓDULO 07** — Quotes
10. **MÓDULO 13** — Payments
11. Resto de módulos en orden de prioridad
12. **MÓDULO 02** — Init/Schema (penúltimo)
13. **MÓDULO 00** — Core (último — eliminar motor legacy)

---

## COLUMNAS CON NOMBRES INCORRECTOS CONOCIDOS

| Tabla | Columna legacy (incorrecta) | Columna real (esquema) |
|-------|---------------------------|----------------------|
| chart_of_accounts | account_code | code |
| chart_of_accounts | account_name | name |
| chart_of_accounts | account_type | type |
| chart_of_accounts | is_active | active |
| journal_details | journal_entry_id / entry_id | journal_id |
| journal_details | debit_amount | debit |
| journal_details | credit_amount | credit |
| bank_transactions | date | transaction_date |
| company_data | company_name | (verificar migración) |

---

*Este archivo debe actualizarse cada vez que un módulo cambia de estado.*
