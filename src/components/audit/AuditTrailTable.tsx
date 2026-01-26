import React, { useState, useEffect } from 'react';
import { History, Search, Filter, User, Activity, Clock, Database } from 'lucide-react';
import AuditTrailService from '../../services/AuditTrailService';
import { AuditEntry } from '../../types/user.types';
import { useAuth } from '../../contexts/AuthContext';

export const AuditTrailTable: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        userId: 0,
        entityType: '',
        action: ''
    });

    useEffect(() => {
        loadAuditTrail();
    }, [filter]);

    const loadAuditTrail = () => {
        setLoading(true);
        try {
            const data = AuditTrailService.getAuditTrail({
                userId: filter.userId || undefined,
                entityType: filter.entityType || undefined,
                action: filter.action || undefined,
                limit: 100
            });
            setEntries(data);
        } catch (error) {
            console.error('Error loading audit trail:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'UPDATE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'DELETE': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'LOGIN': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'LOGOUT': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Trazabilidad (Audit Trail)</h1>
                        <p className="text-slate-400 text-sm">Historial de cambios y acceso al sistema</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Entidad</label>
                    <select
                        value={filter.entityType}
                        onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todas las Entidades</option>
                        <option value="customer">Clientes</option>
                        <option value="invoice">Facturas</option>
                        <option value="bill">Ventas</option>
                        <option value="product">Productos</option>
                        <option value="account">Plan de Cuentas</option>
                        <option value="journal">Asientos</option>
                        <option value="user">Usuarios</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Acción</label>
                    <select
                        value={filter.action}
                        onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todas las Acciones</option>
                        <option value="CREATE">Creación</option>
                        <option value="UPDATE">Modificación</option>
                        <option value="DELETE">Eliminación</option>
                        <option value="LOGIN">Inicio Sesión</option>
                        <option value="LOGOUT">Cierre Sesión</option>
                    </select>
                </div>
                <div className="md:col-span-2 flex items-end">
                    <button
                        onClick={loadAuditTrail}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
                    >
                        <Search className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha/Hora</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidad</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        Cargando trazabilidad...
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        No se encontraron registros de auditoría
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-indigo-600/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    ID {entry.user_id}
                                                </div>
                                                <span className="text-sm text-white font-medium">User #{entry.user_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getActionColor(entry.action)}`}>
                                                {entry.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Database className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-slate-300 uppercase font-black">{entry.entity_type}</span>
                                                <span className="text-indigo-400 font-mono">#{entry.entity_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate text-[10px] text-slate-500 font-mono italic">
                                                {entry.new_value ? entry.new_value.substring(0, 100) : '-'}
                                                {entry.new_value && entry.new_value.length > 100 && '...'}
                                            </div>
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
