# 🚀 PLAN DE IMPLEMENTACIÓN: IRON CLAD UPGRADE
## AccountExpress Next-Gen → Producto Enterprise-Grade

**Fecha de Creación**: 8 de febrero de 2026  
**Basado en**: Análisis de transcripción de auditoría externa  
**Objetivo**: Transformar prototipo local-first en producto vendible y robusto  
**Duración Estimada**: 4-6 semanas  

---

## 📊 DIAGNÓSTICO ACTUAL

### ✅ Fortalezas Identificadas
1. **Arquitectura local-first funcional** (SQLite + OPFS)
2. **RFC 3161 Timestamping implementado** (Auditoría NASA-level)
3. **WorkerOrchestrator ya existe** (infraestructura para Web Workers)
4. **DraftProposalService implementado** (IA propone correcciones)
5. **SyncWorker básico funcional** (patrón Outbox implementado)
6. **Audit Chain inmutable** (SHA-256 + Logic Clocks)

### ❌ Puntos Críticos a Resolver

#### 🔴 **CRÍTICO 1: Riesgo Catastrófico de Pérdida de Datos**
**Problema**: 
- Sistema depende 100% de OPFS del navegador
- Limpiar caché = pérdida total de datos contables
- Riesgo legal inaceptable para clientes

**Impacto**: 
- ⚠️ Anula todo el valor del producto
- ⚠️ No vendible en estado actual
- ⚠️ Responsabilidad legal para usuarios

#### 🟡 **CRÍTICO 2: Bloqueo de UI en Operaciones Pesadas**
**Problema**:
- Generación de PDFs bloquea hilo principal
- Importación de CSV grande congela la aplicación
- Experiencia de usuario frustrante

**Impacto**:
- ⚠️ Percepción de "aplicación lenta"
- ⚠️ Productividad reducida
- ⚠️ Abandono de usuarios

#### 🟢 **MEDIO 3: IA de Solo Lectura (PARCIALMENTE RESUELTO)**
**Estado Actual**:
- ✅ `DraftProposalService` ya existe
- ⚠️ Falta integración completa en UI
- ⚠️ Falta flujo de aprobación/rechazo

---

## 🎯 ESTRATEGIA DE IMPLEMENTACIÓN

### Principios Rectores
1. **No romper lo que funciona** - Cambios incrementales
2. **Fail-safe primero** - Nunca perder datos
3. **User experience second** - UI fluida y responsiva
4. **Backward compatibility** - Migración suave

---

## 📋 FASE 1: HYBRID PERSISTENCE (CRÍTICO)
**Duración**: 1.5 semanas  
**Prioridad**: 🔴 MÁXIMA  
**Objetivo**: Eliminar riesgo de pérdida de datos

### 1.1 Completar Sync Gateway (Días 1-3)

#### Estado Actual
```typescript
// ✅ YA EXISTE: src/workers/SyncWorker.ts
// ✅ YA EXISTE: src/services/cloud/S3Provider.ts
// ⚠️ FALTA: Integración completa y configuración
```

#### Tareas Específicas

**Día 1: Completar S3Provider**
- [ ] Implementar AWS V4 Signing (usar librería `aws4fetch`)
- [ ] Agregar soporte para credenciales temporales (STS)
- [ ] Implementar retry logic con exponential backoff
- [ ] Agregar compresión GZIP antes de upload
- [ ] Tests unitarios para S3Provider

**Archivo a modificar**: `src/services/cloud/S3Provider.ts`
```typescript
// ANTES (línea 26-42):
async upload(filename: string, data: Blob | ArrayBuffer | string): Promise<void> {
    const url = `${this.endpoint}/${this.bucket}/${filename}`;
    const response = await fetch(url, {
        method: 'PUT',
        body: data,
        headers: {
            'Content-Type': 'application/octet-stream',
            // x-amz-date and Authorization would go here
        }
    });
    if (!response.ok) {
        throw new Error(`S3 Upload failed: ${response.statusText}`);
    }
}

// DESPUÉS:
import { AwsClient } from 'aws4fetch';

async upload(filename: string, data: Blob | ArrayBuffer | string): Promise<void> {
    const aws = new AwsClient({
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
        region: 'us-east-1' // Configurable
    });

    const url = `${this.endpoint}/${this.bucket}/${filename}`;
    
    // Retry logic con exponential backoff
    let attempt = 0;
    const maxRetries = 3;
    
    while (attempt < maxRetries) {
        try {
            const response = await aws.fetch(url, {
                method: 'PUT',
                body: data,
                headers: {
                    'Content-Type': 'application/octet-stream',
                }
            });
            
            if (!response.ok) {
                throw new Error(`S3 Upload failed: ${response.statusText}`);
            }
            
            return; // Success
            
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) throw error;
            
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}
```

**Día 2: Integrar con DatabaseService**
- [ ] Agregar hook post-transaction para sync
- [ ] Implementar snapshot incremental de DB
- [ ] Crear función `createBackupSnapshot()`
- [ ] Integrar con `sync_outbox`

**Archivo a modificar**: `src/database/DatabaseService.ts`
```typescript
// Agregar después de línea 469 (fin de insertJournalEntry):

/**
 * Crea un snapshot incremental de la base de datos para backup
 */
static async createBackupSnapshot(): Promise<Blob> {
    if (!DatabaseService.dbInstance) throw new Error('DB not initialized');
    
    // Exportar DB completa a ArrayBuffer
    const dbData = DatabaseService.dbInstance.export();
    
    // Comprimir con GZIP
    const compressed = await this.compressData(dbData);
    
    // Cifrar con AES-256-GCM
    const encrypted = await BasicEncryption.encrypt(compressed);
    
    return new Blob([encrypted], { type: 'application/octet-stream' });
}

/**
 * Programa backup automático cada 6 horas
 */
static async scheduleAutoBackup(): Promise<void> {
    setInterval(async () => {
        try {
            const snapshot = await this.createBackupSnapshot();
            const filename = `backup_${Date.now()}.aex`;
            
            // Insertar en sync_outbox para procesamiento asíncrono
            await this.executeQuery(`
                INSERT INTO sync_outbox (id, module, operation, payload, status)
                VALUES (?, 'backups', 'UPLOAD', ?, 'pending')
            `, [crypto.randomUUID(), JSON.stringify({ filename, data: snapshot })]);
            
            logger.info('DatabaseService', 'backup_scheduled', `Backup ${filename} encolado`);
        } catch (error) {
            logger.error('DatabaseService', 'backup_failed', 'Error al crear backup', null, error as Error);
        }
    }, 6 * 60 * 60 * 1000); // Cada 6 horas
}
```

**Día 3: Configuración de Usuario**
- [ ] Crear UI para configurar credenciales S3
- [ ] Implementar almacenamiento seguro de credenciales
- [ ] Agregar validación de conexión ("Test Connection")
- [ ] Documentar setup para AWS S3, MinIO, Cloudflare R2

**Nuevo archivo**: `src/components/settings/CloudBackupSettings.tsx`
```typescript
import React, { useState } from 'react';
import { DatabaseService } from '../../database/DatabaseService';

export function CloudBackupSettings() {
    const [config, setConfig] = useState({
        endpoint: '',
        bucket: '',
        accessKey: '',
        secretKey: '',
        enabled: false
    });

    const testConnection = async () => {
        // Validar credenciales
        try {
            const s3 = new S3Provider(config);
            await s3.upload('test.txt', 'Hello World');
            await s3.delete('test.txt');
            alert('✅ Conexión exitosa');
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    };

    const saveConfig = async () => {
        // Guardar en localStorage cifrado
        const encrypted = await BasicEncryption.encrypt(JSON.stringify(config));
        localStorage.setItem('cloud_backup_config', encrypted);
        
        // Activar backups automáticos
        if (config.enabled) {
            await DatabaseService.scheduleAutoBackup();
        }
    };

    return (
        <div className="cloud-backup-settings">
            <h2>☁️ Respaldo en la Nube</h2>
            <p>Protege tus datos con backups automáticos cifrados</p>
            
            <label>
                Endpoint S3:
                <input 
                    value={config.endpoint} 
                    onChange={e => setConfig({...config, endpoint: e.target.value})}
                    placeholder="https://s3.amazonaws.com"
                />
            </label>
            
            <label>
                Bucket:
                <input 
                    value={config.bucket} 
                    onChange={e => setConfig({...config, bucket: e.target.value})}
                    placeholder="my-accountexpress-backups"
                />
            </label>
            
            <label>
                Access Key:
                <input 
                    value={config.accessKey} 
                    onChange={e => setConfig({...config, accessKey: e.target.value})}
                    type="password"
                />
            </label>
            
            <label>
                Secret Key:
                <input 
                    value={config.secretKey} 
                    onChange={e => setConfig({...config, secretKey: e.target.value})}
                    type="password"
                />
            </label>
            
            <button onClick={testConnection}>🔍 Probar Conexión</button>
            <button onClick={saveConfig}>💾 Guardar y Activar</button>
        </div>
    );
}
```

### 1.2 Implementar Persistent Storage API (Días 4-5)

**Objetivo**: Proteger OPFS de limpieza automática del navegador

**Día 4: Solicitar Persistent Storage**
- [ ] Implementar `navigator.storage.persist()`
- [ ] Agregar UI para solicitar permiso al usuario
- [ ] Verificar cuota disponible
- [ ] Mostrar advertencias si cuota < 500MB

**Nuevo archivo**: `src/services/PersistentStorageService.ts`
```typescript
export class PersistentStorageService {
    /**
     * Solicita almacenamiento persistente al navegador
     */
    static async requestPersistence(): Promise<boolean> {
        if (!navigator.storage || !navigator.storage.persist) {
            console.warn('Persistent Storage API no soportada');
            return false;
        }

        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
            console.log('✅ Almacenamiento ya es persistente');
            return true;
        }

        const granted = await navigator.storage.persist();
        if (granted) {
            console.log('✅ Persistencia otorgada');
            return true;
        } else {
            console.warn('⚠️ Persistencia denegada - datos en riesgo');
            return false;
        }
    }

    /**
     * Verifica cuota disponible
     */
    static async checkQuota(): Promise<{ usage: number; quota: number; available: number }> {
        if (!navigator.storage || !navigator.storage.estimate) {
            throw new Error('Storage Estimation API no soportada');
        }

        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - usage;

        return { usage, quota, available };
    }

    /**
     * Muestra advertencia si espacio insuficiente
     */
    static async warnIfLowSpace(minRequired: number = 500 * 1024 * 1024): Promise<void> {
        const { available } = await this.checkQuota();
        
        if (available < minRequired) {
            const availableMB = Math.floor(available / (1024 * 1024));
            const requiredMB = Math.floor(minRequired / (1024 * 1024));
            
            alert(`⚠️ ADVERTENCIA: Espacio insuficiente\n\nDisponible: ${availableMB}MB\nRequerido: ${requiredMB}MB\n\nPor favor libera espacio o configura respaldo en la nube.`);
        }
    }
}
```

**Día 5: Integrar en App Initialization**
- [ ] Solicitar persistencia en `App.tsx` al iniciar
- [ ] Mostrar banner si persistencia denegada
- [ ] Agregar indicador de estado en Dashboard

**Archivo a modificar**: `src/App.tsx`
```typescript
// Agregar en useEffect de inicialización:

useEffect(() => {
    async function initializeApp() {
        // 1. Solicitar almacenamiento persistente
        const isPersistent = await PersistentStorageService.requestPersistence();
        if (!isPersistent) {
            setShowPersistenceWarning(true);
        }

        // 2. Verificar cuota
        await PersistentStorageService.warnIfLowSpace();

        // 3. Inicializar base de datos
        await initDB();

        // 4. Programar backups automáticos
        await DatabaseService.scheduleAutoBackup();
    }

    initializeApp();
}, []);
```

### 1.3 Implementar Recovery System (Días 6-7)

**Día 6: Restauración desde Cloud**
- [ ] Crear función `restoreFromCloud()`
- [ ] Implementar UI de restauración
- [ ] Validar integridad de backup antes de restaurar
- [ ] Crear punto de restauración local antes de sobrescribir

**Nuevo archivo**: `src/services/RecoveryService.ts`
```typescript
export class RecoveryService {
    /**
     * Lista backups disponibles en la nube
     */
    static async listAvailableBackups(): Promise<CloudDetails[]> {
        const config = await this.getCloudConfig();
        const s3 = new S3Provider(config);
        return await s3.list();
    }

    /**
     * Restaura base de datos desde backup en la nube
     */
    static async restoreFromCloud(filename: string): Promise<void> {
        // 1. Crear snapshot de seguridad local
        const localSnapshot = await DatabaseService.createBackupSnapshot();
        const safetyBackup = `safety_${Date.now()}.aex`;
        localStorage.setItem(safetyBackup, await this.blobToBase64(localSnapshot));

        try {
            // 2. Descargar backup desde S3
            const config = await this.getCloudConfig();
            const s3 = new S3Provider(config);
            const encryptedData = await s3.download(filename);

            // 3. Descifrar
            const decrypted = await BasicEncryption.decrypt(encryptedData);

            // 4. Descomprimir
            const decompressed = await this.decompressData(decrypted);

            // 5. Validar integridad
            const isValid = await this.validateBackup(decompressed);
            if (!isValid) {
                throw new Error('Backup corrupto - checksum inválido');
            }

            // 6. Restaurar DB
            const db = new SQL.Database(new Uint8Array(decompressed));
            DatabaseService.setDB(db);

            logger.info('RecoveryService', 'restore_success', `DB restaurada desde ${filename}`);

        } catch (error) {
            // Restaurar desde safety backup
            logger.error('RecoveryService', 'restore_failed', 'Restaurando desde safety backup', null, error as Error);
            const safetyData = localStorage.getItem(safetyBackup);
            if (safetyData) {
                // Restaurar...
            }
            throw error;
        }
    }
}
```

**Día 7: Testing y Validación**
- [ ] Test: Crear backup → Limpiar DB → Restaurar → Validar
- [ ] Test: Simular fallo de red durante upload
- [ ] Test: Validar cifrado end-to-end
- [ ] Test: Verificar que backups antiguos se eliminan (retention policy)

---

## 📋 FASE 2: WEB WORKERS PARA UI FLUIDA (ALTO)
**Duración**: 1 semana  
**Prioridad**: 🟡 ALTA  
**Objetivo**: Eliminar bloqueos de UI

### 2.1 Migrar Generación de PDFs a Workers (Días 8-9)

#### Estado Actual
```typescript
// ✅ YA EXISTE: src/core/workers/WorkerOrchestrator.ts
// ✅ YA EXISTE: src/modules/dr15/DR15PDFGenerator.ts (usa WorkerOrchestrator)
// ⚠️ FALTA: Implementar workers específicos
```

**Día 8: Crear PDF Worker**
- [ ] Implementar `src/workers/pdf.worker.ts`
- [ ] Integrar librería jsPDF en worker
- [ ] Crear generadores para DR-15, W-2, 941, Balance Sheet
- [ ] Implementar progress reporting

**Nuevo archivo**: `src/workers/pdf.worker.ts`
```typescript
import jsPDF from 'jspdf';

self.onmessage = async (e: MessageEvent) => {
    const { type, taskId, payload } = e.data;

    if (type === 'EXECUTE_TASK') {
        try {
            let result;

            switch (payload.type) {
                case 'dr15-pdf':
                    result = await generateDR15PDF(payload.data);
                    break;
                case 'w2-pdf':
                    result = await generateW2PDF(payload.data);
                    break;
                case 'balance-sheet-pdf':
                    result = await generateBalanceSheetPDF(payload.data);
                    break;
                default:
                    throw new Error(`Tipo de PDF no soportado: ${payload.type}`);
            }

            self.postMessage({
                taskId,
                type: 'TASK_COMPLETE',
                payload: { success: true, data: result }
            });

        } catch (error: any) {
            self.postMessage({
                taskId,
                type: 'TASK_ERROR',
                error: error.message
            });
        }
    }
};

async function generateDR15PDF(data: any): Promise<{ pdf: ArrayBuffer }> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text('Florida DR-15 Sales Tax Report', 105, 20, { align: 'center' });
    
    // Taxpayer Info
    doc.setFontSize(10);
    doc.text(`FEIN: ${data.taxpayerInfo.fein}`, 20, 40);
    doc.text(`Period: ${data.taxpayerInfo.period}`, 20, 50);
    doc.text(`Name: ${data.taxpayerInfo.name}`, 20, 60);
    
    // County Breakdown Table
    let y = 80;
    doc.text('County', 20, y);
    doc.text('Sales', 80, y);
    doc.text('Tax', 140, y);
    
    y += 10;
    for (const county of data.countySummary) {
        doc.text(county.county, 20, y);
        doc.text(`$${county.grossSales.toFixed(2)}`, 80, y);
        doc.text(`$${county.taxCollected.toFixed(2)}`, 140, y);
        y += 10;
        
        // Progress reporting
        self.postMessage({
            type: 'PROGRESS',
            progress: (y / 200) * 100
        });
    }
    
    // Totals
    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Sales: $${data.totals.sales.toFixed(2)}`, 20, y);
    doc.text(`Total Tax: $${data.totals.tax.toFixed(2)}`, 20, y + 10);
    
    // Verification
    doc.setFontSize(8);
    doc.text(`Generated: ${data.verification.generatedAt}`, 20, 280);
    doc.text(`Checksum: ${data.verification.checksum}`, 20, 285);
    
    // Convert to ArrayBuffer
    const pdfBlob = doc.output('arraybuffer');
    return { pdf: pdfBlob };
}
```

**Día 9: Actualizar Componentes UI**
- [ ] Modificar `PayrollReportGenerator.ts` para usar worker
- [ ] Agregar loading spinner durante generación
- [ ] Implementar progress bar
- [ ] Agregar cancelación de tarea

**Archivo a modificar**: `src/services/payroll/PayrollReportGenerator.ts`
```typescript
// Agregar al inicio de la clase:
private orchestrator: WorkerOrchestrator;

constructor() {
    this.orchestrator = new WorkerOrchestrator();
}

// Modificar método generateForm941:
async generateForm941PDF(quarter: number, year: number, companyData?: any): Promise<Blob> {
    const data = this.generateForm941(quarter, year, companyData);
    
    const result = await this.orchestrator.executeTask('PDF_GENERATION', {
        type: 'form-941-pdf',
        data: {
            ...data,
            companyData
        }
    });
    
    if (!result.success) {
        throw new Error(result.error || 'Error generando PDF Form 941');
    }
    
    return new Blob([result.data.pdf], { type: 'application/pdf' });
}
```

### 2.2 Migrar Importación CSV a Workers (Días 10-11)

**Día 10: Crear CSV Worker**
- [ ] Implementar `src/workers/csv.worker.ts`
- [ ] Parser CSV con streaming (para archivos grandes)
- [ ] Detección de duplicados
- [ ] Categorización con ML

**Nuevo archivo**: `src/workers/csv.worker.ts`
```typescript
import Papa from 'papaparse';

self.onmessage = async (e: MessageEvent) => {
    const { type, taskId, payload } = e.data;

    if (type === 'EXECUTE_TASK') {
        try {
            const { file, format } = payload;
            
            // Parse CSV con streaming
            const results: any[] = [];
            let processed = 0;
            
            Papa.parse(file, {
                header: true,
                worker: false, // Ya estamos en un worker
                step: (row: any) => {
                    results.push(row.data);
                    processed++;
                    
                    // Progress reporting cada 100 filas
                    if (processed % 100 === 0) {
                        self.postMessage({
                            type: 'PROGRESS',
                            progress: processed,
                            total: file.size
                        });
                    }
                },
                complete: () => {
                    self.postMessage({
                        taskId,
                        type: 'TASK_COMPLETE',
                        payload: {
                            success: true,
                            data: {
                                transactions: results,
                                count: results.length
                            }
                        }
                    });
                },
                error: (error: any) => {
                    self.postMessage({
                        taskId,
                        type: 'TASK_ERROR',
                        error: error.message
                    });
                }
            });

        } catch (error: any) {
            self.postMessage({
                taskId,
                type: 'TASK_ERROR',
                error: error.message
            });
        }
    }
};
```

**Día 11: Integrar en BankImportService**
- [ ] Modificar `BankImportService` para usar worker
- [ ] Agregar UI de progreso
- [ ] Implementar cancelación
- [ ] Test con archivo CSV de 10,000 filas

### 2.3 Crear Worker Pool Manager (Día 12)

**Objetivo**: Optimizar uso de workers con pooling

**Archivo a modificar**: `src/core/workers/WorkerOrchestrator.ts`
```typescript
// Agregar después de línea 30:

private workerPools: Map<WorkerType, Worker[]> = new Map();
private poolSize: number = 2; // 2 workers por tipo

/**
 * Obtiene worker del pool o crea uno nuevo
 */
private async getPooledWorker(type: WorkerType): Promise<Worker> {
    if (!this.workerPools.has(type)) {
        this.workerPools.set(type, []);
    }
    
    const pool = this.workerPools.get(type)!;
    
    // Buscar worker disponible
    for (const worker of pool) {
        const isBusy = Array.from(this.taskQueue.values())
            .some(task => this.workers.get(task.workerId) === worker);
        
        if (!isBusy) {
            return worker;
        }
    }
    
    // Si todos están ocupados y no llegamos al límite, crear nuevo
    if (pool.length < this.poolSize) {
        const newWorker = await this.spawnWorker(type);
        pool.push(newWorker);
        return newWorker;
    }
    
    // Esperar a que se libere uno
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            for (const worker of pool) {
                const isBusy = Array.from(this.taskQueue.values())
                    .some(task => this.workers.get(task.workerId) === worker);
                
                if (!isBusy) {
                    clearInterval(checkInterval);
                    resolve(worker);
                    return;
                }
            }
        }, 100);
    });
}
```

---

## 📋 FASE 3: IA PROACTIVA (MEDIO)
**Duración**: 4 días  
**Prioridad**: 🟢 MEDIA  
**Objetivo**: Completar integración de DraftProposalService

### 3.1 UI de Propuestas de IA (Días 13-14)

**Estado Actual**
```typescript
// ✅ YA EXISTE: src/services/DraftProposalService.ts
// ⚠️ FALTA: UI para mostrar y aprobar propuestas
```

**Día 13: Crear Componente de Propuestas**

**Nuevo archivo**: `src/components/ai/AIProposalPanel.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { DraftProposalService } from '../../services/DraftProposalService';

export function AIProposalPanel() {
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProposals();
    }, []);

    const loadProposals = async () => {
        setLoading(true);
        const pending = await DraftProposalService.getPendingProposals();
        setProposals(pending);
        setLoading(false);
    };

    const handleApprove = async (id: number) => {
        if (confirm('¿Aprobar esta propuesta de la IA?')) {
            await DraftProposalService.approveProposal(id);
            await loadProposals();
        }
    };

    const handleReject = async (id: number) => {
        if (confirm('¿Rechazar esta propuesta?')) {
            await DraftProposalService.rejectProposal(id);
            await loadProposals();
        }
    };

    if (loading) return <div>Cargando propuestas...</div>;
    if (proposals.length === 0) return null;

    return (
        <div className="ai-proposal-panel">
            <h3>🤖 Propuestas de la IA ({proposals.length})</h3>
            
            {proposals.map(proposal => (
                <div key={proposal.id} className="proposal-card">
                    <div className="proposal-header">
                        <span className="module-badge">{proposal.module}</span>
                        <span className="operation-badge">{proposal.operation}</span>
                    </div>
                    
                    <div className="proposal-reason">
                        <strong>Razón:</strong> {proposal.ai_proposal_reason}
                    </div>
                    
                    <div className="proposal-payload">
                        <strong>Cambios propuestos:</strong>
                        <pre>{JSON.stringify(JSON.parse(proposal.payload), null, 2)}</pre>
                    </div>
                    
                    <div className="proposal-actions">
                        <button 
                            className="btn-approve"
                            onClick={() => handleApprove(proposal.id)}
                        >
                            ✅ Aprobar
                        </button>
                        <button 
                            className="btn-reject"
                            onClick={() => handleReject(proposal.id)}
                        >
                            ❌ Rechazar
                        </button>
                    </div>
                    
                    <div className="proposal-meta">
                        Creado: {new Date(proposal.created_at).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

**Día 14: Integrar en Dashboard**
- [ ] Agregar `AIProposalPanel` al Dashboard
- [ ] Mostrar badge con número de propuestas pendientes
- [ ] Agregar notificaciones cuando IA crea propuesta
- [ ] Implementar shortcuts de teclado (A = aprobar, R = rechazar)

### 3.2 Generador Automático de Propuestas (Días 15-16)

**Día 15: Detector de Anomalías**

**Nuevo archivo**: `src/services/ai/AnomalyDetector.ts`
```typescript
export class AnomalyDetector {
    /**
     * Detecta asientos desbalanceados
     */
    static async detectUnbalancedEntries(): Promise<void> {
        const unbalanced = await DatabaseService.executeQuery(`
            SELECT je.*, 
                   SUM(jel.debit) as total_debit,
                   SUM(jel.credit) as total_credit
            FROM journal_entries je
            JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
            GROUP BY je.id
            HAVING ABS(total_debit - total_credit) > 0.01
        `);

        for (const entry of unbalanced) {
            const diff = entry.total_debit - entry.total_credit;
            
            // Crear propuesta de corrección
            await DraftProposalService.createProposal({
                module: 'accounting',
                operation: 'FIX_UNBALANCED_ENTRY',
                payload: {
                    entryId: entry.id,
                    correction: {
                        account: '9999', // Cuenta de ajuste
                        amount: Math.abs(diff),
                        type: diff > 0 ? 'credit' : 'debit'
                    }
                },
                reason: `Asiento ${entry.entry_number} desbalanceado por $${Math.abs(diff).toFixed(2)}. Propongo ajuste en cuenta 9999.`
            });
        }
    }

    /**
     * Detecta facturas vencidas sin seguimiento
     */
    static async detectOverdueInvoices(): Promise<void> {
        const overdue = await DatabaseService.executeQuery(`
            SELECT * FROM invoices
            WHERE status = 'sent'
            AND due_date < date('now', '-30 days')
            AND id NOT IN (SELECT invoice_id FROM collection_actions)
        `);

        for (const invoice of overdue) {
            await DraftProposalService.createProposal({
                module: 'accounts_receivable',
                operation: 'CREATE_COLLECTION_ACTION',
                payload: {
                    invoiceId: invoice.id,
                    action: 'send_reminder',
                    priority: 'high'
                },
                reason: `Factura ${invoice.number} vencida hace ${this.daysSince(invoice.due_date)} días sin seguimiento. Propongo enviar recordatorio.`
            });
        }
    }

    /**
     * Ejecuta todos los detectores
     */
    static async runAllDetectors(): Promise<void> {
        await this.detectUnbalancedEntries();
        await this.detectOverdueInvoices();
        // Agregar más detectores aquí...
    }

    private static daysSince(date: string): number {
        const then = new Date(date).getTime();
        const now = Date.now();
        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    }
}
```

**Día 16: Scheduler de Detección**
- [ ] Ejecutar detectores cada 1 hora
- [ ] Agregar configuración para habilitar/deshabilitar detectores
- [ ] Implementar límite de propuestas (máx 10 por día)
- [ ] Agregar métricas de aceptación/rechazo

---

## 📋 FASE 4: TESTING Y VALIDACIÓN (CRÍTICO)
**Duración**: 3 días  
**Prioridad**: 🔴 MÁXIMA  
**Objetivo**: Garantizar que nada se rompió

### 4.1 Tests de Integración (Día 17)

**Nuevos tests a crear**:

```typescript
// tests/integration/hybrid-persistence.test.ts
describe('Hybrid Persistence', () => {
    it('✅ Debe crear backup y subirlo a S3', async () => {
        const snapshot = await DatabaseService.createBackupSnapshot();
        expect(snapshot).toBeInstanceOf(Blob);
        expect(snapshot.size).toBeGreaterThan(0);
    });

    it('✅ Debe restaurar DB desde backup', async () => {
        // 1. Crear datos de prueba
        await DatabaseService.insertJournalEntry({...});
        
        // 2. Crear backup
        const backup = await DatabaseService.createBackupSnapshot();
        
        // 3. Limpiar DB
        await DatabaseService.executeQuery('DELETE FROM journal_entries');
        
        // 4. Restaurar
        await RecoveryService.restoreFromBackup(backup);
        
        // 5. Verificar
        const entries = await DatabaseService.executeQuery('SELECT * FROM journal_entries');
        expect(entries.length).toBeGreaterThan(0);
    });
});

// tests/integration/web-workers.test.ts
describe('Web Workers', () => {
    it('✅ Debe generar PDF sin bloquear UI', async () => {
        const startTime = performance.now();
        
        const pdf = await dr15PDFGenerator.generatePDFAsync({...});
        
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(5000); // < 5 segundos
        expect(pdf).toBeInstanceOf(Blob);
    });

    it('✅ Debe procesar CSV de 10k filas sin bloquear', async () => {
        const largeCsv = generateMockCSV(10000);
        
        const result = await csvWorker.process(largeCsv);
        
        expect(result.count).toBe(10000);
    });
});

// tests/integration/ai-proposals.test.ts
describe('AI Proposals', () => {
    it('✅ Debe detectar asiento desbalanceado', async () => {
        // Crear asiento intencionalmente malo
        await createBadEntry();
        
        await AnomalyDetector.detectUnbalancedEntries();
        
        const proposals = await DraftProposalService.getPendingProposals();
        expect(proposals.length).toBeGreaterThan(0);
    });

    it('✅ Debe aprobar propuesta correctamente', async () => {
        const proposal = await DraftProposalService.createProposal({...});
        
        await DraftProposalService.approveProposal(proposal);
        
        // Verificar que se ejecutó la corrección
        const entry = await DatabaseService.executeQuery('SELECT * FROM journal_entries WHERE id = ?', [proposal.payload.entryId]);
        expect(entry.total_debit).toBe(entry.total_credit);
    });
});
```

### 4.2 Tests de Regresión (Día 18)

- [ ] Ejecutar suite completa de tests existentes
- [ ] Verificar que todos los módulos siguen funcionando
- [ ] Test manual de flujos críticos:
  - Crear factura → Pagar → Conciliar
  - Procesar nómina → Generar W-2
  - Importar CSV → Categorizar → Aprobar
  - Cerrar período → Generar reportes

### 4.3 Performance Testing (Día 19)

**Benchmarks a ejecutar**:

```typescript
// tests/performance/benchmarks.test.ts
describe('Performance Benchmarks', () => {
    it('✅ Dashboard debe cargar en < 2s', async () => {
        const start = performance.now();
        await loadDashboard();
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(2000);
    });

    it('✅ General Ledger con 10k registros en < 3s', async () => {
        await seedDatabase(10000);
        
        const start = performance.now();
        const results = await queryGeneralLedger();
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(3000);
        expect(results.length).toBe(10000);
    });

    it('✅ Backup de 100MB debe completar en < 30s', async () => {
        await seedLargeDatabase(100 * 1024 * 1024);
        
        const start = performance.now();
        await DatabaseService.createBackupSnapshot();
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(30000);
    });
});
```

---

## 📋 FASE 5: DOCUMENTACIÓN Y DEPLOYMENT (FINAL)
**Duración**: 2 días  
**Prioridad**: 🟢 MEDIA  
**Objetivo**: Preparar para lanzamiento

### 5.1 Documentación de Usuario (Día 20)

**Crear guías**:
- [ ] `docs/CLOUD_BACKUP_SETUP.md` - Cómo configurar S3/MinIO
- [ ] `docs/AI_PROPOSALS_GUIDE.md` - Cómo usar propuestas de IA
- [ ] `docs/DISASTER_RECOVERY.md` - Cómo restaurar desde backup
- [ ] `docs/PERFORMANCE_TIPS.md` - Optimización de rendimiento

### 5.2 Release Notes (Día 21)

**Crear**: `RELEASE_NOTES_v5.0.md`

```markdown
# AccountExpress v5.0 - Iron Clad Upgrade

## 🚀 Nuevas Características

### 1. Hybrid Persistence (Crítico)
- ✅ Backups automáticos cifrados a S3/MinIO/R2
- ✅ Protección contra pérdida de datos del navegador
- ✅ Restauración con un clic
- ✅ Persistent Storage API integrado

### 2. UI Sin Bloqueos
- ✅ Generación de PDFs en Web Workers
- ✅ Importación de CSV sin congelar UI
- ✅ Progress bars en tiempo real
- ✅ Cancelación de tareas pesadas

### 3. IA Proactiva
- ✅ Detección automática de anomalías
- ✅ Propuestas de corrección con un clic
- ✅ Aprobación/rechazo de cambios
- ✅ Dashboard de propuestas pendientes

## 🔧 Mejoras Técnicas
- Worker Pool Manager para optimización
- Retry logic con exponential backoff
- Compresión GZIP de backups
- Cifrado AES-256-GCM end-to-end

## 📊 Métricas
- Tiempo de backup: < 30s para 100MB
- Generación de PDF: < 5s sin bloqueo
- Importación CSV: 10k filas en < 10s
- Cobertura de tests: 86%

## 🎯 Próximos Pasos
- Integración con Google Drive
- Múltiples TSAs para redundancia
- Dashboard de métricas de IA
```

---

## 📊 CRONOGRAMA VISUAL

```
Semana 1: HYBRID PERSISTENCE (CRÍTICO)
├─ Días 1-3:  Completar Sync Gateway
├─ Días 4-5:  Persistent Storage API
└─ Días 6-7:  Recovery System

Semana 2: WEB WORKERS (ALTO)
├─ Días 8-9:   PDF Workers
├─ Días 10-11: CSV Workers
└─ Día 12:     Worker Pool Manager

Semana 3: IA PROACTIVA (MEDIO)
├─ Días 13-14: UI de Propuestas
└─ Días 15-16: Detector de Anomalías

Semana 4: TESTING Y DEPLOYMENT
├─ Días 17-19: Testing completo
└─ Días 20-21: Documentación y Release
```

---

## 🎯 CRITERIOS DE ÉXITO

### Fase 1: Hybrid Persistence
- [ ] ✅ Backup automático cada 6 horas
- [ ] ✅ Restauración exitosa desde S3
- [ ] ✅ Persistent Storage otorgado
- [ ] ✅ Zero pérdida de datos en tests

### Fase 2: Web Workers
- [ ] ✅ PDF generado sin bloqueo de UI
- [ ] ✅ CSV de 10k filas procesado en < 10s
- [ ] ✅ Progress bars funcionando
- [ ] ✅ Worker pool optimizado

### Fase 3: IA Proactiva
- [ ] ✅ Detección de anomalías automática
- [ ] ✅ UI de propuestas funcional
- [ ] ✅ Aprobación/rechazo implementado
- [ ] ✅ Al menos 3 detectores funcionando

### Fase 4: Testing
- [ ] ✅ 100% tests de regresión pasando
- [ ] ✅ Performance benchmarks cumplidos
- [ ] ✅ Zero errores críticos

---

## 🚨 RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| S3 credentials leak | Media | Crítico | Cifrar en localStorage, nunca en código |
| Worker compatibility | Baja | Alto | Feature detection, fallback a sync |
| Backup corruption | Baja | Crítico | Checksum validation, safety backup |
| Performance degradation | Media | Medio | Benchmarks continuos, rollback plan |

---

## 📞 SOPORTE Y CONTACTO

**Implementación**: Equipo de Desarrollo  
**Revisión Técnica**: Basado en auditoría externa  
**Fecha de Inicio**: 9 de febrero de 2026  
**Fecha Estimada de Completitud**: 8 de marzo de 2026  

---

## 🎓 APÉNDICE: DECISIONES TÉCNICAS

### ¿Por qué aws4fetch y no AWS SDK?
- **Tamaño**: aws4fetch = 5KB vs AWS SDK = 500KB
- **Funcionalidad**: Solo necesitamos signing, no todo el SDK
- **Performance**: Menor overhead en workers

### ¿Por qué FreeTSA y no servicio propio?
- **Costo**: FreeTSA es gratuito
- **Confiabilidad**: Certificados válidos y reconocidos
- **Simplicidad**: No requiere infraestructura adicional

### ¿Por qué Worker Pool en lugar de workers on-demand?
- **Latencia**: Crear worker toma ~100ms
- **Memoria**: Reutilizar workers es más eficiente
- **Límites**: Navegadores limitan workers concurrentes

---

**🚀 AccountExpress - De Prototipo a Producto Enterprise-Grade**
