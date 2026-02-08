# Diseño Técnico: Wizard de Cierre Contable

**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0  
**Estado**: Draft

---

## 🏗️ ARQUITECTURA DE COMPONENTES

### Jerarquía de Componentes

```
PeriodManager.tsx (existente)
  └─> PeriodClosureWizard.tsx (nuevo)
       ├─> WizardHeader.tsx
       ├─> WizardProgress.tsx
       ├─> WizardSteps/
       │    ├─> TransactionValidationStep.tsx
       │    ├─> BankReconciliationStep.tsx
       │    ├─> AdjustmentsStep.tsx
       │    ├─> TrialBalanceStep.tsx
       │    └─> ConfirmationStep.tsx
       ├─> ClosureChecklist.tsx (nuevo)
       ├─> ClosureReport.tsx (nuevo)
       └─> WizardNavigation.tsx
```

---

## 📦 INTERFACES Y TIPOS

### Core Types

```typescript
// Wizard State
interface WizardState {
  currentStep: number;
  totalSteps: number;
  periodId: number;
  validationResults: Map<number, ValidationResult>;
  canProceed: boolean;
  isProcessing: boolean;
}

// Validation Result
interface ValidationResult {
  stepId: number;
  status: 'pending' | 'passed' | 'warning' | 'error';
  checks: CheckResult[];
  timestamp: string;
}

interface CheckResult {
  id: string;
  label: string;
  status: 'pending' | 'passed' | 'warning' | 'error';
  message?: string;
  details?: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Closure Report Data
interface ClosureReportData {
  period: AccountingPeriod;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    accountsReceivable: number;
    accountsPayable: number;
    cashBalance: number;
  };
  transactions: {
    invoices: number;
    bills: number;
    journalEntries: number;
    payments: number;
  };
  validations: ValidationResult[];
  trialBalance: TrialBalanceEntry[];
  closedBy: User;
  closedAt: string;
}
```

---

## 🔧 COMPONENTES PRINCIPALES

### 1. PeriodClosureWizard.tsx

**Props**:
```typescript
interface PeriodClosureWizardProps {
  periodId: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}
```

**Estado**:
```typescript
const [wizardState, setWizardState] = useState<WizardState>({
  currentStep: 1,
  totalSteps: 5,
  periodId,
  validationResults: new Map(),
  canProceed: false,
  isProcessing: false
});
```

**Métodos Clave**:
- `handleNextStep()` - Avanzar al siguiente paso
- `handlePreviousStep()` - Regresar al paso anterior
- `handleStepValidation()` - Ejecutar validaciones del paso actual
- `handleClosePeriod()` - Ejecutar cierre final

---

### 2. ClosureChecklist.tsx

**Props**:
```typescript
interface ClosureChecklistProps {
  periodId: number;
  autoRun?: boolean;
  onComplete: (results: ValidationResult) => void;
}
```

**Checks a Ejecutar**:
1. Todas las facturas registradas
2. Todos los gastos registrados
3. Conciliación bancaria completa
4. Inventario reconciliado
5. Depreciaciones calculadas
6. Nómina procesada
7. Asientos de ajuste registrados
8. Balance de comprobación cuadra
9. Período anterior cerrado

---

### 3. ClosureReport.tsx

**Props**:
```typescript
interface ClosureReportProps {
  data: ClosureReportData;
  onDownloadPDF: () => void;
}
```

**Secciones del Reporte**:
- Header con información del período
- Resumen financiero (cards)
- Transacciones del período (tabla)
- Validaciones ejecutadas (checklist)
- Balance de comprobación (tabla)
- Footer con firma digital

---

## 🔄 FLUJO DE DATOS

### Paso 1: Inicialización
```
Usuario hace clic en "Cerrar con Wizard"
  ↓
PeriodManager abre modal con PeriodClosureWizard
  ↓
Wizard carga datos del período
  ↓
Muestra paso 1 (Validación de Transacciones)
```

### Paso 2: Validación de Cada Paso
```
Usuario en paso N
  ↓
Wizard ejecuta validaciones del paso
  ↓
ClosureChecklist muestra resultados
  ↓
Si hay errores: Mostrar mensaje, bloquear avance
Si hay warnings: Mostrar advertencia, permitir continuar
Si todo OK: Habilitar botón "Siguiente"
```

### Paso 3: Cierre Final
```
Usuario en paso 5 (Confirmación)
  ↓
Muestra resumen completo
  ↓
Usuario hace clic en "Cerrar Período"
  ↓
Wizard llama AccountingPeriodService.closePeriod()
  ↓
Genera ClosureReport
  ↓
Muestra reporte con opción de descargar PDF
  ↓
Cierra wizard y actualiza PeriodManager
```

---

## 📊 VALIDACIONES POR PASO

### Paso 1: Transacciones
```typescript
async function validateTransactions(periodId: number): Promise<ValidationResult> {
  const period = await getPeriodById(periodId);
  const checks: CheckResult[] = [];
  
  // Check 1: Facturas registradas
  const invoices = await getInvoicesByPeriod(period.start_date, period.end_date);
  checks.push({
    id: 'invoices',
    label: 'Facturas registradas',
    status: invoices.length > 0 ? 'passed' : 'warning',
    message: `${invoices.length} facturas encontradas`
  });
  
  // Check 2: Gastos registrados
  const bills = await getBillsByPeriod(period.start_date, period.end_date);
  checks.push({
    id: 'bills',
    label: 'Gastos registrados',
    status: bills.length > 0 ? 'passed' : 'warning',
    message: `${bills.length} gastos encontrados`
  });
  
  // Check 3: No hay transacciones pendientes
  const pendingTxs = await getPendingTransactions(period.start_date, period.end_date);
  checks.push({
    id: 'pending',
    label: 'Sin transacciones pendientes',
    status: pendingTxs.length === 0 ? 'passed' : 'error',
    message: pendingTxs.length > 0 ? `${pendingTxs.length} transacciones pendientes` : 'OK'
  });
  
  const hasErrors = checks.some(c => c.status === 'error');
  
  return {
    stepId: 1,
    status: hasErrors ? 'error' : 'passed',
    checks,
    timestamp: new Date().toISOString()
  };
}
```

---

## 🎨 ESTILOS Y TEMAS

### Colores del Wizard
```typescript
const WIZARD_COLORS = {
  primary: '#3B82F6',      // Azul
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Amarillo
  error: '#EF4444',        // Rojo
  neutral: '#9CA3AF',      // Gris
  background: '#F9FAFB',   // Gris claro
  border: '#E5E7EB'        // Gris borde
};
```

### Iconos
- Paso completado: ✅
- Paso actual: 🔵
- Paso pendiente: ⚪
- Error: ❌
- Advertencia: ⚠️
- Procesando: 🔄

---

## 📄 GENERACIÓN DE PDF

### Librería: jsPDF + jspdf-autotable

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function generateClosureReportPDF(data: ClosureReportData): Blob {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('Reporte de Cierre Contable', 14, 20);
  doc.setFontSize(12);
  doc.text(`Período: ${data.period.name}`, 14, 30);
  doc.text(`Cerrado por: ${data.closedBy.name}`, 14, 36);
  doc.text(`Fecha: ${formatDate(data.closedAt)}`, 14, 42);
  
  // Resumen Financiero
  doc.setFontSize(14);
  doc.text('Resumen Financiero', 14, 55);
  autoTable(doc, {
    startY: 60,
    head: [['Concepto', 'Monto']],
    body: [
      ['Ingresos', formatCurrency(data.summary.totalRevenue)],
      ['Gastos', formatCurrency(data.summary.totalExpenses)],
      ['Utilidad Neta', formatCurrency(data.summary.netIncome)]
    ]
  });
  
  // Balance de Comprobación
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Balance de Comprobación', 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Cuenta', 'Débito', 'Crédito']],
    body: data.trialBalance.map(entry => [
      entry.accountName,
      formatCurrency(entry.debit),
      formatCurrency(entry.credit)
    ])
  });
  
  return doc.output('blob');
}
```

---

## 🧪 TESTING

### Unit Tests
- Validaciones individuales
- Lógica de navegación del wizard
- Generación de reporte

### Integration Tests
- Flujo completo del wizard
- Integración con AccountingPeriodService
- Generación de PDF

### E2E Tests
- Usuario completa cierre exitosamente
- Usuario encuentra errores y los corrige
- Usuario cancela el wizard

---

## 📦 DEPENDENCIAS

### Nuevas
```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.0"
}
```

### Existentes
- React
- TypeScript
- Tailwind CSS
- Recharts (para gráficos si se necesitan)

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Estructura Base (4 horas)
- [ ] Crear `PeriodClosureWizard.tsx`
- [ ] Crear componentes de navegación
- [ ] Implementar lógica de pasos

### Fase 2: Validaciones (6 horas)
- [ ] Crear `ClosureChecklist.tsx`
- [ ] Implementar validaciones por paso
- [ ] Crear componentes de cada paso

### Fase 3: Reporte (4 horas)
- [ ] Crear `ClosureReport.tsx`
- [ ] Implementar generación de PDF
- [ ] Diseñar layout del reporte

### Fase 4: Integración (2 horas)
- [ ] Integrar con `PeriodManager.tsx`
- [ ] Extender `AccountingPeriodService.ts`
- [ ] Testing de integración

### Fase 5: Polish (2 horas)
- [ ] Mejorar UX/UI
- [ ] Agregar animaciones
- [ ] Testing final

**Total**: 18 horas

---

**Documentado por**: Kiro AI  
**Última Actualización**: 7 de febrero de 2026
