# 🔧 DOCUMENTACIÓN TÉCNICA - SISTEMA DE BACKUPS MULTI-UBICACIÓN

## 📋 Para Desarrolladores

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     BackupPanel.tsx                         │
│                  (Interfaz de Usuario)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BackupLocationSelector.tsx                     │
│              (Modal de Selección de Ubicación)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BackupLocationService.ts                       │
│              (Lógica de Negocio)                            │
└─────┬───────────┬───────────┬───────────┬───────────────────┘
      │           │           │           │
      ▼           ▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│Downloads │ │  Local  │ │ Google  │ │   Pendrive   │
│  Folder  │ │  Disk   │ │  Drive  │ │   /External  │
└──────────┘ └─────────┘ └─────────┘ └──────────────┘
```

---

## 🏗️ COMPONENTES PRINCIPALES

### 1. BackupLocationService.ts

**Responsabilidad**: Gestión de ubicaciones de backup y operaciones de archivo

**Métodos Públicos**:

```typescript
// Verifica soporte de File System Access API
static isFileSystemAccessSupported(): boolean

// Permite al usuario elegir directorio para guardar
static async chooseBackupLocation(): Promise<BackupDestination | null>

// Guarda backup en ubicación especificada
static async saveBackup(
    data: string,
    filename: string,
    destination?: BackupDestination
): Promise<boolean>

// Permite al usuario elegir archivo para restaurar
static async chooseBackupFile(): Promise<File | null>

// Detecta dispositivos externos (limitado por navegador)
static async detectExternalDevices(): Promise<string[]>

// Obtiene última ubicación usada
static getLastUsedLocation(): BackupDestination | null

// Limpia última ubicación usada
static clearLastUsedLocation(): void
```

**Métodos Privados**:

```typescript
// Guarda en Google Drive
private static async saveToGoogleDrive(data: string, filename: string): Promise<boolean>

// Guarda usando File System Access API
private static async saveToFileSystem(
    data: string,
    filename: string,
    dirHandle: FileSystemDirectoryHandle
): Promise<boolean>

// Guarda en carpeta de Descargas (fallback)
private static async saveToDownloads(data: string, filename: string): Promise<boolean>

// Método tradicional para elegir archivo (fallback)
private static async chooseFileTraditional(): Promise<File | null>
```

**Tipos**:

```typescript
export type BackupLocation = 'downloads' | 'local-disk' | 'google-drive' | 'custom';

export interface BackupDestination {
    type: BackupLocation;
    handle?: FileSystemDirectoryHandle; // Para File System Access API
    path?: string; // Para mostrar al usuario
}
```

---

### 2. BackupLocationSelector.tsx

**Responsabilidad**: UI para selección de ubicación de backup

**Props**:

```typescript
interface BackupLocationSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: BackupDestination) => void;
}
```

**Características**:
- Modal con 4 opciones visuales
- Iconos descriptivos para cada opción
- Detección automática de soporte de API
- Manejo de errores con mensajes amigables
- Animaciones suaves

---

### 3. BackupPanel.tsx (Modificado)

**Responsabilidad**: Panel principal de gestión de backups

**Cambios Implementados**:

```typescript
// Estado para modal de selección
const [showLocationSelector, setShowLocationSelector] = useState(false);

// Nuevo flujo de backup
const handleBackup = async () => {
    setShowLocationSelector(true); // Mostrar selector
};

const handleLocationSelected = async (location: BackupDestination) => {
    setShowLocationSelector(false);
    // Generar datos de backup
    const backupData = await BackupService.createBackup();
    // Guardar en ubicación elegida
    const success = await BackupLocationService.saveBackup(
        backupData,
        `backup_${Date.now()}.aex`,
        location
    );
    // Mostrar resultado
};

// Nuevo flujo de restauración
const handleRestore = async () => {
    const file = await BackupLocationService.chooseBackupFile();
    if (file) {
        const content = await file.text();
        await BackupService.restoreBackup(content);
    }
};
```

---

## 🔌 APIS UTILIZADAS

### File System Access API

**Soporte**: Chrome 86+, Edge 86+, Opera 72+

**Métodos Usados**:

```typescript
// Selector de directorio
const dirHandle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'documents'
});

// Selector de archivo
const [fileHandle] = await window.showOpenFilePicker({
    types: [{
        description: 'AccountExpress Backup',
        accept: { 'application/json': ['.aex', '.json'] }
    }],
    multiple: false
});

// Crear archivo en directorio
const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
const writable = await fileHandle.createWritable();
await writable.write(data);
await writable.close();
```

**Fallback**: Si no está disponible, usa método tradicional con `<input type="file">`

---

### Google Drive API

**Integración**: A través de `GDriveSyncService.ts`

**Flujo**:
1. Usuario elige "Google Drive"
2. Sistema verifica token OAuth
3. Si no hay token o está expirado, solicita login
4. Sube archivo usando `uploadBackup()`
5. Mantiene rotación de últimos 5 backups

**Código**:

```typescript
const blob = new Blob([data], { type: 'application/json' });
const success = await GDriveSyncService.uploadBackup(blob, filename);
```

---

## 🧪 TESTING

### Suite de Tests

**Archivo**: `src/tests/integration/BackupLocationService.test.ts`

**Tests Implementados** (6/6 ✅):

1. **Detección de API**: Verifica soporte de File System Access API
2. **Guardar en Descargas**: Valida método fallback
3. **Manejo de Errores**: Verifica comportamiento ante fallos
4. **Recordar Ubicación**: Valida persistencia de última ubicación
5. **Limpiar Ubicación**: Verifica limpieza de estado
6. **Detectar Dispositivos**: Valida detección de externos

**Ejecutar Tests**:

```bash
# Todos los tests
npm test

# Solo tests de BackupLocationService
npm test src/tests/integration/BackupLocationService.test.ts

# Con cobertura
npm test -- --coverage
```

---

## 🔒 SEGURIDAD

### Permisos del Navegador

**File System Access API requiere**:
- Permiso explícito del usuario (no se puede automatizar)
- Contexto seguro (HTTPS o localhost)
- Interacción del usuario (no se puede llamar sin click)

**Validaciones Implementadas**:

```typescript
// Verificar soporte antes de usar
if (!BackupLocationService.isFileSystemAccessSupported()) {
    // Usar fallback
}

// Manejar cancelación del usuario
try {
    const dirHandle = await window.showDirectoryPicker();
} catch (e) {
    if (e.name === 'AbortError') {
        // Usuario canceló
    }
}
```

### Datos Sensibles

**Cifrado**: Los backups contienen datos cifrados
**Tokens OAuth**: Almacenados en localStorage con refresh automático
**Logs**: No se registran datos sensibles, solo metadatos

---

## 📊 LOGGING

### Sistema de Logs

**Servicio**: `SystemLogger.ts`

**Eventos Registrados**:

```typescript
// Selección de ubicación
logger.info('BackupLocation', 'location_selected', `Usuario seleccionó: ${dirHandle.name}`);

// Guardado exitoso
logger.info('BackupLocation', 'saved_to_disk', `Backup guardado en: ${path}`);

// Errores
logger.error('BackupLocation', 'save_failed', 'Error guardando backup', null, error);

// Cancelaciones
logger.info('BackupLocation', 'cancelled', 'Usuario canceló selección');
```

**Niveles**:
- `info`: Operaciones normales
- `warn`: Situaciones inusuales pero manejables
- `error`: Errores que requieren atención

---

## 🚀 DEPLOYMENT

### Configuración de Producción

**vite.config.ts**:

```typescript
export default defineConfig({
    build: {
        target: 'es2020', // Requerido para File System Access API
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    'backup': ['./src/services/BackupLocationService.ts']
                }
            }
        }
    }
});
```

### Variables de Entorno

```env
# Google Drive OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key

# Configuración de Backups
VITE_MAX_BACKUP_SIZE=52428800  # 50MB
VITE_BACKUP_ROTATION_COUNT=5   # Últimos 5 backups en GDrive
```

---

## 🔄 FLUJOS DE TRABAJO

### Flujo de Backup

```
Usuario hace click en "Elegir Ubicación y Guardar"
    ↓
BackupPanel muestra BackupLocationSelector
    ↓
Usuario elige ubicación (Downloads/Local/GDrive/Pendrive)
    ↓
BackupLocationService.saveBackup() ejecuta lógica específica
    ↓
    ├─ Downloads: Crea blob y descarga
    ├─ Local: Usa File System Access API
    ├─ GDrive: Llama a GDriveSyncService
    └─ Pendrive: Usa File System Access API
    ↓
Retorna success/failure
    ↓
BackupPanel muestra mensaje al usuario
```

### Flujo de Restauración

```
Usuario hace click en "Elegir Archivo y Restaurar"
    ↓
BackupLocationService.chooseBackupFile() abre selector
    ↓
Usuario navega y selecciona archivo .aex
    ↓
Sistema lee contenido del archivo
    ↓
BackupService.restoreBackup() procesa datos
    ↓
Sistema restaura base de datos
    ↓
BackupPanel muestra confirmación
```

---

## 🐛 DEBUGGING

### Herramientas de Desarrollo

**Chrome DevTools**:

```javascript
// Inspeccionar permisos
navigator.permissions.query({ name: 'file-system' })

// Ver handles activos
// (No hay API pública, usar breakpoints)

// Simular fallo de red
// DevTools > Network > Offline
```

**Logs del Sistema**:

```typescript
// Habilitar logs detallados
localStorage.setItem('debug', 'BackupLocation:*');

// Ver logs en consola
// Filtrar por "BackupLocation"
```

---

## 📈 MÉTRICAS Y MONITOREO

### Eventos a Monitorear

```typescript
// Uso de ubicaciones
analytics.track('backup_location_selected', {
    location: 'google-drive',
    timestamp: Date.now()
});

// Éxito/Fallo de backups
analytics.track('backup_completed', {
    success: true,
    location: 'local-disk',
    size: fileSize,
    duration: endTime - startTime
});

// Errores
analytics.track('backup_error', {
    error: error.message,
    location: 'google-drive',
    code: error.code
});
```

---

## 🔧 MANTENIMIENTO

### Tareas Comunes

**Actualizar límite de rotación de GDrive**:

```typescript
// En GDriveSyncService.ts
private static readonly MAX_BACKUPS = 10; // Cambiar de 5 a 10
```

**Agregar nueva ubicación**:

1. Agregar tipo en `BackupLocation`:
```typescript
export type BackupLocation = 'downloads' | 'local-disk' | 'google-drive' | 'custom' | 'dropbox';
```

2. Implementar método en `BackupLocationService`:
```typescript
private static async saveToDropbox(data: string, filename: string): Promise<boolean> {
    // Implementación
}
```

3. Agregar caso en `saveBackup()`:
```typescript
case 'dropbox':
    return await this.saveToDropbox(data, filename);
```

4. Agregar opción en `BackupLocationSelector.tsx`

---

## 📚 RECURSOS ADICIONALES

### Documentación de APIs

- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

### Compatibilidad de Navegadores

- [Can I Use - File System Access](https://caniuse.com/native-filesystem-api)
- [Can I Use - Storage API](https://caniuse.com/mdn-api_storagemanager)

---

## 🤝 CONTRIBUIR

### Guía de Estilo

```typescript
// Usar async/await
async function saveBackup() { }

// Manejar errores explícitamente
try {
    await operation();
} catch (e) {
    logger.error('Context', 'operation_failed', 'Description', null, e);
    return false;
}

// Documentar métodos públicos
/**
 * Guarda backup en ubicación especificada
 * @param data - Datos a guardar
 * @param filename - Nombre del archivo
 * @param destination - Ubicación de destino
 * @returns true si éxito, false si fallo
 */
```

### Tests Requeridos

- Unit tests para cada método público
- Integration tests para flujos completos
- E2E tests para UI (opcional)

---

*Documentación generada para AccountExpress Next-Gen v2.0 NASA Edition*
*Última actualización: 5 de febrero de 2026*
