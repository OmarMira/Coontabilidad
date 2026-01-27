---
name: sistema-backup
description: Gestiona la creación y restauración de copias de seguridad cifradas (.aex).
---

# Instrucciones

Este servicio permite la exportación e importación segura de toda la base de datos de AccountExpress usando cifrado de grado militar (Iron Core).

1. **Creación de Backup (.exportToAex)**:
   - Invoca `BackupService.createBackup()` para generar un blob JSON cifrado.
   - El proceso exporta el estado actual de la DB, aplica cifrado AES con salt/iv y firma el archivo con un checksum HMAC.
   - El archivo resultante tiene extensión `.aex`.

2. **Restauración de Backup (.restoreFromAex)**:
   - Invoca `BackupService.restoreBackup(jsonString)`.
   - El sistema validará primero la integridad del archivo mediante el checksum.
   - Si la firma es válida, procede a descifrar el blob y restaurar el archivo de base de datos directamente al sistema de archivos del navegador (OPFS).

3. **Mantenimiento**:
   - Siempre verifica la disponibilidad del servicio mediante `await backupService.isAvailable()` antes de iniciar una operación.

# Referencias Técnicas

- **Servicio Core**: `src/services/BackupService.ts`
- **Motor Cifrado**: `src/core/security/BasicEncryption.ts`
- **UI de Gestión**: `src/components/BackupRestore.tsx`
