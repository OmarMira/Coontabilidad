import React, { useState, useEffect } from 'react';
import { X, Search, Users, UserPlus, CheckCircle2 } from 'lucide-react';
import { getCustomers, assignCustomerToARDDocument, Customer } from '../../database/simple-db';

interface ARDAssignCustomerModalProps {
    documentId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ARDAssignCustomerModal: React.FC<ARDAssignCustomerModalProps> = ({ documentId, onClose, onSuccess }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        setCustomers(getCustomers());
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toString().includes(searchTerm)
    );

    const handleAssign = () => {
        if (selectedId) {
            assignCustomerToARDDocument(documentId, selectedId);
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Asignar Cliente</h3>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Sincronización de Entidad ARD</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Escriba el nombre o ID del cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                        {filteredCustomers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedId(c.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedId === c.id ? 'bg-indigo-600 border-indigo-400 border-2 shadow-lg shadow-indigo-900/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedId === c.id ? 'bg-white text-indigo-600' : 'bg-white/10 text-gray-400'}`}>
                                        {c.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <div className={`font-black text-sm uppercase ${selectedId === c.id ? 'text-white' : 'text-gray-200'}`}>{c.name}</div>
                                        <div className="text-[10px] font-bold text-gray-500 tracking-widest">ID: {c.id}</div>
                                    </div>
                                </div>
                                {selectedId === c.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </button>
                        ))}

                        {filteredCustomers.length === 0 && (
                            <div className="py-12 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">
                                No se encontraron clientes coincidentes
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 font-black text-[10px] uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedId}
                        className="flex-2 flex items-center justify-center gap-3 px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:bg-gray-700 disabled:shadow-none"
                    >
                        <UserPlus className="w-4 h-4" /> Finalizar Asignación
                    </button>
                </div>
            </div>
        </div>
    );
};
