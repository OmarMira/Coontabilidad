import React, { useState, useEffect } from 'react';
import { Shield, Activity, RefreshCw, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { ForensicSentinel } from '../../services/ForensicSentinel';
import { logger } from '../../core/logging/SystemLogger';

export const ForensicSentinelDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [tamperedRecords, setTamperedRecords] = useState<any[]>([]);

    const refreshStats = async () => {
        setLoading(true);
        try {
            const result = await ForensicSentinel.getHealthStats();
            setStats(result);

            const auditResult = await ForensicSentinel.fullIntegrityAudit();
            setTamperedRecords(auditResult.tamperedRecords);
        } catch (error) {
            logger.error('SentinelUI', 'refresh_failed', 'Failed to refresh forensic stats');
        } finally {
            setLoading(false);
        }
    };

    const handleRepair = async (record: any) => {
        if (!confirm(`¿Desea intentar la autocuración (Forensic Replay) para el registro ${record.recordId} en ${record.tableName}?`)) return;

        try {
            const success = await ForensicSentinel.repairRecord(record.tableName, record.recordId);
            if (success) {
                alert('Registro reparado exitosamente desde la verdad forense.');
                refreshStats();
            } else {
                alert('No se pudo reparar el registro. Consulte los logs del sistema.');
            }
        } catch (error) {
            alert('Error crítico durante la reparación.');
        }
    };

    useEffect(() => {
        refreshStats();
    }, []);

    if (!stats && loading) return <div className="text-blue-400 animate-pulse">Iniciando Telemetría NASA...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Card */}
                <div className={`p-4 rounded-2xl border ${stats?.status === 'HEALTHY' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'} shadow-lg`}>
                    <div className="flex items-center gap-3 mb-2">
                        {stats?.status === 'HEALTHY' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                        <span className="text-xs font-black uppercase tracking-widest">Estado Sistema</span>
                    </div>
                    <div className="text-2xl font-black">{stats?.status || 'UNKNOWN'}</div>
                </div>

                {/* Integrity Score */}
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Integridad IA</span>
                    </div>
                    <div className="text-2xl font-black">{stats?.integrityScore || 0}%</div>
                </div>

                {/* Forensic Events */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-slate-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Eventos Sellados</span>
                    </div>
                    <div className="text-2xl font-black">{stats?.forensicEvents || 0}</div>
                </div>

                {/* Uptime/Clock */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-slate-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Reloj Lógico</span>
                    </div>
                    <div className="text-2xl font-black">{stats?.lastClock || 0}</div>
                </div>
            </div>

            {/* Tampered Records Table */}
            {tamperedRecords.length > 0 && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-rose-300 font-black uppercase tracking-tighter">
                            <AlertCircle className="w-5 h-5" />
                            Violaciones de Integridad Detectadas
                        </div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black">
                            <tr>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Tabla</th>
                                <th className="p-4">ID Registro</th>
                                <th className="p-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-500/10">
                            {tamperedRecords.map((r, i) => (
                                <tr key={i} className="hover:bg-rose-500/5 transition-colors">
                                    <td className="p-4 text-rose-400 font-black uppercase tracking-tight">{r.type}</td>
                                    <td className="p-4 text-slate-300">{r.tableName || 'Audit Chain'}</td>
                                    <td className="p-4 text-slate-300 font-mono">#{r.recordId}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleRepair(r)}
                                            className="px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-lg hover:bg-rose-600 transition-all flex items-center gap-1 ml-auto uppercase tracking-widest"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            AUTOCURAR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                onClick={refreshStats}
                disabled={loading}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
            >
                <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-all duration-700 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Ejecutando Auditoría Profunda...' : 'Ejecutar Deep Forensic Audit'}
            </button>
        </div>
    );
};
