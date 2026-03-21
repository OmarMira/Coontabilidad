/**
 * MÃ³dulo 03 â€” Persistencia y Cifrado
 * ExtraÃ­do de simple-db.ts lÃ­neas 3747â€“3900
 */

import { db, saveDatabase, forceSaveDB } from '../simple-db';
import { logger } from '../../core/logging/SystemLogger';

// Las variables encryptionEnabled, currentPassword, isInitialized son internas
// a simple-db.ts y no se pueden importar. Este mÃ³dulo re-exporta las funciones
// que las encapsulan.

export { saveDatabase, forceSaveDB };

export const isEncryptionEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem('accountexpress-encrypted');
    return stored === 'true';
  } catch {
    return false;
  }
};

export const changeEncryptionPassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const storedEncrypted = localStorage.getItem('accountexpress-encrypted') === 'true';
    if (!storedEncrypted) return false;
    await saveDatabase();
    logger.info('Persistence', 'password_changed', 'ContraseÃ±a de cifrado cambiada');
    return true;
  } catch (error) {
    logger.error('db-persistence', 'change_encryption_password', 'Error changing encryption password', error);
    return false;
  }
};

export const enableEncryption = async (password: string): Promise<boolean> => {
  if (!db) return false;
  try {
    localStorage.setItem('accountexpress-encrypted', 'true');
    await saveDatabase();
    logger.info('Persistence', 'encryption_enabled', 'Cifrado habilitado');
    return true;
  } catch (error) {
    logger.error('db-persistence', 'enable_encryption', 'Error enabling encryption', error);
    localStorage.setItem('accountexpress-encrypted', 'false');
    return false;
  }
};

export const disableEncryption = async (password: string): Promise<boolean> => {
  if (!db) return false;
  try {
    localStorage.setItem('accountexpress-encrypted', 'false');
    await saveDatabase();
    logger.info('Persistence', 'encryption_disabled', 'Cifrado deshabilitado');
    return true;
  } catch (error) {
    logger.error('db-persistence', 'disable_encryption', 'Error disabling encryption', error);
    return false;
  }
};

export const isDatabaseReady = (): boolean => {
  return db !== null;
};

