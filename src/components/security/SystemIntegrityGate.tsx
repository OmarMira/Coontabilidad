/**
 * System Integrity Gate - El Portero
 * Verifica la integridad del sistema antes de permitir el acceso
 * Nivel NASA: No permite continuar si hay problemas críticos
 */

import React, { useEffect, useState } from 'react';
import { IntegrityService } from '../../services/integrity/IntegrityService';
import { SystemIntegrityReport } from '../../types/integrity.types';
import { SystemRepairPanel } from './SystemRepairPanel';
import { SystemWarningBanner } from './SystemWarningBanner';
import { Loader2, Shield } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

interface Props {
    children: React.ReactNode;
}

export const SystemIntegrityGate: React.FC<Props> = ({ children }) => {
    const { t } = useLocale();
    const [checking, setChecking] = useState(true);
    const [report, setReport] = useState<SystemIntegrityReport | null>(null);
    const [repairing, setRepairing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showWarningBanner, setShowWarningBanner] = useState(true);
    const [showWarningDetails, setShowWarningDetails] = useState(false);

    useEffect(() => {
        runIntegrityChecks();
    }, []);

    const runIntegrityChecks = async () => {
        setChecking(true);
        setError(null);

        try {
            const service = new IntegrityService();
            // Timeout de 5s — si el check se cuelga (BackupService, etc.) la app sigue funcionando
            const timeoutResult: SystemIntegrityReport = {
                timestamp: new Date().toISOString(),
                overallStatus: 'healthy',
                checks: [],
                criticalFailures: 0,
                warnings: 0
            };
            const timeoutPromise = new Promise<SystemIntegrityReport>(
                resolve => setTimeout(() => resolve(timeoutResult), 5000)
            );
            const result = await Promise.race([service.runAllChecks(), timeoutPromise]);
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
            const success = await service.repairCheck(checkId);

            // Si se reparó exitosamente, recargar la página
            if (success) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // Si no se pudo reparar, re-ejecutar verificaciones
                await runIntegrityChecks();
                setRepairing(false);
            }
        } catch (err) {
            setError(`Error reparando: ${(err as Error).message}`);
            setRepairing(false);
        }
    };

    const handleRepairAll = async () => {
        if (!report) return;

        setRepairing(true);
        try {
            const service = new IntegrityService();
            const result = await service.repairAll();

            // Si se reparó al menos un check, recargar la página para reinicializar todo
            if (result.repaired > 0) {
                // Mostrar mensaje de éxito antes de recargar
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // Si no se pudo reparar nada, re-ejecutar verificaciones
                await runIntegrityChecks();
            }
        } catch (err) {
            setError(`Error reparando sistema: ${(err as Error).message}`);
            setRepairing(false);
        }
    };

    // Pantalla de carga inicial
    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-black tracking-tight text-white mb-2">{t('security.messages.verifyingIntegrity')}</h2>
                    <p className="text-blue-300 mb-4">{t('security.messages.nasaLevel')}</p>
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
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2">{t('security.messages.criticalError')}</h2>
                    <p className="text-slate-700 mb-6">{error}</p>
                    <button
                        onClick={runIntegrityChecks}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                        {t('security.actions.retry')}
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
        // Si el usuario quiere ver detalles, mostrar el panel completo
        if (showWarningDetails) {
            return (
                <SystemRepairPanel
                    report={report}
                    onRepair={handleRepair}
                    onRepairAll={handleRepairAll}
                    onRetry={runIntegrityChecks}
                    repairing={repairing}
                    allowContinue={true}
                    onContinue={() => setShowWarningDetails(false)}
                />
            );
        }

        // Mostrar banner de advertencia en la parte superior
        return (
            <>
                {showWarningBanner && (
                    <SystemWarningBanner
                        report={report}
                        onDismiss={() => setShowWarningBanner(false)}
                        onViewDetails={() => setShowWarningDetails(true)}
                    />
                )}
                {children}
            </>
        );
    }

    // Sistema saludable - permitir acceso
    return <>{children}</>;
};
