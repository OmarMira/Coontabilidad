/**
 * Panel de Reparación del Sistema
 * Muestra errores de integridad y permite repararlos
 */

import React from 'react';
import { SystemIntegrityReport } from '../../types/integrity.types';
import { AlertTriangle, CheckCircle, XCircle, Wrench, RefreshCw } from 'lucide-react';

interface Props {
    report: SystemIntegrityReport;
    onRepair: (checkId: string) => Promise<void>;
    onRepairAll: () => Promise<void>;
    onRetry: () => void;
    repairing: boolean;
    allowContinue?: boolean;
    onContinue?: () => void;
}

export const SystemRepairPanel: React.FC<Props> = ({ 
    report, 
    onRepair, 
    onRepairAll, 
    onRetry,
    repairing,
    allowContinue = false,
    onContinue
}) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getStatusIcon = (passed: boolean) => {
        return passed ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
            <XCircle className="w-6 h-6 text-red-600" />
        );
    };

    const failedChecks = report.checks.filter(c => !c.result.passed);
    const repairableChecks = failedChecks.filter(c => c.result.canAutoRepair);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`p-6 ${
                    report.overallStatus === 'critical' ? 'bg-red-600' :
                    report.overallStatus === 'degraded' ? 'bg-yellow-600' :
                    'bg-green-600'
                }`}>
                    <div className="flex items-center gap-4">
                        <AlertTriangle className="w-12 h-12 text-white" />
                        <div className="flex-1">
                            <h1 className="text-2xl font-black tracking-tight text-white">
                                {report.overallStatus === 'critical' ? 'Sistema Requiere Atención' :
                                 report.overallStatus === 'degraded' ? 'Sistema con Advertencias' :
                                 'Sistema Saludable'}
                            </h1>
                            <p className="text-white/90 mt-1">
                                {report.criticalFailures > 0 && `${report.criticalFailures} problema${report.criticalFailures > 1 ? 's' : ''} crítico${report.criticalFailures > 1 ? 's' : ''}`}
                                {report.warnings > 0 && ` • ${report.warnings} advertencia${report.warnings > 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Checks List */}
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {report.checks.map((check) => (
                        <div 
                            key={check.id}
                            className={`border rounded-lg p-4 ${getSeverityColor(check.severity)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(check.result.passed)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg">{check.name}</h3>
                                    <p className="text-sm opacity-80 mt-1">{check.description}</p>
                                    <p className="mt-2 font-medium">{check.result.message}</p>
                                    
                                    {check.result.details && (
                                        <div className="mt-2 text-xs opacity-70">
                                            <pre className="whitespace-pre-wrap">
                                                {JSON.stringify(check.result.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {!check.result.passed && check.result.canAutoRepair && (
                                        <button
                                            onClick={() => onRepair(check.id)}
                                            disabled={repairing}
                                            className="mt-3 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                        >
                                            <Wrench className="w-4 h-4" />
                                            {repairing ? 'Reparando...' : 'Reparar Automáticamente'}
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs opacity-60">
                                    {check.executionTime.toFixed(0)}ms
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 border-t flex gap-3">
                    {repairableChecks.length > 0 && (
                        <button
                            onClick={onRepairAll}
                            disabled={repairing}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                        >
                            <Wrench className="w-5 h-5" />
                            {repairing ? 'Reparando Sistema... Recargando...' : `Reparar Todo (${repairableChecks.length})`}
                        </button>
                    )}
                    
                    <button
                        onClick={onRetry}
                        disabled={repairing}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Verificar de Nuevo
                    </button>

                    {allowContinue && onContinue && (
                        <button
                            onClick={onContinue}
                            disabled={repairing}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continuar de Todos Modos
                        </button>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 bg-gray-100 text-xs text-slate-700 text-center">
                    Verificación ejecutada: {new Date(report.timestamp).toLocaleString('es-ES')}
                </div>
            </div>
        </div>
    );
};
