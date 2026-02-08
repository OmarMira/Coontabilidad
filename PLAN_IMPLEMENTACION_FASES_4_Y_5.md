# 🚀 Plan de Implementación: Fases 4 y 5

**Fecha**: 7 de febrero de 2026  
**Objetivo**: Completar sistema al 100%  
**Tiempo Estimado Total**: 20-28 horas (2.5-3.5 días)

---

## 📊 ESTADO ACTUAL

### Fase 4: Motor de Nómina
- **Progreso**: 40% completado
- **Backend**: ✅ 100% completo
- **Frontend**: ⏳ 0% completo
- **Tiempo Restante**: 15-21 horas

### Fase 5: Bank Import AI
- **Progreso**: 0% completado
- **Spec**: ✅ 100% completo
- **Tiempo Estimado**: 24-32 horas

---

## 🎯 ESTRATEGIA RECOMENDADA

### Opción A: Completar Fase 4 Primero (RECOMENDADO)
**Razón**: Nómina es más crítica para usuarios que Bank Import

**Timeline**:
1. **Día 1-2**: Completar Fase 4 (UI + Reportes + Integración)
2. **Día 3**: Testing y validación de Fase 4
3. **Día 4-6**: Implementar Fase 5 completa
4. **Día 7**: Testing final y lanzamiento

**Ventajas**:
- ✅ Nómina funcional más rápido
- ✅ Validación incremental
- ✅ Menor riesgo de bugs

### Opción B: Implementar Ambas en Paralelo
**Razón**: Lanzamiento más rápido

**Timeline**:
1. **Día 1-3**: Implementar ambas fases simultáneamente
2. **Día 4**: Testing exhaustivo de ambas
3. **Día 5**: Lanzamiento

**Desventajas**:
- ⚠️ Mayor complejidad
- ⚠️ Más difícil de debuggear
- ⚠️ Testing más complejo

---

## 📋 FASE 4: MOTOR DE NÓMINA (Completar)

### ✅ YA COMPLETADO (40%)
1. ✅ Estructura de base de datos
2. ✅ PayrollTaxCalculator (cálculos de impuestos)
3. ✅ PayrollProcessor (procesamiento de nómina)
4. ✅ PayrollJournalService (asientos contables)

### ⏳ PENDIENTE (60%)

#### **Tarea 1: UI de Procesamiento** (4-6 horas)
**Archivos a Crear**:
- `src/components/payroll/PayrollProcessorUI.tsx` (ya existe, actualizar)
- `src/components/payroll/PayrollReview.tsx` (ya existe, actualizar)
- `src/components/payroll/EmployeePaystub.tsx` (ya existe, actualizar)

**Funcionalidades**:
1. **PayrollProcessorUI.tsx**:
   - Formulario para seleccionar employee
   - Inputs para pay period dates
   - Inputs para hours, bonuses, commissions, deductions
   - Preview de cálculos (gross, taxes, net)
   - Botón para aprobar y procesar
   - Manejo de errores y validaciones

2. **PayrollReview.tsx**:
   - Lista de payrolls procesados
   - Filtros por employee, date range, status
   - Detalles de cada payroll
   - Opción para ver journal entry
   - Opción para void payroll

3. **EmployeePaystub.tsx**:
   - Pay stub detallado
   - Todas las deducciones
   - YTD totals
   - Opción para descargar PDF

4. **Integración**:
   - Agregar rutas en App.tsx
   - Agregar sección "Nómina" en Sidebar
   - Conectar con PayrollProcessor service

**Prioridad**: 🔴 ALTA

---

#### **Tarea 2: Reportes de Nómina** (4-6 horas)
**Archivos a Crear**:
- `src/services/payroll/PayrollReportGenerator.ts`
- `src/components/payroll/PayrollReports.tsx`

**Funcionalidades**:
1. **PayrollReportGenerator.ts**:
   - `generateForm941()`: Reporte trimestral para IRS
   - `generateW2()`: Reporte anual por empleado
   - `generateW3()`: Resumen anual de todos los W-2
   - `exportForm941ToPDF()`: Exportar Form 941 a PDF
   - `exportW2ToPDF()`: Exportar W-2 a PDF

2. **PayrollReports.tsx**:
   - Sección para Form 941 (quarterly)
   - Selector de quarter y year
   - Preview de datos
   - Botón para descargar PDF
   - Sección para W-2 (annual)
   - Lista de employees
   - Botón para generar W-3
   - Análisis de costos laborales
   - Gráficos de tendencias

**Prioridad**: 🟡 MEDIA

---

#### **Tarea 3: Integración con Cierres** (2 horas)
**Archivos a Modificar**:
- `src/services/accounting/AccountingPeriodService.ts`
- `src/components/accounting/wizard-steps/TrialBalanceStep.tsx`

**Funcionalidades**:
1. Extender `validatePeriodClosure()`:
   - Verificar que todos los payrolls del período estén procesados
   - Agregar warning si hay payroll pendiente

2. Actualizar wizard:
   - Agregar validación de nómina en paso de Trial Balance
   - Mostrar lista de payrolls procesados
   - Mostrar warning si falta procesar

**Prioridad**: 🟢 BAJA

---

#### **Tarea 4: Actualizar Dashboard** (1 hora)
**Archivo a Modificar**:
- `src/components/dashboards/PayrollDashboard.tsx`

**Cambios**:
- Conectar con PayrollProcessor en lugar de datos mock
- Actualizar cálculos con datos reales
- Remover banner de "datos de demostración"
- Verificar que gráficos funcionan

**Prioridad**: 🟢 BAJA

---

#### **Tarea 5: Testing y Validación** (4-6 horas)
**Actividades**:
1. Testing end-to-end:
   - Procesar nómina completa
   - Verificar journal entry
   - Cerrar período
   - Generar reportes

2. Validación contra IRS:
   - Usar IRS Tax Withholding Estimator
   - Comparar resultados (deben coincidir al centavo)
   - Documentar cualquier discrepancia

3. Testing de performance:
   - Procesar 1 employee: < 1 segundo
   - Procesar 100 employees: < 30 segundos
   - Generar reportes: < 5 segundos

4. Testing de UI:
   - Probar en diferentes navegadores
   - Probar en mobile
   - Verificar validaciones

**Prioridad**: 🔴 ALTA

---

## 📋 FASE 5: BANK IMPORT AI

### **Tarea 1: Parsers de Archivos** (4-6 horas)
**Archivo a Crear**:
- `src/services/banking/BankFileParser.ts`

**Funcionalidades**:
- `parseCSV()`: Parser de archivos CSV
- `parseOFX()`: Parser de archivos OFX
- `parseQFX()`: Parser de archivos QFX
- `detectFileType()`: Detectar tipo de archivo automáticamente
- `validateFileFormat()`: Validar formato del archivo
- Manejo de diferentes formatos de fecha
- Manejo de diferentes formatos de monto

**Prioridad**: 🔴 ALTA

---

### **Tarea 2: ML Classifier** (6-8 horas)
**Archivo a Crear**:
- `src/services/banking/TransactionCategorizer.ts`

**Funcionalidades**:
- `trainClassifier()`: Entrenar Naive Bayes con transacciones históricas
- `categorizeTransaction()`: Categorizar una transacción
- `categorizeBatch()`: Categorizar múltiples transacciones
- `updateModel()`: Actualizar modelo con feedback del usuario
- `getConfidenceScore()`: Obtener score de confianza
- Feature extraction (descripción, monto, merchant)
- Tokenización y normalización de texto

**Prioridad**: 🔴 ALTA

---

### **Tarea 3: Detección de Duplicados** (3-4 horas)
**Archivo a Crear**:
- `src/services/banking/DuplicateDetector.ts`

**Funcionalidades**:
- `detectDuplicates()`: Detectar duplicados en batch
- `isExactDuplicate()`: Matching exacto (fecha + monto + descripción)
- `isFuzzyDuplicate()`: Matching fuzzy (Levenshtein distance)
- `getSimilarityScore()`: Calcular score de similitud
- Configuración de thresholds

**Prioridad**: 🟡 MEDIA

---

### **Tarea 4: Matching Inteligente** (4-6 horas)
**Archivo a Crear**:
- `src/services/banking/IntelligentMatcher.ts`

**Funcionalidades**:
- `matchWithInvoices()`: Matching con facturas
- `matchWithBills()`: Matching con gastos
- `matchWithPayroll()`: Matching con nómina
- `suggestMatches()`: Sugerir matches con score
- Matching por monto, fecha, descripción
- Fuzzy matching para descripciones

**Prioridad**: 🟡 MEDIA

---

### **Tarea 5: UI de Importación** (4-6 horas)
**Archivos a Crear**:
- `src/components/banking/BankImport.tsx`
- `src/components/banking/ImportPreview.tsx`
- `src/components/banking/ImportReview.tsx`

**Funcionalidades**:
1. **BankImport.tsx**:
   - Upload de archivos (drag & drop)
   - Selector de cuenta bancaria
   - Selector de tipo de archivo
   - Botón para procesar

2. **ImportPreview.tsx**:
   - Preview de transacciones parseadas
   - Categorización automática con ML
   - Detección de duplicados
   - Matching sugerido
   - Corrección manual
   - Confirmación de importación

3. **ImportReview.tsx**:
   - Resumen de importación
   - Transacciones importadas
   - Duplicados detectados
   - Matches realizados
   - Errores encontrados

**Prioridad**: 🔴 ALTA

---

### **Tarea 6: Reportes de Importación** (2-3 horas)
**Archivo a Crear**:
- `src/components/banking/ImportReports.tsx`

**Funcionalidades**:
- Historial de importaciones
- Estadísticas de categorización (accuracy)
- Estadísticas de duplicados
- Estadísticas de matching
- Exportar a Excel

**Prioridad**: 🟢 BAJA

---

### **Tarea 7: Testing y Validación** (3-4 horas)
**Actividades**:
1. Testing con archivos reales:
   - CSV de diferentes bancos
   - OFX de diferentes bancos
   - QFX de Quicken

2. Testing de ML:
   - Accuracy de categorización > 80%
   - Confidence scores correctos
   - Aprendizaje continuo funciona

3. Testing de duplicados:
   - Exact matching 100% accuracy
   - Fuzzy matching > 95% accuracy

4. Testing de performance:
   - Importar 1,000 transacciones: < 10 segundos
   - Categorizar 1,000 transacciones: < 5 segundos

**Prioridad**: 🔴 ALTA

---

## 📅 CRONOGRAMA DETALLADO

### **Opción A: Secuencial (RECOMENDADO)**

#### **Día 1: Fase 4 - UI de Procesamiento**
- ⏰ 09:00-13:00: PayrollProcessorUI.tsx (4h)
- ⏰ 14:00-16:00: PayrollReview.tsx (2h)
- ⏰ 16:00-18:00: EmployeePaystub.tsx (2h)
- **Total**: 8 horas

#### **Día 2: Fase 4 - Reportes e Integración**
- ⏰ 09:00-13:00: PayrollReportGenerator.ts (4h)
- ⏰ 14:00-17:00: PayrollReports.tsx (3h)
- ⏰ 17:00-19:00: Integración con Cierres (2h)
- ⏰ 19:00-20:00: Actualizar Dashboard (1h)
- **Total**: 10 horas

#### **Día 3: Fase 4 - Testing y Validación**
- ⏰ 09:00-13:00: Testing end-to-end (4h)
- ⏰ 14:00-17:00: Validación contra IRS (3h)
- ⏰ 17:00-19:00: Testing de performance y UI (2h)
- **Total**: 9 horas
- **✅ Fase 4 COMPLETADA**

#### **Día 4: Fase 5 - Parsers y ML**
- ⏰ 09:00-13:00: BankFileParser.ts (4h)
- ⏰ 14:00-18:00: TransactionCategorizer.ts (4h)
- **Total**: 8 horas

#### **Día 5: Fase 5 - Matching y Duplicados**
- ⏰ 09:00-13:00: DuplicateDetector.ts (4h)
- ⏰ 14:00-18:00: IntelligentMatcher.ts (4h)
- **Total**: 8 horas

#### **Día 6: Fase 5 - UI**
- ⏰ 09:00-13:00: BankImport.tsx (4h)
- ⏰ 14:00-17:00: ImportPreview.tsx (3h)
- ⏰ 17:00-19:00: ImportReview.tsx (2h)
- **Total**: 9 horas

#### **Día 7: Fase 5 - Testing y Lanzamiento**
- ⏰ 09:00-13:00: Testing con archivos reales (4h)
- ⏰ 14:00-17:00: Testing de ML y performance (3h)
- ⏰ 17:00-19:00: Testing final del sistema completo (2h)
- ⏰ 19:00-20:00: Preparación para lanzamiento (1h)
- **Total**: 10 horas
- **✅ Fase 5 COMPLETADA**
- **🚀 SISTEMA 100% COMPLETO**

**Total Horas**: 62 horas (~8 días laborales)

---

## 🎯 PRIORIDADES

### 🔴 CRÍTICO (Debe hacerse)
1. Fase 4: UI de Procesamiento
2. Fase 4: Testing y Validación
3. Fase 5: Parsers de Archivos
4. Fase 5: ML Classifier
5. Fase 5: UI de Importación

### 🟡 IMPORTANTE (Debería hacerse)
1. Fase 4: Reportes de Nómina
2. Fase 5: Detección de Duplicados
3. Fase 5: Matching Inteligente

### 🟢 OPCIONAL (Nice to have)
1. Fase 4: Integración con Cierres
2. Fase 4: Actualizar Dashboard
3. Fase 5: Reportes de Importación

---

## ✅ CRITERIOS DE ÉXITO

### Fase 4: Motor de Nómina
- [ ] UI permite procesar nómina completa
- [ ] Cálculos validados contra IRS (100% match)
- [ ] Form 941 genera correctamente
- [ ] W-2 genera correctamente
- [ ] Asientos contables balancean
- [ ] Performance < 2 segundos por payroll
- [ ] Sin errores TypeScript
- [ ] Dashboard usa datos reales

### Fase 5: Bank Import AI
- [ ] Parsea CSV, OFX, QFX correctamente
- [ ] Categorización ML > 80% accuracy
- [ ] Detección de duplicados > 95% accuracy
- [ ] UI permite importar y revisar
- [ ] Performance < 10 segundos para 1,000 transacciones
- [ ] Sin errores TypeScript

### Sistema Completo
- [ ] Todas las fases funcionando
- [ ] Testing end-to-end exitoso
- [ ] Performance cumple targets
- [ ] Sin errores críticos
- [ ] Documentación actualizada
- [ ] **Sistema al 100%** 🎉

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### Para Empezar Ahora:
1. **Leer** `.kiro/specs/payroll-engine/tasks.md` (completo)
2. **Revisar** archivos ya creados:
   - `src/services/payroll/PayrollProcessor.ts`
   - `src/services/payroll/PayrollTaxCalculator.ts`
   - `src/services/payroll/PayrollJournalService.ts`
3. **Empezar** con Tarea 1 de Fase 4: UI de Procesamiento
4. **Crear** `src/components/payroll/PayrollProcessorUI.tsx`

### Comando para Empezar:
```bash
# Abrir archivos relevantes
code src/components/payroll/PayrollProcessorUI.tsx
code src/services/payroll/PayrollProcessor.ts
code .kiro/specs/payroll-engine/tasks.md
```

---

## 💬 DECISIÓN REQUERIDA

**¿Qué enfoque prefieres?**

**A)** Secuencial - Completar Fase 4, luego Fase 5 (RECOMENDADO)
- Más ordenado y fácil de validar
- 7 días de trabajo

**B)** Paralelo - Implementar ambas simultáneamente
- Más rápido pero más complejo
- 5 días de trabajo

**C)** Solo Fase 4 - Lanzar v1.0 con nómina, Bank Import después
- Lanzamiento más rápido
- 3 días de trabajo

**Responde con A, B, o C para continuar.**

---

**Creado por**: Kiro AI  
**Fecha**: 7 de febrero de 2026  
**Recomendación**: ⭐⭐⭐⭐⭐ Opción A - Secuencial
