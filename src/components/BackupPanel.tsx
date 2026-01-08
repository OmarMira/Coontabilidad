import React, { useState } from 'react';
import { BackupService } from '../services/BackupService';
import { Download, Upload, Shield, Loader2, AlertTriangle, FileJson, CheckCircle } from 'lucide-react';

export const BackupPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const handleBackup = async () => {
        setLoading(true);
        setStatus('Iniciando protocolo de cifrado (L4)...');
        setError('');
        try {
            // Delay visual para UX
            await new Promise(r => setTimeout(r, 800));

            const json = await BackupService.createBackup();

            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `account-express-backup-${new Date().toISOString().split('T')[0]}.aex`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setStatus('Respaldo .aex cifrado generado y descargado.');
        } catch (e: any) {
            setError('Error al generar respaldo: ' + e.message);
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');

        if (!window.confirm("⚠️ ADVERTENCIA CRÍTICA DE SEGURIDAD ⚠️\n\nEsta acción eliminará TODOS los datos actuales y los reemplazará con el contenido del respaldo.\n\nEsta acción es irreversible.\n\n¿Estás absolutamente seguro de continuar?")) {
            e.target.value = ''; // Reset input
            return;
        }

        setLoading(true);
        setStatus('Verificando firma criptográfica e integridad...');

        try {
            const text = await file.text();

            setStatus('Descifrando base de datos (AES-GCM-256)...');
            await new Promise(r => setTimeout(r, 1000)); // UX

            await BackupService.restoreBackup(text);

            setStatus('Restauración completada. El sistema se reiniciará.');
            // Reload handled by Service, but just in case:
            setTimeout(() => window.location.reload(), 2000);

        } catch (e: any) {
            setError('FALLO CRÍTICO DE RESTAURACIÓN: ' + e.message);
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
                    <h1 className="text-3xl font-black text-white tracking-tight">Centro de Seguridad</h1>
                    <p className="text-slate-400">Gestión de Respaldos Cifrados (.aex)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card Exportar */}
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Exportar Copia Maestra</h3>
                        <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
                            Genera un archivo <code>.aex</code> cifrado militarmente con toda la base de datos y logs de auditoría.
                        </p>

                        <button
                            onClick={handleBackup}
                            disabled={loading}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileJson className="w-5 h-5" />}
                            {loading ? 'Procesando...' : 'Descargar Respaldo .aex'}
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

                        <h3 className="text-xl font-bold text-white mb-2">Restaurar Copia</h3>
                        <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
                            Recupera el sistema desde un archivo <code>.aex</code>. Sobrescribirá los datos actuales.
                        </p>

                        <label className={`w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600 cursor-pointer flex items-center justify-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {loading ? 'Restaurando...' : 'Seleccionar Archivo .aex'}
                            <input
                                type="file"
                                accept=".aex,.json"
                                onChange={handleRestore}
                                className="hidden"
                                disabled={loading}
                            />
                        </label>
                    </div>
                </div>

            </div>

            {/* Status Area */}
            {(status || error) && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${error ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {error ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                    <div>
                        <p className="font-bold text-sm">{error ? 'Error de Operación' : 'Estado del Procesador'}</p>
                        <p className="text-xs opacity-80 mt-1">{error || status}</p>
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                    Iron Core Security Protocol v1.0 • AES-256-GCM Encryption
                </p>
            </div>

        </div>
    );
};
