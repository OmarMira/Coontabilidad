---
name: gestion-backups
description: Ejecuta copias de seguridad cifradas (.aex) o restaura la base de datos. Activar con "hacer backup", "guardar todo" o "restaurar".
---

# Gestión de Copias de Seguridad (Backup System)

Este skill administra el ciclo de vida de los datos críticos del sistema mediante copias de seguridad cifradas y verificadas.

## Procedimiento de Respaldo (Backup)

1. **Congelar Estado**:
   - Asegurar que no haya escrituras activas en la base de datos SQLite.

2. **Exportar Datos**:
   - Utilizar el `BackupManager` para serializar la base de datos completa.
   - Formato objetivo: `.aex` (Account Express Encrypted).

3. **Cifrado y Seguridad**:
   - Aplicar cifrado AES-256 al archivo exportado.
   - Generar checksum/hash SHA-256 para integridad futura.

4. **Almacenamiento**:
   - Guardar el archivo en el directorio local o destino configurado (OPFS/File System).
   - Registrar la operación en `audit_log`.

## Procedimiento de Restauración

1. **Validar Archivo**:
   - Verificar la firma y el checksum del archivo `.aex` seleccionado.

2. **Restaurar**:
   - Descifrar el contenido.
   - Reemplazar la base de datos actual (requiere confirmación explícita del usuario).
   - Reiniciar conexiones a la DB.

## Referencias de Código

- `src/modules/backup/BackupManager.ts`
- `src/database/simple-db.ts` (función `createBackup`)
