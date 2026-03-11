import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  ShieldCheck,
  ArrowRight,
  Layers,
  RefreshCw,
  History,
  Target,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';
import { BankImportService, ImportBatch } from '../../services/banking/BankImportService';
import { toast } from 'react-hot-toast';
import { BatchTransactionClassifier } from './BatchTransactionClassifier';
import { Edit3 } from 'lucide-react';

export const ImportHistory: React.FC = () => {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [showClassifier, setShowClassifier] = useState(false);
  const [classifyingBatchId, setClassifyingBatchId] = useState<number | null>(null);

  const importService = new BankImportService();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await importService.getImportHistory();
      setBatches(history);
    } catch (error) {
      toast.error('Error al sincronizar historial transaccional');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (batchId: number) => {
    try {
      await importService.rollbackImport(batchId);
      toast.success('Inyección revertida y huellas digitales eliminadas');
      setShowRollbackConfirm(false);
      setSelectedBatch(null);
      loadHistory();
    } catch (error) {
      toast.error('Fallo en el protocolo de reversión');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
          <Database className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Sincronizando Archivos...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between border-b border-slate-800 pb-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-600/10 rounded-2.5xl border border-indigo-500/20 text-indigo-500 shadow-xl group">
            <History className="w-8 h-8 group-hover:rotate-180 transition-transform duration-700" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Huellas de Importación</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Transaction Forensic History
            </p>
          </div>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 border border-slate-800 text-indigo-400 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
          Sincronizar
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 text-center group">
          <Database className="w-16 h-16 text-slate-800 mx-auto mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-black text-slate-500 uppercase tracking-[0.2em]">Registro Central Vacío</h3>
        </div>
      ) : (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
              <tr>
                <th className="px-8 py-6">Inyección ID</th>
                <th className="px-8 py-6">Descriptor Fuente</th>
                <th className="px-8 py-6 text-center">Batch Vol.</th>
                <th className="px-8 py-6">Estatus Operativo</th>
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-500 font-mono text-xs font-black shadow-lg">
                        {batch.batchNumber.toString().padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{batch.id.toString().slice(-4)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white uppercase tracking-tighter group-hover/row:text-indigo-400 transition-colors">{batch.fileName}</span>
                      <span className="text-[9px] font-black text-indigo-500/80 uppercase tracking-[0.2em] mt-1.5">{batch.fileFormat} PROTOCOL</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col gap-1">
                      <span className="text-sm font-bold text-white font-mono tracking-tighter">{batch.importedCount} / {batch.totalTransactions}</span>
                      {batch.duplicateCount > 0 && (
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">-{batch.duplicateCount} DUPEL</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{new Date(batch.createdAt).toLocaleDateString()}</span>
                      <span className="text-[9px] font-bold text-slate-600 font-mono mt-1">{new Date(batch.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {batch.status === 'completed' && (
                      <button
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowRollbackConfirm(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Revertir
                      </button>
                    )}
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => {
                          setClassifyingBatchId(batch.id);
                          setShowClassifier(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600/10 border border-amber-500/20 text-amber-500 hover:bg-amber-600 hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Clasificar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rollback Confirmation Modal - High Stakes */}
      {showRollbackConfirm && selectedBatch && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[70] p-6">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] shadow-4xl max-w-lg w-full p-12 relative animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none"></div>

            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-2.5xl flex items-center justify-center mb-8 shadow-xl shadow-rose-950/20">
                <RotateCcw className="w-10 h-10 text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-4">
                Confirmar Reversión
              </h3>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> High Irrevocability Risk
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-[2.2rem] p-8 mb-10 space-y-4 shadow-inner">
              <DetailRow label="Cotejo Transaccional" value={selectedBatch.batchNumber.toString()} />
              <DetailRow label="Descriptor Fuente" value={selectedBatch.fileName} />
              <DetailRow label="Inyecciones Activas" value={selectedBatch.importedCount.toString()} />
            </div>

            <p className="text-[11px] text-slate-500 text-center font-black uppercase tracking-widest leading-relaxed mb-10">
              ESTA OPERACIÓN ELIMINARÁ DE FORMA PERMANENTE TODAS LAS TRANSACCIONES Y ASIENTOS CONTABLES ASOCIADOS A ESTA INYECCIÓN. ¿PROCEDER CON LA REVERSIÓN?
            </p>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => { setShowRollbackConfirm(false); setSelectedBatch(null); }}
                className="px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all"
              >
                ABORTAR
              </button>
              <button
                onClick={() => handleRollback(selectedBatch.id)}
                className="px-10 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-rose-900/40 hover:-translate-y-1 active:scale-95"
              >
                EXTERMINAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showClassifier && classifyingBatchId && (
        <BatchTransactionClassifier
          batchId={classifyingBatchId}
          onClose={() => {
            setShowClassifier(false);
            setClassifyingBatchId(null);
            loadHistory();
          }}
        />
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-black text-white uppercase tracking-tighter">{value}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    completed: { label: 'CERTIFICADO', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
    rolled_back: { label: 'REVERTIDO', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: XCircle },
    pending: { label: 'SINCRO-PEND', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
  };

  const { label, color, bg, border, icon: Icon } = config[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Target };

  return (
    <span className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${bg} ${color} ${border} shadow-lg shadow-black/20`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};
