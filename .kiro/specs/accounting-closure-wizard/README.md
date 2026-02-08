# Spec: Wizard de Cierre Contable (Fase 3.5)

**Estado**: 📝 Draft  
**Prioridad**: 🟡 Media (Mejora de UX)  
**Completitud**: 0%  
**Tiempo Estimado**: 18 horas

---

## 🎯 RESUMEN EJECUTIVO

Este spec define la implementación de un wizard paso a paso para guiar a los usuarios a través del proceso de cierre contable mensual. El wizard mejorará significativamente la experiencia de usuario y reducirá errores en el proceso de cierre.

### ¿Por Qué Este Feature?
El sistema actual de cierres contables (Fase 3) está **100% funcional** pero el proceso puede ser intimidante para usuarios nuevos. Un wizard guiado:
- Reduce tiempo de cierre de 30 min a 10 min
- Elimina errores comunes
- Genera documentación automática
- Mejora confianza del usuario

---

## 📚 DOCUMENTOS DEL SPEC

### 1. [requirements.md](./requirements.md)
**Qué contiene**:
- Contexto del sistema actual
- Historias de usuario
- Requisitos funcionales y no funcionales
- Criterios de aceptación
- Métricas de éxito

**Cuándo leerlo**: Antes de empezar cualquier implementación

---

### 2. [design.md](./design.md)
**Qué contiene**:
- Arquitectura de componentes
- Interfaces TypeScript
- Flujo de datos
- Validaciones por paso
- Generación de PDF
- Plan de implementación

**Cuándo leerlo**: Antes de escribir código

---

### 3. [tasks.md](./tasks.md)
**Qué contiene**:
- Backlog de tareas detallado
- 12 tareas organizadas en 5 fases
- Estimaciones de tiempo
- Dependencias entre tareas
- Criterios de aceptación por tarea

**Cuándo leerlo**: Durante la implementación

---

## 🚀 INICIO RÁPIDO

### Prerrequisitos
- Sistema al 96% de completitud
- Fase 3 (Cierres Contables) al 80%
- Componentes existentes:
  - ✅ `AccountingPeriodService.ts`
  - ✅ `PeriodManager.tsx`
  - ✅ Tablas de base de datos

### Instalación de Dependencias
```bash
npm install jspdf jspdf-autotable
```

### Crear Rama
```bash
git checkout -b feature/accounting-closure-wizard
```

### Primera Tarea
Empezar con **Tarea 1.1**: Crear Componente Principal del Wizard
- Ver detalles en [tasks.md](./tasks.md)
- Estimación: 2 horas
- Archivo a crear: `src/components/accounting/PeriodClosureWizard.tsx`

---

## 📊 PROGRESO

### Estado Actual
- **Tareas Completadas**: 0/12
- **Progreso**: 0%
- **Tiempo Invertido**: 0 horas
- **Tiempo Restante**: 18 horas

### Fases
- [ ] Fase 1: Estructura Base (4 horas)
- [ ] Fase 2: Validaciones (6 horas)
- [ ] Fase 3: Reporte (4 horas)
- [ ] Fase 4: Integración (2 horas)
- [ ] Fase 5: Polish (2 horas)

---

## 🎯 OBJETIVOS CLAVE

### Funcionales
1. Wizard con 5 pasos claramente definidos
2. Validaciones automáticas en cada paso
3. Reporte de cierre descargable en PDF
4. Integración con PeriodManager existente

### No Funcionales
1. Tiempo de carga < 2 segundos
2. Generación de PDF < 5 segundos
3. Navegación intuitiva
4. Accesible (teclado, screen readers)

---

## 📁 ARCHIVOS A CREAR

### Componentes Nuevos
```
src/components/accounting/
├── PeriodClosureWizard.tsx       (nuevo)
├── ClosureChecklist.tsx          (nuevo)
├── ClosureReport.tsx             (nuevo)
└── wizard-steps/                 (nuevo)
    ├── TransactionValidationStep.tsx
    ├── BankReconciliationStep.tsx
    ├── AdjustmentsStep.tsx
    ├── TrialBalanceStep.tsx
    └── ConfirmationStep.tsx
```

### Archivos a Modificar
```
src/services/accounting/
└── AccountingPeriodService.ts    (extender)

src/components/accounting/
└── PeriodManager.tsx             (agregar botón)
```

---

## 🧪 TESTING

### Unit Tests
- Validaciones individuales
- Lógica de navegación
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

## 📖 REFERENCIAS

### Documentos Relacionados
- [PLAN_MAESTRO_IMPLEMENTACION.md](../../../PLAN_MAESTRO_IMPLEMENTACION.md)
- [PROGRESO_IMPLEMENTACION.md](../../../PROGRESO_IMPLEMENTACION.md)
- [FASE_3_CIERRES_CONTABLES_COMPLETADA.md](../../../FASE_3_CIERRES_CONTABLES_COMPLETADA.md)

### Archivos Existentes
- `src/services/accounting/AccountingPeriodService.ts`
- `src/components/accounting/PeriodManager.tsx`
- `src/database/simple-db.ts`

### Estándares
- GAAP (Generally Accepted Accounting Principles)
- AICPA Auditing Standards

---

## 💡 DECISIONES CLAVE

### Arquitectura
- ✅ Usar modal para el wizard (no página completa)
- ✅ Mantener estado local (no Redux)
- ✅ Usar Tailwind para estilos
- ✅ Usar jsPDF para PDFs

### UX
- ✅ 5 pasos (no más, no menos)
- ✅ Validaciones automáticas
- ✅ Navegación bloqueada si hay errores
- ✅ Confirmación antes de cerrar

### Prioridad
- 🟡 Media - El sistema funciona sin esto
- 🎯 Mejora de UX, no funcionalidad crítica
- 📅 Puede implementarse después del lanzamiento v1.0

---

## 🚨 RIESGOS

### Riesgo 1: Complejidad del Wizard
**Mitigación**: Empezar con versión simple (3 pasos) y expandir

### Riesgo 2: Performance en Reportes
**Mitigación**: Generar reporte en background, mostrar spinner

### Riesgo 3: Validaciones Lentas
**Mitigación**: Cachear resultados, ejecutar en paralelo

---

## 📞 CONTACTO

**Creado por**: Kiro AI  
**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0

---

## 🎬 PRÓXIMOS PASOS

1. ✅ Leer este README
2. 📖 Leer [requirements.md](./requirements.md)
3. 🏗️ Leer [design.md](./design.md)
4. 📋 Abrir [tasks.md](./tasks.md)
5. 💻 Empezar con Tarea 1.1

**¿Listo para empezar?** Abre [tasks.md](./tasks.md) y comienza con la Fase 1.
