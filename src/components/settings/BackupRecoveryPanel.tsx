import React, { useState, useEffect } from 'react';
import { RecoveryService, BackupMetadata } from '../../services/RecoveryService';
import { useLocale } from '@/i18n/useLocale';

/**
 * BackupRecoveryPanel Component (Iron Clad Upgrade - Phase 1, Day 6)
 * 
 * UI for restoring database from cloud or local backups.
 * Features:
 * - List available cloud backups
 * - Restore from cloud with progress
 * - Restore from local file
 * - Safety backup before restoration
 * - Recovery statistics
 */

export function BackupRecoveryPanel() {
    const { t, language } = useLocale();
    const [backups, setBackups] = useState<BackupMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, message: '' });
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadBackups();
        loadStats();
    }, []);

    const loadBackups = async () => {
        setLoading(true);
        try {
            const availableBackups = await RecoveryService.listAvailableBackups();
            setBackups(availableBackups);
        } catch (error: any) {
            console.error('Error loading backups:', error);
            alert(`❌ ${t('settings.restoreError')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const recoveryStats = await RecoveryService.getRecoveryStats();
            setStats(recoveryStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const restoreFromCloud = async (filename: string) => {
        const confirmed = window.confirm(
            `⚠️ ${t('settings.securityWarning').toUpperCase()}: ${t('settings.overwriteWarning')}\n\n` +
            `${t('settings.backupPrompt')}\n\n` +
            `¿${t('settings.restoreAction')} ${filename}?`
        );

        if (!confirmed) return;

        setRestoring(true);
        setProgress({ percent: 0, message: t('settings.restoringHint') });

        try {
            await RecoveryService.restoreFromCloud(filename, {
                skipSafetyBackup: false,
                onProgress: (percent, message) => {
                    setProgress({ percent, message });
                }
            });

            alert(`✅ ${t('settings.restoreSuccess')}!\n\nLa aplicación se recargará.`);
            window.location.reload();

        } catch (error: any) {
            alert(`❌ ${t('settings.restoreError')}:\n\n${error.message}`);
        } finally {
            setRestoring(false);
            setProgress({ percent: 0, message: '' });
        }
    };

    const restoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmed = window.confirm(
            `⚠️ ${t('settings.securityWarning').toUpperCase()}: ${t('settings.overwriteWarning')}\n\n` +
            `${t('settings.backupPrompt')}\n\n` +
            `¿${t('settings.restoreAction')} ${file.name}?`
        );

        if (!confirmed) {
            event.target.value = ''; // Reset file input
            return;
        }

        setRestoring(true);
        setProgress({ percent: 0, message: t('settings.restoringHint') });

        try {
            await RecoveryService.restoreFromFile(file, {
                skipSafetyBackup: false,
                onProgress: (percent, message) => {
                    setProgress({ percent, message });
                }
            });

            alert(`✅ ${t('settings.restoreSuccess')}!\n\nLa aplicación se recargará.`);
            window.location.reload();

        } catch (error: any) {
            alert(`❌ ${t('settings.restoreError')}:\n\n${error.message}`);
        } finally {
            setRestoring(false);
            setProgress({ percent: 0, message: '' });
            event.target.value = ''; // Reset file input
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>🔄 {t('settings.recovery')}</h2>
                <p style={styles.subtitle}>
                    {t('settings.subtitle')}
                </p>
            </div>

            {stats && (
                <div style={styles.statsBox}>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>{t('settings.availableBackups')}</span>
                        <span style={styles.statValue}>{stats.cloudBackupsAvailable}</span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>{t('settings.lastSync')}:</span>
                        <span style={styles.statValue}>
                            {stats.latestBackup ? formatDate(stats.latestBackup.created) : 'N/A'}
                        </span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>{t('settings.hasSafetyBackup')}</span>
                        <span style={styles.statValue}>
                            {stats.hasSafetyBackup ? `✅ ${t('settings.available')}` : `❌ ${t('settings.notAvailable')}`}
                        </span>
                    </div>
                </div>
            )}

            {restoring && (
                <div style={styles.progressBox}>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress.percent}%` }}></div>
                    </div>
                    <p style={styles.progressText}>
                        {progress.message} ({progress.percent}%)
                    </p>
                </div>
            )}

            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>☁️ {t('settings.backup')}</h3>
                    <button
                        onClick={loadBackups}
                        disabled={loading || restoring}
                        style={{ ...styles.button, ...styles.buttonSmall }}
                    >
                        {loading ? `🔄 ${t('settings.update')}...` : `🔄 ${t('settings.update')}`}
                    </button>
                </div>

                {loading ? (
                    <p style={styles.loadingText}>{t('settings.loadingBackups')}</p>
                ) : backups.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.emptyText}>
                            📭 {t('settings.noBackups')}
                        </p>
                        <small style={styles.emptyHint}>
                            {t('settings.noBackupsHint')}
                        </small>
                    </div>
                ) : (
                    <div style={styles.backupList}>
                        {backups.map((backup, index) => (
                            <div key={backup.filename} style={styles.backupItem}>
                                <div style={styles.backupInfo}>
                                    <div style={styles.backupName}>
                                        {index === 0 && <span style={styles.badge}>{t('settings.mostRecent')}</span>}
                                        📦 {backup.filename}
                                    </div>
                                    <div style={styles.backupMeta}>
                                        <span>{formatDate(backup.created)}</span>
                                        <span>•</span>
                                        <span>{formatFileSize(backup.size)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => restoreFromCloud(backup.filename)}
                                    disabled={restoring}
                                    style={{ ...styles.button, ...styles.buttonPrimary }}
                                >
                                    🔄 {t('settings.restoreAction')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={styles.divider}></div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>💾 {t('settings.restoreLocal')}</h3>
                <p style={styles.sectionText}>
                    {t('settings.loadBackup')}
                </p>
                <label style={styles.fileInputLabel}>
                    <input
                        type="file"
                        accept=".aex"
                        onChange={restoreFromFile}
                        disabled={restoring}
                        style={styles.fileInput}
                    />
                    <span style={{ ...styles.button, ...styles.buttonSecondary }}>
                        📁 {t('settings.selectFile')}
                    </span>
                </label>
            </div>

            <div style={styles.warningBox}>
                <h4 style={styles.warningTitle}>⚠️ {t('settings.securityWarning')}</h4>
                <ul style={styles.warningList}>
                    {t<string[]>('settings.warningItems').map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
        marginBottom: '30px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px'
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        margin: '0'
    },
    statsBox: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
    },
    stat: {
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
    },
    statLabel: {
        display: 'block',
        fontSize: '12px',
        color: '#666',
        marginBottom: '4px'
    },
    statValue: {
        display: 'block',
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a1a'
    },
    progressBox: {
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
    },
    progressBar: {
        width: '100%',
        height: '24px',
        backgroundColor: '#e0e0e0',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '8px'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007bff',
        transition: 'width 0.3s ease'
    },
    progressText: {
        fontSize: '14px',
        color: '#856404',
        margin: '0',
        textAlign: 'center' as const
    },
    section: {
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a1a1a',
        margin: '0'
    },
    sectionText: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '16px'
    },
    loadingText: {
        fontSize: '14px',
        color: '#666',
        textAlign: 'center' as const,
        padding: '20px'
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '40px 20px'
    },
    emptyText: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '8px'
    },
    emptyHint: {
        fontSize: '14px',
        color: '#999'
    },
    backupList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px'
    },
    backupItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '6px'
    },
    backupInfo: {
        flex: 1
    },
    backupName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#1a1a1a',
        marginBottom: '4px'
    },
    backupMeta: {
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        gap: '8px'
    },
    badge: {
        display: 'inline-block',
        backgroundColor: '#28a745',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '12px',
        marginRight: '8px'
    },
    button: {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const
    },
    buttonPrimary: {
        backgroundColor: '#007bff',
        color: '#fff'
    },
    buttonSecondary: {
        backgroundColor: '#6c757d',
        color: '#fff'
    },
    buttonSmall: {
        padding: '6px 12px',
        fontSize: '12px'
    },
    divider: {
        height: '1px',
        backgroundColor: '#e0e0e0',
        margin: '24px 0'
    },
    fileInputLabel: {
        display: 'inline-block',
        cursor: 'pointer'
    },
    fileInput: {
        display: 'none'
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '20px'
    },
    warningTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#856404',
        marginBottom: '12px'
    },
    warningList: {
        margin: '0',
        paddingLeft: '20px',
        fontSize: '14px',
        color: '#856404',
        lineHeight: '1.6'
    }
};
