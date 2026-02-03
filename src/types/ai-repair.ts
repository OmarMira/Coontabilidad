/**
 * AI Repair System - Type Definitions
 * 
 * Sistema de reparación asistida por IA con aprobación del usuario.
 * La IA detecta problemas, propone soluciones, y el usuario decide si ejecutar.
 */

export type RepairCategory = 'audit' | 'balance' | 'tax' | 'integrity';
export type RepairSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RepairStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'rolled_back';

export type RepairActionType =
    | 'CREATE_JE'           // Crear asiento contable
    | 'UPDATE_ACCOUNT'      // Actualizar cuenta
    | 'RECALCULATE_TAX'     // Recalcular impuestos
    | 'FIX_CHAIN'           // Reparar cadena de auditoría
    | 'REVERSE_ENTRY'       // Revertir asiento
    | 'ADJUST_BALANCE';     // Ajustar balance

/**
 * Propuesta de reparación generada por la IA
 */
export interface RepairProposal {
    id: string;
    timestamp: Date;
    category: RepairCategory;
    severity: RepairSeverity;
    status: RepairStatus;

    // Problema detectado
    issue: {
        title: string;
        description: string;
        affectedEntities: string[];  // ["JE #1234", "Account 4010"]
        detectedAt: Date;
    };

    // Solución propuesta
    solution: {
        summary: string;
        actions: RepairAction[];
        preview: string;  // Vista previa legible para humanos
        estimatedDuration: number;  // milliseconds
    };

    // Información adicional
    risks: string[];
    confidence: number;  // 0-1
    affectedRecords: number;

    // Metadata
    proposedBy: 'AI' | 'SYSTEM';
    userId?: number;  // Usuario que aprobó/rechazó
    approvedAt?: Date;
    executedAt?: Date;
    backupPointId?: string;
}

/**
 * Acción específica de reparación
 */
export interface RepairAction {
    type: RepairActionType;
    params: Record<string, any>;
    reversible: boolean;
    description: string;

    // Para validación
    requiredPermissions?: string[];
    estimatedImpact: 'low' | 'medium' | 'high';
}

/**
 * Resultado de la ejecución de una reparación
 */
export interface RepairResult {
    success: boolean;
    repairId: string;
    proposalId: string;
    executedActions: number;
    failedActions: number;
    backupPointId?: string;

    // Verificación post-reparación
    verification: {
        passed: boolean;
        checks: VerificationCheck[];
    };

    // Metadata
    duration: number;
    timestamp: Date;
    error?: string;
}

/**
 * Verificación post-reparación
 */
export interface VerificationCheck {
    name: string;
    passed: boolean;
    message: string;
    severity: 'info' | 'warning' | 'error';
}

/**
 * Punto de backup para rollback
 */
export interface BackupPoint {
    id: string;
    timestamp: Date;
    logicClock: number;
    affectedTables: string[];
    dataSnapshot: Record<string, any[]>;
    expiresAt: Date;  // Auto-delete after 24h
}

/**
 * Historial de reparaciones
 */
export interface RepairHistoryEntry {
    id: string;
    proposalId: string;
    category: RepairCategory;
    severity: RepairSeverity;
    status: RepairStatus;
    issueTitle: string;
    timestamp: Date;
    userId?: number;
    canRollback: boolean;
}

/**
 * Estadísticas de reparaciones
 */
export interface RepairStats {
    totalProposals: number;
    approved: number;
    rejected: number;
    executed: number;
    failed: number;
    rolledBack: number;
    averageConfidence: number;
    successRate: number;
}
