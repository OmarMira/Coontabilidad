---
name: sistema-backup
description: Ejecuta copias de seguridad cifradas (.aex) o restaura la base de datos. Úsalo cuando el usuario pida "guardar todo", "hacer backup" o "restaurar".
---

# Sistema de Respaldo y Restauración (Iron Core)

Esta skill gestiona la integridad de los datos mediante copias de seguridad cifradas. El sistema utiliza el formato `.aex` (Account Express Encrypted) para asegurar la información financiera.

## Capacidades

1. **Crear Respaldo (Backup)**:
    - Genera un archivo `.aex` con toda la base de datos SQLite y los metadatos.
    - Utiliza `src/services/backup/EnhancedBackupService.ts` o `src/services/BackupService.ts`.
    - Asegura que el cifrado AES-256 se aplique correctamente antes de guardar.

2. **Restaurar Base de Datos**:
    - Permite recuperar el estado del sistema desde un archivo previo.
    - **ADVERTENCIA**: Esta es una operación destructiva para los datos actuales. Siempre sugiere crear un respaldo de emergencia antes de restaurar.

## Flujo de Trabajo

### Para Crear Backup

1. Verificar que no haya transacciones activas pendientes.
2. Invocar el método de creación de backup del servicio.
3. Confirmar ubicación de guardado (OPFS o descarga local).

### Para Restaurar

1. Validar la integridad del archivo `.aex` (Checksum/Hash).
2. Detener escrituras en la base de datos actuales.
3. Reemplazar el archivo `accountexpress.db` en OPFS.
4. Reiniciar la conexión a la base de datos (`initDB`).

## Código Relevante

- `src/services/backup/EnhancedBackupService.ts`
- `src/components/maintenance/DatabaseMaintenance.tsx`
