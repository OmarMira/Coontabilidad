---
name: hybrid-backup-manager
description: Gestión de backups cifrados AES-256-GCM hacia destinos locales y remotos, implementando patrón Outbox para sincronización.
version: 1.0.0
---

# Hybrid Backup Manager Skill

Este skill gestiona la salvaguarda de los datos críticos del sistema. Implementa una estrategia de respaldo 3-2-1 modificada para entornos web/locales híbridos, priorizando la seguridad (cifrado) y la consistencia en entornos con conectividad intermitente (Offline-First).

## ⚠️ Reglas Críticas (Hard Constraints)

1. **Cifrado Obligatorio**: Todo backup exportado fuera del entorno seguro del navegador (OPFS) debe estar cifrado con **AES-256-GCM**.
    * La clave de cifrado se deriva de una passphrase maestra usando PBKDF2 (mínimo 100k iteraciones).
2. **Outbox Pattern**:
    * Si no hay conexión, el backup se marca como `pending_sync` en una tabla local `sys_outbox`.
    * Un worker en segundo plano intenta sincronizar cuando detecta red.
3. **Formato**:
    * Contenedor: ZIP o Blob binario propietario (`.aex`).
    * Contenido: Dump SQL completo + Metadatos JSON (checksum, timestamp, version).

## Flujo de Backup (Backup Flow)

### 1. Generación Local

1. **Snapshot**: `db.export()` (dump binario de SQLite/wa-sqlite).
2. **Compresión**: GZIP/Deflate (opcional).
3. **Cifrado**:

    ```typescript
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        dumpData
    );
    ```

4. **Empaquetado**: Concatenar `Salt + IV + EncryptedData` -> Archivo `.aex`.
5. **Persistencia Local**: Guardar en OPFS (`backups/backup-{timestamp}.aex`).

### 2. Sincronización Remota (Hybrid)

1. Registrar evento en tabla `sys_outbox`:
    * `type`: 'BACKUP_UPLOAD'
    * `payload`: Path del archivo local o referencia ID.
    * `status`: 'PENDING'
2. **Sync Worker**:
    * Detecta `online`.
    * Lee `sys_outbox`.
    * Sube el archivo al endpoint remoto (S3/API).
    * Actualiza `status` a 'COMPLETED'.
    * Elimina copia local si la política de retención lo dicta.

## Recuperación (Restore)

* **Importar**: Leer archivo `.aex`.
* **Descifrar**: Solicitar passphrase al usuario -> Derivar Key -> Descifrar AES-GCM.
* **Validar Header**: Verificar "Magic Bytes" y versión compatible.
* **Reemplazar DB**: `db.close()` -> Sobreescribir OPFS -> Re-inicializar conexión.

## Archivos Clave

* `src/database/BackupManager.ts` (Lógica de orquestación).
* `src/core/security/EncryptionService.ts` (Implementación AES-GCM).
