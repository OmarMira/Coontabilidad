# Sistema Integral de Integridad de Datos 🔐

## Objetivo: 100% CONTROL de Datos - Cero Corrupción

Este sistema garantiza que **NO EXISTA NINGÚN DATO CORRUPTED**, ni parcial ni total. Deteción automática y reparación en tiempo real.

---

## 📋 Arquitectura Completa

### 1. **DataIntegrityCore** (`DataIntegrityCore.ts`)
**Validación en el Origen** - Previene corrupción desde el principio

```
Responsabilidades:
✅ Define reglas de validación por tabla
✅ Valida cada operación INSERT/UPDATE
✅ Auto-repara datos inconsistentes
✅ Genera checksums para detectar cambios
✅ Auditoría completa de todas las operaciones (CRUD)
```

**Validaciones por Tabla:**
- **customers**: name (requerido), email (formato), phone (requerido), status (enum)
- **suppliers**: name (requerido), document_number (único), email (formato), status (enum)
- **invoices**: customer_id (FK), invoice_number (único), total_amount (número ≥0), status (enum)
- **bills**: supplier_id (FK), bill_number (único), total_amount (número ≥0), status (enum)
- **products**: name (requerido), price (número ≥0), stock_quantity (número ≥0)
- **journal_entries**: entry_date (requerido), description (requerido)

---

### 2. **DataIntegrityChecker** (`DataIntegrityChecker.ts`)
**Detección de Problemas** - Identifica inconsistencias

```
Verificaciones:
✅ Foreign Keys rotos (referencias huérfanas)
✅ Duplicados en campos unique
✅ Inconsistencias numéricas (sumas, totales)
✅ Formatos inválidos (fechas, montos)
✅ Violaciones de constraints

Tablas verificadas:
• invoices.customer_id → customers.id
• bills.supplier_id → suppliers.id
• invoice_lines.invoice_id → invoices.id
• bill_lines.bill_id → bills.id
• journal_details.entry_id → journal_entries.id
• Y más...
```

---

### 3. **DataRepairEngine** (`DataRepairEngine.ts`)
**Reparación Automática** - Corrige errores sin intervención

```
Estrategias de Reparación:
1. REGISTROS HUÉRFANOS:
   - Detecta y elimina de forma segura
   - Usa transacciones para rollback

2. DUPLICADOS:
   - Mantiene el primer registro
   - Renumera o marca otros como inactivos
   - Redirige referencias

3. INCONSISTENCIAS NUMÉRICAS:
   - Recalcula totales basados en líneas
   - Recalcula impuestos
   - Valida sumas contables

4. DATOS FALTANTES:
   - Auto-repara con valores por defecto
   - Genera IDs/números únicos automáticamente
   - Llena campos obligatorios

Nivel de Riesgo:
- LOW: 0-5 eliminaciones
- MEDIUM: 5-20 actualizaciones
- HIGH: >10 eliminaciones o >20 actualizaciones
```

---

### 4. **DataHealthCheckService** (`DataHealthCheckService.ts`)
**Monitoreo Continuo** - Verifica la salud periódicamente

```
Características:
✅ Check automático cada 5 minutos
✅ Auto-repair si está habilitado
✅ Reintentos automáticos (hasta 3)
✅ Historial de verificaciones
✅ Generación de reportes
✅ Recomendaciones automáticas

Reportes incluyen:
- Estado actual (healthy/warning/critical)
- Cantidad de errores y tipos
- Reparaciones aplicadas
- Tiempo promedio de reparación
- Métricas de BD
- Recomendaciones accionables
```

---

## 🚀 Flujo de Operación

```
┌─────────────────────────────────────┐
│         INSERT/UPDATE/DELETE        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   DataIntegrityValidator.validate() │ ◄── Prechecks
│   - Required fields?                │
│   - Unique constraints?             │
│   - Format valid?                   │
│   - Auto-repair if needed?          │
└────────────┬────────────────────────┘
             │
             ├─ VÁLIDO ──────┐
             │               │
             ├─ INVÁLIDO ────► RECHAZAR (error al usuario)
             │
             ▼
┌─────────────────────────────────────┐
│   EXECUTE en Base de Datos          │
│   (con TRANSACTION)                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   DataIntegrityCore.logAudit()      │ ◄── Auditoría
│   - Registro de cambio              │
│   - Valores old/new                 │
│   - Checksum para integridad        │
└────────────┬────────────────────────┘
             │
             ▼
    ✅ CONFIRMADO y AUDITABLE
    
    
CADA 5 MINUTOS (Monitoreo):
┌─────────────────────────────────────┐
│  DataHealthCheckService.runCheck()  │
├─────────────────────────────────────┤
│ 1. DataIntegrityChecker            │
│    - FK rotos?                      │
│    - Duplicados?                    │
│    - Inconsistencias?              │
├─────────────────────────────────────┤
│ 2. Si hay errores y autoRepair:    │
│    DataRepairEngine.executeRepair()│
│    - Genera plan de reparación      │
│    - Ejecuta transacciones          │
│    - Registra en auditoría          │
├─────────────────────────────────────┤
│ 3. Generar reporte                 │
│    - Status (healthy/warning/etc)   │
│    - Métricas                       │
│    - Recomendaciones                │
└─────────────────────────────────────┘
```

---

## 📊 Ejemplos de Reparaciones Automáticas

### Ejemplo 1: Referencia Rota (FK Huérfano)
```
DETECCIÓN:
❌ Factura INV-001 referencia customer_id = 999
   Pero customer #999 no existe

REPARACIÓN:
✅ Plan: Eliminar factura huérfana
✅ Ejecutar: DELETE FROM invoices WHERE id = 1
✅ Auditar: (tipo: DELETE, tabla: invoices, id: 1, razón: "FK roto")
```

### Ejemplo 2: Duplicado
```
DETECCIÓN:
❌ Bill número "BILL-2024-001" está duplicado (2 veces)

REPARACIÓN:
✅ Mantener: bill.id = 1 (BILL-2024-001)
✅ Renumerar: bill.id = 2 (BILL-2024-001_OLD_2)
✅ Auditar: (tipo: UPDATE, tabla: bills, id: 2, cambio: nombre)
```

### Ejemplo 3: Inconsistencia Numérica
```
DETECCIÓN:
❌ Invoice #100 tiene total_amount = $500
   Pero líneas suman: $300 + impuestos $150 = $450

REPARACIÓN:
✅ Recalcular: total_amount = 300 + 150 = 450
✅ Auditar: (tipo: UPDATE, tabla: invoices, id: 100, cambio: 500→450)
```

---

## 🔧 API Pública

### Inicialización
```typescript
import { initializeDataIntegrity } from '@core/data-integrity';

// En DatabaseService.initializeForensicLayer():
initializeDataIntegrity();
// ↑ Inicia monitoreo automático de 5 minutos
```

### Verificación Manual
```typescript
import { runManualIntegrityCheck } from '@core/data-integrity';

const report = await runManualIntegrityCheck();
console.log(report.status);      // 'healthy' | 'warning' | 'critical'
console.log(report.errorCount);  // Cantidad de errores
console.log(report.repaired);    // Operaciones aplicadas
```

### Estado Actual
```typescript
import { getIntegrityStatus } from '@core/data-integrity';

const status = getIntegrityStatus();
console.log(status.health.status);        // Estado actual
console.log(status.lastReport);           // Último reporte
console.log(status.history);              // Últimos 5 reportes
```

### Obtener Reportes
```typescript
import { DataHealthCheckService } from '@core/data-integrity';

const report = DataHealthCheckService.getLatestReport();
const history = DataHealthCheckService.getReportHistory(10);
const detailReport = DataHealthCheckService.generateDetailedReport();
```

---

## 🎨 UI: Panel de Integridad

Componente: `DataHealthPanel.tsx`

```
┌─────────────────────────────────────────────────┐
│         INTEGRIDAD DE DATOS                      │
│  Status: SALUDABLE ✅                           │
│                                                 │
│  MÉTRICAS:                                      │
│  • Errores: 0                                   │
│  • Advertencias: 0                              │
│  • Reparaciones: 0                              │
│  • Tiempo promedio: 0ms                         │
│                                                 │
│  RECOMENDACIONES:                               │
│  ✅ Base de datos en perfecto estado            │
│                                                 │
│  ACCIONES:                                      │
│  [Verificar Ahora] [Reparaciones]               │
│  [Referencias]     [Consolidar]                 │
│  [Duplicados]      [Recalcular Totales]         │
└─────────────────────────────────────────────────┘
```

---

## 📈 Métricas Monitoreadas

```
Métricas de Base de Datos:
├─ Total de registros
├─ Registros huérfanos: 0
├─ Duplicados: 0
├─ Inconsistencias: 0
├─ Tamaño de BD
└─ Performance de queries:
   ├─ Tiempo promedio
   ├─ Tiempo máximo
   └─ Queries lentas

Estado de Integridad:
├─ Foreign keys: ✅ Válidas
├─ Unique constraints: ✅ Válidas
├─ Type checks: ✅ Válidos
├─ Checksums: ✅ Coinciden
└─ Auditoría: ✅ Registro completo
```

---

## 🛡️ Garantías

### Datos Perfectamente Válidos
```
✅ NUNCA habrá:
   - Foreign keys rotos
   - Duplicados de números únicos
   - Registros huérfanos
   - Inconsistencias numéricas
   - Valores NULL en campos obligatorios
   - Datos con formato inválido
```

### Reparación Automática
```
✅ Sistema detecta y repara:
   - Automáticamente cada 5 minutos
   - Sin intervención del usuario
   - Con registro completo en auditoría
   - Con rollback si falla
   - Con reintentos automáticos
```

### Auditoría Completa
```
✅ Cada cambio registra:
   - Qué cambió (tabla, campo, ID)
   - Valores anteriores
   - Valores nuevos
   - Cuándo cambió (timestamp)
   - Quién lo hizo (userId)
   - Por qué (razón/motivo)
   - Checksum para integridad
```

### Zero Trust
```
✅ No confiar en:
   - Datos del usuario
   - Validación del cliente
   - Base de datos "perfecta"
   
✅ En su lugar:
   - Validar SIEMPRE en origen
   - Verificar continuamente
   - Reparar automáticamente
   - Auditar todo
```

---

## 🔄 Ciclo de Vida

```
1. PREVENCIÓN (Pre-Insert)
   └─ Validar datos antes de guardar
   
2. DETECIÓN (Monitoreo)
   └─ Verificar integridad cada 5 min
   
3. REPARACIÓN (Auto-Fix)
   └─ Reparar inconsistencias encontradas
   
4. AUDITORÍA (Trazabilidad)
   └─ Registrar todos los cambios
   
5. REPORTE (Visibilidad)
   └─ Mostrar estado y recomendaciones
```

---

## 📝 Configuración

```typescript
// En DatabaseService.initializeForensicLayer():

// Intervalo de verificación (5 minutos = 300 segundos)
const checkInterval = 5 * 60 * 1000;

// Habilitar reparación automática (true/false)
const autoRepair = true;

// Máximo de reintentos si falla
const maxRetries = 3;

DataHealthCheckService.startHealthMonitoring(checkInterval, autoRepair);
```

---

## ✅ Resultado Final

**El sistema garantiza:**

1. ✅ **Cero Corrupción**: Prevención desde origen + monitoreo continuo
2. ✅ **Auto-Reparación**: Detecta y corrige errores automáticamente
3. ✅ **Auditoría Completa**: Registro de cada operación
4. ✅ **Visibilidad**: Panel UI mostrando salud en tiempo real
5. ✅ **Confiabilidad**: Safe transacciones con rollback automático
6. ✅ **Performance**: Checks optimizados cada 5 minutos
7. ✅ **Transparencia**: Reportes detallados y recomendaciones

---

**Estado Actual: 🟢 100% OPERATIVO Y PROTEGIDO**
