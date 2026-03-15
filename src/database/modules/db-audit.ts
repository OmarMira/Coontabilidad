/**
 * Módulo 05 — Auditoría
 * Extraído de simple-db.ts líneas 4342–4531
 */

import { db } from '../simple-db';
import { saveDatabase } from '../simple-db';
import { DatabaseService } from '../DatabaseService';
import { logger } from '../../core/logging/SystemLogger';

// SHA-256 inline (mismo algoritmo que simple-db.ts usa internamente)
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; words.length < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = candidate * candidate; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      words.push(mathPow(candidate, 0.5) * maxWord | 0);
    }
  }

  const k = words.slice(8);
  let hash = words.slice(0, 8);
  const asciiBitLength = ascii.length * 8;
  let i: number, j: number;
  ascii += '\x80';

  while (ascii.length % 64 - 56) ascii += '\x00';

  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }

  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ ((~e) & hash[6])) +
        k[i] +
        (w[i] = (i < 16) ? w[i] :
          (w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

export const generateSimpleHash = (data: any): string => {
  return sha256(JSON.stringify(data));
};

const generateAuditHash = async (auditData: any): Promise<string> => {
  try {
    let previousHash = '0';

    if (!auditData.previousHash) {
      const lastHashResult = db?.exec(`
        SELECT audit_hash FROM audit_log
        ORDER BY id DESC
        LIMIT 1
      `);
      previousHash = lastHashResult?.[0]?.values?.[0]?.[0] as string || '0';
    } else {
      previousHash = auditData.previousHash;
    }

    const dataToHash = JSON.stringify({
      previousHash,
      tableName: auditData.tableName,
      recordId: auditData.recordId,
      action: auditData.action,
      oldValues: auditData.oldValues,
      newValues: auditData.newValues,
      timestamp: auditData.timestamp,
      userId: auditData.userId
    });

    return sha256(dataToHash);

  } catch (error) {
    console.error('Error generating audit hash:', error);
    return sha256(Date.now().toString());
  }
};

export const logAuditEvent = async (
  tableName: string,
  recordId: number,
  action: string,
  oldValues: any,
  newValues: any,
  userId?: number
): Promise<void> => {
  if (!db) return;

  try {
    const auditData = {
      tableName,
      recordId,
      action,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      timestamp: new Date().toISOString(),
      userId: userId || 1
    };

    await DatabaseService.sealGenericRecord({
      tableName,
      recordId,
      operation: action as any,
      payload: newValues || oldValues || {},
      userId: userId || 1
    });

    const auditHash = await generateAuditHash(auditData);

    const stmt = db.prepare(`
      INSERT INTO audit_log(
        table_name, record_id, action, old_values, new_values,
        user_id, timestamp, audit_hash
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      tableName,
      recordId,
      action,
      auditData.oldValues,
      auditData.newValues,
      auditData.userId,
      auditData.timestamp,
      auditHash
    ]);

    stmt.free();

    logger.info('AuditSystem', 'log_event', `Audit event logged: ${action} on ${tableName} ID ${recordId}`, {
      tableName,
      recordId,
      action,
      auditHash: auditHash.substring(0, 8) + '...'
    });

  } catch (error) {
    logger.error('AuditSystem', 'log_event_failed', 'Error logging audit event', { tableName, recordId, action }, error as Error);
  }
};

export const getAuditLog = (limit: number = 100): Array<Record<string, any>> => {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM audit_log
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const result = stmt.getAsObject([limit]);
    stmt.free();

    return Array.isArray(result) ? result as Array<Record<string, any>> : [];
  } catch (error) {
    console.error('Error getting audit log:', error);
    return [];
  }
};

export const getDatabaseInfo = () => {
  if (!db) return null;

  try {
    const info = {
      size: db.export().length,
      tables: {} as Record<string, number>,
      lastBackup: localStorage.getItem('accountexpress-last-backup'),
      opfsSupported: false,
      autoSaveEnabled: true
    };

    const tables = ['customers', 'products', 'florida_tax_rates', 'audit_log'];

    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        info.tables[table] = result[0]?.values[0]?.[0] as number || 0;
      } catch {
        info.tables[table] = 0;
      }
    }

    return info;
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
};

export const createBackup = async (): Promise<string> => {
  if (!db) throw new Error('Database not initialized');

  try {
    await saveDatabase();
    const timestamp = new Date().toISOString();
    localStorage.setItem('accountexpress-last-backup', timestamp);
    return timestamp;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const getStats = () => {
  if (!db) return { customers: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");
    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;
    return { customers: customerCount };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { customers: 0 };
  }
};
