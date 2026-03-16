import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Target,
  ArrowRight,
  AlertTriangle,
  Check,
  Building2
} from 'lucide-react';
import { BankImportService, ImportTransaction } from '../../services/banking/BankImportService';
import type { BankAccount } from '@/database/modules/db-types';
import { db } from '@/database/modules/db-core';
import { createBankAccount, getBankAccounts } from '@/database/modules/db-bank-accounts';
import { toast } from 'react-hot-toast';
import { BankAccountForm } from '../BankAccountForm';

interface BankImportWizardProps {
  onClose?: () => void;
  onComplete: () => void;
  accounts?: BankAccount[];
  selectedAccountId?: number;
}

type Step = 'upload' | 'preview' | 'edit' | 'confirm';

export const BankImportWizard: React.FC<BankImportWizardProps> = ({ onClose = () => { }, onComplete, accounts, selectedAccountId }) => {
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<ImportTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Cuenta resuelta: puede venir del prop externo o autodetectarse del PDF
  const [resolvedAccountId, setResolvedAccountId] = useState<number | null>(selectedAccountId ?? null);
  const [detectedAccountNumber, setDetectedAccountNumber] = useState<string | null>(null);
  const [accountMatchStatus, setAccountMatchStatus] = useState<'matched' | 'not_found' | null>(null);
  const [matchedAccountLabel, setMatchedAccountLabel] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [detectedBankName, setDetectedBankName] = useState<string | null>(null);
  const [internalAccounts, setInternalAccounts] = useState<BankAccount[]>(accounts || []);

  // Cargar cuentas si no vienen por props
  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      const loaded = getBankAccounts();
      setInternalAccounts(loaded);
    } else {
      setInternalAccounts(accounts);
    }
  }, [accounts]);

  // Si el padre actualiza selectedAccountId (ej. el usuario cambia la cuenta en el selector externo)
  useEffect(() => {
    if (selectedAccountId) setResolvedAccountId(selectedAccountId);
  }, [selectedAccountId]);

  const importService = new BankImportService();

  /**
   * Intenta auto-matchear el número de cuenta extraído del PDF
   * contra las cuentas existentes en bank_accounts.
   * Busca por sufijo (los últimos 4 dígitos del número detectado).
   */
  const autoMatchAccount = (rawAccountNumber: string) => {
    try {
      // Extraer los últimos 4 dígitos del número detectado
      const digits = rawAccountNumber.replace(/\D/g, '');
      const suffix = digits.slice(-4);
      if (!suffix) return;

      setDetectedAccountNumber(rawAccountNumber);

      const result = db.exec(
        `SELECT id, account_name, account_number FROM bank_accounts
         WHERE replace(account_number,'*','') LIKE '%${suffix}'
            OR replace(account_number,' ','') LIKE '%${suffix}'
         LIMIT 1`
      );

      if (result.length > 0 && result[0].values.length > 0) {
        const [id, name, number] = result[0].values[0] as [number, string, string];
        setResolvedAccountId(id);
        setAccountMatchStatus('matched');
        setMatchedAccountLabel(`${name} (...${suffix})`);
        toast.success(`Cuenta bancaria autodetectada: ...${suffix}`);
      } else {
        setAccountMatchStatus('not_found');
        setMatchedAccountLabel(null);
      }
    } catch (e) {
      console.warn('[BankImportWizard] autoMatchAccount error:', e);
    }
  };

  const handleFileSelect = (selectedFiles: File | File[] | FileList) => {
    const newFiles = selectedFiles instanceof File
      ? [selectedFiles]
      : Array.from(selectedFiles);

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleProcessFile = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let cumulativeTransactions: ImportTransaction[] = [];
      let lastBatchId: number | null = null;
      let accountDetected = false;

      for (const file of files) {
        const result = await importService.createImportBatch(file, resolvedAccountId ?? 0, 1);
        cumulativeTransactions = [...cumulativeTransactions, ...result.transactions];
        lastBatchId = result.batchId;

        // Auto-match cuenta si el PDF reportó un número de cuenta
        if (result.detectedAccountNumber && !accountDetected) {
          autoMatchAccount(result.detectedAccountNumber);
          // Intentar adivinar banco por nombre de archivo si no hay metadatos claros
          if (file.name.toLowerCase().includes('bofa') || file.name.toLowerCase().includes('estmt')) {
            setDetectedBankName('Bank of America');
          } else if (file.name.toLowerCase().includes('chase')) {
            setDetectedBankName('Chase');
          }
          accountDetected = true;
        }
      }

      setBatchId(lastBatchId); // Note: finalizeImport currently only takes one batchId. This is a limitation.
      setTransactions(cumulativeTransactions);

      setStep('preview');
      toast.success(`${files.length} archivo(s) analizado(s) correctamente`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeImport = async () => {
    console.log('handleFinalizeImport called', { resolvedAccountId, batchId, selectedAccountId });
    if (!batchId) return;

    // CAMBIO 5: Validar resolvedAccountId y mostrar error claro.
    // resolvedAccountId ya se actualiza en autoMatchAccount(result.detectedAccountNumber)
    if (!resolvedAccountId || resolvedAccountId <= 0) {
      const msg = detectedAccountNumber
        ? `No se encontró la cuenta terminada en ${detectedAccountNumber.replace(/\D/g, '').slice(-4)} en el sistema. Seleccioná una cuenta manualmente.`
        : 'Seleccioná una cuenta bancaria antes de importar';
      toast.error(msg);
      setError(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await importService.finalizeImport(batchId, 1, Number(resolvedAccountId));

      if (result.imported === 0 && result.skipped > 0) {
        toast.error('No se importó nada: todas las transacciones ya existen.');
        return;
      }

      if (result.skipped > 0) {
        toast.success(`${result.imported} transacciones importadas, ${result.skipped} duplicadas salteadas`);
      } else {
        toast.success(`${result.imported} transacciones importadas correctamente`);
      }

      onComplete();
    } catch (err) {
      console.error('Finalize error:', err);
      setError((err as Error).message);
      toast.error('Error al inyectar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[60] p-6 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-[4rem] shadow-4xl w-full max-w-6xl my-auto overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-700">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        <header className="flex items-center justify-between p-12 border-b border-slate-800 relative z-10 bg-slate-900/50">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 text-blue-500 shadow-xl group">
              <Cpu className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Protocolo de Importación</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Neural Ledger Interface v2.4
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg hover:border-slate-700">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="px-12 py-8 border-b border-slate-800 flex items-center justify-center bg-slate-950/30">
          <div className="flex items-center gap-10">
            <StepIndicator active={step === 'upload'} completed={step !== 'upload'} step="01" label="CARGA" icon={Upload} />
            <div className={`w-32 h-px ${step !== 'upload' ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`}></div>
            <StepIndicator active={step !== 'upload'} completed={false} step="02" label="VERIFICACIÓN" icon={Target} />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-12 relative z-10">
          {step === 'upload' ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-[3rem] p-24 text-center transition-all duration-500 group relative overflow-hidden ${dragActive ? 'border-blue-500 bg-blue-500/5 scale-[0.99]' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
              >
                <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-700 ${dragActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
                <div className="relative z-10">
                  <div className={`w-24 h-24 bg-slate-950 rounded-2.5xl border border-slate-800 flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-500 ${dragActive ? 'scale-110 border-blue-500/50' : 'group-hover:scale-105'}`}>
                    <Upload className={`w-10 h-10 ${dragActive ? 'text-blue-500 animate-bounce' : 'text-slate-600'}`} />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">Inyección de Archivo Fuente</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto mb-10">
                    ARRASTRA TU BASE DE DATOS AQUÍ O HAZ CLIC PARA SELECCIONAR. SOPORTA <span className="text-blue-400">CSV / OFX / QFX / PDF</span>. HASTA 10MB POR CICLO.
                  </p>

                  <input
                    type="file"
                    accept=".csv,.ofx,.qfx,.pdf"
                    multiple
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer transition-all shadow-3xl shadow-blue-900/50 hover:-translate-y-1"
                  >
                    Localizar Archivo
                  </label>
                </div>
              </div>

              {files.length > 0 && files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="bg-slate-950 border-2 border-slate-800 rounded-[2rem] p-8 flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4 duration-500 mb-4 last:mb-0">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tighter">{file.name}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        Capacidad: {(file.size / 1024 / 1024).toFixed(2)} MB / Protocolo: {file.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                    className="p-3 bg-slate-900 border border-slate-800 text-slate-600 hover:text-rose-500 hover:border-rose-500/50 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {error && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-[2rem] p-8 flex items-center gap-6 animate-in shake duration-500">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-loose">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-6 pt-10 border-t border-slate-800">
                <button onClick={onClose} className="px-10 py-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-800">
                  Abortar Misión
                </button>
                <button
                  onClick={handleProcessFile}
                  disabled={files.length === 0 || loading}
                  className="px-14 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-blue-900/50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-4"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Zap className="w-4 h-4 fill-current" />}
                  {loading ? 'CALIBRANDO...' : 'INICIAR PROCESAMIENTO'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
              <div className="grid grid-cols-3 gap-8">
                <StatHighlight title="Registro Total" value={transactions.length.toString()} icon={Layers} color="blue" />
                <StatHighlight title="Alertas de Duplicidad" value={transactions.filter(t => t.isDuplicate).length.toString()} icon={AlertTriangle} color="rose" />
                <StatHighlight title="Nivel de Confianza" value={`${(transactions.reduce((acc, t) => acc + t.confidenceScore, 0) / transactions.length || 0).toFixed(0)}%`} icon={Target} color="emerald" />
              </div>

              {/* Banner de cuenta autodetectada / advertencia */}
              {accountMatchStatus === 'matched' && matchedAccountLabel && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-6 flex items-center gap-5 animate-in slide-in-from-top-4 duration-500">
                  <div className="w-11 h-11 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    ✓ Cuenta autodetectada: <span className="text-emerald-300">{matchedAccountLabel}</span>
                  </p>
                </div>
              )}

              {/* Selector Manual si no hay match */}
              {(!resolvedAccountId || accountMatchStatus === 'not_found') && (
                <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] p-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-4 text-amber-500 mb-4">
                    <Building2 className="w-6 h-6" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Vincular Cuenta Bancaria</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <select
                      value={resolvedAccountId || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setResolvedAccountId(val);
                        if (val > 0) {
                          setAccountMatchStatus('matched');
                          const acc = internalAccounts?.find(a => a.id === val);
                          setMatchedAccountLabel(acc ? acc.account_name : 'Cuenta Seleccionada');
                          setError(null);
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="">-- SELECCIONAR CUENTA DE DESTINO --</option>
                      {internalAccounts?.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.account_number})</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setShowRegisterForm(true)}
                      className="px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl text-[10px] font-black text-blue-400 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3 h-3 fill-current" /> O Registrar Nueva Cuenta
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-[2rem] p-8 flex items-center gap-6 animate-in shake duration-500">
                  <div className="w-12 h-12 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
                </div>
              )}

              <div className="bg-slate-950 border-2 border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl group">
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50 sticky top-0 z-20">
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                        <th className="px-8 py-6">Timestamp</th>
                        <th className="px-8 py-6">Descriptor</th>
                        <th className="px-8 py-6 text-right">Monto</th>
                        <th className="px-8 py-6">Categoría IA</th>
                        <th className="px-8 py-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {transactions.map((txn) => (
                        <tr
                          key={txn.id}
                          className={`hover:bg-white/[0.02] transition-colors group/row ${txn.isDuplicate ? 'bg-rose-500/[0.02]' : ''}`}
                        >
                          <td className="px-8 py-6 text-[10px] font-black text-slate-400 font-mono tracking-tighter">{txn.transactionDate}</td>
                          <td className="px-8 py-6 text-[11px] font-black text-white uppercase tracking-tighter leading-none">{txn.description}</td>
                          <td className={`px-8 py-6 text-right font-mono font-black text-sm tracking-tighter ${txn.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            ${Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{txn.suggestedCategory}</span>
                              {txn.confidenceScore < 85 && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[8px] font-black border border-amber-500/20">
                                  {txn.confidenceScore}% ACC
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            {txn.isDuplicate ? (
                              <span className="inline-flex px-3 py-1 rounded-lg bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase border border-rose-500/20 tracking-widest">
                                Duplicado
                              </span>
                            ) : (
                              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto">
                                <Check className="w-4 h-4 text-emerald-500" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between gap-6 pt-10 border-t border-slate-800">
                <button onClick={() => { setStep('upload'); setFiles([]); }} className="px-10 py-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-800 flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 rotate-180" /> Recalibrar
                </button>
                <div className="flex gap-6">
                  <button onClick={onClose} className="px-10 py-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-800">
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinalizeImport}
                    disabled={loading || !resolvedAccountId || transactions.filter(t => !t.isDuplicate).length === 0}
                    className="px-14 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-blue-900/50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-4"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck className="w-4 h-4" />}
                    {loading ? 'CERTIFICANDO...' : 'INYECTAR EN LIBRO MAYOR'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Registro de Cuenta Automático */}
      {showRegisterForm && detectedAccountNumber && (
        <BankAccountForm
          initialData={{
            id: 0,
            account_name: detectedBankName ? `${detectedBankName} (...${detectedAccountNumber.slice(-4)})` : detectedAccountNumber,
            bank_name: detectedBankName || '',
            account_number: detectedAccountNumber,
            account_type: 'checking',
            balance: 0,
            currency: 'USD',
            is_active: true,
            created_at: new Date().toISOString()
          }}
          onCancel={() => setShowRegisterForm(false)}
          onSubmit={async (data) => {
            const res = await createBankAccount(data);
            if (res.success && res.id) {
              setResolvedAccountId(res.id);
              setAccountMatchStatus('matched');
              setMatchedAccountLabel(`${data.account_name}`);
              setShowRegisterForm(false);
              toast.success('Cuenta bancaria registrada y vinculada exitosamente');
            } else {
              toast.error(res.message || 'Error al registrar cuenta');
            }
          }}
        />
      )}
    </div>
  );
};

const StepIndicator = ({ active, completed, step, label, icon: Icon }: any) => (
  <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'scale-110' : completed ? 'opacity-80' : 'opacity-40'}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${active ? 'bg-blue-600 border-blue-400 text-white shadow-blue-900/40' :
      completed ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-500' :
        'bg-slate-950 border-slate-800 text-slate-600'
      }`}>
      {completed ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
    </div>
    <div className="text-left">
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-0.5">{step}</span>
      <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
    </div>
  </div>
);

const StatHighlight = ({ title, value, icon: Icon, color }: any) => {
  const themes: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-950/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-950/20',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-950/20'
  };

  return (
    <div className="bg-slate-950 border-2 border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-slate-700 transition-all shadow-xl">
      <div className={`w-16 h-16 rounded-2.2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-lg ${themes[color]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <div className="text-2xl font-black text-white font-mono tracking-tighter leading-none mb-1.5">{value}</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
      </div>
    </div>
  );
};
