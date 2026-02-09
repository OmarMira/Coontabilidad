# 📚 API REFERENCE - AccountExpress v4.1.0

**Fecha**: 8 de febrero de 2026  
**Versión**: 4.1.0  
**Estado**: Sistema 100% Funcional

---

## 📖 TABLA DE CONTENIDOS

1. [Servicios de Nómina](#servicios-de-nómina)
2. [Servicios de Banca](#servicios-de-banca)
3. [Servicios de Contabilidad](#servicios-de-contabilidad)
4. [Servicios de Auditoría](#servicios-de-auditoría)
5. [Servicios de IA](#servicios-de-ia)
6. [Servicios de Backup](#servicios-de-backup)
7. [Servicios Core](#servicios-core)
8. [Base de Datos](#base-de-datos)
9. [Tipos y Interfaces](#tipos-y-interfaces)

---

## 🧾 SERVICIOS DE NÓMINA

### PayrollProcessor

**Ubicación**: `src/services/payroll/PayrollProcessor.ts`

Servicio principal para procesamiento de nómina con cumplimiento IRS.

#### Métodos Principales

##### `processPayroll(input: PayrollInput): Promise<PayrollResult>`

Procesa nómina completa para un empleado.

**Parámetros**:
```typescript
interface PayrollInput {
  employeeId: number;
  payPeriodStart: string;      // YYYY-MM-DD
  payPeriodEnd: string;        // YYYY-MM-DD
  payDate: string;             // YYYY-MM-DD
  regularHours: number;        // 0-168
  overtimeHours: number;       // 0-168
  bonuses: number;             // USD
  commissions: number;         // USD
  otherDeductions: number;     // USD
  processedBy: number;         // User ID
}
```

**Retorna**:
```typescript
interface PayrollResult {
  success: boolean;
  payrollId?: number;
  grossPay: number;
  netPay: number;
  taxes?: TaxCalculationResult;
  journalEntryId?: number;
  message?: string;
  error?: string;
}
```

**Ejemplo**:
```typescript
const result = await payrollProcessor.processPayroll({
  employeeId: 1,
  payPeriodStart: '2026-01-01',
  payPeriodEnd: '2026-01-15',
  payDate: '2026-01-20',
  regularHours: 80,
  overtimeHours: 5,
  bonuses: 500,
  commissions: 0,
  otherDeductions: 100,
  processedBy: 1
});

if (result.success) {
  console.log(`Payroll ID: ${result.payrollId}`);
  console.log(`Net Pay: $${result.netPay.toFixed(2)}`);
}
```

**Flujo de Procesamiento**:
1. Valida inputs (horas, fechas, montos)
2. Verifica período contable abierto
3. Obtiene y valida datos del empleado
4. Verifica no duplicados
5. Calcula gross pay (regular + overtime + bonuses)
6. Calcula impuestos (FICA, Medicare, Federal)
7. Calcula net pay
8. Guarda en base de datos
9. Genera asiento contable
10. Actualiza totales YTD

**Errores Comunes**:
- `ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado`
- `Employee not found`
- `Payroll already processed for this employee and period`
- `Employee data incomplete: [detalles]`

---

##### `approvePayroll(payrollId: number, approvedBy: number): boolean`

Aprueba un payroll (cambia status de draft a approved).

**Ejemplo**:
```typescript
const approved = payrollProcessor.approvePayroll(123, 1);
if (approved) {
  console.log('Payroll approved successfully');
}
```

---

##### `voidPayroll(payrollId: number): boolean`

Anula un payroll y revierte totales YTD.

**Ejemplo**:
```typescript
const voided = payrollProcessor.voidPayroll(123);
if (voided) {
  console.log('Payroll voided and YTD reverted');
}
```

---

##### `getEmployeePayrolls(employeeId: number, year?: number): Payroll[]`

Obtiene historial de payrolls de un empleado.

**Ejemplo**:
```typescript
const payrolls = payrollProcessor.getEmployeePayrolls(1, 2026);
console.log(`Found ${payrolls.length} payrolls for 2026`);
```

---

### PayrollTaxCalculator

**Ubicación**: `src/services/payroll/PayrollTaxCalculator.ts`

Calcula impuestos federales con precisión 100% según IRS Publication 15.

#### Métodos Principales

##### `calculateAllTaxes(input: TaxCalculationInput): TaxCalculationResult`

Calcula todos los impuestos (FICA + Medicare + Federal).

**Parámetros**:
```typescript
interface TaxCalculationInput {
  grossPay: number;
  ytdGrossPay: number;
  filingStatus: 'single' | 'married' | 'married_separate' | 'head_of_household';
  allowances: number;
  additionalWithholding: number;
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}
```

**Retorna**:
```typescript
interface TaxCalculationResult {
  socialSecurity: number;
  medicare: number;
  medicareAdditional: number;
  federalIncomeTax: number;
  totalTaxes: number;
  breakdown: TaxBreakdown;
}
```

**Ejemplo**:
```typescript
const taxes = payrollTaxCalculator.calculateAllTaxes({
  grossPay: 3000,
  ytdGrossPay: 15000,
  filingStatus: 'single',
  allowances: 1,
  additionalWithholding: 0,
  payPeriod: 'semimonthly'
});

console.log(`Total Taxes: $${taxes.totalTaxes.toFixed(2)}`);
console.log(`Federal: $${taxes.federalIncomeTax.toFixed(2)}`);
console.log(`FICA: $${taxes.socialSecurity.toFixed(2)}`);
```

**Tasas 2026**:
- Social Security: 6.2% hasta $168,600
- Medicare: 1.45% sin límite
- Medicare Adicional: 0.9% sobre threshold
- Federal Income Tax: Progressive brackets

---

##### `calculateFICA(input: TaxCalculationInput): FICAResult`

Calcula solo FICA (Social Security + Medicare).

---

##### `calculateMedicare(input: TaxCalculationInput): MedicareResult`

Calcula Medicare regular + adicional.

---

##### `calculateFederalTax(input: TaxCalculationInput): FederalTaxResult`

Calcula Federal Income Tax usando W-4 y tax brackets.

---

### PayrollReportGenerator

**Ubicación**: `src/services/payroll/PayrollReportGenerator.ts`

Genera reportes IRS requeridos (Form 941, W-2, W-3).

#### Métodos Principales

##### `generateForm941(quarter: number, year: number, companyData?: any): Form941Data`

Genera datos para Form 941 (Quarterly Federal Tax Return).

**Ejemplo**:
```typescript
const form941 = payrollReportGenerator.generateForm941(1, 2026, {
  name: 'My Company Inc',
  ein: '12-3456789',
  address: '123 Main St, Miami, FL'
});

console.log(`Total Wages: $${form941.totalWages.toFixed(2)}`);
console.log(`Total Taxes: $${form941.totalTaxes.toFixed(2)}`);
```

---

##### `generateW2(employeeId: number, year: number, companyData?: any): W2Data | null`

Genera datos para Form W-2 (Wage and Tax Statement).

**Ejemplo**:
```typescript
const w2 = payrollReportGenerator.generateW2(1, 2026, companyData);
if (w2) {
  console.log(`W-2 for ${w2.employeeName}`);
  console.log(`Wages: $${w2.wages.toFixed(2)}`);
  console.log(`Federal Tax: $${w2.federalIncomeTax.toFixed(2)}`);
}
```

---

##### `generateW3(year: number, companyData?: any): W3Data`

Genera datos para Form W-3 (Transmittal of Wage and Tax Statements).

---

##### `getAllW2s(year: number, companyData?: any): W2Data[]`

Obtiene todas las W-2 para un año.

---

## 🏦 SERVICIOS DE BANCA

### BankImportService

**Ubicación**: `src/services/banking/BankImportService.ts`

Orquestador principal de importación bancaria con IA.

#### Métodos Principales

##### `createImportBatch(file: File, bankAccountId: number, userId: number): Promise<{batchId, transactions}>`

Crea un nuevo batch de importación y genera preview.

**Flujo**:
1. Parse file (CSV, OFX, QFX, QBO)
2. Detección de duplicados
3. Categorización con IA
4. Matching con facturas/gastos
5. Preview para usuario

**Ejemplo**:
```typescript
const { batchId, transactions } = await bankImportService.createImportBatch(
  file,
  1, // bankAccountId
  1  // userId
);

console.log(`Batch ${batchId} created with ${transactions.length} transactions`);

transactions.forEach(txn => {
  console.log(`${txn.description}: ${txn.suggestedCategory} (${txn.confidenceScore}%)`);
  if (txn.isDuplicate) {
    console.log('  ⚠️ Possible duplicate');
  }
});
```

---

##### `updateImportTransaction(transactionId: number, updates: object): Promise<void>`

Actualiza una transacción en el preview (categoría, descripción, excluded).

**Ejemplo**:
```typescript
await bankImportService.updateImportTransaction(123, {
  userCategory: 'Office Supplies',
  userDescription: 'Staples - Office supplies',
  excluded: false
});
```

---

##### `finalizeImport(batchId: number, userId: number): Promise<void>`

Importa las transacciones finales y genera asientos contables.

**Ejemplo**:
```typescript
await bankImportService.finalizeImport(batchId, userId);
console.log('Import completed successfully');
```

---

##### `rollbackImport(batchId: number): Promise<void>`

Rollback de una importación.

---

### AICategorizerService

**Ubicación**: `src/services/banking/AICategorizerService.ts`

Categoriza transacciones usando ML (Naive Bayes).

#### Métodos Principales

##### `train(examples: TrainingExample[]): void`

Entrena el modelo con datos históricos.

**Ejemplo**:
```typescript
const categorizer = new AICategorizerService();
categorizer.train([
  { description: 'WALMART SUPERCENTER', category: 'Groceries', amount: -150 },
  { description: 'SHELL GAS STATION', category: 'Fuel', amount: -45 },
  { description: 'AMAZON.COM', category: 'Office Supplies', amount: -89 }
]);
```

---

##### `categorize(transaction: ParsedTransaction): CategorizationResult`

Categoriza una transacción.

**Retorna**:
```typescript
interface CategorizationResult {
  category: string;
  confidence: number;  // 0-100
  autoSelected: boolean;  // true si confidence > 70
}
```

**Ejemplo**:
```typescript
const result = categorizer.categorize({
  date: '2026-01-15',
  description: 'WALMART SUPERCENTER #1234',
  amount: -125.50
});

console.log(`Category: ${result.category}`);
console.log(`Confidence: ${result.confidence}%`);
if (result.autoSelected) {
  console.log('Auto-selected (high confidence)');
}
```

---

##### `addTrainingExample(example: TrainingExample): void`

Agrega un ejemplo de entrenamiento (aprendizaje incremental).

---

### TransactionMatcher

**Ubicación**: `src/services/banking/TransactionMatcher.ts`

Vincula transacciones con facturas/gastos pendientes.

#### Métodos Principales

##### `matchTransaction(transaction, unpaidInvoices, unpaidBills): Promise<MatchResult>`

Busca matches inteligentes.

**Algoritmo**:
- Tolerancia de monto: ±1%
- Ventana de fecha: ±7 días
- Matching de descripción
- Confidence score: 0-100

**Ejemplo**:
```typescript
const match = await TransactionMatcher.matchTransaction(
  transaction,
  unpaidInvoices,
  unpaidBills
);

if (match.matched) {
  console.log(`Matched with ${match.matchType}: ${match.matchedName}`);
  console.log(`Confidence: ${match.confidence}%`);
}
```

---

## 📊 SERVICIOS DE CONTABILIDAD

### AccountingService

**Ubicación**: `src/services/accounting/AccountingService.ts`

Motor de contabilidad de partida doble con US GAAP.

#### Métodos Principales

##### `createJournalEntry(entry: CreateJournalEntryDTO): Promise<string>`

Crea un asiento contable con validación automática.

**Validaciones**:
- Σ Debits = Σ Credits (ecuación contable)
- Mínimo 2 líneas
- Cuentas existen y están activas
- Montos en centavos (INTEGER)

**Ejemplo**:
```typescript
const entryId = await accountingService.createJournalEntry({
  description: 'Sale - Invoice INV-001',
  lines: [
    {
      accountCode: '1020',  // Accounts Receivable
      debit: 10700,         // $107.00
      credit: 0
    },
    {
      accountCode: '4010',  // Sales Revenue
      debit: 0,
      credit: 10000         // $100.00
    },
    {
      accountCode: '2020',  // Sales Tax Payable
      debit: 0,
      credit: 700           // $7.00
    }
  ],
  autoPost: true,
  createdBy: 'user123'
});

console.log(`Journal Entry Created: ${entryId}`);
```

**Errores**:
```typescript
// Si debits ≠ credits
throw new Error('Accounting equation violated: Debits (10700) ≠ Credits (10500). Difference: 200 cents');

// Si cuenta no existe
throw new Error('Account 9999 not found in chart of accounts');

// Si cuenta inactiva
throw new Error('Account 1020 is inactive');
```

---

##### `postJournalEntry(entryId: string, postedBy: string): Promise<void>`

Publica un asiento (lo hace inmutable).

---

##### `createReversalEntry(originalEntryId, reason, createdBy): Promise<string>`

Crea un asiento de reversión (Storno method).

**Ejemplo**:
```typescript
const reversalId = await accountingService.createReversalEntry(
  'original-uuid',
  'Correction: Wrong amount',
  'user123'
);
```

---

##### `createInvoiceSaleEntry(invoiceData): Promise<string>`

Crea asiento automático para venta de factura.

**Asientos Generados**:
```
DR  Accounts Receivable    $107.00
  CR  Sales Revenue                  $100.00
  CR  Sales Tax Payable              $7.00
DR  Cost of Goods Sold     $60.00
  CR  Inventory                      $60.00
```

---

##### `getAccountBalance(accountCode: string): Promise<number>`

Obtiene balance de una cuenta.

**Retorna**: Balance en centavos (positivo = normal balance)

---

##### `getTrialBalance(): Promise<TrialBalanceEntry[]>`

Obtiene balance de comprobación.

**Ejemplo**:
```typescript
const trialBalance = await accountingService.getTrialBalance();

let totalDebits = 0;
let totalCredits = 0;

trialBalance.forEach(entry => {
  console.log(`${entry.accountCode} ${entry.accountName}`);
  console.log(`  Debit: $${(entry.debit / 100).toFixed(2)}`);
  console.log(`  Credit: $${(entry.credit / 100).toFixed(2)}`);
  
  totalDebits += entry.debit;
  totalCredits += entry.credit;
});

console.log(`\nTotal Debits: $${(totalDebits / 100).toFixed(2)}`);
console.log(`Total Credits: $${(totalCredits / 100).toFixed(2)}`);
console.log(`Balanced: ${totalDebits === totalCredits ? '✅' : '❌'}`);
```

---

### AccountingPeriodService

**Ubicación**: `src/services/accounting/AccountingPeriodService.ts`

Gestión de períodos contables y cierres.

#### Métodos Principales

##### `createPeriod(data): {success, message, periodId?}`

Crea un nuevo período contable.

**Ejemplo**:
```typescript
const result = accountingPeriodService.createPeriod({
  name: 'Enero 2026',
  period_type: 'monthly',
  start_date: '2026-01-01',
  end_date: '2026-01-31',
  fiscal_year: 2026,
  notes: 'Primer período del año',
  created_by: 1
});

if (result.success) {
  console.log(`Period created: ${result.periodId}`);
}
```

---

##### `createMonthlyPeriods(fiscalYear, createdBy): {success, message, count?}`

Crea 12 períodos mensuales para un año fiscal.

---

##### `getPeriods(filters?): AccountingPeriod[]`

Obtiene períodos con filtros opcionales.

---

##### `getPeriodByDate(date: string): AccountingPeriod | null`

Obtiene período por fecha.

---

##### `getCurrentPeriod(): AccountingPeriod | null`

Obtiene período actual.

---

##### `validatePeriodClosure(periodId: number): ClosureValidation`

Valida si un período puede ser cerrado.

**Checks**:
- Todos los asientos balanceados
- No hay transacciones pendientes
- Período anterior cerrado
- Conciliación bancaria completa
- Inventario reconciliado

**Ejemplo**:
```typescript
const validation = accountingPeriodService.validatePeriodClosure(1);

if (validation.canClose) {
  console.log('✅ Period can be closed');
} else {
  console.log('❌ Cannot close period:');
  validation.errors.forEach(error => console.log(`  - ${error}`));
}

if (validation.warnings.length > 0) {
  console.log('⚠️ Warnings:');
  validation.warnings.forEach(warning => console.log(`  - ${warning}`));
}
```

---

##### `closePeriod(periodId, userId, notes?, ipAddress?, userAgent?): {success, message}`

Cierra un período contable.

---

##### `reopenPeriod(periodId, userId, reason, ipAddress?, userAgent?): {success, message}`

Reabre un período cerrado.

---

##### `lockPeriod(periodId, userId, notes?): {success, message}`

Bloquea un período (no se puede reabrir sin permisos especiales).

---

### DoubleEntryValidator

**Ubicación**: `src/services/accounting/DoubleEntryValidator.ts`

Validador de partida doble.

#### Métodos Principales

##### `validateJournalEntry(entry: JournalEntry): ValidationResult`

Valida un asiento contable.

**Validaciones**:
- Mínimo 2 líneas
- Σ Debits = Σ Credits (tolerancia 1 centavo)
- Cada línea tiene débito O crédito (no ambos)
- No hay montos cero

**Ejemplo**:
```typescript
const validation = DoubleEntryValidator.validateJournalEntry({
  id: 1,
  date: '2026-01-15',
  description: 'Test Entry',
  reference: 'TEST-001',
  details: [
    { account_code: '1010', debit: 100, credit: 0 },
    { account_code: '4010', debit: 0, credit: 100 }
  ]
});

if (validation.valid) {
  console.log('✅ Entry is valid');
} else {
  console.log('❌ Validation errors:');
  validation.errors.forEach(error => console.log(`  - ${error}`));
}

console.log(`Total Debits: $${validation.totals.debits.toFixed(2)}`);
console.log(`Total Credits: $${validation.totals.credits.toFixed(2)}`);
console.log(`Difference: $${validation.totals.difference.toFixed(2)}`);
```

---

##### `generateBalanceSheet(entries: JournalEntry[]): BalanceSheet`

Genera balance general desde asientos.

---

## 🔒 SERVICIOS DE AUDITORÍA

### AuditChainService

**Ubicación**: `src/services/audit/AuditChainService.ts`

Cadena de auditoría inmutable estilo blockchain.

#### Características

- SHA-256 hashing de transacciones
- Chain linking (hash actual incluye hash anterior)
- Logic clock sequencing
- Detección de tampering
- Compresión delta para updates

#### Métodos Principales

##### `recordEvent(event: AuditEvent): Promise<string>`

Registra un evento en la cadena de auditoría.

**Ejemplo**:
```typescript
const chainHash = await auditChain.recordEvent({
  eventType: 'invoice_created',
  entityTable: 'invoices',
  entityId: '123',
  userId: 'admin',
  payload: {
    invoice_number: 'INV-001',
    total: 10700,
    customer_id: 5
  }
});

console.log(`Event recorded with hash: ${chainHash}`);
```

---

##### `verifyIntegrity(): Promise<IntegrityReport>`

Verifica integridad de toda la cadena.

**Checks**:
1. Hash chain ininterrumpida
2. Logic clock sin gaps
3. Content hashes coinciden

**Ejemplo**:
```typescript
const report = await auditChain.verifyIntegrity();

if (report.valid) {
  console.log(`✅ Chain integrity verified`);
  console.log(`Total records: ${report.totalRecords}`);
  console.log(`Last logic clock: ${report.lastLogicClock}`);
} else {
  console.log(`❌ Chain integrity compromised!`);
  report.errors.forEach(error => {
    console.log(`  Record ${error.recordId}: ${error.message}`);
  });
}
```

---

##### `verifyEntityIntegrity(entityTable, entityId): Promise<IntegrityReport>`

Verifica integridad de una entidad específica.

---

##### `getAuditTrail(entityTable, entityId): Promise<AuditRecord[]>`

Obtiene historial de auditoría de una entidad.

**Ejemplo**:
```typescript
const trail = await auditChain.getAuditTrail('invoices', '123');

trail.forEach(record => {
  console.log(`[${record.timestamp}] ${record.eventType}`);
  console.log(`  User: ${record.userId}`);
  console.log(`  Logic Clock: ${record.logicClock}`);
  console.log(`  Payload:`, record.payload);
});
```

---

##### `reconstructFromDelta(entityTable, entityId, targetLogicClock?): Promise<any>`

Reconstruye objeto completo desde deltas.

---

##### `getDeltaCompressionStats(): Promise<object>`

Obtiene estadísticas de compresión delta.

---

### ExternalTimestampService

**Ubicación**: `src/services/ExternalTimestampService.ts`

Servicio de timestamps externos RFC 3161 (FreeTSA.org).

#### Métodos Principales

##### `getTrustedTimestamp(dataHash: string): Promise<string | null>`

Obtiene timestamp criptográfico de FreeTSA.org.

**Ejemplo**:
```typescript
const hash = 'a1b2c3d4...'; // SHA-256 hash
const timestamp = await ExternalTimestampService.getTrustedTimestamp(hash);

if (timestamp) {
  console.log('✅ Timestamp obtained from FreeTSA.org');
  console.log(`Token: ${timestamp.substring(0, 50)}...`);
} else {
  console.log('⚠️ Timestamp service unavailable (fallback mode)');
}
```

---

##### `verifyTimestamp(tokenBase64, originalHash): Promise<boolean>`

Verifica un timestamp token.

---

## 🤖 SERVICIOS DE IA

### AICategorizerService

Ver sección [Servicios de Banca](#aicategorizerservice)

### ModernConversationalAssistant

**Ubicación**: `src/services/ai/ModernConversationalAssistant.ts`

Asistente conversacional con 45 skills especializados.

#### Skills Disponibles

- Consultas SQL inteligentes
- Análisis de recibos digitales (ARD)
- Generación de reportes
- Análisis financiero
- Recomendaciones contables
- Y 40 más...

---

## 💾 SERVICIOS DE BACKUP

### BackupService

**Ubicación**: `src/services/backup/BackupService.ts`

Sistema de backups automáticos con encriptación.

#### Métodos Principales

##### `createBackup(): Promise<string>`

Crea un backup completo de la base de datos.

---

##### `restoreBackup(backupId: string): Promise<void>`

Restaura desde un backup.

---

##### `scheduleAutoBackup(intervalHours: number): void`

Programa backups automáticos.

---

## 🔧 SERVICIOS CORE

### AuthService

**Ubicación**: `src/services/AuthService.ts`

Autenticación y autorización.

---

### UserService

**Ubicación**: `src/services/UserService.ts`

Gestión de usuarios y roles.

---

### GoogleAuthService

**Ubicación**: `src/services/GoogleAuthService.ts`

Autenticación con Google OAuth.

---

## 💾 BASE DE DATOS

### DatabaseService

**Ubicación**: `src/database/DatabaseService.ts`

Servicio principal de base de datos SQLite.

#### Características

- 45 tablas
- Integridad referencial estricta
- Auto-reparación
- Persistencia IndexedDB
- Transacciones ACID

---

## 📝 TIPOS Y INTERFACES

### Tipos Comunes

```typescript
// Moneda (siempre en centavos)
type CurrencyAmount = number;  // INTEGER cents

// Fechas (siempre ISO 8601)
type ISODate = string;  // YYYY-MM-DD

// UUIDs
type UUID = string;

// Filing Status
type FilingStatus = 'single' | 'married' | 'married_separate' | 'head_of_household';

// Pay Period
type PayPeriod = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

// Account Types
type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

// Normal Balance
type NormalBalance = 'DEBIT' | 'CREDIT';

// Period Status
type PeriodStatus = 'open' | 'closed' | 'locked';

// Transaction Status
type TransactionStatus = 'draft' | 'pending' | 'approved' | 'voided';
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Relacionada

- [Guía de Arquitectura](./ARCHITECTURE.md)
- [README Sistema Completo](../README_SISTEMA_COMPLETO.md)
- [Documentación Técnica Desarrolladores](../DOCUMENTACION_TECNICA_DESARROLLADORES.md)
- [Guía de Uso Sistema Backups](../GUIA_USO_SISTEMA_BACKUPS.md)

### Compliance y Estándares

- **US GAAP**: Generally Accepted Accounting Principles
- **IRS Publication 15**: Employer's Tax Guide (Circular E)
- **RFC 3161**: Time-Stamp Protocol (TSP)
- **FLSA**: Fair Labor Standards Act (Overtime rules)
- **Florida DR-15**: Sales and Use Tax Return

### Soporte

Para preguntas o issues:
1. Revisar documentación completa
2. Verificar ejemplos de código
3. Consultar tests unitarios en `tests/`
4. Contactar equipo de desarrollo

---

**Última Actualización**: 8 de febrero de 2026  
**Mantenido por**: Kiro AI Assistant  
**Versión del Sistema**: 4.1.0
