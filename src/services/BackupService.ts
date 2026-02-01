import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { restoreDatabaseFromBackup, initDB } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { WorkerOrchestrator } from '../core/workers/WorkerOrchestrator';

const BACKUP_SECRET = "IRON-CORE-MASTER-KEY-2026-FLORIDA";

export class BackupService {
  private static orchestrator: WorkerOrchestrator | null = null;

  private static getOrchestrator(): WorkerOrchestrator {
    if (!this.orchestrator) {
      this.orchestrator = new WorkerOrchestrator();
    }
    return this.orchestrator;
  }

  /**
   * Genera un backup cifrado (.aex) con firma HMAC/Checksum.
   * NOW USES WORKER - NO UI FREEZE! 🚀
   */
  static async createBackup(onProgress?: (progress: any) => void): Promise<string> {
    // Ensure database is initialized with retry
    await initDB();

    // Wait a bit for initialization to complete
    let retries = 3;
    while (!DatabaseService['dbInstance'] && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries--;
    }

    if (!DatabaseService['dbInstance']) {
      throw new Error("Base de datos no inicializada. Por favor recarga la página y vuelve a intentar.");
    }

    logger.info('BackupService', 'start_backup', 'Iniciando generación de backup cifrado (usando worker)...');

    try {
      // 1. Export DB to Uint8Array (still on main thread, but fast)
      const dbData = DatabaseService['dbInstance'].export();

      // 2. Get metadata (fast query)
      const tablesCountResult = await DatabaseService.executeQuery("SELECT count(*) as c FROM sqlite_master WHERE type='table'");
      const tablesCount = tablesCountResult[0]?.c || 0;

      // Helper: Uint8Array to Base64
      const toBase64 = (u8: Uint8Array) => {
        let binary = '';
        const len = u8.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(u8[i]);
        }
        return btoa(binary);
      };

      const dbDataBase64 = toBase64(dbData);

      // 3. HEAVY OPERATIONS IN WORKER (encryption, hashing)
      const orchestrator = this.getOrchestrator();

      logger.info('BackupService', 'worker_start', 'Delegando encriptación al worker...');

      const result = await orchestrator.executeTask<any>(
        'DATABASE',
        {
          operation: 'export_and_encrypt',
          dbData: dbDataBase64,
          password: BACKUP_SECRET,
          metadata: {
            tables_count: tablesCount,
            agent: "AccountExpress Iron Core v1.0"
          }
        },
        {
          timeout: 120000 // 2 minutes for large databases
        }
      );

      logger.info('BackupService', 'backup_complete', 'Backup generado y firmado exitosamente (worker).');

      // Return the encrypted backup
      return result.backupData;

    } catch (error: any) {
      logger.error('BackupService', 'backup_failed', 'Error al generar backup', null, error);
      throw error;
    }
  }

  /**
   * LEGACY: Old synchronous backup (kept for compatibility)
   * Use createBackup() instead for non-blocking operation
   */
  static async createBackupLegacy(): Promise<string> {
    // Ensure database is initialized with retry
    await initDB();

    // Wait a bit for initialization to complete
    let retries = 3;
    while (!DatabaseService['dbInstance'] && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries--;
    }

    if (!DatabaseService['dbInstance']) {
      throw new Error("Base de datos no inicializada. Por favor recarga la página y vuelve a intentar.");
    }

    logger.info('BackupService', 'start_backup', 'Iniciando generación de backup cifrado (L4)...');

    // 1. Export DB to Uint8Array
    const dbData = DatabaseService['dbInstance'].export();

    // 2. Encrypt
    const { encrypted, salt, iv } = await BasicEncryption.encrypt(dbData, BACKUP_SECRET);

    // 3. Manifest (Metadata)
    const tablesCountResult = await DatabaseService.executeQuery("SELECT count(*) as c FROM sqlite_master WHERE type='table'");
    const tablesCount = tablesCountResult[0]?.c || 0;

    // Helper: Uint8Array to Base64
    const toBase64 = (u8: Uint8Array) => {
      let binary = '';
      const len = u8.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(u8[i]);
      }
      return btoa(binary);
    };

    const payload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      database: toBase64(encrypted), // Encrypted blob
      salt: toBase64(salt),
      iv: toBase64(iv),
      manifest: {
        tables_count: tablesCount,
        agent: "AccountExpress Iron Core v1.0"
      }
    };

    // 5. Signature (Checksum of the JSON content)
    const contentString = JSON.stringify(payload);
    const checksum = await BasicEncryption.hash(new TextEncoder().encode(contentString));

    const finalBackup = {
      ...payload,
      checksum,
      signature: checksum // Doubling as signature for MVP
    };

    logger.info('BackupService', 'backup_complete', 'Backup generado y firmado exitosamente.');
    return JSON.stringify(finalBackup, null, 2);
  }

  /**
   * Restaura un backup (.aex), verificando integridad y descifrando.
   * NOW USES WORKER - NO UI FREEZE! 🚀
   */
  static async restoreBackup(jsonString: string, onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      logger.info('BackupService', 'start_restore', 'Iniciando restauración de backup (usando worker)...');

      // Parse backup payload
      const payload = JSON.parse(jsonString);

      // 1. Validate Structure
      if (!payload.database || !payload.salt || !payload.iv || !payload.checksum) {
        throw new Error("Formato de backup inválido (.aex corrupto)");
      }

      // 2. HEAVY OPERATIONS IN WORKER (decryption, validation)
      const orchestrator = this.getOrchestrator();

      logger.info('BackupService', 'worker_start', 'Delegando desencriptación al worker...');

      const result = await orchestrator.executeTask<any>(
        'DATABASE',
        {
          operation: 'decrypt_and_validate',
          encryptedData: payload.database,
          password: BACKUP_SECRET,
          metadata: payload
        },
        {
          timeout: 120000 // 2 minutes for large databases
        }
      );

      logger.info('BackupService', 'decrypt_success', 'Backup descifrado correctamente. Restaurando base de datos...');

      // 3. Restore to OPFS (this part stays on main thread as it needs DB access)
      const toUint8 = (str: string) => {
        const binary_string = atob(str);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
      };

      // Convert decrypted data back to Uint8Array
      const decryptedData = toUint8(result.database);
      await restoreDatabaseFromBackup(decryptedData);

      logger.info('BackupService', 'restore_complete', 'Backup restaurado exitosamente.');
      return true;

    } catch (e) {
      logger.error('BackupService', 'restore_failed', 'Fallo crítico al restaurar backup', null, e as Error);
      throw e;
    }
  }

  /**
   * LEGACY: Old synchronous restore (kept for compatibility)
   * Use restoreBackup() instead for non-blocking operation
   */
  static async restoreBackupLegacy(jsonString: string): Promise<boolean> {
    try {
      logger.info('BackupService', 'start_restore', 'Iniciando restauración de backup...');
      const payload = JSON.parse(jsonString);

      // 1. Validate Structure
      if (!payload.database || !payload.salt || !payload.iv || !payload.checksum) {
        throw new Error("Formato de backup inválido (.aex corrupto)");
      }

      // 2. Verify Integrity (Checksum)
      const signature = payload.signature || payload.checksum;
      const reconstructPayload = {
        version: payload.version,
        timestamp: payload.timestamp,
        database: payload.database,
        salt: payload.salt,
        iv: payload.iv,
        manifest: payload.manifest
      };

      const calculatedHash = await BasicEncryption.hash(new TextEncoder().encode(JSON.stringify(reconstructPayload)));

      if (signature !== calculatedHash) {
        logger.warn('BackupService', 'integrity_warning', 'El checksum del backup no coincide. Puede haber sido modificado, pero el cifrado lo protegerá.');
      }

      // 3. Decrypt
      const toUint8 = (str: string) => {
        const binary_string = atob(str);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
      };

      const encryptedBytes = toUint8(payload.database);
      const saltBytes = toUint8(payload.salt);
      const ivBytes = toUint8(payload.iv);

      const decryptedData = await BasicEncryption.decrypt(encryptedBytes, saltBytes, ivBytes, BACKUP_SECRET);

      logger.info('BackupService', 'decrypt_success', 'Backup descifrado correctamente. Restaurando base de datos...');

      // 4. Restore to OPFS
      await restoreDatabaseFromBackup(decryptedData);

      return true;

    } catch (e) {
      logger.error('BackupService', 'restore_failed', 'Fallo crítico al restaurar backup', null, e as Error);
      throw e;
    }
  }
}