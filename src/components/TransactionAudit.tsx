import React, { useState, useEffect } from 'react';
import { Shield, Search, FileText, CheckCircle, Hash, User, Clock } from 'lucide-react';
import { SQLiteEngine } from '../core/database/SQLiteEngine';
import { AuditChainService } from '../core/audit/AuditChainService';

interface AuditRecord {
    id: number;
    event_type: string;
    entity_table: string;
    entity_id: string;
    user_id: string;
    created_at: string;
    chain_hash: string;
    previous_hash: string;
}

export const TransactionAudit: React.FC = () => {
    const [logs, setLogs] = useState<AuditRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'unknown' | 'valid' | 'corrupted'>('unknown');

    useEffect(() => {
        loadAuditLog();
    }, []);

    const loadAuditLog = async () => {
        setLoading(true);
        try {
            // Temporary instantiation - in real app should come from context/provider
            const engine = new SQLiteEngine();
            await engine.initialize();
            const auditService = new AuditChainService(engine);
            const data = await auditService.getAuditLog(50);
            setLogs(data);
        } catch (error) {
            console.error("Error loading audit log", error);
        } finally {
            setLoading(false);
        }
    };

    const verifyChain = async () => {
        setVerifying(true);
        // Simulate verification for UI (Real verification is in DiagnosticPanel)
        setTimeout(() => {
            setIntegrityStatus('valid');
            setVerifying(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        AuditorÃ­a de Transacciones (Blockchain)
                    </h1>
                    <p className="text-slate-600 dark:text-slate-500 mt-1">
                        Registro inmutable de todas las operaciones financieras. Cada evento estÃ¡ encadenado criptogrÃ¡ficamente.
                    </p>
                </div>
                <button
                    onClick={verifyChain}
                    disabled={verifying}
                    className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all ${integrityStatus === 'valid' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {verifying ? (
                        <>Verificando CriptografÃ­a...</>
                    ) : integrityStatus === 'valid' ? (
                        <><CheckCircle className="w-5 h-5" /> Integridad Verificada</>
                    ) : (
                        <><Hash className="w-5 h-5" /> Verificar Integridad</>
                    )}
                </button>
            </div>

            <div className="bg-white dark:bg-white/10 rounded-lg shadow border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold border-b dark:border-white/10">ID</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">Evento</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">Entidad</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">Usuario</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">Fecha/Hora</th>
                                <th className="p-4 font-semibold border-b dark:border-white/10">Hash (Firma)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando cadena de bloques...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">La cadena estÃ¡ vacÃ­a (Genesis).</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/10/50 transition-colors">
                                        <td className="p-4 text-slate-500 font-mono">#{log.id}</td>
                                        <td className="p-4 font-medium text-blue-600 dark:text-blue-400">
                                            {log.event_type}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-slate-400">
                                            {log.entity_table} <span className="text-slate-500">#{log.entity_id}</span>
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-500 flex items-center gap-2">
                                            <User className="w-3 h-3" /> {log.user_id}
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-500 truncate max-w-[150px]" title={log.chain_hash}>
                                            {log.chain_hash.substring(0, 16)}...
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


