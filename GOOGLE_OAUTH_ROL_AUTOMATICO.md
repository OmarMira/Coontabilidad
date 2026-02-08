# Google OAuth - Asignación Automática de Roles

## ✅ IMPLEMENTACIÓN COMPLETADA

### Comportamiento del Sistema

Cuando un usuario inicia sesión con Google OAuth, el sistema ahora asigna roles automáticamente según esta lógica:

#### 1. **Primer Usuario del Sistema**
- **Rol Asignado**: `admin` (Administrador)
- **Permisos**: Acceso completo al sistema
- **Propósito**: El dueño/propietario del sistema que configura todo inicialmente

#### 2. **Usuarios Subsecuentes**
- **Rol Asignado**: `vendedor` (Salesperson)
- **Permisos**: Acceso a clientes, facturación, y ventas
- **Propósito**: Empleados que trabajan con clientes y ventas

#### 3. **Usuarios Existentes**
- Si el email ya existe en el sistema, se usa el rol previamente asignado
- No se modifica el rol existente

### Gestión de Roles Post-Login

El **Administrador** puede cambiar los roles de cualquier usuario desde:
- **Ruta**: Sistema → Gestión de Usuarios → Roles
- **Módulo**: `RoleManager.tsx`
- **Capacidades**:
  - Ver todos los usuarios y sus roles actuales
  - Cambiar el rol de cualquier usuario
  - Crear roles personalizados
  - Asignar permisos granulares por módulo

### Roles Disponibles en el Sistema

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| `admin` | 100 | Administrador con acceso completo |
| `contador` | 80 | Contador con acceso a módulos contables |
| `vendedor` | 40 | Vendedor con acceso a clientes y facturación |
| `comprador` | 40 | Comprador con acceso a proveedores y compras |
| `auditor` | 20 | Auditor con acceso de solo lectura |
| `viewer` | 10 | Usuario de consulta básica |

### Flujo de Trabajo Recomendado

1. **Configuración Inicial**:
   - El propietario inicia sesión con Google → Se crea como `admin`
   - Configura la empresa, cuentas contables, productos, etc.

2. **Agregar Empleados**:
   - Los empleados inician sesión con Google → Se crean como `vendedor`
   - El admin puede cambiar sus roles según necesidad:
     - Contador → Para personal contable
     - Comprador → Para personal de compras
     - Auditor → Para revisores externos

3. **Gestión Continua**:
   - El admin puede promover/degradar roles en cualquier momento
   - Los cambios de rol se aplican inmediatamente

### Archivos Modificados

- `src/contexts/AuthContext.tsx` - Líneas 118-145
  - Agregada lógica de detección de primer usuario
  - Asignación condicional de roles (admin vs vendedor)
  - Logs informativos en consola

### Logs del Sistema

El sistema ahora muestra en consola:
```
🎯 Primer usuario del sistema - Asignando rol de Administrador
```
o
```
👤 Usuario adicional - Asignando rol de Vendedor
```

### Seguridad

- Los passwords de usuarios Google son aleatorios y no se usan
- La autenticación se hace exclusivamente vía Google OAuth
- Los roles se pueden cambiar solo por administradores
- Los roles del sistema (admin, contador, viewer) no se pueden eliminar

---

**Fecha de Implementación**: 2026-02-06  
**Estado**: ✅ Completado y Funcional
