# Sistema de Google OAuth con Asignación Automática de Roles

## ✅ ESTADO: IMPLEMENTADO Y FUNCIONAL

---

## 🎯 FUNCIONAMIENTO DEL SISTEMA

### Flujo Completo de Login con Google

```
1. Usuario hace clic en botón "Iniciar sesión con Google"
   ↓
2. Se abre popup de Google OAuth
   ↓
3. Usuario selecciona su cuenta de Google
   ↓
4. Sistema recibe credenciales (email, nombre, foto)
   ↓
5. Sistema verifica si el email ya existe en la base de datos
   ↓
   ├─ SI EXISTE → Login con rol actual
   │              └─ Redirige al dashboard
   │
   └─ NO EXISTE → Crear nuevo usuario
                  ↓
                  ├─ ¿Es el primer usuario del sistema?
                  │  ├─ SÍ → Asignar rol: ADMIN
                  │  └─ NO → Asignar rol: VENDEDOR
                  ↓
                  Crear usuario en base de datos
                  ↓
                  Login automático
                  ↓
                  Redirigir al dashboard
```

---

## 📋 REGLAS DE ASIGNACIÓN DE ROLES

### 1. Primer Usuario (Propietario del Sistema)
- **Condición**: No hay ningún usuario en la base de datos
- **Rol Asignado**: `admin` (Administrador)
- **Nivel de Acceso**: 100 (Acceso completo)
- **Permisos**: 
  - Acceso a todos los módulos
  - Gestión de usuarios
  - Cambio de roles
  - Configuración del sistema
  - Reportes completos

### 2. Usuarios Subsecuentes (Empleados)
- **Condición**: Ya existe al menos un usuario en el sistema
- **Rol Asignado**: `vendedor` (Salesperson)
- **Nivel de Acceso**: 40
- **Permisos**:
  - Gestión de clientes
  - Creación de facturas
  - Registro de ventas
  - Consulta de inventario
  - Reportes de ventas propias

### 3. Usuarios Existentes
- **Condición**: El email ya está registrado
- **Rol Asignado**: Mantiene su rol actual
- **Comportamiento**: Login normal sin cambios

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Archivo: `src/contexts/AuthContext.tsx`

```typescript
const loginWithGoogle = async (googleUser: GoogleUserInfo): Promise<boolean> => {
    // 1. Buscar usuario existente
    const existingUser = getUserByUsername(googleUser.email);

    if (existingUser) {
        // Usuario existe → Login normal
        return loginExistingUser(existingUser, googleUser);
    } else {
        // Usuario nuevo → Asignar rol automáticamente
        const roles = UserService.getRoles();
        const isFirstUser = !hasUsers(); // ← Verificación clave
        
        let assignedRole;
        if (isFirstUser) {
            assignedRole = roles.find(r => r.name === 'admin');
            console.log('🎯 Primer usuario - Asignando ADMIN');
        } else {
            assignedRole = roles.find(r => r.name === 'vendedor');
            console.log('👤 Usuario adicional - Asignando VENDEDOR');
        }

        // Crear usuario con rol asignado
        const result = await createUser({
            username: googleUser.email,
            email: googleUser.email,
            full_name: googleUser.name,
            password: `google_${googleUser.sub}_${Date.now()}`,
            display_name: googleUser.name,
            role_id: assignedRole.id
        });

        return result.success;
    }
};
```

### Función Clave: `hasUsers()`

**Ubicación**: `src/database/simple-db.ts`

```typescript
export function hasUsers(): boolean {
    if (!db) return false;
    try {
        const res = db.exec("SELECT COUNT(*) as count FROM users");
        if (res.length > 0 && res[0].values.length > 0) {
            const count = res[0].values[0][0] as number;
            return count > 0;
        }
        return false;
    } catch (e) {
        return false;
    }
}
```

---

## 👥 GESTIÓN DE ROLES POR EL ADMINISTRADOR

### Acceso al Panel de Roles

**Ruta**: Sistema → Gestión de Usuarios → Roles

**Ubicación del Código**: `src/components/auth/RoleManager.tsx`

### Capacidades del Administrador

1. **Ver todos los usuarios**
   - Lista completa con email, nombre y rol actual
   - Información de permisos por módulo

2. **Cambiar roles**
   - Seleccionar cualquier usuario
   - Asignar nuevo rol desde dropdown
   - Cambios se aplican inmediatamente

3. **Roles disponibles**:
   - `admin` - Administrador (nivel 100)
   - `contador` - Contador (nivel 80)
   - `vendedor` - Vendedor (nivel 40)
   - `comprador` - Comprador (nivel 40)
   - `auditor` - Auditor (nivel 20)
   - `viewer` - Consulta básica (nivel 10)

4. **Crear roles personalizados**
   - Definir nombre y descripción
   - Asignar permisos granulares por módulo
   - Establecer nivel de acceso

### Restricciones de Seguridad

- ❌ No se pueden eliminar roles del sistema (admin, contador, viewer)
- ❌ Usuarios demo/guest no pueden modificar usuarios
- ✅ Solo administradores pueden cambiar roles
- ✅ Cambios quedan registrados en audit trail

---

## 🔐 CONFIGURACIÓN DE GOOGLE OAUTH

### Archivo: `.env.local`

```env
VITE_GOOGLE_CLIENT_ID=385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com
```

### Configuración en Google Cloud Console

**URL**: https://console.cloud.google.com

1. **Credenciales OAuth 2.0**:
   - Client ID: `385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com`

2. **Orígenes de JavaScript autorizados**:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Tu dominio de producción

3. **URIs de redireccionamiento autorizados**:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Tu dominio de producción

4. **Pantalla de consentimiento**:
   - Tipo: Externo (para testing)
   - Usuarios de prueba: Agregar emails autorizados

### Verificación del Botón de Google

El botón de Google solo aparece si:
- ✅ `VITE_GOOGLE_CLIENT_ID` está configurado en `.env.local`
- ✅ El Client ID tiene más de 10 caracteres
- ✅ No es el placeholder `YOUR_GOOGLE_CLIENT_ID_HERE`

**Código de Verificación** (`src/components/auth/LoginForm.tsx`):
```typescript
const isGoogleConfigured = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    return clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && clientId.length > 10;
};

const showGoogleLogin = isGoogleConfigured();
```

---

## 🧪 PRUEBAS DEL SISTEMA

### Escenario 1: Primer Usuario (Propietario)

**Pasos**:
1. Borrar base de datos local (localStorage.clear() en consola)
2. Refrescar página
3. Hacer clic en "Iniciar sesión con Google"
4. Seleccionar cuenta de Google

**Resultado Esperado**:
- ✅ Usuario creado con rol `admin`
- ✅ Acceso completo al sistema
- ✅ Puede ver "Sistema → Gestión de Usuarios"
- ✅ Console log: "🎯 Primer usuario del sistema - Asignando rol de Administrador"

### Escenario 2: Segundo Usuario (Empleado)

**Pasos**:
1. Con el admin ya creado, cerrar sesión
2. Hacer clic en "Iniciar sesión con Google"
3. Seleccionar OTRA cuenta de Google

**Resultado Esperado**:
- ✅ Usuario creado con rol `vendedor`
- ✅ Acceso limitado a módulos de ventas
- ✅ NO puede ver "Sistema → Gestión de Usuarios"
- ✅ Console log: "👤 Usuario adicional - Asignando rol de Vendedor"

### Escenario 3: Usuario Existente

**Pasos**:
1. Cerrar sesión
2. Hacer clic en "Iniciar sesión con Google"
3. Seleccionar cuenta ya registrada

**Resultado Esperado**:
- ✅ Login exitoso con rol actual
- ✅ No se crea usuario duplicado
- ✅ Mantiene permisos asignados

### Escenario 4: Cambio de Rol por Admin

**Pasos**:
1. Login como admin
2. Ir a Sistema → Gestión de Usuarios → Roles
3. Seleccionar un usuario vendedor
4. Cambiar rol a "contador"
5. Guardar cambios

**Resultado Esperado**:
- ✅ Rol actualizado en base de datos
- ✅ Usuario ve nuevos permisos al siguiente login
- ✅ Cambio registrado en audit trail

---

## 📊 LOGS DEL SISTEMA

### Logs de Asignación de Roles

```javascript
// Primer usuario
console.log('🎯 Primer usuario del sistema - Asignando rol de Administrador');

// Usuarios subsecuentes
console.log('👤 Usuario adicional - Asignando rol de Vendedor');

// Usuario creado exitosamente
console.log('✅ Usuario de Google creado exitosamente con rol: admin', userData);
```

### Verificación en Consola del Navegador

Abre DevTools (F12) → Console y verás:
```
🔐 Google Auth Init: { mode: 'FORCE_PRODUCTION', ... }
Procesando login de Google: { email: '...', name: '...', ... }
🎯 Primer usuario del sistema - Asignando rol de Administrador
📝 Creando usuario de Google: { email: '...', role: 'admin' }
✅ Usuario de Google creado exitosamente con rol: admin
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problema: Botón de Google no aparece

**Causas posibles**:
1. Client ID no configurado en `.env.local`
2. Client ID inválido (menos de 10 caracteres)
3. Archivo `.env.local` no se recargó

**Solución**:
```bash
# 1. Verificar .env.local
cat .env.local | grep VITE_GOOGLE_CLIENT_ID

# 2. Reiniciar servidor de desarrollo
npm run dev

# 3. Limpiar caché del navegador (Ctrl+Shift+Delete)
```

### Problema: Error 401 al hacer login

**Causas posibles**:
1. Client ID no coincide con Google Cloud Console
2. Origen no autorizado en Google Cloud Console
3. Usuario no está en lista de prueba

**Solución**:
1. Verificar Client ID en Google Cloud Console
2. Agregar `http://localhost:5173` a orígenes autorizados
3. Agregar email a "Usuarios de prueba"

### Problema: Todos los usuarios se crean como vendedor

**Causa**: La función `hasUsers()` no está funcionando correctamente

**Solución**:
```javascript
// Verificar en consola del navegador
import { hasUsers } from './src/database/simple-db';
console.log('¿Hay usuarios?', hasUsers());

// Si retorna true cuando no debería, limpiar base de datos
localStorage.clear();
location.reload();
```

### Problema: No puedo cambiar roles

**Causa**: Usuario no tiene permisos de administrador

**Solución**:
1. Verificar rol actual en consola:
```javascript
const user = JSON.parse(localStorage.getItem('accountexpress_user'));
console.log('Rol actual:', user.role);
```

2. Si no es admin, necesitas:
   - Borrar base de datos y crear nuevo admin
   - O modificar directamente en la base de datos (modo desarrollo)

---

## 📁 ARCHIVOS MODIFICADOS

### Archivos Principales

1. **`src/contexts/AuthContext.tsx`**
   - Lógica de asignación automática de roles
   - Verificación de primer usuario
   - Creación de usuarios con Google

2. **`src/components/auth/LoginForm.tsx`**
   - Verificación de configuración de Google OAuth
   - Mostrar/ocultar botón de Google

3. **`src/components/auth/GoogleLoginButton.tsx`**
   - Desactivado popup automático (One Tap)
   - Client ID actualizado

4. **`src/database/simple-db.ts`**
   - Función `hasUsers()` para verificar primer usuario
   - Función `createUser()` para crear usuarios

5. **`src/components/auth/RoleManager.tsx`**
   - Panel de gestión de roles
   - Cambio de roles por administrador

---

## 🎉 RESUMEN FINAL

### ✅ Sistema Completamente Funcional

- ✅ Login con Google OAuth implementado
- ✅ Primer usuario se crea como Administrador
- ✅ Usuarios subsecuentes se crean como Vendedores
- ✅ Administrador puede cambiar roles de cualquier usuario
- ✅ Botón de Google solo aparece si está configurado
- ✅ Popup automático desactivado
- ✅ Sesión expira en 8 horas
- ✅ Logs informativos en consola

### 🔒 Seguridad

- ✅ Passwords de Google son aleatorios (no se usan)
- ✅ Autenticación exclusiva vía Google OAuth
- ✅ Roles protegidos (no se pueden eliminar roles del sistema)
- ✅ Solo administradores pueden cambiar roles
- ✅ Cambios registrados en audit trail

### 📱 Experiencia de Usuario

- ✅ Flujo simple: Click → Seleccionar cuenta → Dashboard
- ✅ Sin configuración manual de usuarios
- ✅ Roles asignados automáticamente
- ✅ Administrador tiene control total

---

**Fecha de Implementación**: 2026-02-06  
**Estado**: ✅ COMPLETADO Y FUNCIONAL  
**Versión**: 1.0.0
