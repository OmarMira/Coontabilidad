import React, { useState, useEffect } from 'react';
import { EnhancedBackupService, ProgressData, RestoreResult } from '../../services/backup/EnhancedBackupService';
import '../../styles/backup-progress.css';
import { useLocale } from '../../i18n/useLocale';

interface BackupRestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedBackupId: string;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose, selectedBackupId }) => {
    const { t } = useLocale();
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [result, setResult] = useState<RestoreResult | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const handleProgress = (data: ProgressData) => {
            setProgress(data);
        };

        const handleComplete = (res: RestoreResult) => {
            setResult(res);
            setIsRestoring(false);

            // Si fue exitoso, el servicio ya programó la redirección, 
            // pero podríamos cerrar el modal aquí después de un tiempo
            if (res.success) {
                setTimeout(() => {
                    onClose();
                }, 5000);
            }
        };

        EnhancedBackupService.eventEmitter.on('backup-progress', handleProgress);
        EnhancedBackupService.eventEmitter.on('backup-complete', handleComplete);

        return () => {
            EnhancedBackupService.eventEmitter.off('backup-progress', handleProgress);
            EnhancedBackupService.eventEmitter.off('backup-complete', handleComplete);
        };
    }, [isOpen, onClose]);

    const startRestore = async () => {
        setIsRestoring(true);
        setResult(null);
        setProgress(null);
        try {
            await EnhancedBackupService.restoreBackup(selectedBackupId);
        } catch (err: any) {
            console.error('Error in restoration trigger:', err);
            setIsRestoring(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1f2937] border border-[#374151] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-[#374151] flex justify-between items-center bg-[#111827]">
                    <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        <span className="text-blue-500">🛡️</span> {t('backup.modal.title')}
                    </h2>
                    {!isRestoring && !result && (
                        <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl">&times;</button>
                    )}
                </div>

                <div className="p-8">
                    {!isRestoring && !result ? (
                        <div className="text-center">
                            <div className="text-5xl mb-6">📦</div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t('backup.modal.confirmTitle')}</h3>
                            <p className="text-slate-500 mb-8">
                                {t('backup.modal.confirmMessage', { id: selectedBackupId })}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-lg border border-[#374151] text-slate-400 hover:bg-[#374151] transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={startRestore}
                                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    {t('backup.modal.confirmButton')}
                                </button>
                            </div>
                        </div>
                    ) : result ? (
                        <div className={`completion-card ${result.success ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                            <div className="success-icon-animate">{result.success ? '✅' : '❌'}</div>
                            <h3 className="text-white">{result.success ? t('backup.modal.successTitle') : t('backup.modal.errorTitle')}</h3>
                            <p className="text-slate-500 mb-4">{result.message}</p>
                            {result.success && (
                                <div className="redirect-hint animate-pulse">
                                    {t('backup.modal.redirecting')}
                                </div>
                            )}
                            {!result.success && (
                                <button
                                    onClick={onClose}
                                    className="mt-4 px-6 py-2 rounded-lg bg-[#374151] text-white hover:bg-[#4b5563]"
                                >
                                    {t('backup.modal.closeAndReview')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="restore-progress-container">
                            <div className="progress-status-info">
                                <div className="status-label-group">
                                    <span className="status-stage">{progress?.stage || 'INICIANDO'}</span>
                                    <span className="status-message">{progress?.message || t('backup.modal.starting')}</span>
                                </div>
                                <div className="percentage-display">
                                    {progress?.percentage || 0}%
                                </div>
                            </div>

                            <div className="progress-bar-wrapper">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${progress?.percentage || 0}%` }}
                                ></div>
                            </div>

                            <div className="loading-spinner-box">
                                <div className="backup-spinner"></div>
                                <span>{t('backup.modal.databaseWorking')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
