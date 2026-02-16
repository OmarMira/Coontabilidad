import React, { useState } from 'react';
import { BackupService } from '../services/BackupService';
import { BackupLocationSelector } from './backup/BackupLocationSelector';
import { BackupLocation } from '../services/BackupLocationService';
import { Download, Upload, Shield, Loader2, AlertTriangle, FileJson, CheckCircle, FolderOpen } from 'lucide-react';
import { useLocale } from '../i18n/useLocale';

export const BackupPanel: React.FC = () => {
    const { t } = useLocale();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<BackupLocation>('downloads');

    const handleBackup = async () => {
        setShowLocationSelector(true);
    };

    const handleLocationSelected = async (location: BackupLocation, customPath?: string) => {
        setShowLocationSelector(false);
        setLoading(true);
        setStatus(t('backupPanel.startingEncryptionProtocol'));
        setError('');

        try {
            // Delay visual para UX
            await new Promise(r => setTimeout(r, 800));

            setStatus(`${t('backupPanel.savingBackupAt')} ${customPath || location}...`);

            // Usar el nuevo sistema de selección de ubicación
            const success = await BackupService.createBackupWithLocationChoice();

            if (success) {
                setStatus(`${t('backupPanel.backupGeneratedAndSaved')} ${customPath || location}`);
            } else {
                setError(t('backupPanel.userCancelledOrError'));
            }
        } catch (e: any) {
            setError(t('backupPanel.errorGeneratingBackup') + e.message);
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setError('');

        if (!window.confirm(t('backupPanel.criticalSecurityWarning'))) {
            return;
        }

        setLoading(true);
        setStatus(t('backupPanel.waitingForFile'));

        try {
            setStatus(t('backupPanel.verifyingSignature'));

            // Usar el nuevo sistema de selección de archivo
            const success = await BackupService.restoreBackupWithFileChoice();

            if (success) {
                setStatus(t('backupPanel.restoreComplete'));
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setError(t('backupPanel.userCancelledOrError'));
                setLoading(false);
            }

        } catch (e: any) {
            setError(t('backupPanel.criticalRestoreFailure') + e.message);
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                    <Shield className="w-8 h-8 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">{t('backupPanel.securityCenter')}</h1>
                    <p className="text-slate-400">{t('backupPanel.subtitle')}</p>
                </div>
            </div>

            {/* Selector de Ubicación Modal */}
            {showLocationSelector && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black tracking-tight text-white">{t('backupPanel.selectBackupLocation')}</h2>
                            <button
                                onClick={() => setShowLocationSelector(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <BackupLocationSelector
                            mode="save"
                            onLocationSelected={handleLocationSelected}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card Exportar */}
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-black tracking-tight text-white mb-2">{t('backupPanel.exportMasterCopy')}</h3>
                        <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
                            {t('backupPanel.exportDesc')}
                        </p>

                        <button
                            onClick={handleBackup}
                            disabled={loading}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderOpen className="w-5 h-5" />}
                            {loading ? t('backupPanel.processing') : t('backupPanel.chooseLocationAndSave')}
                        </button>
                    </div>
                </div>

                {/* Card Importar */}
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-black tracking-tight text-white mb-2">{t('backupPanel.restoreCopy')}</h3>
                        <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
                            {t('backupPanel.restoreDesc')}
                        </p>

                        <button
                            onClick={handleRestore}
                            disabled={loading}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {loading ? t('backupPanel.restoring') : t('backupPanel.chooseFileAndRestore')}
                        </button>
                    </div>
                </div>

            </div>

            {/* Status Area */}
            {(status || error) && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${error ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {error ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                    <div>
                        <p className="font-bold text-sm">{error ? t('backupPanel.operationError') : t('backupPanel.processorStatus')}</p>
                        <p className="text-xs opacity-80 mt-1">{error || status}</p>
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                    {t('backupPanelStrings.securityFooter')}
                </p>
            </div>

        </div>
    );
};
