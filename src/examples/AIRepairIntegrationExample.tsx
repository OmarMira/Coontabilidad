/**
 * EJEMPLO DE INTEGRACIÓN: AI Repair System
 * 
 * Este archivo muestra cómo integrar el sistema de reparación asistida
 * por IA en tu dashboard o componente principal.
 */

import React, { useState, useEffect } from 'react';
import { AIRepairService } from '../services/ai/AIRepairService';
import { RepairProposalCard } from '../components/ai/RepairProposalCard';
import { RepairHistoryPanel } from '../components/ai/RepairHistoryPanel';
import { RepairProposal, RepairCategory } from '../types/ai-repair';
import { db } from '../database/simple-db';
import toast from 'react-hot-toast';

/**
 * Ejemplo de componente que integra AI Repair
 */
export function AIRepairDashboard() {
    const [repairService] = useState(() => new AIRepairService(db, 'YOUR_API_KEY'));
    const [currentProposal, setCurrentProposal] = useState<RepairProposal | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Función para analizar un tipo de problema
    const analyzeCategory = async (category: RepairCategory) => {
        setIsAnalyzing(true);
        try {
            const proposal = await repairService.detectAndPropose(category);

            if (proposal) {
                setCurrentProposal(proposal);
                toast.success(`Problema detectado: ${proposal.issue.title}`);
            } else {
                toast.success('No se detectaron problemas en esta categoría');
            }
        } catch (error) {
            toast.error(`Error al analizar: ${(error as Error).message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Manejar aprobación de propuesta
    const handleApprove = async (proposalId: string) => {
        try {
            const result = await repairService.executeRepair(proposalId, 1); // userId = 1

            if (result.success) {
                toast.success('Reparación ejecutada exitosamente');
                setCurrentProposal(null);
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            toast.error(`Error al ejecutar: ${(error as Error).message}`);
        }
    };

    // Manejar rechazo de propuesta
    const handleReject = async (proposalId: string) => {
        try {
            await repairService.rejectProposal(proposalId, 1); // userId = 1
            toast.success('Propuesta rechazada');
            setCurrentProposal(null);
        } catch (error) {
            toast.error(`Error al rechazar: ${(error as Error).message}`);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">🤖 Asistente de Reparación IA</h1>

            {/* Botones de análisis */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => analyzeCategory('audit')}
                    disabled={isAnalyzing}
                    className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                    🔗 Analizar Cadena de Auditoría
                </button>
                <button
                    onClick={() => analyzeCategory('balance')}
                    disabled={isAnalyzing}
                    className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                    ⚖️ Analizar Balance
                </button>
                <button
                    onClick={() => analyzeCategory('tax')}
                    disabled={isAnalyzing}
                    className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                    📊 Analizar Impuestos
                </button>
                <button
                    onClick={() => analyzeCategory('integrity')}
                    disabled={isAnalyzing}
                    className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                    🔒 Verificar Integridad
                </button>
            </div>

            {/* Loading */}
            {isAnalyzing && (
                <div className="text-center py-8 text-gray-500">
                    🔄 Analizando sistema...
                </div>
            )}

            {/* Propuesta actual */}
            {currentProposal && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3">Problema Detectado</h2>
                    <RepairProposalCard
                        proposal={currentProposal}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                </div>
            )}

            {/* Toggle historial */}
            <div className="mb-4">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                >
                    {showHistory ? '▼' : '►'} Historial de Reparaciones
                </button>
            </div>

            {/* Historial */}
            {showHistory && (
                <div className="border-2 rounded-lg">
                    <RepairHistoryPanel repairService={repairService} />
                </div>
            )}

            {/* Instrucciones */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-bold mb-2">💡 Cómo funciona:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Haz clic en un botón de análisis para detectar problemas</li>
                    <li>La IA analizará el sistema y propondrá una solución si encuentra algo</li>
                    <li>Revisa la propuesta, el preview y las advertencias</li>
                    <li>Decide si aprobar o rechazar la reparación</li>
                    <li>Si apruebas, la IA ejecutará la reparación de forma segura</li>
                    <li>Puedes revertir reparaciones desde el historial (disponible 24h)</li>
                </ol>
            </div>
        </div>
    );
}
