# 🔧 Solución: Error 401 + "No puedes continuar con google.com"

## 🔍 Diagnóstico de Errores

### Error 1: "Error 401: invalid_client"
**Causa:** El Client ID no coincide con el configurado en Google Cloud Console

### Error 2: "No puedes continuar con google.com - Se produjo un error"
**Causa:** Los orígenes autorizados no están correctamente configurados en Google Cloud Console

## ✅ Solución Completa

### Paso 1: Verificar Google Cloud Console

#### 1.1 Acceder a Credenciales
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu proyecto (o créalo si no existe)

#### 1.2 Verificar/Crear Client ID OAuth 2.0

**Si ya tienes un Client ID:**
1. Click en el nombre del Client ID existente
2. Verifica que el Client ID sea: `385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com`
3. Si NO coincide, copia el Client ID correcto y actualiza `.env.local`

**Si necesitas crear uno nuevo:**
1. Click en "+ CREAR CREDENCIALES"
2. Selecciona "ID de cliente de OAuth"
3. Tipo de aplicación: **"Aplicación web"**
4. Nombre: "AccountExpress Web Client"

#### 1.3 Configurar Orígenes Autorizados (CRÍTICO)

**Orígenes de JavaScript autorizados:**
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
```

**IMPORTANTE:** 
- NO uses `https://` para localhost
- NO agregues rutas adicionales (ej: `/login`)
- Usa exactamente el puerto donde corre tu app (5173 para Vite)

**URIs de redireccionamiento autorizados:**
```
http://localhost:5173
http://localhost:3000
```

#### 1.4 Guardar Cambios
1. Click en "GUARDAR"
2. Espera 5-10 segundos para que los cambios se propaguen

### Paso 2: Configurar Pantalla de Consentimiento

#### 2.1 Acceder a Pantalla de Consentimiento
1. En Google Cloud Console, ve a: "Pantalla de consentimiento de OAuth"
2. Si no está configurada, configúrala ahora

#### 2.2 Configuración Básica
- **Tipo de usuario:** Externo
- **Nombre de la aplicación:** AccountExpress
- **Email de asistencia:** tu-email@gmail.com
- **Logo:** (opcional)

#### 2.3 Ámbitos (Scopes)
Agrega estos ámbitos:
- `email`
- `profile`
- `openid`

#### 2.4 Usuarios de Prueba
**IMPORTANTE:** Agrega tu email a la lista de usuarios de prueba:
- `nmira.omar@gmail.com`

Sin esto, verás el error "No puedes continuar con google.com"

#### 2.5 Estado de Publicación
- Para desarrollo: Dejar en **"Testing"**
- Para producción: Click en **"Publicar aplicación"**

### Paso 3: Verificar .env.local

Abre `.env.local` y verifica que tenga:

```bash
VITE_GOOGLE_CLIENT_ID=385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com
```

**Verificaciones:**
- ✅ Sin espacios al inicio o final
- ✅ Sin comillas
- ✅ Exactamente 72 caracteres
- ✅ Termina en `.apps.googleusercontent.com`

### Paso 4: Reiniciar el Servidor

**CRÍTICO:** Debes reiniciar el servidor para que lea el nuevo `.env.local`

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Limpiar caché (opcional pero recomendado)
npm run build

# 3. Reiniciar
npm run dev
```

### Paso 5: Limpiar Caché del Navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar de forma forzada"

O usa: `Ctrl + Shift + Delete` → Limpiar caché

### Paso 6: Probar el Login

1. Abre: http://localhost:5173
2. Click en "Iniciar sesión con Google"
3. Debería abrir el popup de Google sin errores
4. Selecciona tu cuenta
5. Acepta los permisos
6. ✅ Login exitoso

## 🐛 Troubleshooting Específico

### Error: "The OAuth client was not found"

**Causa:** El Client ID en `.env.local` no existe en Google Cloud Console

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Copia el Client ID exacto
3. Actualiza `.env.local`
4. Reinicia el servidor

### Error: "redirect_uri_mismatch"

**Causa:** La URL de tu app no está en los orígenes autorizados

**Solución:**
1. Ve a Google Cloud Console → Credenciales → Tu Client ID
2. Agrega `http://localhost:5173` a "Orígenes de JavaScript autorizados"
3. Agrega `http://localhost:5173` a "URIs de redireccionamiento autorizados"
4. Guarda y espera 5-10 segundos

### Error: "No puedes continuar con google.com"

**Causa:** Tu email no está en la lista de usuarios de prueba

**Solución:**
1. Ve a Google Cloud Console → "Pantalla de consentimiento de OAuth"
2. Scroll hasta "Usuarios de prueba"
3. Click en "+ AGREGAR USUARIOS"
4. Agrega: `nmira.omar@gmail.com`
5. Guarda

### Error: "access_denied"

**Causa:** El usuario rechazó los permisos o no está autorizado

**Solución:**
1. Verifica que tu email esté en "Usuarios de prueba"
2. Intenta con una cuenta diferente
3. Verifica que los ámbitos (scopes) estén correctamente configurados

### El popup se cierra inmediatamente

**Causa:** Problema con los orígenes autorizados

**Solución:**
1. Verifica que `http://localhost:5173` esté en los orígenes
2. NO uses `https://` para localhost
3. Verifica que el puerto sea el correcto (5173 para Vite)
4. Limpia la caché del navegador

## 📋 Checklist de Verificación

Antes de probar, verifica que:

- [ ] Client ID en `.env.local` coincide con Google Cloud Console
- [ ] Orígenes autorizados incluyen `http://localhost:5173`
- [ ] URIs de redireccionamiento incluyen `http://localhost:5173`
- [ ] Pantalla de consentimiento configurada
- [ ] Tu email está en "Usuarios de prueba"
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Caché del navegador limpiada

## 🎯 Configuración Correcta Final

### Google Cloud Console

**Credenciales → Tu Client ID:**
```
Orígenes de JavaScript autorizados:
  http://localhost:5173
  http://localhost:3000
  http://127.0.0.1:5173

URIs de redireccionamiento autorizados:
  http://localhost:5173
  http://localhost:3000
```

**Pantalla de consentimiento:**
```
Tipo: Externo
Estado: Testing
Usuarios de prueba: nmira.omar@gmail.com
Ámbitos: email, profile, openid
```

### .env.local

```bash
VITE_GOOGLE_CLIENT_ID=385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com
```

## 🚀 Resultado Esperado

Después de seguir todos los pasos:

```
✅ Popup de Google se abre sin errores
✅ Puedes seleccionar tu cuenta
✅ Aceptas los permisos
✅ Login exitoso
✅ Acceso al sistema
```

---

**Tiempo estimado:** 10-15 minutos  
**Dificultad:** Media  
**Requiere:** Acceso a Google Cloud Console
