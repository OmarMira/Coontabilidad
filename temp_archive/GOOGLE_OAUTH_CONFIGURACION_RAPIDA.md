# ⚡ Configuración Rápida: Google OAuth

## 🚨 Problema Actual

```
❌ Error 401: invalid_client
❌ The OAuth client was not found
```

**Causa:** Client ID incompleto o inválido

## ✅ Solución en 3 Pasos

### Paso 1: Obtener Client ID de Google Cloud Console

```
🌐 https://console.cloud.google.com/
   ↓
📁 Crear/Seleccionar Proyecto
   ↓
🔌 Habilitar "Google+ API"
   ↓
🔑 Crear Credenciales OAuth 2.0
   ↓
📋 Copiar Client ID completo
```

**Formato del Client ID:**
```
836862308960-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
             ^^^^^^^^^^^^^^^^^^^^^^^^
             32 caracteres alfanuméricos
```

### Paso 2: Actualizar .env.local

```bash
# Abrir .env.local y reemplazar:
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_COMPLETO_AQUI
```

### Paso 3: Habilitar el Botón

```typescript
// En src/components/auth/LoginForm.tsx
// Cambiar línea 20:
const showGoogleLogin = true; // ✅ Habilitar
```

## 🔧 Configuración Detallada en Google Cloud

### 1. Crear Credenciales OAuth

**Tipo de aplicación:** Aplicación web

**Orígenes de JavaScript autorizados:**
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
```

**URIs de redireccionamiento autorizados:**
```
http://localhost:5173
http://localhost:3000
```

### 2. Pantalla de Consentimiento

**Información básica:**
- Nombre de la app: `AccountExpress`
- Email de asistencia: `tu-email@gmail.com`
- Tipo de usuario: `Externo` (para testing)

**Ámbitos (Scopes):**
- ✅ `email`
- ✅ `profile`
- ✅ `openid`

**Usuarios de prueba:**
- Agregar: `nmira.omar@gmail.com`

## 🧪 Verificar que Funciona

### 1. Reiniciar el servidor
```bash
# Detener (Ctrl+C) y reiniciar:
npm run dev
```

### 2. Probar el login
1. Abrir: http://localhost:5173
2. Debería aparecer el botón "Continuar con Google"
3. Click en el botón
4. Popup de Google se abre
5. Seleccionar cuenta
6. ✅ Login exitoso

## 📊 Estado Actual

```
🔴 Google Login: DESHABILITADO
   Razón: Client ID incompleto
   
📝 Acción requerida:
   1. Obtener Client ID completo de Google Cloud Console
   2. Actualizar VITE_GOOGLE_CLIENT_ID en .env.local
   3. Cambiar showGoogleLogin = true en LoginForm.tsx
   4. Reiniciar servidor
```

## 🎯 Resultado Esperado

Después de configurar:

```
✅ Botón "Continuar con Google" visible
✅ Click abre popup de Google
✅ Login funciona correctamente
✅ Usuario creado automáticamente con rol "viewer"
✅ Acceso al sistema sin errores
```

## 📚 Documentación Completa

Ver: `SOLUCION_GOOGLE_OAUTH_ERROR.md` para guía paso a paso detallada

---

**Tiempo estimado:** 5-10 minutos  
**Dificultad:** Fácil  
**Requiere:** Cuenta de Google
