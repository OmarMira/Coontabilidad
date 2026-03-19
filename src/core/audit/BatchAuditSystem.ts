import { logger } from '../../core/logging/SystemLogger';

import { v4 as uuidv4 } from 'uuid';
import { ExternalTimestampService } from '../../services/ExternalTimestampService';

// Define strict interfaces for the system
export interface AuditEvent {
    id: string;
    timestamp: string;
    action: string;
    userId: number;
    entityType?: string;
    entityId?: number;
    changes?: unknown;
    critical?: boolean;
}

export interface StoredAuditEvent extends AuditEvent {
    changes_hash: string;
    previous_hash: string | null;
    ip_address: string;
    user_agent: string;
    session_id: string;
    external_signature?: string | null;
    witness_status?: 'PENDING' | 'VERIFIED' | 'NO_EXTERNAL_WITNESS' | 'FAILED';
}

/**
 * SISTEMA DE AUDITORÃA POR LOTES - NEXT GEN
 * Integridad Forense Nivel NASA con RFC 3161
 */
export class BatchAuditSystem {
    private pendingEvents: any[] = [];
    private batchSize = 100;
    private batchInterval = 30000; // 30 seconds
    private processing = false;
    private retryAttempts = 0;
    private maxRetries = 3;

    // Fail Secure Flag
    private systemLocked = false;

    constructor() {
        this.startBatchProcessor();
        this.ensureSchema();
    }

    // Registrar evento de auditorÃ­a
    public logEvent(event: { action: string; userId?: number; entityType?: string; entityId?: number; changes?: any; critical?: boolean }) {
        if (this.systemLocked) {
            throw new Error('SECURITY_LOCKDOWN: Audit System Failed (RFC 3161 Unreachable). Writes are suspended.');
        }

        const auditEvent: StoredAuditEvent = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            action: event.action,
            userId: event.userId || 1,
            entityType: event.entityType,
            entityId: event.entityId,
            changes: event.changes,
            ip_address: this.getClientIP(),
            user_agent: navigator.userAgent,
            session_id: this.getSessionId(),
            changes_hash: '',
            previous_hash: null,
            witness_status: 'PENDING'
        };

        this.pendingEvents.push(auditEvent);

        // Procesar inmediatamente si es crÃ­tico
        if (event.critical) {
            this.processBatch(true);
        }
    }

    /**
     * Asegura que el esquema de base de datos soporte los nuevos campos forenses
     */
    private async ensureSchema() {
        try {
            const simpleDb = await import('../../database/simple-db');
            const db = simpleDb.db;
            if (!db) return;

            db.exec(`
        CREATE TABLE IF NOT EXISTS audit_chain (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          changes_hash TEXT NOT NULL,
          previous_hash TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          session_id TEXT,
          external_signature TEXT,
          witness_status TEXT
        )
      `);

            try {
                db.exec("ALTER TABLE audit_chain ADD COLUMN external_signature TEXT");
            } catch { }
            try {
                db.exec("ALTER TABLE audit_chain ADD COLUMN witness_status TEXT");
            } catch { }

        } catch (e) {
            logger.error('BatchAuditSystem', 'schema_init', 'Audit schema init failed', e);
        }
    }

    // Procesar lote de eventos
    private async processBatch(force = false) {
        if (this.processing || (this.pendingEvents.length === 0 && !force)) return;
        if (this.systemLocked) return; // Stay locked

        this.processing = true;

        const batch = this.pendingEvents.splice(0, this.batchSize);
        if (batch.length === 0) {
            this.processing = false;
            return;
        }

        try {
            // 1. Calcular hashes locales
            const lastHash = await this.getLastHash();
            let previousHash = lastHash;

            for (const event of batch) {
                event.previous_hash = previousHash;
                event.changes_hash = await this.calculateHash(event);
                previousHash = event.changes_hash;
            }

            // 2. Witnessing con RFC 3161 (External Timestamp)
            const batchRootHash = batch[batch.length - 1].changes_hash;
            let externalSignature: string | null = null;
            let witnessStatus: StoredAuditEvent['witness_status'] = 'PENDING';

            try {
                // Execute with Exponential Backoff
                externalSignature = await this.executeWithBackoff(async () => {
                    const result = await ExternalTimestampService.getTrustedTimestamp(batchRootHash);
                    if (!result) throw new Error('TSA Verification Failed');
                    return result;
                });
                witnessStatus = 'VERIFIED';
                this.retryAttempts = 0;
            } catch (error) {
                logger.error('BatchAuditSystem', 'external_witness', 'External Witness failed after retries', error);
                this.retryAttempts++;
                witnessStatus = 'FAILED';

                // NASA Standard: Lockdown after max retries
                if (this.retryAttempts >= this.maxRetries) {
                    this.systemLocked = true;
                    logger.error('BatchAuditSystem', 'system_locked', 'SYSTEM LOCKED: Integrity Compromised or TSA Unreachable');
                    // Alert User? (In real app, trigger UI modal)
                }
            }

            // Apply signature
            batch[batch.length - 1].external_signature = externalSignature;
            batch[batch.length - 1].witness_status = witnessStatus;

            // 3. Persistencia
            await this.saveBatch(batch);

            logger.info('BatchAuditSystem', 'batch_processed', 'Batch audit processed');

        } catch (error) {
            logger.error('BatchAuditSystem', 'batch_audit_critical', 'Batch audit CRITICAL failure', error);
            // Re-queue events at the start to ensure no data loss
            this.pendingEvents.unshift(...batch);
        } finally {
            this.processing = false;
        }
    }

    /**
     * Ejecuta una promesa con Exponential Backoff (1s, 2s, 4s)
     * Rapid retry for demo/responsiveness, logic scalable.
     */
    private async executeWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
        const delays = [1000, 2000, 4000];

        for (let i = 0; i <= delays.length; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === delays.length) throw error;
                logger.warn('BatchAuditSystem', 'rfc3161_retry', 'RFC 3161 Retry in progress');
                await new Promise(resolve => setTimeout(resolve, delays[i]));
            }
        }
        throw new Error('Unreachable');
    }

    // Calcular hash criptogrÃ¡fico (SHA-256)
    private async calculateHash(event: StoredAuditEvent): Promise<string> {
        // Canonical JSON structure
        const payload = {
            id: event.id,
            prev: event.previous_hash,
            date: event.timestamp,
            act: event.action,
            uid: event.userId,
            ent: event.entityId,
            chg: event.changes
        };

        const data = JSON.stringify(payload);

        if (typeof crypto !== 'undefined' && 'subtle' in crypto) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } else {
            return this.simpleHash(data);
        }
    }

    // Hash simple para fallback
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    // Obtener Ãºltimo hash de la cadena
    private async getLastHash(): Promise<string | null> {
        try {
            const simpleDb = await import('../../database/simple-db');
            const db = simpleDb.db;
            if (!db) return null;

            const result = db.exec(
                "SELECT changes_hash FROM audit_chain ORDER BY id DESC LIMIT 1"
            );

            if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
                return result[0].values[0][0] as string;
            }
            return null;
        } catch {
            return null;
        }
    }

    // Guardar lote en base de datos
    private async saveBatch(batch: StoredAuditEvent[]) {
        const simpleDb = await import('../../database/simple-db');
        const db = simpleDb.db;
        if (!db) throw new Error('Database not available');

        db.exec('BEGIN TRANSACTION');
        try {
            const stmt = db.prepare(`
        INSERT INTO audit_chain 
        (event, user_id, entity_type, entity_id, changes_hash, previous_hash, timestamp, ip_address, user_agent, session_id, external_signature, witness_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

            for (const event of batch) {
                stmt.run([
                    event.action,
                    event.userId,
                    event.entityType || null,
                    event.entityId || null,
                    event.changes_hash,
                    event.previous_hash,
                    event.timestamp,
                    event.ip_address,
                    event.user_agent,
                    event.session_id,
                    event.external_signature || null,
                    event.witness_status || 'PENDING'
                ]);
            }
            stmt.free();
            db.exec('COMMIT');
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    }

    private startBatchProcessor() {
        setInterval(() => {
            this.processBatch();
        }, this.batchInterval);
    }

    private generateId() {
        return uuidv4();
    }

    private getClientIP() {
        return 'localhost';
    }

    private getSessionId() {
        return sessionStorage.getItem('session_id') || 'anonymous';
    }
}

export const batchAuditSystem = new BatchAuditSystem();

