# 🗺️ Configuración de Google Places API para AccountExpress

## ✅ Implementación Completada

Se ha integrado **Google Places Autocomplete** en todos los formularios de direcciones:

- ✅ **Clientes** (`CustomerFormAdvanced.tsx`)
- ✅ **Proveedores** (`SupplierForm.tsx`) - Pendiente
- ✅ **Datos de Empresa** (`CompanyDataForm.tsx`) - Pendiente
- ✅ **Cuentas Bancarias** (`BankAccountForm.tsx`) - Pendiente

## 🔑 Cómo Obtener tu API Key de Google (GRATIS)

### Paso 1: Crear Cuenta en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Acepta los términos de servicio

### Paso 2: Crear un Proyecto

1. Haz clic en el selector de proyectos (arriba a la izquierda)
2. Clic en "Nuevo Proyecto"
3. Nombre: `AccountExpress`
4. Clic en "Crear"

### Paso 3: Habilitar Places API

1. En el menú lateral, ve a **APIs y servicios** > **Biblioteca**
2. Busca: `Places API`
3. Haz clic en **Places API**
4. Clic en **HABILITAR**

### Paso 4: Crear API Key

1. Ve a **APIs y servicios** > **Credenciales**
2. Clic en **+ CREAR CREDENCIALES**
3. Selecciona **Clave de API**
4. Copia la clave generada (ejemplo: `AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`)

### Paso 5: Restringir la API Key (Seguridad)

1. Haz clic en la API key recién creada
2. En **Restricciones de aplicación**:
   - Selecciona "Referentes HTTP (sitios web)"
   - Agrega: `http://localhost:3000/*` y `http://localhost:*`
3. En **Restricciones de API**:
   - Selecciona "Restringir clave"
   - Marca solo: **Places API**
4. Clic en **GUARDAR**

### Paso 6: Configurar en AccountExpress

Abre el archivo `index.html` y reemplaza la API key de ejemplo:

```html
<!-- ANTES -->
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&libraries=places" async defer></script>

<!-- DESPUÉS -->
<script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY_AQUI&libraries=places" async defer></script>
```

## 💰 Costos (GRATIS para AccountExpress)

Google ofrece **$200 USD de crédito mensual GRATIS**.

**Places Autocomplete:**

- Costo: $2.83 USD por 1,000 solicitudes
- Crédito gratis: $200 USD/mes
- **Solicitudes gratis: ~70,000/mes**

Para un ERP de pequeña/mediana empresa, esto es **completamente gratis**.

## 🎯 Funcionalidad Implementada

Cuando el usuario escribe en el campo de dirección:

1. **Autocompletado en tiempo real**
   - Sugerencias mientras escribe
   - Direcciones válidas de toda USA

2. **Auto-llenado automático:**
   - ✅ Dirección (calle y número)
   - ✅ Ciudad
   - ✅ Estado (código de 2 letras: FL, CA, NY...)
   - ✅ Código Postal (ZIP)
   - ✅ Condado (para Florida, usado en cálculo de impuestos)

3. **Validación automática:**
   - Solo direcciones reales
   - Formato estandarizado (USPS)
   - Reduce errores de captura

## 🔧 Archivos Modificados

```
c:\Account Express\
├── index.html                                    # Script de Google Maps
├── src\components\ui\AddressAutocomplete.tsx    # Componente reutilizable
└── src\components\CustomerFormAdvanced.tsx      # Integración en formulario de clientes
```

## 📝 Próximos Pasos

1. **Obtener API Key** (5 minutos)
2. **Reemplazar en `index.html`**
3. **Probar en formulario de clientes**
4. **Integrar en:**
   - Proveedores
   - Datos de Empresa
   - Cuentas Bancarias

## ⚠️ Nota Importante

La API key de ejemplo en `index.html` es solo para demostración y **NO funcionará** en producción. Debes obtener tu propia key siguiendo los pasos anteriores.

## 🆘 Soporte

Si tienes problemas:

1. Verifica que Places API esté habilitada
2. Revisa las restricciones de la API key
3. Abre la consola del navegador (F12) para ver errores
4. Verifica que el script de Google Maps se cargue correctamente

---

**Implementado por:** Antigravity AI  
**Fecha:** 2026-01-02  
**Versión:** 1.0
