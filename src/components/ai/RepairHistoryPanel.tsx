import React, { useState, useEffect } from 'react';
import { RepairHistoryEntry, RepairStats } from '../../types/ai-repair';
import { AIRepairService } from '../../services/ai/AIRepairService';
import { ProductionLogger } from '../../core/logging/ProductionLogger';
import { useLocale } from '../../i18n/useLocale';

interface RepairHistoryPanelProps {
    repairService: AIRepairService;
}

/**
 * Panel de historial de reparaciones ejecutadas
 */
export function RepairHistoryPanel({ repairService }: RepairHistoryPanelProps) {
    const { t } = useLocale();
    const [history, setHistory] = useState<RepairHistoryEntry[]>([]);
    const [stats, setStats] = useState<RepairStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const historyData = await repairService.getRepairHistory(50);
            const statsData = repairService.getStats();

            setHistory(historyData);
            setStats(statsData);

            ProductionLogger.info('RepairHistoryPanel', 'History loaded', {
                count: historyData.length
            });
        } catch (error) {
            ProductionLogger.error('RepairHistoryPanel', 'Failed to load history', error as Error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRollback = async (repairId: string) => {
        if (!confirm(t('aiAssistant.history.rollbackConfirm'))) {
            return;
        }

        try {
            // await repairService.rollbackToBackupPoint(repairId);
            alert(t('aiAssistant.history.rollbackNotImplemented'));
            await loadHistory();
        } catch (error) {
            ProductionLogger.error('RepairHistoryPanel', 'Rollback failed', error as Error);
            alert(`Error al revertir: ${(error as Error).message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 text-center text-slate-600">
                {t('aiAssistant.history.loading')}
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Stats Summary */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label={t('aiAssistant.history.totalProposals')}
                        value={stats.totalProposals}
                        icon="📊"
                    />
                    <StatCard
                        label={t('aiAssistant.history.executed')}
                        value={stats.executed}
                        icon="✅"
                        color="green"
                    />
                    <StatCard
                        label={t('aiAssistant.history.rejected')}
                        value={stats.rejected}
                        icon="❌"
                        color="red"
                    />
                    <StatCard
                        label={t('aiAssistant.history.successRate')}
                        value={`${(stats.successRate * 100).toFixed(1)}%`}
                        icon="🎯"
                        color="blue"
                    />
                </div>
            )}

            {/* History List */}
            <div className="space-y-2">
                <h3 className="font-bold text-lg mb-3">{t('aiAssistant.history.title')}</h3>

                {history.length === 0 ? (
                    <div className="text-center text-slate-600 py-8">
                        {t('aiAssistant.history.empty')}
                    </div>
                ) : (
                    history.map((entry) => (
                        <HistoryEntry
                            key={entry.id}
                            entry={entry}
                            onRollback={handleRollback}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    color = 'gray'
}: {
    label: string;
    value: string | number;
    icon: string;
    color?: 'gray' | 'green' | 'red' | 'blue';
}) {
    const colors = {
        gray: 'bg-gray-100 border-gray-300',
        green: 'bg-green-50 border-green-300',
        red: 'bg-red-50 border-red-300',
        blue: 'bg-blue-50 border-blue-300',
    };

    return (
        <div className={`border-2 rounded-lg p-3 ${colors[color]}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-black tracking-tight">{value}</div>
            <div className="text-sm text-slate-700">{label}</div>
        </div>
    );
}

function HistoryEntry({
    entry,
    onRollback
}: {
    entry: RepairHistoryEntry;
    onRollback: (id: string) => void;
}) {
    const { t } = useLocale();
    const statusColors = {
        pending: 'bg-gray-100',
        approved: 'bg-blue-100',
        rejected: 'bg-red-100',
        executed: 'bg-green-100',
        failed: 'bg-red-200',
        rolled_back: 'bg-orange-100'
    };

    const severityColors = {
        low: 'text-blue-600',
        medium: 'text-yellow-600',
        high: 'text-orange-600',
        critical: 'text-red-600'
    };

    return (
        <div className={`border rounded p-3 ${statusColors[entry.status]}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold ${severityColors[entry.severity]}`}>
                            {entry.issueTitle}
                        </span>
                        <span className="text-xs text-slate-600">
                            {entry.category}
                        </span>
                    </div>
                    <div className="text-xs text-slate-700 mt-1">
                        {entry.timestamp.toLocaleString()}
                        {entry.userId && ` • Usuario ID: ${entry.userId}`}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-white rounded border">
                        {entry.status}
                    </span>

                    {entry.canRollback && (
                        <button
                            onClick={() => onRollback(entry.id)}
                            className="text-xs px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded"
                        >
                            {t('aiAssistant.history.rollback')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
