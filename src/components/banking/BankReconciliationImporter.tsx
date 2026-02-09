import React, { useState, useCallback } from 'react';
import {
    Upload,
    FileText,
    X,
    AlertCircle,
    CheckCircle,
    Database,
    ArrowRight,
    Zap,
    ShieldCheck,
    Layers,
    Target,
    Cpu,
    Activity,
    Landmark,
    FileSpreadsheet,
    Terminal as TerminalIcon,
    Sparkles,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { BankAccount, BankTransaction, getBankAccounts, insertBankTransactions } from '../../database/simple-db';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';

export const BankReconciliationImporter: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mapping, setMapping] = useState({
        date: 0,
        description: 1,
        amount: 2,
        reference: 3
    });
    const [preview, setPreview] = useState<string[][]>([]);
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

    React.useEffect(() => {
        setAccounts(getBankAccounts());
    }, []);

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Protocolo requiere formato CSV');
            return;
        }
        setFile(selectedFile);
        Papa.parse(selectedFile, {
            complete: (results: Papa.ParseResult<string[]>) => {
                setPreview((results.data as string[][]).slice(0, 10));
                setStep('mapping');
                toast.success('Integridad de archivo verificada');
            },
            header: false,
            skipEmptyLines: true
        });
    };

    const handleImport = async () => {
        if (!file || !selectedAccountId) return;

        setIsProcessing(true);
        Papa.parse(file, {
            complete: (results: Papa.ParseResult<string[]>) => {
                const rows = results.data as string[][];
                const mapped = rows
                    .slice(1)
                    .map((row: string[]) => ({
                        bank_account_id: selectedAccountId,
                        transaction_date: row[mapping.date],
                        description: row[mapping.description],
                        amount: parseFloat((row[mapping.amount] || '').toString().replace(/[$,]/g, '')) || 0,
                        reference_number: row[mapping.reference] || '',
                        status: 'pending' as const
                    }));

                const transactions = mapped.filter((t) => !!t.transaction_date && t.amount !== 0) as Partial<BankTransaction>[];

                const result = insertBankTransactions(transactions as BankTransaction[]);
                if (result.success) {
                    toast.success(`Inyección completa: ${transactions.length} registros certificados`);
                    setStep('upload');
                    setFile(null);
                    setPreview([]);
                } else {
                    toast.error(result.message);
                }
                setIsProcessing(false);
            },
            header: false,
            skipEmptyLines: true
        });
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
                        <FileSpreadsheet className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Inyector de Conciliación</h2>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-3">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Asset Synchronization Interface
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 p-1.5 bg-slate-950 border border-slate-900 rounded-2.5xl shadow-3xl">
                    <div className="px-6 py-3 flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Kernel Integrity: Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 border-slate-800">
                {/* Protocol Selector - Account selection */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] pointer-events-none"></div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Landmark className="w-4 h-4 text-blue-500" /> Destino de Bóveda
                        </h3>
                        <div className="space-y-3">
                            {accounts.map(account => (
                                <button
                                    key={account.id}
                                    onClick={() => setSelectedAccountId(account.id)}
                                    className={`w-full text-left p-6 rounded-[1.8rem] transition-all duration-500 relative overflow-hidden ${selectedAccountId === account.id
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-950/40'
                                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:-translate-x-1'
                                        }`}
                                >
                                    <div className="relative z-10 flex flex-col gap-1">
                                        <div className="font-black uppercase tracking-tighter text-sm">{account.account_name}</div>
                                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] font-mono ${selectedAccountId === account.id ? 'text-blue-100' : 'text-slate-600'}`}>ID: #{account.id}</div>
                                    </div>
                                    {selectedAccountId === account.id && (
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-[30px] -mr-12 -mt-12"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-xl text-center space-y-4">
                        <TerminalIcon className="w-8 h-8 text-slate-800 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol: CSV_STANDARD_V1</p>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Auth: AES-X_CRYPTO</p>
                        </div>
                    </div>
                </div>

                {/* Main Action Hub */}
                <div className="lg:col-span-2">
                    {step === 'upload' ? (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`h-full bg-slate-900 border-4 border-dashed rounded-[3.5rem] p-24 text-center transition-all duration-700 flex flex-col items-center justify-center group relative overflow-hidden ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-700 ${dragActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

                            <div className={`w-32 h-32 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex items-center justify-center mb-10 shadow-2xl transition-all duration-700 ${dragActive ? 'scale-110 border-blue-500/50' : 'group-hover:scale-105 group-hover:bg-slate-900'}`}>
                                <Upload className={`w-12 h-12 ${dragActive ? 'text-blue-500 animate-bounce' : 'text-slate-700'}`} />
                            </div>

                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Ingreso de Base CSV</h3>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed max-w-sm mb-12">
                                ARRASTRA EL ARCHIVO DE TRANSACCIONES O HAZ CLIC PARA SELECCIONAR. NUESTRO MOTOR REFIBRARÁ LOS DATOS.
                            </p>

                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="csv-upload"
                                disabled={!selectedAccountId}
                            />
                            <label
                                htmlFor="csv-upload"
                                className={`px-14 py-6 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all shadow-3xl flex items-center gap-4 cursor-pointer ${!selectedAccountId ? 'bg-slate-800 text-slate-600 opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 hover:-translate-y-1 active:scale-95'
                                    }`}
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                LOCALIZAR FUENTE CSV
                            </label>
                            {!selectedAccountId && <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mt-6">⚠️ ACCESO DENEGADO: SELECCIONA BÓVEDA PRIMERO</p>}
                        </div>
                    ) : (
                        <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] p-12 shadow-3xl space-y-12 animate-in slide-in-from-bottom-6 duration-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-blue-500/10"></div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mapeo de Atributos</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-blue-500" /> Neural Layer Coordination
                                    </p>
                                </div>
                                <button onClick={() => setStep('upload')} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <MappingField label="Timestamp (Fecha)" icon={Calendar} value={mapping.date} onChange={(v) => setMapping(prev => ({ ...prev, date: v }))} />
                                <MappingField label="Descriptor (Descripción)" icon={Target} value={mapping.description} onChange={(v) => setMapping(prev => ({ ...prev, description: v }))} />
                                <MappingField label="Cuantía (Monto)" icon={Activity} value={mapping.amount} onChange={(v) => setMapping(prev => ({ ...prev, amount: v }))} />
                                <MappingField label="Referencia (ID)" icon={ShieldCheck} value={mapping.reference} onChange={(v) => setMapping(prev => ({ ...prev, reference: v }))} />
                            </div>

                            <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner">
                                <div className="px-8 py-4 bg-slate-900/50 border-b border-slate-800">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Heurística: Vista Previa de Kernel</span>
                                </div>
                                <div className="overflow-x-auto p-4 max-h-48 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <tbody>
                                            {preview.map((row: string[], i: number) => (
                                                        <tr key={i} className="border-b border-slate-800/40 last:border-0 hover:bg-white/[0.02]">
                                                            {row.map((cell: string | number, j: number) => (
                                                                <td key={j} className="px-4 py-3 text-[10px] font-black text-slate-600 font-mono tracking-tighter truncate max-w-[150px]">{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <footer className="flex justify-end pt-6 border-t border-slate-800">
                                <button
                                    onClick={handleImport}
                                    disabled={isProcessing}
                                    className="px-14 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all shadow-3xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-4"
                                >
                                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Cpu className="w-5 h-5" />}
                                    {isProcessing ? 'INYECTANDO...' : 'EJECUTAR SINCRO'}
                                </button>
                            </footer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface MappingFieldProps {
    label: string;
    icon: React.ComponentType<any>;
    value: number;
    onChange: (v: number) => void;
}

const MappingField = ({ label, icon: Icon, value, onChange }: MappingFieldProps) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 ml-1">
            <Icon className="w-4 h-4 text-blue-500" /> {label}
        </label>
        <div className="relative group/input">
            <select
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full bg-slate-950 text-white px-8 py-5 rounded-2.5xl border border-slate-800 transition-all font-black uppercase tracking-widest text-[11px] focus:outline-none focus:border-blue-500 focus:shadow-[0_0_25px_rgba(59,130,246,0.1)] group-hover/input:border-slate-700 shadow-inner appearance-none relative z-10"
            >
                {[...Array(10)].map((_, i) => (
                    <option key={i} value={i} className="bg-slate-900">Columna {i + 1}</option>
                ))}
            </select>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover/input:text-blue-500 transition-colors rotate-90" />
            </div>
        </div>
    </div>
);


