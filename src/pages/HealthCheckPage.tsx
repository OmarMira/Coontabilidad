/**
 * Página de Health Check
 * Endpoint público para verificar el estado del sistema
 * Accesible en /health
 */

import React, { useEffect, useState } from 'react';
import { getHealthStatus, HealthCheckResponse } from '../api/health';
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLocale } from '../i18n/useLocale';

export const HealthCheckPage: React.FC = () => {
    const { t } = useLocale();
    const [health, setHealth] = useState<HealthCheckResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHealth();
    }, []);

    const loadHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getHealthStatus();
            setHealth(result);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-600">{t('systemStatus.verifying')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md bg-white rounded-lg shadow-lg p-6">
                    <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t('common.error')}</h1>
                    <p className="text-gray-600 text-center">{error}</p>
                </div>
            </div>
        );
    }

    if (!health) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-50';
            case 'degraded': return 'text-yellow-600 bg-yellow-50';
            case 'critical': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="w-8 h-8 text-green-600" />;
            case 'degraded': return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
            case 'critical': return <XCircle className="w-8 h-8 text-red-600" />;
            default: return <Activity className="w-8 h-8 text-gray-600" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className={`rounded-lg p-6 mb-6 ${getStatusColor(health.status)}`}>
                    <div className="flex items-center gap-4">
                        {getStatusIcon(health.status)}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold capitalize">{t(`systemStatus.status.${health.status}`)}</h1>
                            <p className="text-sm opacity-80 mt-1">
                                Iron Core v{health.version}
                            </p>
                        </div>
                        <button
                            onClick={loadHealth}
                            className="px-4 py-2 bg-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                        >
                            {t('common.refresh')}
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow">
                        <p className="text-sm text-gray-600">{t('systemStatus.totalChecksLabel')}</p>
                        <p className="text-2xl font-bold text-gray-900">{health.summary.total}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <p className="text-sm text-gray-600">{t('systemStatus.passed')}</p>
                        <p className="text-2xl font-bold text-green-600">{health.summary.passed}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <p className="text-sm text-gray-600">{t('systemStatus.failed')}</p>
                        <p className="text-2xl font-bold text-red-600">{health.summary.failed}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <p className="text-sm text-gray-600">{t('systemStatus.warnings')}</p>
                        <p className="text-2xl font-bold text-yellow-600">{health.summary.warnings}</p>
                    </div>
                </div>

                {/* Checks Detail */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">{t('systemStatus.verificationDetails')}</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {health.checks.map((check) => (
                            <div key={check.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    {check.status === 'passed' ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900">{check.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {check.executionTime.toFixed(0)}ms
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metadata */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>{t('systemStatus.lastVerification')} {new Date(health.timestamp).toLocaleString()}</p>
                    <p className="mt-1">{t('systemStatus.responseTime')} {health.uptime.toFixed(0)}ms</p>
                </div>

                {/* JSON Export */}
                <div className="mt-6">
                    <details className="bg-white rounded-lg shadow overflow-hidden">
                        <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-semibold text-gray-900">
                            {t('systemStatus.viewJson')}
                        </summary>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(health, null, 2)}
                            </pre>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

