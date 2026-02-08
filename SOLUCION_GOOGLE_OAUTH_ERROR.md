# 🔧 Solución: Error 401 Google OAuth - "invalid_client"

## 🔍 Diagnóstico

**Error:** `Error 401: invalid_client`  
**Causa:** El Google Client ID está incompleto o es inválido

### Client ID Actual (INCOMPLETO):
```
836862308960-r678kubfgqd7edr4.apps.googleusercontent.com
                            ❌ Falta parte del ID
```

### Client ID Correcto (Formato esperado):
```
836862308960-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
             ^^^^^^^^^^^^^^^^^^^^^^^^
             Esta parte debe tener ~32 caracteres
```

## ✅ Solución Paso a Paso

### Opción 1: Obtener el Client ID Correcto (RECOMENDADO)

#### 1. Acceder a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google

#### 2. Seleccionar o Crear Proyecto
- Si ya tienes un proyecto: Selecciónalo en el menú superior
- Si no: Click en "Crear Proyecto" → Nombre: "AccountExpress" → Crear

#### 3. Habilitar Google+ API
1. Menú lateral → "APIs y servicios" → "Biblioteca"
2. Buscar: "Google+ API"
3. Click en "Habilitar"

#### 4. Crear Credenciales OAuth 2.0
1. Menú lateral → "APIs y servicios" → "Credenciales"
2. Click en "+ CREAR CREDENCIALES" → "ID de cliente de OAuth"
3. Tipo de aplicación: **"Aplicación web"**
4. Nombre: "AccountExpress Web Client"

#### 5. Configurar Orígenes Autorizados
**Orígenes de JavaScript autorizados:**
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
https://tu-dominio.com (si tienes uno)
```

**URIs de redireccionamiento autorizados:**
```
http://localhost:5173
http://localhost:3000
https://tu-dominio.com (si tienes uno)
```

#### 6. Copiar el Client ID
Después de crear, verás:
```
ID de cliente: 836862308960-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
                            ^^^^^^^^^^^^^^^^^^^^^^^^
                            Copia TODO el ID completo
```

#### 7. Actualizar .env.local
```bash
# Reemplazar en .env.local:
VITE_GOOGLE_CLIENT_ID=836862308960-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
```

#### 8. Reiniciar el servidor
```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

### Opción 2: Deshabilitar Google Login Temporalmente

Si no puedes obtener el Client ID ahora, puedes deshabilitar el botón:

#### Editar `src/components/auth/LoginForm.tsx`:
```typescript
// Cambiar esta línea:
const showGoogleLogin = true;

// Por:
const showGoogleLogin = false;
```

## 🔐 Configuración de Seguridad (Importante)

### Pantalla de Consentimiento OAuth
1. Google Cloud Console → "APIs y servicios" → "Pantalla de consentimiento de OAuth"
2. Tipo de usuario: **"Externo"** (para testing) o **"Interno"** (solo tu organización)
3. Información de la aplicación:
   - Nombre: "AccountExpress"
   - Email de asistencia: tu-email@gmail.com
   - Logo: (opcional)
4. Ámbitos (Scopes):
   - `email`
   - `profile`
   - `openid`
5. Usuarios de prueba (si es "Externo"):
   - Agregar tu email: nmira.omar@gmail.com

### Publicar la App (Opcional)
- Para uso público: Click en "Publicar aplicación"
- Para testing: Dejar en modo "Testing" (máximo 100 usuarios)

## 🧪 Verificar la Configuración

### 1. Verificar Client ID en el código
```bash
# Ver el Client ID actual:
cat .env.local | grep VITE_GOOGLE_CLIENT_ID
```

### 2. Probar el login
1. Abrir la app: http://localhost:5173
2. Click en "Continuar con Google"
3. Debería abrir el popup de Google
4. Seleccionar tu cuenta
5. Aceptar permisos
6. Debería redirigir al sistema

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solución:** Agregar la URL exacta a "URIs de redireccionamiento autorizados"

### Error: "access_denied"
**Solución:** Verificar que tu email está en "Usuarios de prueba"

### Error: "invalid_client" (persiste)
**Solución:** 
1. Verificar que el Client ID está completo
2. Verificar que no hay espacios al inicio/final
3. Reiniciar el servidor de desarrollo

### El botón no aparece
**Solución:**
1. Verificar que `showGoogleLogin = true` en LoginForm.tsx
2. Verificar que el Client ID tiene más de 10 caracteres
3. Abrir DevTools Console y buscar errores

## 📝 Archivo .env.local Completo

```bash
# Configuración de IA Local y Híbrida
REACT_APP_AI_MODE=hybrid
REACT_APP_MAX_TOKENS=4000

# API Keys
REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here
REACT_APP_DEEPSEEK_ENDPOINT=https://api.deepseek.com/chat/completions

# Groq (Motor de Respaldo)
VITE_GROQ_API_KEY=your_groq_api_key_here

# Google Search / Places API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Sistema de Base de Datos
REACT_APP_SQLITE_VERSION=1.13.0
VITE_SQLITE_WASM_PATH=/sql-wasm.wasm

# Configuración de Google OAuth (ACTUALIZAR CON TU CLIENT ID COMPLETO)
VITE_GOOGLE_CLIENT_ID=836862308960-XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
```

## 🎯 Resultado Esperado

Después de configurar correctamente:
1. ✅ El botón "Continuar con Google" aparece
2. ✅ Click abre popup de Google
3. ✅ Seleccionar cuenta funciona
4. ✅ Login exitoso y acceso al sistema
5. ✅ Usuario creado automáticamente con rol "viewer"

## 📚 Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

---

**Nota:** El Client ID es público y puede estar en el código. El Client Secret (si lo usas) NUNCA debe estar en el frontend.
