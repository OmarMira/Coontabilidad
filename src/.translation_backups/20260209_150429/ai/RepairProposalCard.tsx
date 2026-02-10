import React, { useState } from 'react';
import {
    RepairProposal,
    RepairSeverity
} from '../../types/ai-repair';
import { ProductionLogger } from '../../core/logging/ProductionLogger';

interface RepairProposalCardProps {
    proposal: RepairProposal;
    onApprove: (proposalId: string) => Promise<void>;
    onReject: (proposalId: string) => Promise<void>;
}

/**
 * Componente para mostrar propuesta de reparación de IA
 * con preview y botones de aprobación/rechazo
 */
export function RepairProposalCard({
    proposal,
    onApprove,
    onReject
}: RepairProposalCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await onApprove(proposal.id);
            ProductionLogger.info('RepairProposalCard', 'Proposal approved by user', {
                proposalId: proposal.id
            });
        } catch (error) {
            ProductionLogger.error('RepairProposalCard', 'Failed to approve proposal', error as Error);
            alert(`Error al aprobar: ${(error as Error).message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);
        try {
            await onReject(proposal.id);
            ProductionLogger.info('RepairProposalCard', 'Proposal rejected by user', {
                proposalId: proposal.id
            });
        } catch (error) {
            ProductionLogger.error('RepairProposalCard', 'Failed to reject proposal', error as Error);
        } finally {
            setIsProcessing(false);
        }
    };

    const severityColors: Record<RepairSeverity, string> = {
        low: 'bg-blue-50 border-blue-300',
        medium: 'bg-yellow-50 border-yellow-400',
        high: 'bg-orange-50 border-orange-400',
        critical: 'bg-red-50 border-red-500'
    };

    const severityIcons: Record<RepairSeverity, string> = {
        low: 'ℹ️',
        medium: '⚠️',
        high: '🔶',
        critical: '🔴'
    };

    const severityLabels: Record<RepairSeverity, string> = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        critical: 'Crítica'
    };

    return (
        <div className={`border-2 rounded-lg p-4 mb-4 ${severityColors[proposal.severity]}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{severityIcons[proposal.severity]}</span>
                    <div>
                        <h3 className="font-bold text-lg">{proposal.issue.title}</h3>
                        <p className="text-sm text-slate-700">
                            Severidad: {severityLabels[proposal.severity]} •
                            Confianza: {(proposal.confidence * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>
                <span className="text-xs text-slate-600">
                    {proposal.timestamp.toLocaleString()}
                </span>
            </div>

            {/* Description */}
            <div className="mb-3">
                <p className="text-gray-700">{proposal.issue.description}</p>
                {proposal.issue.affectedEntities.length > 0 && (
                    <div className="mt-2">
                        <span className="text-sm font-semibold">Entidades afectadas:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {proposal.issue.affectedEntities.map((entity, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-white px-2 py-1 rounded border border-gray-300"
                                >
                                    {entity}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Solution Summary */}
            <div className="mb-3">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <h4 className="font-semibold text-green-700">
                        💡 Solución Propuesta
                    </h4>
                    <span className="text-sm text-slate-600">
                        {isExpanded ? '▼' : '►'} Ver detalles
                    </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{proposal.solution.summary}</p>
            </div>

            {/* Preview (Expandible) */}
            {isExpanded && (
                <div className="mb-3 bg-slate-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                    <pre>{proposal.solution.preview}</pre>
                </div>
            )}

            {/* Risks */}
            {proposal.risks.length > 0 && (
                <div className="mb-3 bg-yellow-100 border border-yellow-300 rounded p-2">
                    <div className="font-semibold text-sm text-yellow-800 mb-1">
                        ⚠️ Advertencias:
                    </div>
                    <ul className="text-sm text-yellow-900 list-disc list-inside">
                        {proposal.risks.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-slate-700 mb-3">
                <div className="flex gap-4">
                    <span>Acciones: {proposal.solution.actions.length}</span>
                    <span>Registros afectados: ~{proposal.affectedRecords}</span>
                    <span>Duración estimada: {(proposal.solution.estimatedDuration / 1000).toFixed(1)}s</span>
                </div>
            </div>

            {/* Actions */}
            {proposal.status === 'pending' && (
                <div className="flex gap-2">
                    <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Rechazar'}
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Ejecutando...' : '✓ Aprobar y Ejecutar'}
                    </button>
                </div>
            )}

            {/* Status Badge */}
            {proposal.status !== 'pending' && (
                <div className="mt-2 text-center">
                    <StatusBadge status={proposal.status} />
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: RepairProposal['status'] }) {
    const styles: Record<typeof status, string> = {
        pending: 'bg-gray-200 text-gray-700',
        approved: 'bg-blue-200 text-blue-800',
        rejected: 'bg-red-200 text-red-800',
        executed: 'bg-green-200 text-green-800',
        failed: 'bg-red-300 text-red-900',
        rolled_back: 'bg-orange-200 text-orange-800'
    };

    const labels: Record<typeof status, string> = {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        executed: 'Ejecutado',
        failed: 'Fallido',
        rolled_back: 'Revertido'
    };

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}
