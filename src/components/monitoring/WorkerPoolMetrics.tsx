/**
 * WorkerPoolMetrics (Iron Clad Upgrade - Phase 2, Day 7)
 * 
 * Componente para visualizar métricas del Worker Pool Manager en tiempo real.
 */

import React, { useState, useEffect } from 'react';
import { workerPoolManager } from '../../core/workers/WorkerPoolManager';

export function WorkerPoolMetrics() {
    const [metrics, setMetrics] = useState(workerPoolManager.getMetrics());
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Update metrics every second
        const interval = setInterval(() => {
            setMetrics(workerPoolManager.getMetrics());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={styles.toggleButton}
                title="Show Worker Pool Metrics"
            >
                📊 Worker Pool
            </button>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>📊 Worker Pool Metrics</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    style={styles.closeButton}
                >
                    ✕
                </button>
            </div>

            <div style={styles.metricsGrid}>
                {/* Total Workers */}
                <div style={styles.metricCard}>
                    <div style={styles.metricValue}>{metrics.totalWorkers}</div>
                    <div style={styles.metricLabel}>Total Workers</div>
                </div>

                {/* Busy Workers */}
                <div style={{ ...styles.metricCard, ...styles.metricBusy }}>
                    <div style={styles.metricValue}>{metrics.busyWorkers}</div>
                    <div style={styles.metricLabel}>Busy</div>
                </div>

                {/* Idle Workers */}
                <div style={{ ...styles.metricCard, ...styles.metricIdle }}>
                    <div style={styles.metricValue}>{metrics.idleWorkers}</div>
                    <div style={styles.metricLabel}>Idle</div>
                </div>

                {/* Queued Tasks */}
                <div style={{ ...styles.metricCard, ...styles.metricQueued }}>
                    <div style={styles.metricValue}>{metrics.queuedTasks}</div>
                    <div style={styles.metricLabel}>Queued</div>
                </div>

                {/* Total Tasks Completed */}
                <div style={{ ...styles.metricCard, ...styles.metricCompleted }}>
                    <div style={styles.metricValue}>{metrics.totalTasksCompleted}</div>
                    <div style={styles.metricLabel}>Completed</div>
                </div>
            </div>

            {/* Workers by Type */}
            <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Workers by Type</h4>
                <div style={styles.workerTypes}>
                    {Object.entries(metrics.workersByType).map(([type, count]) => (
                        <div key={type} style={styles.workerType}>
                            <span style={styles.workerTypeName}>{type}</span>
                            <span style={styles.workerTypeCount}>{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Indicators */}
            <div style={styles.statusBar}>
                {metrics.busyWorkers > 0 && (
                    <div style={styles.statusBusy}>
                        ⚡ {metrics.busyWorkers} worker{metrics.busyWorkers > 1 ? 's' : ''} active
                    </div>
                )}
                {metrics.queuedTasks > 0 && (
                    <div style={styles.statusQueued}>
                        📋 {metrics.queuedTasks} task{metrics.queuedTasks > 1 ? 's' : ''} queued
                    </div>
                )}
                {metrics.busyWorkers === 0 && metrics.queuedTasks === 0 && (
                    <div style={styles.statusIdle}>
                        ✅ All workers idle
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    toggleButton: {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000
    },
    container: {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        width: '350px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 1000
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e0e0e0'
    },
    title: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a1a',
        margin: '0'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#666',
        padding: '0',
        width: '24px',
        height: '24px'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        padding: '16px'
    },
    metricCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center' as const
    },
    metricBusy: {
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107'
    },
    metricIdle: {
        backgroundColor: '#d4edda',
        border: '1px solid #28a745'
    },
    metricQueued: {
        backgroundColor: '#f8d7da',
        border: '1px solid #dc3545'
    },
    metricCompleted: {
        backgroundColor: '#d1ecf1',
        border: '1px solid #17a2b8'
    },
    metricValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: '4px'
    },
    metricLabel: {
        fontSize: '11px',
        fontWeight: '500',
        color: '#666',
        textTransform: 'uppercase' as const
    },
    section: {
        padding: '0 16px 16px 16px'
    },
    sectionTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '12px'
    },
    workerTypes: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px'
    },
    workerType: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px'
    },
    workerTypeName: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#333'
    },
    workerTypeCount: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#007bff',
        backgroundColor: '#e7f3ff',
        padding: '2px 8px',
        borderRadius: '12px'
    },
    statusBar: {
        padding: '12px 16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px'
    },
    statusBusy: {
        fontSize: '12px',
        color: '#856404',
        fontWeight: '500'
    },
    statusQueued: {
        fontSize: '12px',
        color: '#721c24',
        fontWeight: '500'
    },
    statusIdle: {
        fontSize: '12px',
        color: '#155724',
        fontWeight: '500'
    }
};
