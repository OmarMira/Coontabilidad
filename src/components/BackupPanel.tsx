import React, { useState, useEffect } from 'react';
import { BackupService } from '../services/backup/BackupService';
import { BackupLocationSelector } from './backup/BackupLocationSelector';
import { BackupLocation } from '../services/BackupLocationService';
import { PersistentStorageService } from '../services/PersistentStorageService';
import { Download, Upload, Server, Search, AlertTriangle, RefreshCw, X, ShieldAlert, Shield, Loader2, FolderOpen, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocale } from '../i18n/useLocale';
import { BankImportService } from '../services/banking/BankImportService';
import { DatabaseService } from '../database/DatabaseService'; // Added this import

export const TestingTools = () => {
    const [stats, setStats] = useState({ total: 0, duplicates: 0 });
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const importService = new BankImportService();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const currentStats = await importService.getHistoryStats();
            setStats(currentStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const checkDuplicates = async () => {
        setLoading(true);
        try {
            const currentStats = await importService.getHistoryStats();
            setStats(currentStats);
            if (currentStats.duplicates > 0) {
                toast.error(`ATENCIÓN: Se han detectado ${currentStats.duplicates} grupos de registros duplicados.`);
            } else {
                toast.success("CONTROL EXITOSO: No se detectaron transacciones duplicadas.");
            }
        } catch (error) {
            toast.error("Error al controlar duplicados.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmClear = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        try {
            await importService.clearImportHistory();
            await loadStats();
            toast.success("Historial de transacciones eliminado exitosamente.");
        } catch (error) {
            toast.error("Error al eliminar el historial.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-slate-950 border border-slate-800 rounded-2.5xl p-6 mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldAlert className="w-5 h-5 text-blue-500" />
                    <h3 className="text-white font-black uppercase text-xs tracking-widest">Herramientas de Control Bancario</h3>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={checkDuplicates}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-blue-500/50 text-blue-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Controlar Duplicados
                    </button>

                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40 text-rose-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Limpiar Historial de Transacciones ({stats.total})
                    </button>
                </div>
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
                    <div className="bg-slate-900 border-2 border-rose-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-white text-xl font-black text-center mb-4 uppercase tracking-tighter">
                            Aviso Crítico
                        </h3>
                        <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
                            Vas a eliminar de forma permanente TODOS los registros importados ({stats.total} transacciones). Esta acción no se puede deshacer. ¿Proceder con purga?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmClear}
                                className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-500"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const BackupPanel: React.FC = () => {
    const { t } = useLocale();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<BackupLocation>('downloads');
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem('auto_backup_enabled') === 'true');

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
            await new Promise(r => window.setTimeout(r, 800));

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
        setStatus('');

        if (!window.confirm('⚠️ ADVERTENCIA: Esta operación reemplazará TODOS los datos actuales con el contenido del archivo de respaldo seleccionado. Esta acción no se puede deshacer. ¿Desea continuar?')) {
            return;
        }

        setLoading(true);
        setStatus(t('backupPanel.waitingForFile'));

        try {
            setStatus(t('backupPanel.verifyingSignature'));

            const success = await BackupService.restoreBackupWithFileChoice();

            if (success) {
                setStatus(t('backupPanel.restoreComplete'));
                window.setTimeout(() => window.location.reload(), 2000);
            } else {
                // null retornado = usuario canceló el picker, no es un error real
                setError('');
                setStatus('');
            }
        } catch (e: any) {
            setError(t('backupPanel.criticalRestoreFailure') + (e?.message ?? 'Error desconocido'));
            setStatus('');
        } finally {
            // SIEMPRE liberar el loading, sin importar qué pasó
            setLoading(false);
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

            {/* Persistent Storage Request Button - Added Phase 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Almacenamiento Permanente</h3>
                        <p className="text-xs text-slate-500">Garantiza que el navegador no borre tus datos locales.</p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        const granted = await PersistentStorageService.requestPersistence();
                        if (granted) {
                            alert("✅ Persistencia concedida. Tus datos están protegidos.");
                        } else {
                            alert("❌ Persistencia denegada — ve a chrome://settings/content y permite para localhost:3000");
                        }
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20"
                >
                    Activar Almacenamiento Persistente
                </button>
            </div>

            {/* Automatic Backups Config - Added Sanitation Step 4 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Respaldo Automático Local</h3>
                            <p className="text-xs text-slate-500">Descarga una copia .sqlite cada 5 minutos.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoBackupEnabled}
                            onChange={(e) => {
                                const enabled = e.target.checked;
                                setAutoBackupEnabled(enabled);
                                if (enabled) {
                                    localStorage.setItem('auto_backup_enabled', 'true');
                                    toast.success("Backups automáticos activados");
                                } else {
                                    localStorage.removeItem('auto_backup_enabled');
                                    toast.success("Backups automáticos desactivados");
                                }
                            }}
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={async () => {
                            await DatabaseService.backupDB(true);
                            toast.success("Backup manual iniciado");
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-700"
                    >
                        <Download className="w-4 h-4" />
                        Backup Manual Ahora
                    </button>
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

            {/* Temporary Testing Tools */}
            <TestingTools />

            {/* Danger Zone - Reset Nuclear */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8 mt-12">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert className="w-6 h-6 text-rose-500" />
                    <h3 className="text-rose-500 font-black uppercase text-sm tracking-widest">Zona de Peligro</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6">Esta sección contiene herramientas altamente destructivas. Úsalas solo bajo supervisión técnica o en situaciones de emergencia total.</p>
                
                <button
                    onClick={async () => {
                        const c1 = window.confirm('¿Seguro? PERDERÁS TODOS LOS DATOS.');
                        if (!c1) return;
                        const c2 = window.confirm('Esta acción NO se puede deshacer. ¿Continuar?');
                        if (!c2) return;
                        const typed = window.prompt('Escribe BORRAR para confirmar:');
                        if (typed !== 'BORRAR') return;
                        window.location.href = '/?nuclear=confirm';
                    }}
                    className="flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-900/20"
                >
                    <ShieldAlert className="w-5 h-5" />
                    Reiniciar Sistema (Nuclear Reset)
                </button>
            </div>

            <div className="text-center pt-8">
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                    {t('backupPanelStrings.securityFooter')}
                </p>
            </div>

        </div>
    );
};
