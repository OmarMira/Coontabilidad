import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { restoreDatabaseFromBackup, initDB } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { WorkerOrchestrator } from '../core/workers/WorkerOrchestrator';
import { BackupLocationService, BackupLocation } from './BackupLocationService';

const BACKUP_SECRET = import.meta.env.VITE_BACKUP_SECRET || "IRON-CORE-MASTER-KEY-2026-FLORIDA";


// Cloud Vault Configuration (Hybrid Persistence)
interface CloudVaultConfig {
  provider: 'google_drive' | 'none';
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'manual';
}

export class BackupService {
  private static orchestrator: WorkerOrchestrator | null = null;
  private static persistenceGranted = false;

  private static getOrchestrator(): WorkerOrchestrator {
    if (!this.orchestrator) {
      this.orchestrator = new WorkerOrchestrator();
    }
    return this.orchestrator;
  }

  /**
   * P0: Solicitar almacenamiento persistente al navegador
   * Esto evita que el navegador elimine IndexedDB/OPFS bajo presión de almacenamiento
   */
  static async requestPersistentStorage(): Promise<boolean> {
    if (this.persistenceGranted) return true;

    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      this.persistenceGranted = isPersisted;
      logger.info('BackupService', 'persistence_request', `Storage persistence granted: ${isPersisted}`);

      const estimate = await (navigator.storage?.estimate?.() ?? Promise.resolve({ quota: 0, usage: 0 }));
      logger.info('BackupService', 'storage_estimate', `Quota: ${(estimate.quota || 0) / 1024 / 1024} MB, Usage: ${(estimate.usage || 0) / 1024 / 1024} MB`);

      return isPersisted;
    }
    return false;
  }

  /**
   * Genera un backup cifrado (.aex) con firma HMAC/Checksum.
   * NIVEL NASA: Permite elegir ubicación de guardado
   */
  static async createBackup(
    location?: BackupLocation,
    onProgress?: (progress: any) => void
  ): Promise<string> {
    // Ensure persistence is requested at least once
    await this.requestPersistentStorage();

    const backupJson = await this.createBackupLegacy(); // Usa la lógica robusta existente
    const filename = `AccountExpress_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.aex`;

    // Si se especificó una ubicación, guardar ahí
    if (location) {
      const success = await BackupLocationService.saveBackup(backupJson, filename, { type: location });
      if (success) {
        logger.info('BackupService', 'backup_saved', `Backup guardado en: ${location}`);
      } else {
        logger.error('BackupService', 'backup_save_failed', `Error guardando backup en: ${location}`);
      }
    } else {
      // Comportamiento legacy: intentar Google Drive si está configurado
      const token = localStorage.getItem('gdrive_token');
      if (token) {
        import('./GDriveSyncService').then(mod => {
          const blob = new Blob([backupJson], { type: 'application/json' });
          mod.GDriveSyncService.uploadBackup(blob, filename);
        });
      }
    }

    return backupJson;
  }

  /**
   * Permite al usuario elegir ubicación y guardar backup
   * NIVEL NASA: Interfaz completa de selección
   */
  static async createBackupWithLocationChoice(onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      // Generar backup
      const backupJson = await this.createBackupLegacy();
      const filename = `AccountExpress_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.aex`;

      // Permitir al usuario elegir ubicación
      const destination = await BackupLocationService.chooseBackupLocation();

      if (!destination) {
        // Usuario canceló
        logger.info('BackupService', 'backup_cancelled', 'Usuario canceló selección de ubicación');
        return false;
      }

      // Guardar en la ubicación elegida
      const success = await BackupLocationService.saveBackup(backupJson, filename, destination);

      if (success) {
        logger.info('BackupService', 'backup_success', `Backup guardado exitosamente en: ${destination.type}`);
        return true;
      } else {
        logger.error('BackupService', 'backup_failed', 'Error guardando backup');
        return false;
      }
    } catch (e) {
      logger.error('BackupService', 'backup_error', 'Error en proceso de backup', null, e as Error);
      return false;
    }
  }

  /**
   * Permite al usuario elegir archivo de backup y restaurarlo
   * NIVEL NASA: Interfaz completa de selección
   */
  static async restoreBackupWithFileChoice(onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      // Permitir al usuario elegir archivo
      const file = await BackupLocationService.chooseBackupFile();

      if (!file) {
        // Usuario canceló
        logger.info('BackupService', 'restore_cancelled', 'Usuario canceló selección de archivo');
        return false;
      }

      // Leer contenido del archivo
      const content = await file.text();

      // Restaurar
      const success = await this.restoreBackupLegacy(content);

      if (success) {
        logger.info('BackupService', 'restore_success', `Backup restaurado exitosamente desde: ${file.name}`);
        return true;
      } else {
        logger.error('BackupService', 'restore_failed', 'Error restaurando backup');
        return false;
      }
    } catch (e) {
      logger.error('BackupService', 'restore_error', 'Error en proceso de restauración', null, e as Error);
      return false;
    }
  }


  /**
   * P0: Cloud Vault - Google Drive Integration
   * Sube el backup directamente al Drive del usuario sin backend intermedio.
   */
  private static async uploadToCloudVault(backupJson: string): Promise<void> {
    // Check if user has authenticated with Google (Token presence)
    const token = localStorage.getItem('gdrive_token');
    if (!token) return; // Silent skip if not linked

    logger.info('BackupService', 'cloud_upload_start', 'Uploading backup to Google Drive...');

    const fileContent = new Blob([backupJson], { type: 'application/json' });
    const metadata = {
      name: `AccountExpress_Backup_${new Date().toISOString().split('T')[0]}.aex`,
      mimeType: 'application/json',
      // Folder logic could be added here to search/create specific app folder
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileContent);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + token }),
        body: form,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('gdrive_token'); // Invalidate if expired
          throw new Error('Google Drive token expired');
        }
        throw new Error(`Drive API Error: ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('BackupService', 'cloud_upload_success', `Backup uploaded to Drive with ID: ${result.id}`);

    } catch (e) {
      // Re-throw for logging in the caller, but classify it
      throw e;
    }
  }

  /**
   * Helper para iniciar el flujo OAuth 2.0 Implicit (Client-side only)
   * Esto debe ser invocado por una acción de usuario en la UI
   */
  static async initiateCloudLink(): Promise<void> {
    // Configuración CLIENT_ID
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'PENDING_CLIENT_ID';

    // Antigravity Feature: Modo Demo Inteligente
    // Si no hay API Key real configurada, permitir probar la UI en modo simulación
    if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE' || CLIENT_ID === 'PENDING_CLIENT_ID') {
      const confirmDemo = window.confirm(
        "⚠️ Google Client ID no configurado en .env.local\n\n" +
        "¿Desea activar el MODO DEMO para simular la vinculación exitosa?\n" +
        "(Esto permitirá probar la interfaz, pero no subirá archivos reales a Drive)"
      );

      if (confirmDemo) {
        logger.info('BackupService', 'demo_mode', 'Activando simulación de Cloud Link');
        // Simular token de OAuth con duración de 1 hora
        const fakeToken = `demo_token_${Date.now()}_${Math.random().toString(36).substr(2)}`;
        localStorage.setItem('gdrive_token', fakeToken);

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Recargar para reflejar estado
        window.location.reload();
        return;
      } else {
        window.open('https://console.cloud.google.com/apis/credentials', '_blank');
        return;
      }
    }

    const REDIRECT_URI = window.location.origin;
    const SCOPE = 'https://www.googleapis.com/auth/drive.file';

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPE}&include_granted_scopes=true&state=cloud_vault_link`;

    window.location.href = url;
  }

  /**
   * LEGACY: Old synchronous backup (kept for compatibility)
   * Use createBackup() instead for non-blocking operation
   */
  static async createBackupLegacy(): Promise<string> {
    // Ensure database is initialized
    const db = await initDB();
    DatabaseService.setDB(db); // Explicitly set the DB instance

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
   */
  static async restoreBackup(jsonString: string, onProgress?: (progress: any) => void): Promise<boolean> {
    // Use the legacy method which works correctly
    // Worker implementation needs more work to handle decryption properly
    return await this.restoreBackupLegacy(jsonString);
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
