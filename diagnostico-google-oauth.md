# 🔍 Diagnóstico: Google OAuth Error 401

## 📊 Estado Actual

### ❌ Errores Detectados

**Error 1:** `Error 401: invalid_client - The OAuth client was not found`
- **Significado:** El Client ID no es válido o no existe en Google Cloud Console
- **Ubicación:** Primera imagen (popup de Google)

**Error 2:** `No puedes continuar con google.com - Se produjo un error`
- **Significado:** Problema con orígenes autorizados o usuarios de prueba
- **Ubicación:** Segunda imagen (popup secundario)

## 🔧 Causas Probables

### 1. Client ID No Coincide
El Client ID en `.env.local` podría no coincidir con el de Google Cloud Console.

**Client ID actual en .env.local:**
```
385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com
```

**Acción:** Verifica en Google Cloud Console que este sea el Client ID correcto.

### 2. Orígenes No Autorizados
Google está bloqueando la solicitud porque `http://localhost:5173` no está en la lista de orígenes autorizados.

**Acción:** Agrega `http://localhost:5173` a los orígenes autorizados en Google Cloud Console.

### 3. Usuario No Autorizado
Tu email (`nmira.omar@gmail.com`) no está en la lista de usuarios de prueba.

**Acción:** Agrega tu email a "Usuarios de prueba" en la Pantalla de consentimiento.

### 4. Servidor No Reiniciado
El servidor no leyó el nuevo `.env.local` porque no se reinició.

**Acción:** Reinicia el servidor con `Ctrl+C` y luego `npm run dev`.

## ✅ Solución Paso a Paso

### Paso 1: Verificar Client ID en Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Busca tu Client ID de OAuth 2.0
3. Click en el nombre para ver los detalles
4. **Copia el Client ID completo**
5. Compáralo con el de `.env.local`

**Si NO coinciden:**
```bash
# Actualiza .env.local con el Client ID correcto
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_CORRECTO_AQUI
```

### Paso 2: Configurar Orígenes Autorizados

En la misma página del Client ID:

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

**IMPORTANTE:**
- ✅ Usa `http://` (NO `https://`)
- ✅ Usa el puerto exacto (5173 para Vite)
- ✅ NO agregues rutas (ej: `/login`)

Click en **"GUARDAR"** y espera 5-10 segundos.

### Paso 3: Configurar Usuarios de Prueba

1. Ve a: https://console.cloud.google.com/apis/credentials/consent
2. Scroll hasta "Usuarios de prueba"
3. Click en "+ AGREGAR USUARIOS"
4. Agrega: `nmira.omar@gmail.com`
5. Click en "GUARDAR"

### Paso 4: Reiniciar el Servidor

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Reiniciar
npm run dev
```

### Paso 5: Limpiar Caché del Navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. "Vaciar caché y recargar de forma forzada"

### Paso 6: Probar Nuevamente

1. Abre: http://localhost:5173
2. Click en "Iniciar sesión con Google"
3. Debería funcionar sin errores

## 🎯 Configuración Mínima Requerida

Para que funcione, necesitas:

### En Google Cloud Console:

**1. Client ID OAuth 2.0 creado**
- Tipo: Aplicación web
- Orígenes: `http://localhost:5173`
- URIs: `http://localhost:5173`

**2. Pantalla de consentimiento configurada**
- Tipo: Externo
- Estado: Testing
- Usuarios de prueba: `nmira.omar@gmail.com`

**3. APIs habilitadas**
- Google+ API (o People API)

### En tu proyecto:

**1. .env.local actualizado**
```bash
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_COMPLETO
```

**2. Servidor reiniciado**
```bash
npm run dev
```

**3. Caché limpiada**
- Ctrl+Shift+Delete → Limpiar caché

## 📝 Notas Importantes

### ⚠️ Errores Comunes

1. **Olvidar reiniciar el servidor** después de cambiar `.env.local`
2. **Usar `https://` en lugar de `http://`** para localhost
3. **No agregar el email a usuarios de prueba**
4. **Usar un Client ID de un proyecto diferente**
5. **No esperar 5-10 segundos** después de guardar cambios en Google Cloud Console

### 💡 Tips

- Los cambios en Google Cloud Console pueden tardar hasta 10 segundos en propagarse
- Si sigues teniendo problemas, intenta crear un nuevo Client ID desde cero
- Verifica que estés usando el proyecto correcto en Google Cloud Console
- Asegúrate de que el puerto en el navegador coincida con el configurado (5173)

## 🔗 Enlaces Útiles

- **Google Cloud Console:** https://console.cloud.google.com/
- **Credenciales:** https://console.cloud.google.com/apis/credentials
- **Pantalla de consentimiento:** https://console.cloud.google.com/apis/credentials/consent
- **Documentación OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2

---

**Próximo paso:** Sigue la guía en `SOLUCION_ERROR_GOOGLE_OAUTH_FINAL.md` para configurar correctamente Google Cloud Console.
