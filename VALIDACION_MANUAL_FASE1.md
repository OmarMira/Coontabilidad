# 📋 GUÍA DE VALIDACIÓN MANUAL - FASE 1

**Objetivo**: Validar manualmente todas las funcionalidades implementadas en Fase 1 (Hybrid Persistence)

---

## ✅ CHECKLIST DE VALIDACIÓN

### 1. CONFIGURACIÓN DE CLOUD BACKUP

#### Paso 1.1: Acceder a Configuración
- [ ] Abrir AccountExpress
- [ ] Ir a **Settings** → **Cloud Backup**
- [ ] Verificar que el formulario se carga correctamente

#### Paso 1.2: Configurar Credenciales
- [ ] Ingresar **Endpoint**: `https://s3.amazonaws.com` (o MinIO local)
- [ ] Ingresar **Bucket**: `accountexpress-backups-test`
- [ ] Ingresar **Access Key**: `[TU_ACCESS_KEY]`
- [ ] Ingresar **Secret Key**: `[TU_SECRET_KEY]`
- [ ] Ingresar **Región**: `us-east-1`

#### Paso 1.3: Probar Conexión
- [ ] Click en **"🔍 Probar Conexión"**
- [ ] Esperar resultado
- [ ] Verificar mensaje: **"✅ Conexión exitosa! Las credenciales son válidas."**

#### Paso 1.4: Activar Auto-Backup
- [ ] Marcar checkbox **"Activar backups automáticos (cada 6 horas)"**
- [ ] Click en **"💾 Guardar Configuración"**
- [ ] Verificar mensaje: **"✅ Configuración guardada y backups automáticos activados"**

**Resultado Esperado**: Configuración guardada y auto-backup programado

---

### 2. BACKUP MANUAL

#### Paso 2.1: Crear Backup Manual
- [ ] En la misma pantalla de Cloud Backup
- [ ] Click en **"📦 Crear Backup Ahora"**
- [ ] Esperar confirmación
- [ ] Verificar mensaje: **"✅ Backup manual creado: backup_manual_[timestamp].aex"**

#### Paso 2.2: Verificar en Consola
- [ ] Abrir DevTools (F12)
- [ ] Ir a pestaña **Console**
- [ ] Buscar mensajes:
  ```
  ✅ S3 Upload successful: backup_manual_[timestamp].aex
  ```

#### Paso 2.3: Verificar en S3
- [ ] Abrir tu consola de S3 (AWS Console o MinIO)
- [ ] Navegar al bucket configurado
- [ ] Verificar que existe el archivo `backup_manual_[timestamp].aex`
- [ ] Verificar tamaño del archivo (debería ser menor al DB original por compresión)

**Resultado Esperado**: Archivo de backup en S3, cifrado y comprimido

---

### 3. PERSISTENT STORAGE

#### Paso 3.1: Verificar Solicitud de Persistencia
- [ ] Abrir DevTools (F12)
- [ ] Ir a pestaña **Console**
- [ ] Buscar mensaje al iniciar la app:
  ```
  🔧 Initializing Persistent Storage Service...
  ✅ Persistent storage granted - data is now protected
  ```

#### Paso 3.2: Verificar Reporte de Storage
- [ ] En Console, buscar:
  ```
  📊 STORAGE STATUS REPORT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔒 Persistent Storage: ✅ ENABLED
  💾 Usage: [X]MB / [Y]MB ([Z]%)
  📦 Available: [A]MB
  ```

#### Paso 3.3: Verificar en Browser Settings
- [ ] Chrome: `chrome://settings/content/storageAccess`
- [ ] Firefox: `about:preferences#privacy`
- [ ] Verificar que AccountExpress tiene permiso de almacenamiento persistente

**Resultado Esperado**: Almacenamiento persistente otorgado, datos protegidos

---

### 4. RECUPERACIÓN DESDE CLOUD

#### Paso 4.1: Acceder a Recovery
- [ ] Ir a **Settings** → **Recovery** (o **Backup Recovery**)
- [ ] Verificar que la pantalla se carga

#### Paso 4.2: Listar Backups Disponibles
- [ ] Click en **"🔄 Actualizar"**
- [ ] Esperar carga
- [ ] Verificar que aparece lista de backups
- [ ] Verificar que el backup más reciente tiene badge **"Más reciente"**

#### Paso 4.3: Restaurar desde Cloud
- [ ] Seleccionar el backup más reciente
- [ ] Click en **"🔄 Restaurar"**
- [ ] Leer advertencia:
  ```
  ⚠️ ADVERTENCIA: Esta operación reemplazará tu base de datos actual.
  Se creará un backup de seguridad antes de continuar.
  ¿Deseas restaurar desde: backup_[timestamp].aex?
  ```
- [ ] Click en **"Aceptar"**
- [ ] Observar progress bar:
  - "Creating safety backup..." (10%)
  - "Downloading backup from cloud..." (30-60%)
  - "Decrypting backup..." (60%)
  - "Decompressing backup..." (70%)
  - "Validating backup integrity..." (80%)
  - "Restoring database..." (90%)
  - "Verifying restoration..." (95%)
  - "Restoration complete!" (100%)
- [ ] Verificar mensaje: **"✅ Restauración completada exitosamente!"**
- [ ] Verificar que la app se recarga

#### Paso 4.4: Verificar Datos Restaurados
- [ ] Ir a **Dashboard**
- [ ] Verificar que los datos están presentes
- [ ] Ir a **Customers** → Verificar lista de clientes
- [ ] Ir a **Invoices** → Verificar facturas

**Resultado Esperado**: Datos restaurados correctamente desde cloud

---

### 5. RESTAURACIÓN DESDE ARCHIVO LOCAL

#### Paso 5.1: Descargar Backup
- [ ] En tu S3/MinIO, descargar un archivo `.aex`
- [ ] Guardar en tu computadora

#### Paso 5.2: Restaurar desde Archivo
- [ ] Ir a **Settings** → **Recovery**
- [ ] En sección **"💾 Restaurar desde Archivo Local"**
- [ ] Click en **"📁 Seleccionar Archivo"**
- [ ] Seleccionar el archivo `.aex` descargado
- [ ] Confirmar advertencia
- [ ] Observar progress bar (igual que en cloud)
- [ ] Verificar restauración exitosa

**Resultado Esperado**: Datos restaurados desde archivo local

---

### 6. SAFETY BACKUP Y ROLLBACK

#### Paso 6.1: Simular Fallo de Restauración
- [ ] Crear un archivo `.aex` corrupto (renombrar un .txt a .aex)
- [ ] Intentar restaurar desde ese archivo
- [ ] Observar error
- [ ] Verificar mensaje:
  ```
  ❌ Error durante la restauración:
  Restoration failed, rolled back to previous state: Invalid backup file
  ```

#### Paso 6.2: Verificar Rollback
- [ ] Verificar que los datos NO se perdieron
- [ ] Ir a **Dashboard** → Datos intactos
- [ ] Verificar en Console:
  ```
  ⚠️ Restoration failed, rolling back...
  ✅ Rolled back to safety backup
  ```

**Resultado Esperado**: Rollback automático funciona, datos protegidos

---

### 7. AUTO-BACKUP PROGRAMADO

#### Paso 7.1: Verificar Scheduler
- [ ] Abrir DevTools → Console
- [ ] Buscar mensaje al iniciar:
  ```
  🔧 Initializing automatic backup scheduler...
  ✅ Automatic backups scheduled (every 6 hours)
  ```

#### Paso 7.2: Verificar Sync Outbox
- [ ] Abrir DevTools → Application → Storage → IndexedDB (o OPFS)
- [ ] Buscar tabla `sync_outbox`
- [ ] Verificar que hay entradas con `module = 'backups'`
- [ ] Verificar que `status = 'pending'` o `'processing'`

#### Paso 7.3: Esperar Procesamiento
- [ ] Esperar 1-2 minutos
- [ ] Verificar en Console:
  ```
  [SyncWorker] Starting Cloud Vault Upload: backup_[timestamp].aex
  [SyncWorker] Upload progress: 100%
  ✅ S3 Upload successful
  ```

**Resultado Esperado**: Backups automáticos se ejecutan y suben a S3

---

### 8. MONITOREO DE CUOTA

#### Paso 8.1: Verificar Monitoreo Activo
- [ ] Esperar 5 minutos (intervalo de monitoreo)
- [ ] Verificar en Console:
  ```
  🔍 Starting storage monitoring (interval: 300000ms)
  ```

#### Paso 8.2: Simular Espacio Bajo
- [ ] Llenar el almacenamiento del navegador (crear datos grandes)
- [ ] Esperar siguiente ciclo de monitoreo
- [ ] Verificar advertencia en Console:
  ```
  ⚠️ Storage usage high: 92.5%
  ⚠️ ADVERTENCIA: Almacenamiento casi lleno
  Uso: 92.5%
  Disponible: 50MB de 500MB
  ```

**Resultado Esperado**: Sistema detecta y advierte sobre espacio bajo

---

## 📊 RESULTADOS DE VALIDACIÓN

### Resumen de Tests

| Test | Resultado | Notas |
|------|-----------|-------|
| 1. Configuración Cloud Backup | ⬜ PASS / ⬜ FAIL | |
| 2. Backup Manual | ⬜ PASS / ⬜ FAIL | |
| 3. Persistent Storage | ⬜ PASS / ⬜ FAIL | |
| 4. Recuperación desde Cloud | ⬜ PASS / ⬜ FAIL | |
| 5. Restauración desde Archivo | ⬜ PASS / ⬜ FAIL | |
| 6. Safety Backup y Rollback | ⬜ PASS / ⬜ FAIL | |
| 7. Auto-Backup Programado | ⬜ PASS / ⬜ FAIL | |
| 8. Monitoreo de Cuota | ⬜ PASS / ⬜ FAIL | |

### Problemas Encontrados

```
[Documentar aquí cualquier problema encontrado durante la validación]

Ejemplo:
- Test 4: Restauración tardó más de lo esperado (2 minutos vs 30 segundos)
- Test 7: SyncWorker no procesó backup inmediatamente
```

### Observaciones

```
[Agregar observaciones generales]

Ejemplo:
- La compresión GZIP reduce el tamaño del backup en ~65%
- El cifrado AES-256-GCM agrega ~16 bytes de overhead (IV + auth tag)
- Persistent Storage fue otorgado automáticamente en Chrome
```

---

## 🎯 CRITERIOS DE ACEPTACIÓN

Para que Fase 1 se considere **100% COMPLETADA**, todos los tests deben pasar:

- [ ] ✅ Todos los tests manuales: **PASS**
- [ ] ✅ Todos los tests unitarios: **PASS** (ejecutar `npm test`)
- [ ] ✅ Todos los tests E2E: **PASS**
- [ ] ✅ No hay errores en Console durante uso normal
- [ ] ✅ Backups se crean correctamente en S3
- [ ] ✅ Restauración funciona sin pérdida de datos
- [ ] ✅ Safety backup protege contra fallos
- [ ] ✅ Persistent Storage otorgado
- [ ] ✅ Monitoreo de cuota funciona

---

## 📝 FIRMA DE VALIDACIÓN

**Validado por**: ___________________________  
**Fecha**: ___________________________  
**Resultado General**: ⬜ APROBADO / ⬜ RECHAZADO

**Comentarios**:
```
[Agregar comentarios finales]
```

---

**🎉 Si todos los tests pasan, Fase 1 está 100% COMPLETADA**
