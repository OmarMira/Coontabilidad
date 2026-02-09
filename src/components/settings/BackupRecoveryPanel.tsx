import React, { useState, useEffect } from 'react';
import { RecoveryService, BackupMetadata } from '../../services/RecoveryService';

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
            alert(`❌ Error al cargar backups: ${error.message}`);
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
            `⚠️ ADVERTENCIA: Esta operación reemplazará tu base de datos actual.\n\n` +
            `Se creará un backup de seguridad antes de continuar.\n\n` +
            `¿Deseas restaurar desde: ${filename}?`
        );

        if (!confirmed) return;

        setRestoring(true);
        setProgress({ percent: 0, message: 'Iniciando restauración...' });

        try {
            await RecoveryService.restoreFromCloud(filename, {
                skipSafetyBackup: false,
                onProgress: (percent, message) => {
                    setProgress({ percent, message });
                }
            });

            alert('✅ Restauración completada exitosamente!\n\nLa aplicación se recargará.');
            window.location.reload();

        } catch (error: any) {
            alert(`❌ Error durante la restauración:\n\n${error.message}`);
        } finally {
            setRestoring(false);
            setProgress({ percent: 0, message: '' });
        }
    };

    const restoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmed = window.confirm(
            `⚠️ ADVERTENCIA: Esta operación reemplazará tu base de datos actual.\n\n` +
            `Se creará un backup de seguridad antes de continuar.\n\n` +
            `¿Deseas restaurar desde: ${file.name}?`
        );

        if (!confirmed) {
            event.target.value = ''; // Reset file input
            return;
        }

        setRestoring(true);
        setProgress({ percent: 0, message: 'Iniciando restauración...' });

        try {
            await RecoveryService.restoreFromFile(file, {
                skipSafetyBackup: false,
                onProgress: (percent, message) => {
                    setProgress({ percent, message });
                }
            });

            alert('✅ Restauración completada exitosamente!\n\nLa aplicación se recargará.');
            window.location.reload();

        } catch (error: any) {
            alert(`❌ Error durante la restauración:\n\n${error.message}`);
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
        return new Intl.DateTimeFormat('es-ES', {
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
                <h2 style={styles.title}>🔄 Recuperación de Datos</h2>
                <p style={styles.subtitle}>
                    Restaura tu base de datos desde un backup en la nube o archivo local
                </p>
            </div>

            {stats && (
                <div style={styles.statsBox}>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Backups Disponibles:</span>
                        <span style={styles.statValue}>{stats.cloudBackupsAvailable}</span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Último Backup:</span>
                        <span style={styles.statValue}>
                            {stats.latestBackup ? formatDate(stats.latestBackup.created) : 'N/A'}
                        </span>
                    </div>
                    <div style={styles.stat}>
                        <span style={styles.statLabel}>Safety Backup:</span>
                        <span style={styles.statValue}>
                            {stats.hasSafetyBackup ? '✅ Disponible' : '❌ No disponible'}
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
                    <h3 style={styles.sectionTitle}>☁️ Backups en la Nube</h3>
                    <button
                        onClick={loadBackups}
                        disabled={loading || restoring}
                        style={{ ...styles.button, ...styles.buttonSmall }}
                    >
                        {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
                    </button>
                </div>

                {loading ? (
                    <p style={styles.loadingText}>Cargando backups...</p>
                ) : backups.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.emptyText}>
                            📭 No hay backups disponibles en la nube
                        </p>
                        <small style={styles.emptyHint}>
                            Configura el respaldo en la nube en la sección "Configuración"
                        </small>
                    </div>
                ) : (
                    <div style={styles.backupList}>
                        {backups.map((backup, index) => (
                            <div key={backup.filename} style={styles.backupItem}>
                                <div style={styles.backupInfo}>
                                    <div style={styles.backupName}>
                                        {index === 0 && <span style={styles.badge}>Más reciente</span>}
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
                                    🔄 Restaurar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={styles.divider}></div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>💾 Restaurar desde Archivo Local</h3>
                <p style={styles.sectionText}>
                    Selecciona un archivo de backup (.aex) guardado en tu computadora
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
                        📁 Seleccionar Archivo
                    </span>
                </label>
            </div>

            <div style={styles.warningBox}>
                <h4 style={styles.warningTitle}>⚠️ Advertencias Importantes</h4>
                <ul style={styles.warningList}>
                    <li>La restauración reemplazará completamente tu base de datos actual</li>
                    <li>Se creará un backup de seguridad automáticamente antes de restaurar</li>
                    <li>Si la restauración falla, se revertirá al estado anterior automáticamente</li>
                    <li>La aplicación se recargará después de una restauración exitosa</li>
                    <li>Asegúrate de tener una conexión estable durante el proceso</li>
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
