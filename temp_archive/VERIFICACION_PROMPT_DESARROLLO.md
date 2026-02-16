# Verificación del Prompt de Desarrollo - Modo Demo Volátil

## 📋 RESUMEN EJECUTIVO

**Estado General**: ⚠️ **PARCIALMENTE IMPLEMENTADO**

El sistema tiene las bases del modo demo, pero **NO cumple completamente** con las especificaciones del prompt original.

---

## ✅ LO QUE SÍ ESTÁ IMPLEMENTADO

### 1. Módulo de Autenticación (AuthService) ✅
**Ubicación**: `src/services/AuthService.ts`

- ✅ Login por Email/Contraseña implementado
- ✅ Google OAuth implementado (`src/services/GoogleAuthService.ts`)
- ✅ Sesión con expiración de 8 horas
- ✅ Token en localStorage
- ✅ Método `createDemoSession()` existe

**Código Verificado**:
```typescript
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours ✅

static createDemoSession(): UserSession {
    const session: UserSession = {
        userId: 999999,
        email: 'demo@accountexpress.local',
        role: 'demo',
        expiresAt: Date.now() + SESSION_DURATION,
        isDemo: true  // ✅ Flag de demo
    };
    this.saveSession(session);
    return session;
}
```

### 2. Interceptor de Límite de 20 Registros ✅
**Ubicación**: `src/core/database/SQLiteEngine.ts` (líneas 60-95)

- ✅ Propiedad `isDemoMode: boolean` existe
- ✅ Interceptor en método `run()` implementado
- ✅ Bloquea INSERT cuando hay 20 registros
- ✅ Lanza excepción con mensaje correcto

**Código Verificado**:
```typescript
private isDemoMode: boolean = false;

setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
    if (enabled) {
        console.warn('⚠️ ENGINE: MODO DEMO ACTIVADO - DATOS VOLÁTILES (RAM)');
    }
}

// INTERCEPTOR EN run()
if (this.isDemoMode) {
    const upperSql = sql.toUpperCase().trim();
    if (upperSql.startsWith('INSERT INTO')) {
        const match = upperSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/);
        if (match && match[1]) {
            const tableName = match[1];
            const countRes = await this.select(`SELECT COUNT(*) as c FROM ${tableName}`);
            if (countRes.length > 0) {
                const count = countRes[0]['c'] as number;
                if (count >= 20) {
                    throw new Error(`Límite de demo alcanzado (20 cargas máximo por archivo) en tabla: ${tableName}`);
                }
            }
        }
    }
}
```

### 3. Restricción de Sandbox en simple-db.ts ✅
**Ubicación**: `src/database/simple-db.ts` (líneas 40-70)

- ✅ Función `checkGuestRestriction()` implementada
- ✅ Limita a 20 registros por tabla
- ✅ Bloquea modificaciones a tabla `users`
- ✅ Verifica roles: guest, demo, viewer

**Código Verificado**:
```typescript
const GUEST_LIMIT_PER_TABLE = 20;

export async function checkGuestRestriction(userId: number | undefined, table: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    // Rule 1: No modifications to 'users' table
    if (table === 'users') {
        throw new Error('SANDBOX SECURITY: Las cuentas demo no pueden modificar usuarios del sistema.');
    }

    // Rule 2: Limit records on ANY table creation
    if (action === 'create') {
        const countRes = db.exec(`SELECT COUNT(*) FROM ${table}`);
        const count = countRes[0].values[0][0] as number;
        if (count >= GUEST_LIMIT_PER_TABLE) {
            throw new Error(`SANDBOX DEMO LIMIT: No puedes crear más de ${GUEST_LIMIT_PER_TABLE} registros en ${table} durante la demostración.`);
        }
    }
}
```

---

## ❌ LO QUE NO ESTÁ IMPLEMENTADO

### 1. Base de Datos Volátil en RAM ❌
**Problema Crítico**: El modo demo NO usa `new SQL.Database()` sin parámetros

**Ubicación**: `src/database/simple-db.ts` (función `initDB`)

**Lo que debería hacer**:
```typescript
if (isDemoMode) {
    db = new SQL.Database(); // RAM pura, sin OPFS
} else {
    // Cargar desde OPFS
    const data = await loadFromOPFS();
    db = new SQL.Database(data);
}
```

**Lo que hace actualmente**:
```typescript
// NO HAY VERIFICACIÓN DE isDemoMode en initDB()
// SIEMPRE intenta cargar desde OPFS o crea nueva DB persistente
```

**Consecuencia**: Los datos del modo demo SE PERSISTEN en OPFS, no son volátiles.

### 2. Prohibición de Carga/Guardado en OPFS ❌
**Problema**: No hay bloqueo de métodos de persistencia en modo demo

**Métodos que deberían estar bloqueados**:
- `saveToOPFS()` - NO está bloqueado
- `loadFromOPFS()` - NO está bloqueado
- Cualquier llamada a FileSystem API

**Lo que debería hacer**:
```typescript
async function saveToOPFS() {
    if (isDemoMode) {
        throw new Error('DEMO MODE: Persistencia deshabilitada');
    }
    // ... código de guardado
}
```

### 3. Banner de Modo Demo en UI ❌
**Problema**: No hay banner persistente en el Header

**Lo que debería existir**:
```tsx
{isDemoMode && (
    <div className="bg-yellow-500 text-black p-2 text-center font-bold">
        ⚠️ MODO DEMO - DATOS VOLÁTILES (Máx. 20 registros)
    </div>
)}
```

**Estado actual**: No existe ningún banner visual

### 4. Integración Completa del Flujo ❌
**Problema**: El botón "ACCESO RÁPIDO DEMO" no activa el modo demo correctamente

**Flujo actual**:
```
Usuario hace clic en "ACCESO RÁPIDO DEMO"
  ↓
loginAsGuest() crea usuario "guest" en DB
  ↓
Usuario ve dashboard normal
  ↓
❌ NO se activa isDemoMode
  ↓
❌ Datos se persisten en OPFS
  ↓
❌ No hay límite de 20 registros efectivo
```

**Flujo esperado**:
```
Usuario hace clic en "ACCESO RÁPIDO DEMO"
  ↓
Se activa isDemoMode = true
  ↓
DB se inicializa en RAM pura
  ↓
Banner de demo aparece
  ↓
Límite de 20 registros se aplica
  ↓
Al cerrar pestaña, datos desaparecen
```

---

## 🔧 CÓDIGO FALTANTE

### Modificación Necesaria en `simple-db.ts`:

```typescript
let isDemoMode = false;

export function setDemoMode(enabled: boolean) {
    isDemoMode = enabled;
    if (dbEngine) {
        dbEngine.setDemoMode(enabled);
    }
}

export async function initDB(forceDemo: boolean = false): Promise<void> {
    if (forceDemo) {
        isDemoMode = true;
    }

    const SQL = await initSqlJs({
        locateFile: (file: string) => `/sql-wasm.wasm`
    });

    if (isDemoMode) {
        // MODO DEMO: RAM PURA
        console.warn('🔴 MODO DEMO ACTIVADO - DATOS VOLÁTILES');
        db = new SQL.Database(); // SIN PARÁMETROS = RAM
    } else {
        // MODO NORMAL: PERSISTENCIA
        try {
            const data = await loadFromOPFS();
            db = new SQL.Database(data);
        } catch {
            db = new SQL.Database();
        }
    }

    // ... resto del código
}

// Bloquear guardado en modo demo
async function saveToOPFS(): Promise<void> {
    if (isDemoMode) {
        console.warn('⚠️ DEMO MODE: Guardado deshabilitado');
        return; // NO guardar
    }
    // ... código de guardado normal
}
```

### Modificación en `AuthContext.tsx`:

```typescript
const loginAsGuest = async (): Promise<boolean> => {
    try {
        // ACTIVAR MODO DEMO
        setDemoMode(true);
        
        // Reinicializar DB en modo demo
        await initDB(true);
        
        // Crear sesión demo
        const session = AuthService.createDemoSession();
        
        // ... resto del código
    } catch (e) {
        console.error('Guest login failed', e);
        return false;
    }
};
```

### Banner en `Dashboard.tsx` o `Layout.tsx`:

```tsx
import { useAuth } from '../contexts/AuthContext';

const DemoBanner = () => {
    const { user } = useAuth();
    
    if (!user?.isDemo) return null;
    
    return (
        <div className="bg-yellow-400 text-black px-4 py-2 text-center font-bold border-b-2 border-yellow-600">
            ⚠️ MODO DEMO - DATOS VOLÁTILES (Máximo 20 registros por tabla)
        </div>
    );
};
```

---

## 📊 TABLA DE CUMPLIMIENTO

| Requisito | Estado | Ubicación | Notas |
|-----------|--------|-----------|-------|
| AuthService con Email/Password | ✅ | `src/services/AuthService.ts` | Implementado |
| Google OAuth | ✅ | `src/services/GoogleAuthService.ts` | Implementado |
| Sesión 8 horas | ✅ | `src/services/AuthService.ts` | Implementado |
| isDemoMode flag | ✅ | `src/core/database/SQLiteEngine.ts` | Implementado |
| Interceptor 20 registros | ✅ | `src/core/database/SQLiteEngine.ts` | Implementado |
| DB en RAM pura | ❌ | `src/database/simple-db.ts` | **NO implementado** |
| Bloqueo OPFS en demo | ❌ | `src/database/simple-db.ts` | **NO implementado** |
| Banner UI | ❌ | N/A | **NO implementado** |
| Integración completa | ❌ | `src/contexts/AuthContext.tsx` | **NO implementado** |
| Datos volátiles | ❌ | Sistema completo | **NO funciona** |

---

## 🎯 CONCLUSIÓN

**El sistema tiene el 50% del prompt implementado**:
- ✅ Autenticación funcional
- ✅ Interceptor de límites
- ❌ Volatilidad de datos
- ❌ Integración UI
- ❌ Flujo completo

**Para cumplir 100% con el prompt, se necesita**:
1. Modificar `initDB()` para soportar modo RAM
2. Bloquear `saveToOPFS()` en modo demo
3. Agregar banner visual
4. Integrar el flujo completo en `loginAsGuest()`

---

**Fecha de Verificación**: 2026-02-06  
**Verificado por**: Análisis de código fuente  
**Estado**: ⚠️ Implementación Parcial - Requiere Completar
