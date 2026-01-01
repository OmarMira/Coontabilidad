import React, { useState, useEffect } from 'react';
import { EnhancedBackupService, ProgressData, RestoreResult } from '../../services/backup/EnhancedBackupService';
import '../../styles/backup-progress.css';

interface BackupRestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedBackupId: string;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose, selectedBackupId }) => {
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
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-blue-500">🛡️</span> Restauración de Seguridad
                    </h2>
                    {!isRestoring && !result && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    )}
                </div>

                <div className="p-8">
                    {!isRestoring && !result ? (
                        <div className="text-center">
                            <div className="text-5xl mb-6">📦</div>
                            <h3 className="text-lg font-semibold text-white mb-2">¿Confirmar restauración?</h3>
                            <p className="text-gray-400 mb-8">
                                Estás a punto de restaurar el backup <span className="text-blue-400 font-mono">#{selectedBackupId}</span>.
                                Los datos actuales serán reemplazados por esta versión anterior.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-lg border border-[#374151] text-gray-300 hover:bg-[#374151] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={startRestore}
                                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    Confirmar y Restaurar
                                </button>
                            </div>
                        </div>
                    ) : result ? (
                        <div className={`completion-card ${result.success ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                            <div className="success-icon-animate">{result.success ? '✅' : '❌'}</div>
                            <h3 className="text-white">{result.success ? '¡Proceso Exitoso!' : 'Error en el Proceso'}</h3>
                            <p className="text-gray-400 mb-4">{result.message}</p>
                            {result.success && (
                                <div className="redirect-hint animate-pulse">
                                    Redirigiendo al dashboard de forma automática en breve...
                                </div>
                            )}
                            {!result.success && (
                                <button
                                    onClick={onClose}
                                    className="mt-4 px-6 py-2 rounded-lg bg-[#374151] text-white hover:bg-[#4b5563]"
                                >
                                    Cerrar y Revisar
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="restore-progress-container">
                            <div className="progress-status-info">
                                <div className="status-label-group">
                                    <span className="status-stage">{progress?.stage || 'INICIANDO'}</span>
                                    <span className="status-message">{progress?.message || 'Iniciando proceso...'}</span>
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
                                <span>Trabajando en la base de datos local de forma segura...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
