/**
 * System Integrity Gate - El Portero
 * Verifica la integridad del sistema antes de permitir el acceso
 * Nivel NASA: No permite continuar si hay problemas críticos
 */

import React, { useEffect, useState } from 'react';
import { IntegrityService } from '../../services/integrity/IntegrityService';
import { SystemIntegrityReport } from '../../types/integrity.types';
import { SystemRepairPanel } from './SystemRepairPanel';
import { Loader2, Shield } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

export const SystemIntegrityGate: React.FC<Props> = ({ children }) => {
    const [checking, setChecking] = useState(true);
    const [report, setReport] = useState<SystemIntegrityReport | null>(null);
    const [repairing, setRepairing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        runIntegrityChecks();
    }, []);

    const runIntegrityChecks = async () => {
        setChecking(true);
        setError(null);
        
        try {
            const service = new IntegrityService();
            const result = await service.runAllChecks();
            setReport(result);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setChecking(false);
        }
    };

    const handleRepair = async (checkId: string) => {
        if (!report) return;
        
        setRepairing(true);
        try {
            const service = new IntegrityService();
            await service.repairCheck(checkId);
            
            // Re-ejecutar verificaciones después de reparar
            await runIntegrityChecks();
        } catch (err) {
            setError(`Error reparando: ${(err as Error).message}`);
        } finally {
            setRepairing(false);
        }
    };

    const handleRepairAll = async () => {
        if (!report) return;
        
        setRepairing(true);
        try {
            const service = new IntegrityService();
            await service.repairAll();
            
            // Re-ejecutar verificaciones después de reparar
            await runIntegrityChecks();
        } catch (err) {
            setError(`Error reparando sistema: ${(err as Error).message}`);
        } finally {
            setRepairing(false);
        }
    };

    // Pantalla de carga inicial
    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-white mb-2">Verificando Integridad del Sistema</h2>
                    <p className="text-blue-300 mb-4">Nivel NASA: Verificación de seguridad en progreso...</p>
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    // Error fatal
    if (error && !report) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Crítico</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={runIntegrityChecks}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                        Reintentar Verificación
                    </button>
                </div>
            </div>
        );
    }

    // Sistema con problemas críticos
    if (report && report.overallStatus === 'critical') {
        return (
            <SystemRepairPanel
                report={report}
                onRepair={handleRepair}
                onRepairAll={handleRepairAll}
                onRetry={runIntegrityChecks}
                repairing={repairing}
            />
        );
    }

    // Sistema con advertencias (permitir continuar pero mostrar aviso)
    if (report && report.overallStatus === 'degraded') {
        // TODO: Mostrar banner de advertencia en la parte superior
        // Por ahora, permitir continuar
        return <>{children}</>;
    }

    // Sistema saludable - permitir acceso
    return <>{children}</>;
};
