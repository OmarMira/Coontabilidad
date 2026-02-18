import React, { useState, useEffect } from 'react';
import { S3Provider } from '../../services/cloud/S3Provider';
import { BasicEncryption } from '../../core/security/BasicEncryption';
import { DatabaseService } from '../../database/DatabaseService';
import { useLocale } from '@/i18n/useLocale';

/**
 * CloudBackupSettings Component (Iron Clad Upgrade - Phase 1, Day 3)
 * 
 * UI for configuring cloud backup credentials (S3/MinIO/R2).
 * Features:
 * - Secure credential storage (encrypted in localStorage)
 * - Connection testing
 * - Enable/disable auto-backup
 * - Manual backup trigger
 * - Backup history
 */

interface CloudConfig {
    endpoint: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
    enabled: boolean;
}

export function CloudBackupSettings() {
    const { t } = useLocale();
    const [config, setConfig] = useState<CloudConfig>({
        endpoint: '',
        bucket: '',
        accessKey: '',
        secretKey: '',
        region: 'us-east-1',
        enabled: false
    });

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);

    // Load existing config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const encrypted = localStorage.getItem('cloud_backup_config');
            if (encrypted) {
                // Use decryptCombinedBase64 which handles base64 decode + extraction + decrypt
                const decryptedJson = await BasicEncryption.decryptCombinedBase64(encrypted);
                const loadedConfig = JSON.parse(decryptedJson);
                setConfig(loadedConfig);
            }
        } catch (error) {
            console.error('Error loading cloud config:', error);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            // Validate required fields
            if (!config.endpoint || !config.bucket || !config.accessKey || !config.secretKey) {
                throw new Error(t('security.messages.criticalError')); // Reusing for "fill all fields" or similar
            }

            // Create S3Provider instance
            const s3 = new S3Provider({
                endpoint: config.endpoint,
                bucket: config.bucket,
                accessKey: config.accessKey,
                secretKey: config.secretKey,
                region: config.region
            });

            // Test connection by listing files
            const canConnect = await s3.testConnection();

            if (canConnect) {
                setTestResult({
                    success: true,
                    message: `✅ ${t('settings.testSuccess')}`
                });
            } else {
                throw new Error('No se pudo conectar al servicio');
            }

        } catch (error: any) {
            setTestResult({
                success: false,
                message: `❌ Error: ${error.message}`
            });
        } finally {
            setTesting(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);

        try {
            // Encrypt and save config using combined base64 format
            const configJson = JSON.stringify(config);
            const base64 = await BasicEncryption.encryptCombinedToBase64(
                new TextEncoder().encode(configJson)
            );
            localStorage.setItem('cloud_backup_config', base64);

            // Schedule auto-backups if enabled
            if (config.enabled) {
                await DatabaseService.scheduleAutoBackup();
                alert(`✅ ${t('settings.autoBackupEnabled')}`);
            } else {
                alert(`✅ ${t('settings.configSaved')}`);
            }

        } catch (error: any) {
            alert(`❌ Error al guardar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const createManualBackup = async () => {
        setCreatingBackup(true);

        try {
            // Create backup snapshot
            const snapshot = await DatabaseService.createBackupSnapshot();
            const arrayBuffer = await snapshot.arrayBuffer();

            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup_manual_${timestamp}.aex`;

            // Convert to Base64
            const base64Data = DatabaseService['arrayBufferToBase64'](arrayBuffer);

            // Insert into sync_outbox
            await DatabaseService.executeQuery(`
                INSERT INTO sync_outbox (id, module, operation, payload, status, created_at, updated_at)
                VALUES (?, 'backups', 'UPLOAD', ?, 'pending', datetime('now'), datetime('now'))
            `, [
                crypto.randomUUID(),
                JSON.stringify({
                    filename,
                    data: base64Data,
                    size: arrayBuffer.byteLength,
                    timestamp,
                    manual: true
                })
            ]);

            alert(`✅ ${t('settings.manualBackupSuccess', { filename })}`);

        } catch (error: any) {
            alert(`❌ ${t('settings.forcedBackupError')}: ${error.message}`);
        } finally {
            setCreatingBackup(false);
        }
    };

    return (
        <div className="cloud-backup-settings" style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>☁️ {t('settings.backup')}</h2>
                <p style={styles.subtitle}>
                    {t('settings.subtitleContent')}
                </p>
            </div>

            <div style={styles.form}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        {t('settings.endpointUrl')} *
                        <input
                            style={styles.input}
                            value={config.endpoint}
                            onChange={e => setConfig({ ...config, endpoint: e.target.value })}
                            placeholder="https://s3.amazonaws.com"
                            type="url"
                        />
                    </label>
                    <small style={styles.hint}>
                        AWS S3: https://s3.amazonaws.com<br />
                        MinIO: http://localhost:9000<br />
                        Cloudflare R2: https://[account-id].r2.cloudflarestorage.com
                    </small>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        {t('settings.bucketName')} *
                        <input
                            style={styles.input}
                            value={config.bucket}
                            onChange={e => setConfig({ ...config, bucket: e.target.value })}
                            placeholder="my-accountexpress-backups"
                        />
                    </label>
                    <small style={styles.hint}>
                        {t('settings.bucketName')}
                    </small>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        {t('settings.region')}
                        <input
                            style={styles.input}
                            value={config.region}
                            onChange={e => setConfig({ ...config, region: e.target.value })}
                            placeholder="us-east-1"
                        />
                    </label>
                    <small style={styles.hint}>
                        Región de AWS (ej: us-east-1, eu-west-1)
                    </small>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        {t('settings.accessKey')} *
                        <input
                            style={styles.input}
                            value={config.accessKey}
                            onChange={e => setConfig({ ...config, accessKey: e.target.value })}
                            type={showSecrets ? 'text' : 'password'}
                            placeholder="AKIAIOSFODNN7EXAMPLE"
                        />
                    </label>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        {t('settings.secretKey')} *
                        <input
                            style={styles.input}
                            value={config.secretKey}
                            onChange={e => setConfig({ ...config, secretKey: e.target.value })}
                            type={showSecrets ? 'text' : 'password'}
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        />
                    </label>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={showSecrets}
                            onChange={e => setShowSecrets(e.target.checked)}
                        />
                        <span style={styles.checkboxText}>{t('settings.showCredentials')}</span>
                    </label>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                        />
                        <span style={styles.checkboxText}>
                            {t('settings.autoBackup')} (cada 6 horas)
                        </span>
                    </label>
                </div>

                {testResult && (
                    <div style={{
                        ...styles.testResult,
                        backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
                        color: testResult.success ? '#155724' : '#721c24',
                        borderColor: testResult.success ? '#c3e6cb' : '#f5c6cb'
                    }}>
                        {testResult.message}
                    </div>
                )}

                <div style={styles.buttonGroup}>
                    <button
                        onClick={testConnection}
                        disabled={testing}
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                    >
                        {testing ? `🔍 ${t('settings.testConnection')}...` : `🔍 ${t('settings.testConnection')}`}
                    </button>

                    <button
                        onClick={saveConfig}
                        disabled={saving}
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                        {saving ? `💾 ${t('settings.saveConfig')}...` : `💾 ${t('settings.saveConfig')}`}
                    </button>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.manualBackup}>
                    <h3 style={styles.sectionTitle}>{t('settings.manualBackup')}</h3>
                    <p style={styles.sectionText}>
                        {t('settings.immediateBackup')}
                    </p>
                    <button
                        onClick={createManualBackup}
                        disabled={creatingBackup || !config.enabled}
                        style={{ ...styles.button, ...styles.buttonSuccess }}
                    >
                        {creatingBackup ? `⏳ ${t('settings.forcedBackupStarted')}` : `📦 ${t('settings.backupNow')}`}
                    </button>
                    {!config.enabled && (
                        <small style={styles.warning}>
                            ⚠️ {t('settings.noBackupsHint')}
                        </small>
                    )}
                </div>
            </div>

            <div style={styles.infoBox}>
                <h4 style={styles.infoTitle}>ℹ️ {t('settings.infoTitle')}</h4>
                <ul style={styles.infoList}>
                    {t<string[]>('settings.infoItems').map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '800px',
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
    form: {
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
        marginBottom: '6px'
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        marginTop: '4px',
        boxSizing: 'border-box' as const
    },
    hint: {
        display: 'block',
        fontSize: '12px',
        color: '#888',
        marginTop: '4px',
        lineHeight: '1.4'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer'
    },
    checkboxText: {
        marginLeft: '8px',
        fontSize: '14px',
        color: '#333'
    },
    testResult: {
        padding: '12px 16px',
        borderRadius: '4px',
        border: '1px solid',
        marginBottom: '16px',
        fontSize: '14px'
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap' as const
    },
    button: {
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    buttonPrimary: {
        backgroundColor: '#007bff',
        color: '#fff'
    },
    buttonSecondary: {
        backgroundColor: '#6c757d',
        color: '#fff'
    },
    buttonSuccess: {
        backgroundColor: '#28a745',
        color: '#fff'
    },
    divider: {
        height: '1px',
        backgroundColor: '#e0e0e0',
        margin: '24px 0'
    },
    manualBackup: {
        marginTop: '20px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px'
    },
    sectionText: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '12px'
    },
    warning: {
        display: 'block',
        fontSize: '12px',
        color: '#856404',
        marginTop: '8px'
    },
    infoBox: {
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '20px'
    },
    infoTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#004085',
        marginBottom: '12px'
    },
    infoList: {
        margin: '0',
        paddingLeft: '20px',
        fontSize: '14px',
        color: '#004085',
        lineHeight: '1.6'
    }
};
