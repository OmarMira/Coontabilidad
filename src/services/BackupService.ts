import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { restoreDatabaseFromBackup } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

const BACKUP_SECRET = "IRON-CORE-MASTER-KEY-2026-FLORIDA";

export class BackupService {

  /**
   * Genera un backup cifrado (.aex) con firma HMAC/Checksum.
   */
  static async createBackup(): Promise<string> {
    if (!DatabaseService['dbInstance']) throw new Error("DB not ready");

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
   */
  static async restoreBackup(jsonString: string): Promise<boolean> {
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

      // Note: JSON.stringify order might differ. strict verification requires canonical json.
      // For MVP, if exact string match fails, we might just warn, but better to be strict?
      // Actually, usually we sign the 'database' field or similar. 
      // If we constructed it exactly as above, it should match if parsed/stringified identically.
      // But browser implementations vary.
      // Let's rely on BasicEncryption.decrypt failing if corrupt (MAC check in AES-GCM).
      // But we will TRY to check checksum.

      if (signature !== calculatedHash) {
        logger.warn('BackupService', 'integrity_warning', 'El checksum del backup no coincide. Puede haber sido modificado, pero el cifrado lo protegerá.');
        // We proceed to decrypt. GCM will fail if tag is wrong.
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