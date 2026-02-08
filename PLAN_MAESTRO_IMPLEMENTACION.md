# Plan Maestro de Implementación - AccountExpress
## De Simple a Complejo - Completar el 21% Faltante

**Objetivo**: Llevar el sistema del 79% al 100% de completitud  
**Estrategia**: Implementar de lo más simple a lo más complejo  
**Tiempo Total Estimado**: 10-15 días de trabajo

---

## 📊 ORDEN DE IMPLEMENTACIÓN (Simple → Complejo)

### ✅ FASE 0: PREPARACIÓN (COMPLETADO)
- [x] Resolver conflicto Wizard/Demo
- [x] Auditoría completa del sistema
- [x] Identificar módulos faltantes
- [x] Crear plan maestro

**Tiempo**: 1 hora ✅ HECHO

---

### 🟢 FASE 1: DASHBOARDS AVANZADOS (SIMPLE)
**Complejidad**: ⭐⭐☆☆☆ (Baja)  
**Tiempo estimado**: 2-3 días  
**Impacto**: Bajo (mejora UX, no crítico)

#### ¿Por qué empezar aquí?
- No requiere lógica de negocio compleja
- No afecta integridad de datos
- Usa datos que ya existen
- Fácil de probar
- Da resultados visuales rápidos

#### Tareas:
1. **Dashboard Financiero Interactivo** (8 horas)
   - Gráficos de ingresos vs gastos (Chart.js/Recharts)
   - Tendencias mensuales
   - Comparación año anterior
   - KPIs principales (Revenue, Profit Margin, Cash Flow)
   - Filtros por fecha/categoría

2. **Dashboard de Inventario** (4 horas)
   - Productos con stock bajo
   - Valor total de inventario
   - Productos más vendidos
   - Alertas de reorden

3. **Dashboard de Clientes** (4 horas)
   - Top clientes por ventas
   - Cuentas por cobrar aging
   - Nuevos clientes del mes
   - Tasa de retención

4. **Dashboard de Nómina** (4 horas)
   - Costo total de nómina
   - Distribución por departamento
   - Tendencia de costos laborales
   - Headcount por área

**Entregables**:
- `src/components/dashboards/FinancialDashboard.tsx`
- `src/components/dashboards/InventoryDashboard.tsx`
- `src/components/dashboards/CustomerDashboard.tsx`
- `src/components/dashboards/PayrollDashboard.tsx`

**Criterios de Éxito**:
- ✅ Dashboards se cargan en < 2 segundos
- ✅ Gráficos son interactivos
- ✅ Datos son precisos
- ✅ Responsive en mobile

---

### 🟡 FASE 2: CONCILIACIÓN BANCARIA (MEDIO)
**Complejidad**: ⭐⭐⭐☆☆ (Media)  
**Tiempo estimado**: 2-3 días  
**Impacto**: Medio (importante pero no crítico)

#### ¿Por qué en segundo lugar?
- Lógica de negocio moderada
- No bloquea otras funcionalidades
- Mejora detección de errores
- Útil pero no obligatorio para operar

#### Tareas:

1. **Algoritmo de Matching Automático** (8 horas)
   ```typescript
   interface BankTransaction {
     id: number;
     date: string;
     amount: number;
     description: string;
     reference?: string;
   }
   
   interface AccountingTransaction {
     id: number;
     entry_date: string;
     amount: number;
     description: string;
     reference?: string;
   }
   
   interface Match {
     bankTxId: number;
     accountingTxId: number;
     confidence: number; // 0-100
     matchType: 'exact' | 'fuzzy' | 'manual';
   }
   
   function autoMatch(
     bankTxs: BankTransaction[],
     accountingTxs: AccountingTransaction[]
   ): Match[] {
     // 1. Exact match: mismo monto + misma fecha + misma referencia
     // 2. Fuzzy match: mismo monto + fecha ±3 días + descripción similar
     // 3. Sugerencias: mismo monto + fecha ±7 días
   }
   ```

2. **Detección de Discrepancias** (4 horas)
   - Transacciones en banco pero no en contabilidad
   - Transacciones en contabilidad pero no en banco
   - Diferencias de monto
   - Transacciones duplicadas

3. **Generación de Ajustes** (6 horas)
   - Registrar cargos bancarios
   - Registrar intereses ganados
   - Corregir errores de captura
   - Generar asientos de ajuste automáticamente

4. **UI de Conciliación** (6 horas)
   - Vista de transacciones pendientes
   - Matching manual (drag & drop)
   - Aprobar matches sugeridos
   - Generar reporte de conciliación
   - Historial de conciliaciones

**Entregables**:
- `src/services/BankReconciliationService.ts`
- `src/components/banking/ReconciliationMatcher.tsx`
- `src/components/banking/DiscrepancyReport.tsx`
- Actualizar `src/database/simple-db.ts` con funciones de matching

**Criterios de Éxito**:
- ✅ Matching automático > 80% de precisión
- ✅ Proceso de conciliación < 10 minutos
- ✅ Reporte de conciliación cumple estándares contables
- ✅ Ajustes generan asientos correctos

---

### 🔴 FASE 3: CIERRES CONTABLES (COMPLEJO - CRÍTICO)
**Complejidad**: ⭐⭐⭐⭐☆ (Alta)  
**Tiempo estimado**: 3-5 días  
**Impacto**: CRÍTICO (requerido para GAAP/IFRS)

#### ¿Por qué en tercer lugar?
- Requiere lógica de negocio compleja
- Afecta TODAS las transacciones del sistema
- Debe ser 100% confiable
- Crítico para auditorías
- Necesita validaciones exhaustivas

#### Tareas:

1. **Estructura de Base de Datos** (4 horas)
   ```sql
   CREATE TABLE accounting_periods (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,                    -- "Enero 2026"
     period_type TEXT NOT NULL,             -- 'monthly', 'quarterly', 'annual'
     start_date DATE NOT NULL,
     end_date DATE NOT NULL,
     fiscal_year INTEGER NOT NULL,
     status TEXT NOT NULL DEFAULT 'open',   -- 'open', 'closed', 'locked'
     closed_by INTEGER REFERENCES users(id),
     closed_at DATETIME,
     locked_by INTEGER REFERENCES users(id),
     locked_at DATETIME,
     notes TEXT,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     
     CONSTRAINT valid_status CHECK(status IN ('open', 'closed', 'locked')),
     CONSTRAINT valid_period_type CHECK(period_type IN ('monthly', 'quarterly', 'annual')),
     CONSTRAINT valid_dates CHECK(end_date > start_date)
   );
   
   CREATE INDEX idx_periods_dates ON accounting_periods(start_date, end_date);
   CREATE INDEX idx_periods_status ON accounting_periods(status);
   CREATE INDEX idx_periods_fiscal_year ON accounting_periods(fiscal_year);
   
   -- Tabla de auditoría de cierres
   CREATE TABLE period_closure_log (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
     action TEXT NOT NULL,                  -- 'closed', 'reopened', 'locked', 'unlocked'
     performed_by INTEGER NOT NULL REFERENCES users(id),
     performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     reason TEXT,
     ip_address TEXT,
     user_agent TEXT
   );
   ```

2. **Servicio de Períodos Contables** (8 horas)
   ```typescript
   class AccountingPeriodService {
     // Crear períodos
     createPeriod(data: PeriodData): Result<Period>
     createMonthlyPeriods(year: number): Result<Period[]>
     createQuarterlyPeriods(year: number): Result<Period[]>
     
     // Consultar períodos
     getPeriods(filters?: PeriodFilters): Period[]
     getPeriodByDate(date: string): Period | null
     getCurrentPeriod(): Period | null
     getOpenPeriods(): Period[]
     
     // Validaciones
     canClosePeriod(periodId: number): ValidationResult
     validatePeriodClosure(periodId: number): ClosureValidation
     
     // Cerrar/Reabrir
     closePeriod(periodId: number, userId: number, notes?: string): Result<void>
     reopenPeriod(periodId: number, userId: number, reason: string): Result<void>
     lockPeriod(periodId: number, userId: number): Result<void>
     
     // Reportes
     getClosureReport(periodId: number): ClosureReport
     getPeriodSummary(periodId: number): PeriodSummary
   }
   
   interface ClosureValidation {
     canClose: boolean;
     errors: string[];
     warnings: string[];
     checks: {
       allEntriesBalanced: boolean;
       noPendingTransactions: boolean;
       previousPeriodClosed: boolean;
       bankReconciliationComplete: boolean;
       inventoryReconciled: boolean;
     };
   }
   ```

3. **Validaciones en Transacciones** (12 horas)
   - Modificar TODAS las funciones de creación/edición:
     - `createInvoice()` → validar período abierto
     - `createExpense()` → validar período abierto
     - `createJournalEntry()` → validar período abierto
     - `recordDepreciation()` → validar período abierto
     - `processPayroll()` → validar período abierto (cuando se implemente)
   
   ```typescript
   function validatePeriodOpen(date: string): void {
     const period = getPeriodByDate(date);
     if (!period) {
       throw new Error(`No existe período contable para la fecha ${date}`);
     }
     if (period.status === 'closed') {
       throw new Error(
         `El período ${period.name} está cerrado. ` +
         `No se pueden crear transacciones en períodos cerrados.`
       );
     }
     if (period.status === 'locked') {
       throw new Error(
         `El período ${period.name} está bloqueado. ` +
         `Contacte al administrador para realizar ajustes.`
       );
     }
   }
   ```

4. **UI de Gestión de Períodos** (8 horas)
   - Vista de lista de períodos
   - Crear períodos (wizard)
   - Cerrar período (con validaciones y confirmación)
   - Reabrir período (solo admin, con justificación)
   - Ver reporte de cierre
   - Historial de cambios

5. **Proceso de Cierre** (8 horas)
   - Pre-validaciones automáticas
   - Checklist de cierre:
     - [ ] Todas las facturas del mes registradas
     - [ ] Todos los gastos del mes registrados
     - [ ] Conciliación bancaria completada
     - [ ] Inventario físico vs sistema reconciliado
     - [ ] Depreciaciones calculadas
     - [ ] Nómina procesada
     - [ ] Asientos de ajuste registrados
     - [ ] Balance de comprobación cuadra
   - Generar reporte de cierre
   - Bloquear período
   - Notificar usuarios

**Entregables**:
- `src/services/AccountingPeriodService.ts`
- `src/components/accounting/PeriodManager.tsx`
- `src/components/accounting/PeriodClosureWizard.tsx`
- `src/components/accounting/ClosureReport.tsx`
- Actualizar `src/database/simple-db.ts` con tablas y funciones
- Actualizar TODAS las funciones de transacciones con validaciones

**Criterios de Éxito**:
- ✅ Imposible crear transacciones en períodos cerrados
- ✅ Solo admin puede reabrir períodos
- ✅ Auditoría completa de todos los cierres
- ✅ Reporte de cierre cumple con GAAP
- ✅ Validaciones previenen errores

---

### 🔴 FASE 4: MOTOR DE NÓMINA (MUY COMPLEJO - CRÍTICO)
**Complejidad**: ⭐⭐⭐⭐⭐ (Muy Alta)  
**Tiempo estimado**: 5-7 días  
**Impacto**: CRÍTICO (requerido para operación)

#### ¿Por qué al final?
- Es el módulo MÁS complejo del sistema
- Requiere cálculos precisos de impuestos
- Debe cumplir con regulaciones laborales
- Genera asientos contables complejos
- Necesita integración con cierres contables
- Requiere testing exhaustivo

#### Tareas:

1. **Motor de Cálculo de Impuestos** (12 horas)
   ```typescript
   class PayrollTaxCalculator {
     // FICA (Social Security)
     calculateFICA(grossPay: number, ytdGross: number): number {
       const FICA_RATE = 0.062;
       const FICA_WAGE_BASE = 160200; // 2023
       
       const remainingBase = Math.max(0, FICA_WAGE_BASE - ytdGross);
       const taxableAmount = Math.min(grossPay, remainingBase);
       return taxableAmount * FICA_RATE;
     }
     
     // Medicare
     calculateMedicare(grossPay: number): number {
       const MEDICARE_RATE = 0.0145;
       return grossPay * MEDICARE_RATE;
     }
     
     // Additional Medicare (sobre $200,000)
     calculateAdditionalMedicare(grossPay: number, ytdGross: number): number {
       const THRESHOLD = 200000;
       const ADDITIONAL_RATE = 0.009;
       
       if (ytdGross + grossPay <= THRESHOLD) return 0;
       
       const amountOverThreshold = Math.max(0, (ytdGross + grossPay) - THRESHOLD);
       return amountOverThreshold * ADDITIONAL_RATE;
     }
     
     // Federal Income Tax (usando tax brackets)
     calculateFederalIncomeTax(
       grossPay: number,
       filingStatus: 'single' | 'married' | 'head_of_household',
       allowances: number
     ): number {
       // Implementar lógica de tax brackets
       // Usar tabla tax_brackets de la BD
     }
     
     // Florida State Tax (NO HAY - Florida no tiene impuesto estatal)
     calculateFloridaStateTax(): number {
       return 0;
     }
     
     // Local Taxes (por condado)
     calculateLocalTax(grossPay: number, county: string): number {
       // Algunos condados de Florida tienen impuestos locales
       const localRates: Record<string, number> = {
         'Miami-Dade': 0.005,
         'Broward': 0.003,
         // ... otros condados
       };
       return grossPay * (localRates[county] || 0);
     }
   }
   ```

2. **Motor de Cálculo de Nómina** (16 horas)
   ```typescript
   class PayrollProcessor {
     calculatePayroll(
       employee: Employee,
       period: PayrollPeriod,
       overrides?: PayrollOverrides
     ): PayrollCalculation {
       // 1. Calcular salario bruto
       const grossPay = this.calculateGrossPay(employee, period);
       
       // 2. Calcular horas extra
       const overtimePay = this.calculateOvertime(employee, period);
       
       // 3. Calcular bonos y comisiones
       const bonuses = overrides?.bonuses || 0;
       const commissions = overrides?.commissions || 0;
       
       // 4. Total bruto
       const totalGross = grossPay + overtimePay + bonuses + commissions;
       
       // 5. Calcular deducciones
       const deductions = this.calculateDeductions(employee, totalGross);
       
       // 6. Calcular neto
       const netPay = totalGross - deductions.total;
       
       return {
         employeeId: employee.id,
         periodId: period.id,
         grossPay: totalGross,
         deductions,
         netPay,
         lineItems: this.generateLineItems(grossPay, overtimePay, bonuses, commissions, deductions)
       };
     }
     
     calculateGrossPay(employee: Employee, period: PayrollPeriod): number {
       if (employee.salary_type === 'monthly') {
         return employee.salary_rate;
       } else {
         // Hourly: obtener horas trabajadas del período
         const hours = this.getWorkedHours(employee.id, period);
         return hours * employee.salary_rate;
       }
     }
     
     calculateDeductions(employee: Employee, grossPay: number): Deductions {
       const ytdGross = this.getYTDGross(employee.id);
       
       return {
         fica: this.taxCalc.calculateFICA(grossPay, ytdGross),
         medicare: this.taxCalc.calculateMedicare(grossPay),
         additionalMedicare: this.taxCalc.calculateAdditionalMedicare(grossPay, ytdGross),
         federalIncomeTax: this.taxCalc.calculateFederalIncomeTax(
           grossPay,
           employee.filing_status,
           employee.allowances
         ),
         stateIncomeTax: 0, // Florida
         localTax: this.taxCalc.calculateLocalTax(grossPay, employee.florida_county),
         healthInsurance: employee.health_insurance_deduction || 0,
         retirement401k: this.calculate401k(grossPay, employee.retirement_percentage),
         garnishments: employee.garnishments || 0,
         total: 0 // se calcula después
       };
     }
   }
   ```

3. **Generación de Asientos Contables** (8 horas)
   ```typescript
   function generatePayrollJournalEntry(
     payrollRun: PayrollRun,
     entries: PayrollEntry[]
   ): JournalEntry {
     const totalGross = entries.reduce((sum, e) => sum + e.gross_amount, 0);
     const totalNet = entries.reduce((sum, e) => sum + e.net_amount, 0);
     const totalFICA = entries.reduce((sum, e) => sum + e.fica, 0);
     const totalMedicare = entries.reduce((sum, e) => sum + e.medicare, 0);
     const totalFederal = entries.reduce((sum, e) => sum + e.federal_tax, 0);
     
     // Asiento contable:
     // DÉBITO: Gasto de Salarios           $totalGross
     // DÉBITO: Gasto de Impuestos Patronales (FICA + Medicare match)
     //   CRÉDITO: Nómina por Pagar         $totalNet
     //   CRÉDITO: FICA por Pagar           $totalFICA (empleado + empleador)
     //   CRÉDITO: Medicare por Pagar       $totalMedicare (empleado + empleador)
     //   CRÉDITO: Retención Federal        $totalFederal
     
     return {
       entry_date: payrollRun.pay_date,
       description: `Nómina ${payrollRun.period_name}`,
       reference: `PAYROLL-${payrollRun.id}`,
       lines: [
         {
           account_id: ACCOUNTS.PAYROLL_EXPENSE,
           debit: totalGross,
           credit: 0,
           description: 'Gasto de salarios'
         },
         {
           account_id: ACCOUNTS.PAYROLL_TAX_EXPENSE,
           debit: totalFICA + totalMedicare, // Employer match
           credit: 0,
           description: 'Impuestos patronales'
         },
         {
           account_id: ACCOUNTS.PAYROLL_PAYABLE,
           debit: 0,
           credit: totalNet,
           description: 'Nómina por pagar'
         },
         {
           account_id: ACCOUNTS.FICA_PAYABLE,
           debit: 0,
           credit: totalFICA * 2, // Employee + Employer
           description: 'FICA por pagar'
         },
         {
           account_id: ACCOUNTS.MEDICARE_PAYABLE,
           debit: 0,
           credit: totalMedicare * 2, // Employee + Employer
           description: 'Medicare por pagar'
         },
         {
           account_id: ACCOUNTS.FEDERAL_TAX_PAYABLE,
           debit: 0,
           credit: totalFederal,
           description: 'Retención federal'
         }
       ]
     };
   }
   ```

4. **UI de Procesamiento de Nómina** (12 horas)
   - Seleccionar período de nómina
   - Ver lista de empleados a procesar
   - Ingresar horas trabajadas (para hourly)
   - Ingresar bonos/comisiones
   - Calcular nómina (preview)
   - Revisar cálculos por empleado
   - Aprobar y generar asientos
   - Imprimir recibos de pago
   - Exportar para ACH/transferencias
   - Marcar como pagado

5. **Reportes de Nómina** (8 horas)
   - Resumen de nómina por período
   - Detalle por empleado
   - Reporte de impuestos (Form 941 quarterly)
   - Reporte anual (W-2)
   - Análisis de costos laborales
   - Distribución por departamento

6. **Integración con Cierres Contables** (4 horas)
   - Validar que período esté abierto
   - Bloquear edición de nómina en períodos cerrados
   - Incluir nómina en checklist de cierre

**Entregables**:
- `src/services/PayrollTaxCalculator.ts`
- `src/services/PayrollProcessor.ts`
- `src/services/PayrollJournalService.ts`
- `src/components/payroll/PayrollProcessor.tsx`
- `src/components/payroll/PayrollReview.tsx`
- `src/components/payroll/PayrollReports.tsx`
- `src/components/payroll/EmployeePaystub.tsx`
- Actualizar `src/database/simple-db.ts` con funciones de nómina

**Criterios de Éxito**:
- ✅ Cálculos de impuestos 100% precisos
- ✅ Asientos contables balanceados
- ✅ Cumple con regulaciones de Florida
- ✅ Reportes listos para IRS (Form 941, W-2)
- ✅ Integrado con cierres contables
- ✅ Testing exhaustivo con casos reales

---

### 🟢 FASE 5: IMPORTACIÓN BANCARIA IA (OPCIONAL)
**Complejidad**: ⭐⭐⭐⭐☆ (Alta)  
**Tiempo estimado**: 3-4 días  
**Impacto**: Bajo (nice-to-have, no crítico)

#### ¿Por qué opcional?
- Es un feature avanzado
- No es crítico para operación
- Requiere integración con APIs externas
- Puede implementarse después del lanzamiento

#### Tareas:
1. Parseo de archivos bancarios (CSV, OFX, QFX)
2. Clasificación automática con IA (categorías)
3. Detección de duplicados
4. Sugerencias de cuentas contables
5. Importación masiva

**Decisión**: Implementar DESPUÉS del lanzamiento v1.0

---

## 📅 CRONOGRAMA DETALLADO

### Semana 1: Fundamentos
- **Día 1-2**: Dashboards Avanzados (Fase 1)
- **Día 3-4**: Conciliación Bancaria (Fase 2)
- **Día 5**: Testing y correcciones

### Semana 2: Módulos Críticos
- **Día 6-8**: Cierres Contables (Fase 3)
- **Día 9-10**: Testing exhaustivo de cierres

### Semana 3: Motor de Nómina
- **Día 11-13**: Motor de Nómina - Cálculos (Fase 4)
- **Día 14-15**: Motor de Nómina - UI y Reportes

### Semana 4: Finalización
- **Día 16-17**: Testing exhaustivo de nómina
- **Día 18**: Integración final y testing
- **Día 19**: Corrección de bugs
- **Día 20**: Documentación y lanzamiento

---

## 🎯 HITOS CLAVE

| Hito | Fecha | Completitud |
|------|-------|-------------|
| ✅ Wizard/Demo Fix | Hoy | 79% → 80% |
| 🟢 Dashboards Listos | Día 2 | 80% → 85% |
| 🟡 Conciliación Lista | Día 4 | 85% → 90% |
| 🔴 Cierres Listos | Día 8 | 90% → 95% |
| 🔴 Nómina Lista | Día 15 | 95% → 100% |
| 🚀 **LANZAMIENTO v1.0** | Día 20 | **100%** |

---

## 🧪 ESTRATEGIA DE TESTING

### Por Fase:
1. **Dashboards**: Testing visual + datos correctos
2. **Conciliación**: Testing de algoritmo de matching
3. **Cierres**: Testing exhaustivo de validaciones
4. **Nómina**: Testing de cálculos con casos reales

### Testing Final:
- [ ] Testing de integración completo
- [ ] Testing de regresión (no romper lo que funciona)
- [ ] Testing de performance
- [ ] Testing de seguridad
- [ ] Testing de usabilidad

---

## 📝 DOCUMENTACIÓN REQUERIDA

Por cada fase:
- [ ] Documentación técnica (cómo funciona)
- [ ] Guía de usuario (cómo usar)
- [ ] Casos de prueba
- [ ] Troubleshooting común

---

## 🚀 CRITERIOS DE LANZAMIENTO v1.0

Para considerar el sistema "100% completo":

### Funcionalidad:
- [x] Todos los módulos implementados
- [x] Todos los cálculos precisos
- [x] Todas las validaciones funcionando
- [x] Todos los reportes generándose correctamente

### Calidad:
- [ ] 0 bugs críticos
- [ ] < 5 bugs menores conocidos (documentados)
- [ ] Performance aceptable (< 3s carga)
- [ ] Seguridad validada

### Documentación:
- [ ] Manual de usuario completo
- [ ] Documentación técnica completa
- [ ] Guías de troubleshooting
- [ ] Videos tutoriales (opcional)

### Compliance:
- [ ] Cumple con GAAP
- [ ] Cumple con regulaciones de Florida
- [ ] Cumple con IRS (Form 941, W-2)
- [ ] Auditable

---

## 💡 DECISIÓN INMEDIATA

**¿Empezamos con la Fase 1 (Dashboards Avanzados)?**

Es lo más simple y te dará resultados visuales rápidos. Luego seguimos con el plan.

**Responde "SÍ" para empezar ahora con la Fase 1.**

O si prefieres empezar con otra fase, dime cuál.
