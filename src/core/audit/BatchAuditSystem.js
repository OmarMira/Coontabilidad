/**
 * SISTEMA DE AUDITORÍA POR LOTES - BLOCKCHAIN STYLE
 * 
 * Auditoría inmutable con hashing criptográfico
 */

export class BatchAuditSystem {
  constructor() {
    this.pendingEvents = [];
    this.batchSize = 100;
    this.batchInterval = 30000; // 30 segundos
    this.startBatchProcessor();
  }
  
  // Registrar evento de auditoría
  logEvent(event) {
    const auditEvent = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      event: event.action,
      user_id: event.userId || 1,
      entity_type: event.entityType,
      entity_id: event.entityId,
      changes: event.changes,
      ip_address: this.getClientIP(),
      user_agent: navigator.userAgent,
      session_id: this.getSessionId()
    };
    
    this.pendingEvents.push(auditEvent);
    
    // Procesar inmediatamente si es crítico
    if (event.critical) {
      this.processBatch();
    }
  }
  
  // Procesar lote de eventos
  async processBatch() {
    if (this.pendingEvents.length === 0) return;
    
    const batch = this.pendingEvents.splice(0, this.batchSize);
    
    try {
      // Calcular hash de cada evento
      for (const event of batch) {
        event.changes_hash = await this.calculateHash(event);
        event.previous_hash = await this.getLastHash();
      }
      
      // Guardar en base de datos
      await this.saveBatch(batch);
      
      console.log(`✅ Batch audit processed: ${batch.length} events`);
    } catch (error) {
      console.error('❌ Batch audit failed:', error);
      // Reintroducir eventos fallidos
      this.pendingEvents.unshift(...batch);
    }
  }
  
  // Calcular hash criptográfico
  async calculateHash(event) {
    const data = JSON.stringify({
      event: event.event,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      changes: event.changes,
      timestamp: event.timestamp
    });
    
    if ('crypto' in globalThis && 'subtle' in crypto) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback hash simple
      return this.simpleHash(data);
    }
  }
  
  // Hash simple para fallback
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  // Obtener último hash de la cadena
  async getLastHash() {
    try {
      const { db } = await import('../../database/simple-db');
      if (!db) return null;
      
      const result = db.exec(
        "SELECT changes_hash FROM audit_chain ORDER BY id DESC LIMIT 1"
      );
      
      return result[0]?.values[0]?.[0] || null;
    } catch {
      return null;
    }
  }
  
  // Guardar lote en base de datos
  async saveBatch(batch) {
    const { db } = await import('../../database/simple-db');
    if (!db) throw new Error('Database not available');
    
    // Crear tabla si no existe
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
        session_id TEXT
      )
    `);
    
    // Insertar eventos
    const stmt = db.prepare(`
      INSERT INTO audit_chain 
      (event, user_id, entity_type, entity_id, changes_hash, previous_hash, timestamp, ip_address, user_agent, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const event of batch) {
      stmt.run([
        event.event,
        event.user_id,
        event.entity_type,
        event.entity_id,
        event.changes_hash,
        event.previous_hash,
        event.timestamp,
        event.ip_address,
        event.user_agent,
        event.session_id
      ]);
    }
    
    stmt.free();
  }
  
  // Iniciar procesador de lotes
  startBatchProcessor() {
    setInterval(() => {
      this.processBatch();
    }, this.batchInterval);
  }
  
  // Utilidades
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  getClientIP() {
    return 'localhost'; // En producción obtener IP real
  }
  
  getSessionId() {
    return sessionStorage.getItem('session_id') || 'anonymous';
  }
}

export const batchAuditSystem = new BatchAuditSystem();
