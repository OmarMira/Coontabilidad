/**
 * Dashboard de Estado del Sistema (Admin)
 * Vista completa del estado del sistema con métricas y controles
 * Nivel NASA: Monitoreo en tiempo real para administradores
 */

import React, { useEffect, useState } from 'react';
import { getHealthStatus, HealthCheckResponse } from '../api/health';
import { IntegrityService } from '../services/integrity/IntegrityService';
import { useLocale } from '../i18n/useLocale';
import {
    Activity,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Wrench,
    Shield,
    Clock,
    TrendingUp,
    Database
} from 'lucide-react';

export const SystemStatusDashboard: React.FC = () => {
    const { t } = useLocale();
    const [health, setHealth] = useState<HealthCheckResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [repairing, setRepairing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        loadHealth();
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            loadHealth();
        }, 30000); // Actualizar cada 30 segundos

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getHealthStatus();
            setHealth(result);
            setLastUpdate(new Date());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleRepairAll = async () => {
        setRepairing(true);
        try {
            const service = new IntegrityService();
            await service.repairAll();
            await loadHealth();
        } catch (err) {
            setError(`Error reparando: ${(err as Error).message}`);
        } finally {
            setRepairing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'degraded': return 'bg-yellow-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600';
            case 'degraded': return 'text-yellow-600';
            case 'critical': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    if (loading && !health) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Activity className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-300">{t('systemStatus.loading')}</p>
                </div>
            </div>
        );
    }

    if (error && !health) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-white text-center mb-2 tracking-tighter uppercase">{t('common.error')}</h1>
                    <p className="text-slate-400 text-center">{error}</p>
                    <button
                        onClick={loadHealth}
                        className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    if (!health) return null;

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${getStatusColor(health.status)} flex items-center justify-center`}>
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t('systemStatus.title')}</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Iron Core v{health.version} • {t('systemStatus.lastUpdate')} {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded"
                            />
                            {t('systemStatus.autoRefresh')} (30s)
                        </label>
                        <button
                            onClick={loadHealth}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {t('common.refresh')}
                        </button>
                        {health.summary.failed > 0 && (
                            <button
                                onClick={handleRepairAll}
                                disabled={repairing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <Wrench className="w-4 h-4" />
                                {repairing ? t('systemStatus.repairing') : t('systemStatus.repairAll')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(health.status)}`}></div>
                            <p className="text-sm text-slate-400">{t('systemStatus.generalStatus')}</p>
                        </div>
                        <p className={`text-2xl font-black uppercase tracking-tighter ${getStatusTextColor(health.status)}`}>
                            {t(`systemStatus.status.${health.status}`)}
                        </p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-sm text-slate-400">{t('systemStatus.passedChecks')}</p>
                        </div>
                        <p className="text-2xl font-black text-green-500 tracking-tighter tabular-nums">{health.summary.passed}</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <p className="text-sm text-slate-400">{t('systemStatus.failedChecks')}</p>
                        </div>
                        <p className="text-2xl font-black text-red-500 tracking-tighter tabular-nums">{health.summary.failed}</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <p className="text-sm text-slate-400">{t('systemStatus.warnings')}</p>
                        </div>
                        <p className="text-2xl font-black text-yellow-500 tracking-tighter tabular-nums">{health.summary.warnings}</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <p className="text-sm text-slate-400">{t('systemStatus.responseTime')}</p>
                        </div>
                        <p className="text-2xl font-black text-blue-500 tracking-tighter tabular-nums font-mono">{health.uptime.toFixed(0)}ms</p>
                    </div>
                </div>

                {/* Checks Detail */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t('systemStatus.integrityChecks')}</h2>
                        <span className="text-sm text-slate-400">
                            {health.summary.total} {t('systemStatus.totalChecksSuffix')}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {health.checks.map((check) => (
                            <div
                                key={check.id}
                                className="px-6 py-4 hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {check.status === 'passed' ? (
                                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white text-lg">{check.name}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{check.message}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${check.status === 'passed'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {check.status === 'passed' ? t('systemStatus.pass') : t('systemStatus.fail')}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {check.executionTime.toFixed(0)}ms
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-blue-500" />
                            <h3 className="text-lg font-black text-white">{t('systemStatus.systemInfo')}</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t('systemStatus.version')}</span>
                                <span className="text-white font-semibold">{health.version}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t('systemStatus.timestamp')}</span>
                                <span className="text-white font-mono text-sm">
                                    {new Date(health.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t('systemStatus.totalChecksLabel')}</span>
                                <span className="text-white font-semibold">{health.summary.total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                            <h3 className="text-lg font-black text-white">{t('systemStatus.performanceMetrics')}</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t('systemStatus.verificationTime')}</span>
                                <span className="text-white font-semibold">{health.uptime.toFixed(2)}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t('systemStatus.successRate')}</span>
                                <span className="text-white font-semibold">
                                    {((health.summary.passed / health.summary.total) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t('systemStatus.criticalFailures')}</span>
                                <span className={`font-semibold ${health.summary.criticalFailures > 0 ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                    {health.summary.criticalFailures}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

