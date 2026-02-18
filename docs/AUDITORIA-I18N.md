# Auditoría de Internacionalización (i18n)

**Fecha**: 2026-02-16
**Sistema**: AccountExpress v0.2.0-stable-build
**Idiomas soportados**: Español (es), Inglés (en)
**Hook i18n**: `useLocale()` de `@/i18n/useLocale`
**Archivos de traducción**: `src/locales/en.json`, `src/locales/es.json`

---

## RESUMEN EJECUTIVO

| Métrica | Cantidad |
|---------|----------|
| Componentes .tsx totales auditados | 154 |
| Componentes CON `useLocale` (i18n OK) | 101 |
| Componentes SIN `useLocale` (i18n FALTANTE) | 53 |
| Módulos completos sin i18n | 8 |
| Páginas principales afectadas | ~15+ |

> **Impacto**: ~34% de los componentes no tienen integración i18n. Incluyen módulos completos como Inventory, Payroll, Budgets, Setup, Security, DR15, entre otros.

---

## COMPONENTES SIN i18n POR MÓDULO

### 🔴 Prioridad ALTA — Módulos completos sin i18n

#### 1. `components/inventory/` — 7 archivos (0/7 con i18n)

| Archivo | Impacto |
|---------|---------|
| `InventoryDashboard.tsx` | Alto — Dashboard principal del módulo |
| `InventoryMovements.tsx` | Alto — Movimientos de inventario |
| `InventoryAdjustments.tsx` | Alto — Ajustes de inventario |
| `InventoryReports.tsx` | Alto — Reportes de inventario |
| `InventoryKardexViewer.tsx` | Medio — Visor de kardex |
| `ProductKardexReport.tsx` | Medio — Reporte kardex de producto |
| `LocationsManager.tsx` | Medio — Gestión de ubicaciones |

#### 2. `components/payroll/` — 8 archivos (2/10 con i18n)

| Archivo | Impacto |
|---------|---------|
| `PayrollProcessorUI.tsx` | Alto — UI principal de procesamiento |
| `PayrollReview.tsx` | Alto — Revisión de nómina |
| `PayrollEntryList.tsx` | Alto — Lista de registros de nómina |
| `PayrollReports.tsx` | Alto — Reportes de nómina |
| `PayrollReportsPanel.tsx` | Alto — Panel de reportes |
| `PayrollSettings.tsx` | Medio — Configuración de nómina |
| `PayrollSlip.tsx` | Medio — Recibo de nómina |
| `EmployeePaystub.tsx` | Medio — Comprobante de pago |

#### 3. `components/budgets/` — 7 archivos (1/8 con i18n)

| Archivo | Impacto |
|---------|---------|
| `BudgetList.tsx` | Alto — Lista de presupuestos |
| `BudgetForm.tsx` | Alto — Formulario de presupuesto |
| `BudgetDetailView.tsx` | Alto — Vista detalle de presupuesto |
| `BudgetLineEditor.tsx` | Alto — Editor de líneas |
| `BudgetLinesTable.tsx` | Alto — Tabla de líneas |
| `reports/BudgetPerformanceChart.tsx` | Medio — Gráfico de rendimiento |
| `reports/BudgetVarianceReport.tsx` | Medio — Reporte de varianzas |

#### 4. `components/setup/` — 7 archivos (0/7 con i18n)

| Archivo | Impacto |
|---------|---------|
| `InitialSetupWizard.tsx` | Alto — Wizard de configuración inicial |
| `OnboardingWizard.tsx` | Alto — Wizard de onboarding |
| `steps/WelcomeStep.tsx` | Alto — Paso de bienvenida |
| `steps/CompanyStep.tsx` | Alto — Paso de empresa |
| `steps/AdminStep.tsx` | Alto — Paso de administrador |
| `steps/SecurityStep.tsx` | Alto — Paso de seguridad |
| `steps/ConfirmationStep.tsx` | Alto — Paso de confirmación |

#### 5. `components/dr15/` — 5 archivos (0/5 con i18n)

| Archivo | Impacto |
|---------|---------|
| `DR15PreparationWizard.tsx` | Alto — Wizard de preparación DR-15 |
| `DORComplianceChecklist.tsx` | Alto — Checklist compliance DOR |
| `CountyBreakdownTable.tsx` | Alto — Tabla desglose por condado |
| `TaxComponents.tsx` | Medio — Componentes fiscales |
| `DR15PreparationWizard.test.tsx` | Bajo — Test (no necesita i18n) |

---

### 🟡 Prioridad MEDIA — Componentes funcionales sin i18n

#### 6. `components/ai/` — 4 archivos (0/4 con i18n)

| Archivo | Impacto |
|---------|---------|
| `UnifiedAssistant.tsx` | Alto — Asistente AI principal |
| `AIProposalPanel.tsx` | Alto — Panel de propuestas AI |
| `RepairProposalCard.tsx` | Medio — Tarjeta de propuesta reparación |
| `RepairHistoryPanel.tsx` | Medio — Historial de reparaciones |

#### 7. `components/assets/` — 6 archivos (1/7 con i18n)

| Archivo | Impacto |
|---------|---------|
| `AssetForm.tsx` | Alto — Formulario de activo fijo |
| `AssetDetailView.tsx` | Alto — Vista detalle de activo |
| `AssetDisposalForm.tsx` | Alto — Formulario de baja de activo |
| `reports/AssetRegisterReport.tsx` | Medio — Reporte de registro |
| `reports/DepreciationScheduleReport.tsx` | Medio — Cronograma de depreciación |
| `reports/DisposalSummaryReport.tsx` | Medio — Resumen de bajas |

#### 8. `components/backup/` — 3 archivos (0/3 con i18n)

| Archivo | Impacto |
|---------|---------|
| `BackupLocationSelector.tsx` | Medio — Selector de ubicación |
| `BackupRestoreModal.tsx` | Medio — Modal de restauración |
| `BackupRestoreWizard.tsx` | Medio — Wizard de restauración |

#### 9. `components/security/` — 3 archivos (0/3 con i18n)

| Archivo | Impacto |
|---------|---------|
| `SystemIntegrityGate.tsx` | Alto — Gate de integridad del sistema |
| `SystemRepairPanel.tsx` | Alto — Panel de reparación |
| `SystemWarningBanner.tsx` | Alto — Banner de alerta del sistema |

#### 10. `components/maintenance/` — 2 archivos (0/2 con i18n)

| Archivo | Impacto |
|---------|---------|
| `DatabaseMaintenance.tsx` | Medio — Mantenimiento de base de datos |
| `RepairCompleteModal.tsx` | Medio — Modal de reparación completa |

#### 11. `components/settings/` — 2 archivos (0/2 con i18n)

| Archivo | Impacto |
|---------|---------|
| `BackupRecoveryPanel.tsx` | Medio — Panel de backup/recovery |
| `CloudBackupSettings.tsx` | Medio — Configuración backup cloud |

#### 12. `components/invoices/subcomponents/` — 3 archivos (0/3 con i18n)

| Archivo | Impacto |
|---------|---------|
| `CustomerSelector.tsx` | Alto — Selector de cliente en factura |
| `InvoiceLinesEditor.tsx` | Alto — Editor de líneas de factura |
| `TaxSummary.tsx` | Alto — Resumen de impuestos |

#### 13. `components/invoices/` — 2 archivos adicionales

| Archivo | Impacto |
|---------|---------|
| `ARComponents.tsx` | Medio — Componentes de cuentas por cobrar |
| `InvoiceForm.tsx` (en invoices/) | Alto — Formulario de factura (duplicado) |

---

### 🟢 Prioridad BAJA — Componentes técnicos/auxiliares sin i18n

#### 14. `components/elite/` — 5 archivos (0/5, componentes UI base)

| Archivo | Impacto |
|---------|---------|
| `EliteBadge.tsx` | Bajo — Badge reutilizable |
| `ElitePageHeader.tsx` | Medio — Header de página |
| `EliteSearchBar.tsx` | Medio — Barra de búsqueda |
| `EliteStatsCard.tsx` | Bajo — Tarjeta de estadísticas |
| `EliteTable.tsx` | Bajo — Tabla reutilizable |

#### 15. `components/ui/` — 6 archivos (0/7, 1 tiene i18n: AddressAutocomplete)

| Archivo | Impacto |
|---------|---------|
| `alert.tsx` | Bajo — Componente UI genérico |
| `badge.tsx` | Bajo — Componente UI genérico |
| `button.tsx` | Bajo — Componente UI genérico |
| `card.tsx` | Bajo — Componente UI genérico |
| `input.tsx` | Bajo — Componente UI genérico |
| `label.tsx` | Bajo — Componente UI genérico |

#### 16. Archivos individuales sin i18n

| Archivo | Impacto | Notas |
|---------|---------|-------|
| `FinancialDashboardPanel.tsx` | Alto | Panel financiero del dashboard |
| `HelpCenter.tsx` | Alto | Centro de ayuda completo |
| `ModulePlaceholder.tsx` | Medio | Placeholder de módulos futuros |
| `AppRouter.tsx` | Bajo | Routing, mínimo texto visible |
| `LanguageSelector.tsx` | Bajo | Selector de idioma (probablemente tiene texto mínimo) |
| `LoadingSpinner.tsx` | Bajo | Spinner de carga |
| `dashboard/TaxComplianceWidget.tsx` | Alto | Widget fiscal del dashboard |
| `admin/SystemAudit.tsx` | Medio | Auditoría del sistema |
| `demo/AsyncOperationsDemo.tsx` | Bajo | Demo de operaciones async |
| `monitoring/WorkerPoolMetrics.tsx` | Bajo | Métricas de workers |
| `forensic/ForensicSentinelDashboard.tsx` | Medio | Dashboard forense |
| `emergency/EmergencyScreen.tsx` | Medio | Pantalla de emergencia |
| `error/DynamicErrorBoundary.tsx` | Bajo | Error boundary |
| `auth/ProtectedRoute.tsx` | Bajo | Ruta protegida (routing) |
| `auth/RolesDiagnostic.tsx` | Bajo | Diagnóstico de roles |
| `common/WorkerProgress.tsx` | Bajo | Progreso de workers |
| `ard/ARDPDFReport.tsx` | Bajo | Generador PDF (no UI directa) |

---

## CLASIFICACIÓN DE ARCHIVOS QUE NO NECESITAN i18n

Estos archivos no requieren corrección porque:

- **Test files**: `InvoiceForm.test.tsx`, `AuditTrailMonitor.test.tsx`, `TaxComplianceWidget.test.tsx`, `DR15PreparationWizard.test.tsx`
- **UI primitivos sin texto**: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `alert.tsx` (reciben texto via props/children)
- **Routing/Logic only**: `AppRouter.tsx`, `ProtectedRoute.tsx`
- **PDF generation**: `ARDPDFReport.tsx` (no UI directa)
- **Loading/Tech**: `LoadingSpinner.tsx`, `WorkerProgress.tsx`, `WorkerPoolMetrics.tsx`

**Componentes que realmente necesitan corrección**: ~53 (excluyendo los ~14 que no necesitan i18n)

---

## PLAN DE CORRECCIÓN

### Fase 1: Componentes Críticos (Prioridad ALTA) — ~25 archivos

- [ ] `inventory/` — 7 archivos
- [ ] `payroll/` — 8 archivos
- [ ] `budgets/` — 7 archivos
- [ ] `setup/` — 7 archivos
- [ ] `dr15/` — 4 archivos (- test)
- [ ] `invoices/subcomponents/` — 3 archivos
- [ ] `FinancialDashboardPanel.tsx`
- [ ] `HelpCenter.tsx`
- [ ] `dashboard/TaxComplianceWidget.tsx`

### Fase 2: Componentes Funcionales (Prioridad MEDIA) — ~20 archivos

- [ ] `ai/` — 4 archivos
- [ ] `assets/` — 6 archivos
- [ ] `backup/` — 3 archivos
- [ ] `security/` — 3 archivos
- [ ] `maintenance/` — 2 archivos
- [ ] `settings/` — 2 archivos
- [ ] `elite/ElitePageHeader.tsx`, `elite/EliteSearchBar.tsx`

### Fase 3: Componentes Menores (Prioridad BAJA) — ~10 archivos

- [ ] `forensic/ForensicSentinelDashboard.tsx`
- [ ] `emergency/EmergencyScreen.tsx`
- [ ] `admin/SystemAudit.tsx`
- [ ] `auth/RolesDiagnostic.tsx`
- [ ] `ModulePlaceholder.tsx`
- [ ] Otros componentes con texto visible mínimo

---

## PATRÓN DE CORRECCIÓN (para Fase 2)

```typescript
// 1. Agregar import
import { useLocale } from '@/i18n/useLocale';

// 2. Agregar hook dentro del componente
const { t } = useLocale();

// 3. Reemplazar textos hardcodeados
// ❌ <h1>Inventory Dashboard</h1>
// ✅ <h1>{t('inventory.dashboardTitle')}</h1>

// 4. Agregar keys en en.json y es.json
```

---

*Generado automáticamente por auditoría i18n — 2026-02-16*
