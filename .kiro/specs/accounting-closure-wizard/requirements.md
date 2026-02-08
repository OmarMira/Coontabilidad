# Spec: Wizard de Cierre Contable (Fase 3.5)

**Fecha de Creación**: 7 de febrero de 2026  
**Estado**: Draft  
**Prioridad**: Media (Mejora de UX)  
**Tipo**: Feature Enhancement

---

## 📋 CONTEXTO

### Estado Actual del Sistema
- **Completitud General**: 96%
- **Fase 3 (Cierres Contables)**: 80% completo
- **Componentes Completados**:
  - ✅ Base de datos (tablas `accounting_periods` y `period_closure_log`)
  - ✅ Servicio `AccountingPeriodService` (~700 líneas)
  - ✅ Validaciones en 7 funciones de transacciones
  - ✅ UI básica `PeriodManager.tsx` (~450 líneas)

### ¿Por Qué Este Spec?
El sistema actual de cierres contables es **completamente funcional** pero la experiencia de usuario puede mejorarse significativamente con un wizard guiado que:
- Muestre visualmente el progreso del cierre
- Valide cada paso antes de continuar
- Genere reportes detallados
- Reduzca errores humanos

---

## 🎯 OBJETIVOS

### Objetivo Principal
Crear un wizard paso a paso que guíe al usuario a través del proceso de cierre contable mensual, asegurando que todos los requisitos se cumplan antes de cerrar el período.

### Objetivos Secundarios
1. Reducir tiempo de cierre de 30 minutos a 10 minutos
2. Eliminar errores comunes en el proceso de cierre
3. Generar documentación automática del cierre
4. Mejorar confianza del usuario en el proceso

---

## 👥 HISTORIAS DE USUARIO

### Historia 1: Contador Mensual
**Como** contador responsable del cierre mensual  
**Quiero** un wizard que me guíe paso a paso  
**Para** asegurarme de no olvidar ninguna validación crítica

**Criterios de Aceptación**:
- [ ] El wizard muestra 5 pasos claramente definidos
- [ ] Cada paso tiene indicador visual de completitud
- [ ] No puedo avanzar si el paso actual tiene errores
- [ ] Puedo ver el resumen antes de confirmar el cierre
- [ ] Recibo confirmación visual al completar el cierre

### Historia 2: Auditor Externo
**Como** auditor externo  
**Quiero** ver un reporte detallado de cada cierre  
**Para** verificar que se siguieron todos los procedimientos

**Criterios de Aceptación**:
- [ ] El reporte muestra todas las validaciones ejecutadas
- [ ] Incluye timestamp y usuario que ejecutó el cierre
- [ ] Lista todas las transacciones del período
- [ ] Muestra balance de comprobación al cierre
- [ ] Es descargable en formato PDF

### Historia 3: Gerente Financiero
**Como** gerente financiero  
**Quiero** ver el estado de cierre en tiempo real  
**Para** saber cuándo puedo generar reportes financieros

**Criterios de Aceptación**:
- [ ] Dashboard muestra períodos abiertos vs cerrados
- [ ] Puedo ver qué validaciones faltan para cerrar
- [ ] Recibo notificación cuando el cierre está completo
- [ ] Puedo ver historial de cierres anteriores

---

## 🔧 REQUISITOS FUNCIONALES

### RF-1: Wizard Multi-Paso
**Prioridad**: Alta

El wizard debe tener 5 pasos:

#### Paso 1: Validación de Transacciones
- Verificar que todas las facturas estén registradas
- Verificar que todos los gastos estén registrados
- Verificar que no haya transacciones pendientes
- Mostrar contador de transacciones por tipo

#### Paso 2: Conciliación Bancaria
- Verificar que la conciliación esté completa
- Mostrar diferencias si existen
- Permitir ir a módulo de conciliación si falta
- Mostrar fecha de última conciliación

#### Paso 3: Ajustes Contables
- Verificar depreciaciones calculadas
- Verificar asientos de ajuste registrados
- Mostrar lista de ajustes pendientes
- Permitir crear ajustes desde el wizard

#### Paso 4: Balance de Comprobación
- Generar balance de comprobación automáticamente
- Verificar que todas las cuentas cuadren
- Mostrar diferencias si existen
- Permitir drill-down a transacciones

#### Paso 5: Confirmación y Cierre
- Mostrar resumen ejecutivo del período
- Mostrar todas las validaciones pasadas
- Solicitar confirmación final
- Ejecutar cierre y generar reporte

### RF-2: Checklist Visual
**Prioridad**: Alta

Componente que muestre el estado de cada validación:
- ✅ Verde: Validación pasada
- ⚠️ Amarillo: Advertencia (puede continuar)
- ❌ Rojo: Error (debe corregirse)

Validaciones incluidas:
- [ ] Todas las facturas registradas
- [ ] Todos los gastos registrados
- [ ] Conciliación bancaria completa
- [ ] Inventario reconciliado
- [ ] Depreciaciones calculadas
- [ ] Nómina procesada (si aplica)
- [ ] Asientos de ajuste registrados
- [ ] Balance de comprobación cuadra
- [ ] Período anterior cerrado

### RF-3: Reporte de Cierre
**Prioridad**: Alta

Documento generado automáticamente que incluya:

**Sección 1: Información General**
- Nombre del período (ej: "Enero 2026")
- Fecha de inicio y fin
- Usuario que ejecutó el cierre
- Fecha y hora del cierre
- IP address y user agent (auditoría)

**Sección 2: Resumen Financiero**
- Total de ingresos del período
- Total de gastos del período
- Utilidad/pérdida neta
- Saldo de cuentas por cobrar
- Saldo de cuentas por pagar
- Saldo de efectivo

**Sección 3: Transacciones del Período**
- Número de facturas emitidas
- Número de gastos registrados
- Número de asientos contables
- Número de pagos recibidos
- Número de pagos realizados

**Sección 4: Validaciones Ejecutadas**
- Lista de todas las validaciones con resultado
- Advertencias encontradas (si las hay)
- Acciones correctivas tomadas

**Sección 5: Balance de Comprobación**
- Tabla completa de cuentas con saldos
- Total débitos = Total créditos
- Diferencia (debe ser $0.00)

**Formato**: PDF descargable

### RF-4: Integración con PeriodManager
**Prioridad**: Media

- Botón "Cerrar con Wizard" en `PeriodManager.tsx`
- Abrir wizard en modal o página completa
- Regresar a PeriodManager al completar
- Actualizar lista de períodos automáticamente

---

## 🎨 REQUISITOS NO FUNCIONALES

### RNF-1: Performance
- El wizard debe cargar en < 2 segundos
- Cada validación debe ejecutarse en < 1 segundo
- Generación de reporte PDF en < 5 segundos

### RNF-2: Usabilidad
- Navegación intuitiva (botones Anterior/Siguiente)
- Indicador de progreso visible (1/5, 2/5, etc.)
- Mensajes de error claros y accionables
- Confirmación antes de acciones irreversibles

### RNF-3: Accesibilidad
- Navegación por teclado (Tab, Enter, Esc)
- Colores con suficiente contraste
- Textos alternativos para iconos
- Compatible con lectores de pantalla

### RNF-4: Seguridad
- Solo usuarios con rol "admin" o "accountant" pueden cerrar
- Auditoría completa de cada cierre
- No se puede cerrar si hay errores críticos
- Confirmación con contraseña para cierres (opcional)

---

## 🏗️ ARQUITECTURA TÉCNICA

### Componentes a Crear

#### 1. `PeriodClosureWizard.tsx`
**Responsabilidad**: Orquestar el flujo del wizard

```typescript
interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  canSkip: boolean;
  validation: () => Promise<ValidationResult>;
}

interface PeriodClosureWizardProps {
  periodId: number;
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Validación de Transacciones',
    description: 'Verificar que todas las transacciones estén registradas',
    component: TransactionValidationStep,
    canSkip: false,
    validation: validateTransactions
  },
  // ... otros pasos
];
```

#### 2. `ClosureChecklist.tsx`
**Responsabilidad**: Mostrar estado de validaciones

```typescript
interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'passed' | 'warning' | 'error';
  message?: string;
  action?: () => void;
}

interface ClosureChecklistProps {
  periodId: number;
  onValidationComplete: (results: ValidationResult[]) => void;
}
```

#### 3. `ClosureReport.tsx`
**Responsabilidad**: Generar y mostrar reporte de cierre

```typescript
interface ClosureReportProps {
  periodId: number;
  closureData: ClosureData;
  onDownloadPDF: () => void;
}

interface ClosureData {
  period: AccountingPeriod;
  summary: PeriodSummary;
  validations: ValidationResult[];
  trialBalance: TrialBalance;
  transactions: TransactionSummary;
}
```

#### 4. Componentes de Pasos (Step Components)
- `TransactionValidationStep.tsx`
- `BankReconciliationStep.tsx`
- `AdjustmentsStep.tsx`
- `TrialBalanceStep.tsx`
- `ConfirmationStep.tsx`

### Servicios a Extender

#### `AccountingPeriodService.ts`
Agregar métodos:
```typescript
// Validaciones por paso
validateTransactions(periodId: number): Promise<ValidationResult>
validateBankReconciliation(periodId: number): Promise<ValidationResult>
validateAdjustments(periodId: number): Promise<ValidationResult>
validateTrialBalance(periodId: number): Promise<ValidationResult>

// Generación de reporte
generateClosureReport(periodId: number): Promise<ClosureReport>
exportClosureReportPDF(periodId: number): Promise<Blob>
```

### Dependencias Nuevas
- `jspdf` - Generación de PDFs
- `jspdf-autotable` - Tablas en PDFs
- Ninguna otra dependencia nueva (usar Recharts existente para gráficos)

---

## 📐 DISEÑO DE UI/UX

### Layout del Wizard

```
┌─────────────────────────────────────────────────────────────┐
│  📅 Cierre Contable: Enero 2026                    [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  1. Transacciones  2. Conciliación  3. Ajustes  4. Balance  5. Confirmar
│     (Actual)                                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                           ││
│  │  [Contenido del paso actual]                             ││
│  │                                                           ││
│  │  - Validaciones                                           ││
│  │  - Formularios                                            ││
│  │  - Tablas                                                 ││
│  │  - Gráficos                                               ││
│  │                                                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [← Anterior]                              [Siguiente →]     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Colores y Estados

| Estado | Color | Icono | Uso |
|--------|-------|-------|-----|
| Pendiente | Gris (#9CA3AF) | ⏳ | Validación no ejecutada |
| Pasado | Verde (#10B981) | ✅ | Validación exitosa |
| Advertencia | Amarillo (#F59E0B) | ⚠️ | Puede continuar con precaución |
| Error | Rojo (#EF4444) | ❌ | Debe corregirse antes de continuar |
| En Progreso | Azul (#3B82F6) | 🔄 | Validación ejecutándose |

---

## 🧪 CRITERIOS DE ACEPTACIÓN

### Criterio 1: Wizard Funcional
- [ ] El wizard se abre desde PeriodManager
- [ ] Los 5 pasos se muestran correctamente
- [ ] La navegación Anterior/Siguiente funciona
- [ ] No puedo avanzar si hay errores críticos
- [ ] Puedo cancelar en cualquier momento
- [ ] El cierre se ejecuta correctamente al final

### Criterio 2: Validaciones Correctas
- [ ] Todas las validaciones se ejecutan
- [ ] Los resultados son precisos
- [ ] Los mensajes de error son claros
- [ ] Las advertencias se muestran correctamente
- [ ] Puedo ver detalles de cada validación

### Criterio 3: Reporte Completo
- [ ] El reporte incluye todas las secciones
- [ ] Los datos son precisos
- [ ] El formato es profesional
- [ ] Se puede descargar como PDF
- [ ] El PDF es legible y bien formateado

### Criterio 4: Integración
- [ ] Se integra con PeriodManager sin problemas
- [ ] Usa AccountingPeriodService correctamente
- [ ] No rompe funcionalidad existente
- [ ] La auditoría se registra correctamente

---

## 📊 MÉTRICAS DE ÉXITO

### Métricas de Uso
- Tiempo promedio de cierre: < 10 minutos
- Tasa de errores en cierre: < 5%
- Satisfacción del usuario: > 4/5

### Métricas Técnicas
- Tiempo de carga del wizard: < 2 segundos
- Tiempo de generación de reporte: < 5 segundos
- Cobertura de tests: > 80%

---

## 🚧 RIESGOS Y MITIGACIONES

### Riesgo 1: Complejidad del Wizard
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**: Empezar con versión simple (3 pasos) y expandir

### Riesgo 2: Performance en Reportes
**Probabilidad**: Baja  
**Impacto**: Medio  
**Mitigación**: Generar reporte en background, mostrar spinner

### Riesgo 3: Validaciones Lentas
**Probabilidad**: Media  
**Impacto**: Medio  
**Mitigación**: Cachear resultados, ejecutar en paralelo

---

## 📅 ESTIMACIÓN DE TIEMPO

| Tarea | Tiempo Estimado |
|-------|-----------------|
| `PeriodClosureWizard.tsx` | 3 horas |
| `ClosureChecklist.tsx` | 2 horas |
| `ClosureReport.tsx` | 2 horas |
| Componentes de pasos (5) | 5 horas |
| Extender `AccountingPeriodService` | 2 horas |
| Integración con PeriodManager | 1 hora |
| Testing | 2 horas |
| Documentación | 1 hora |
| **TOTAL** | **18 horas** |

---

## 🎯 DEFINICIÓN DE "DONE"

Esta feature se considera completa cuando:
- [ ] Todos los componentes están implementados
- [ ] Todas las validaciones funcionan correctamente
- [ ] El reporte PDF se genera correctamente
- [ ] La integración con PeriodManager funciona
- [ ] Los tests tienen > 80% de cobertura
- [ ] La documentación está completa
- [ ] El código está revisado y aprobado
- [ ] No hay bugs críticos
- [ ] La feature está desplegada en producción

---

## 📚 REFERENCIAS

### Documentos Relacionados
- `PLAN_MAESTRO_IMPLEMENTACION.md` - Plan general
- `PROGRESO_IMPLEMENTACION.md` - Tracking de progreso
- `FASE_3_CIERRES_CONTABLES_COMPLETADA.md` - Estado actual Fase 3

### Archivos Existentes
- `src/services/accounting/AccountingPeriodService.ts` - Servicio base
- `src/components/accounting/PeriodManager.tsx` - UI actual
- `src/database/simple-db.ts` - Base de datos

### Estándares Contables
- GAAP (Generally Accepted Accounting Principles)
- Estándares de auditoría AICPA

---

**Creado por**: Kiro AI  
**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0
