# 🔐 Configuración de Google Identity Services

## 📋 Pasos para Configurar Google OAuth 2.0

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Click en el selector de proyectos (arriba a la izquierda)
3. Click en "Nuevo Proyecto"
4. Nombre del proyecto: `AccountExpress` (o el que prefieras)
5. Click en "Crear"

### 2. Habilitar Google Identity Services API

1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Identity Services API"
3. Click en "Habilitar"

### 3. Configurar Pantalla de Consentimiento OAuth

1. Ve a "APIs y servicios" > "Pantalla de consentimiento de OAuth"
2. Selecciona "Externo" (para pruebas)
3. Click en "Crear"
4. Completa la información:
   - **Nombre de la aplicación**: AccountExpress
   - **Correo electrónico de asistencia**: tu email
   - **Logotipo de la aplicación**: (opcional)
   - **Dominios autorizados**: (dejar vacío para desarrollo local)
   - **Correo electrónico del desarrollador**: tu email
5. Click en "Guardar y continuar"
6. En "Ámbitos", click en "Guardar y continuar" (usar ámbitos predeterminados)
7. En "Usuarios de prueba", añade tu email de Google
8. Click en "Guardar y continuar"

### 4. Crear Credenciales OAuth 2.0

1. Ve a "APIs y servicios" > "Credenciales"
2. Click en "+ CREAR CREDENCIALES"
3. Selecciona "ID de cliente de OAuth 2.0"
4. Tipo de aplicación: **Aplicación web**
5. Nombre: `AccountExpress Web Client`
6. **Orígenes de JavaScript autorizados**:
   - Click en "+ Agregar URI"
   - Añade: `http://localhost:3000`
   - Añade: `http://localhost:5173` (si usas Vite)
7. **URIs de redireccionamiento autorizados**:
   - Dejar vacío (no necesario para Google Identity Services)
8. Click en "Crear"

### 5. Copiar Client ID

1. Aparecerá un modal con tu **Client ID**
2. Copia el Client ID (formato: `1234567890-abc123...apps.googleusercontent.com`)
3. **¡IMPORTANTE!** Guarda este Client ID de forma segura

### 6. Configurar en AccountExpress

1. En la raíz del proyecto, crea un archivo `.env`:

   ```bash
   # Windows
   New-Item -Path .env -ItemType File
   
   # Linux/Mac
   touch .env
   ```

2. Abre el archivo `.env` y añade:

   ```env
   VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_AQUI
   ```

   Ejemplo:

   ```env
   VITE_GOOGLE_CLIENT_ID=1234567890-abc123def456ghi789jkl.apps.googleusercontent.com
   ```

3. Guarda el archivo

### 7. Reiniciar el Servidor de Desarrollo

```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar:
npm run dev
```

## ✅ Verificar Configuración

1. Abre `http://localhost:3000` (o el puerto que uses)
2. En la página de login, deberías ver el botón "Sign in with Google"
3. Click en el botón
4. Selecciona tu cuenta de Google
5. Autoriza la aplicación
6. Deberías ser redirigido al dashboard

## 🔒 Seguridad

- **NUNCA** compartas tu Client ID públicamente en repositorios
- El archivo `.env` está en `.gitignore` por defecto
- Para producción, configura dominios autorizados reales

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

- Verifica que `http://localhost:3000` esté en "Orígenes de JavaScript autorizados"
- Asegúrate de usar el puerto correcto

### El botón de Google no aparece

- Verifica que el archivo `.env` existe y tiene el Client ID correcto
- Reinicia el servidor de desarrollo
- Abre la consola del navegador (F12) para ver errores

### Error: "idpiframe_initialization_failed"

- Verifica que las cookies de terceros estén habilitadas
- Prueba en modo incógnito
- Verifica la configuración de CORS

## 📚 Recursos Adicionales

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🎯 Funcionalidades Implementadas

✅ **Sign in with Google** - Botón de login con Google
✅ **One Tap** - Login automático con un click
✅ **Auto-registro** - Usuarios nuevos se crean automáticamente con rol "viewer"
✅ **Fallback local** - Login tradicional sigue funcionando
✅ **Persistencia** - Sesión se mantiene después de recargar
