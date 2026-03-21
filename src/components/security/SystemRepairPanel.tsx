/**
 * Panel de Reparación del Sistema
 * Muestra errores de integridad y permite repararlos
 */

import React from 'react';
import { SystemIntegrityReport } from '../../types/integrity.types';
import { AlertTriangle, CheckCircle, XCircle, Wrench, RefreshCw, HelpCircle, BookOpen, Bot } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

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
    const { t, language } = useLocale();

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
                <div className={`p-6 ${report.overallStatus === 'critical' ? 'bg-red-600' :
                    report.overallStatus === 'degraded' ? 'bg-yellow-600' :
                        'bg-green-600'
                    }`}>
                    <div className="flex items-center gap-4">
                        <AlertTriangle className="w-12 h-12 text-white" />
                        <div className="flex-1">
                            <h1 className="text-2xl font-black tracking-tight text-white">
                                {report.overallStatus === 'critical' ? t('security.messages.attentionRequired') :
                                    report.overallStatus === 'degraded' ? t('security.messages.systemWarnings') :
                                        t('security.messages.systemHealthy')}
                            </h1>
                            <p className="text-white/90 mt-1">
                                {report.criticalFailures > 0 && t('security.messages.problemsCount', { count: report.criticalFailures, s: report.criticalFailures > 1 ? 's' : '' })}
                                {report.warnings > 0 && ` • ${t('security.messages.warningsCount', { count: report.warnings, s: report.warnings > 1 ? 's' : '' })}`}
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
                                        <div className="mt-3 p-3 bg-black/5 rounded-lg border border-black/5">
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Detalles Técnicos para Soporte:</p>
                                            <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-40 custom-scrollbar opacity-90 leading-relaxed">
                                                {typeof check.result.details === 'string' 
                                                    ? check.result.details 
                                                    : JSON.stringify(check.result.details, null, 2)}
                                            </pre>
                                            <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                                <HelpCircle className="w-3 h-3" />
                                                ¿Necesitas ayuda? Contacta a soporte mencionando el ID: {check.id}
                                            </div>
                                        </div>
                                    )}

                                    {!check.result.passed && check.result.canAutoRepair && (
                                        <button
                                            onClick={() => onRepair(check.id)}
                                            disabled={repairing}
                                            className="mt-3 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                        >
                                            <Wrench className="w-4 h-4" />
                                            {repairing ? t('security.messages.repairing') : t('security.actions.autoRepair')}
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
                            {repairing ? t('security.messages.repairingSystem') : t('security.actions.repairAll', { count: repairableChecks.length })}
                        </button>
                    )}

                    <button
                        onClick={onRetry}
                        disabled={repairing}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        {t('security.actions.verify')}
                    </button>

                    {allowContinue && onContinue && (
                        <button
                            onClick={onContinue}
                            disabled={repairing}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('security.actions.continueAnyway')}
                        </button>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 flex flex-col items-center gap-3">
                    <div className="text-xs text-slate-700 font-medium">
                        {t('security.messages.lastCheck', { date: new Date(report.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US') })}
                    </div>
                    <div className="flex items-center gap-4">
                        <a 
                            href="/help" 
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'help' }));
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            Guía de Ayuda
                        </a>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <a 
                            href="mailto:soporte@accountexpress.com" 
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                            <Bot className="w-3.5 h-3.5" />
                            Contactar Soporte
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
