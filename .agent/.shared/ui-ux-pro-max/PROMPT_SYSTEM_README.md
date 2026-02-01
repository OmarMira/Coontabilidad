# 📋 Sistema de Verificación de Prompts - AccountExpress

## 🎯 Descripción

Este sistema permite controlar y verificar el cumplimiento de los 12 prompts fundamentales del desarrollo de AccountExpress Next-Gen. Cada prompt representa una fase crítica del sistema con requisitos específicos y checklists de verificación.

## 📁 Estructura de Archivos

```
.agent/.shared/ui-ux-pro-max/
├── data/
│   ├── accountexpress_prompts.csv      # Base de datos de prompts y checklists
│   └── prompts_raw.json                # Prompts originales extraídos
├── scripts/
│   └── verify-prompts.js               # Script de verificación
├── PROMPT_SYSTEM_README.md             # Esta guía
└── ../../PROMPT_VERIFICATION_REPORT.md # Reporte generado
```

## 🚀 Uso del Sistema

### Verificar Todos los Prompts

```bash
node .agent/.shared/ui-ux-pro-max/scripts/verify-prompts.js
```

Este comando:
- ✅ Verifica el estado de todos los 12 prompts
- 📊 Muestra el porcentaje de completitud de cada uno
- 📄 Genera un reporte detallado en `PROMPT_VERIFICATION_REPORT.md`

### Verificar un Prompt Específico

```bash
node .agent/.shared/ui-ux-pro-max/scripts/verify-prompts.js --prompt 1
```

Muestra el checklist detallado del Prompt 1 (o el número que especifiques).

## 📋 Los 12 Prompts del Sistema

| # | Fase | Categoría | Prioridad | Dependencias |
|---|------|-----------|-----------|--------------|
| 1 | 2 | Core - Invoicing & Tax | Critical | Phase 1 |
| 3 | 3 | Accounting - US GAAP | Critical | Phase 2 |
| 4 | 4 | Security - Audit & Backup | Critical | Phase 3 |
| 5 | 5 | AI & Reporting | High | Phase 4 |
| 6 | 6 | Production - Security & Optimization | Critical | Phase 5 |
| 7 | 7 | Payroll | High | Phase 3 |
| 8 | 8 | Accounts Payable | Medium | Phase 3 |
| 9 | 9 | Advanced Inventory | Medium | Phase 2 |
| 10 | 10 | Integrations & APIs | High | Phase 4 |
| 11 | 11 | Multi-Company & Federal Tax | Low | Phase 6 |
| 12 | 12 | Mobile/PWA & Launch | High | Phase 6 |

## ✅ Formato del Checklist

Cada prompt tiene un checklist de verificación con items que pueden estar:
- `☐` **Pendiente** - No implementado o no verificado
- `☑` **Completado** - Implementado y verificado

### Ejemplo de Actualización Manual

Para marcar un item como completado en `accountexpress_prompts.csv`, cambia:
```
☐ wa-sqlite connection stable
```
Por:
```
☑ wa-sqlite connection stable
```

## 🎨 Salida del Script

El script muestra:
- ✓ Items completados en **verde**
- ⚠ Items pendientes en **amarillo**
- ✗ Items fallidos en **rojo**
- Porcentaje de completitud por prompt
- Resumen general del sistema

## 📊 Reporte Generado

El archivo `PROMPT_VERIFICATION_REPORT.md` contiene:
- Resumen general con métricas
- Detalle de cada prompt con su checklist
- Estado actual de implementación
- Dependencias entre fases

## 🔄 Flujo de Trabajo Recomendado

1. **Antes de comenzar una fase:**
   ```bash
   node .agent/.shared/ui-ux-pro-max/scripts/verify-prompts.js --prompt [número]
   ```
   Revisa los requisitos específicos del prompt.

2. **Durante el desarrollo:**
   - Marca items completados en el CSV
   - Verifica dependencias con fases anteriores

3. **Al finalizar una fase:**
   ```bash
   node .agent/.shared/ui-ux-pro-max/scripts/verify-prompts.js
   ```
   Genera el reporte completo y verifica 100% de completitud.

4. **Antes de producción:**
   - Todos los prompts críticos deben estar al 100%
   - Prompts de alta prioridad al 100%
   - Prompts de media/baja prioridad según roadmap

## 🎯 Criterios de Aceptación

### Para Considerar un Prompt Completado:
- ✅ Todos los items del checklist marcados como `☑`
- ✅ Tests de integración pasando
- ✅ TypeScript sin errores (`tsc --noEmit`)
- ✅ Build de producción exitoso
- ✅ Documentación actualizada

### Para Considerar el Sistema Production-Ready:
- ✅ Prompts 1, 3, 4, 6: 100% (Critical)
- ✅ Prompts 5, 7, 10, 12: 100% (High)
- ✅ Prompts 8, 9: 80%+ (Medium)
- ✅ Prompt 11: Según roadmap (Low)

## 🔧 Mantenimiento

### Agregar Nuevos Items al Checklist

Edita `accountexpress_prompts.csv` y agrega items separados por `|`:
```csv
...,☐ Nuevo item 1|☐ Nuevo item 2|☐ Nuevo item 3,...
```

### Actualizar Estado de un Prompt

Cambia el campo `Status`:
- `Pending` - No iniciado
- `In Progress` - En desarrollo
- `Completed` - Completado al 100%
- `Failed` - Requiere corrección

## 📝 Notas Importantes

1. **Integridad de Datos:** El CSV usa `|` como separador de items del checklist. No uses `|` en el texto de los items.

2. **Orden de Implementación:** Respeta las dependencias. No implementes un prompt sin completar sus dependencias.

3. **Verificación Continua:** Ejecuta el script regularmente para mantener visibilidad del progreso.

4. **Backup:** Los prompts originales están en `prompts_raw.json` como respaldo.

## 🎉 Estado Actual del Sistema

Para ver el estado actual, ejecuta:
```bash
node .agent/.shared/ui-ux-pro-max/scripts/verify-prompts.js
```

---

**Última actualización:** 31 de Enero, 2026  
**Sistema:** AccountExpress Next-Gen  
**Score Actual:** 9.0/10 ⭐⭐⭐⭐
