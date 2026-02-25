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
import { BankAccount, BankTransaction, getBankAccounts, insertBankTransactions, findBankAccountsByNumber, createBankAccount, getLastReconciliationStatement } from '../../database/simple-db';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { StatementSmartParser, StatementMetadata } from '../../services/banking/StatementSmartParser';
import { BankAccountForm } from '../BankAccountForm';
import { useLocale } from '../../i18n/useLocale';

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
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [detectedMetadata, setDetectedMetadata] = useState<StatementMetadata | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [ambiguousAccounts, setAmbiguousAccounts] = useState<BankAccount[]>([]);
    const [continuityError, setContinuityError] = useState<string | null>(null);
    const { t } = useLocale();

    React.useEffect(() => {
        setAccounts(getBankAccounts());
    }, []);

    // Re-validar continuidad si cambia la cuenta seleccionada
    React.useEffect(() => {
        if (selectedAccountId && detectedMetadata && detectedMetadata.openingBalance !== undefined) {
            const lastStatement = getLastReconciliationStatement(selectedAccountId);
            if (lastStatement) {
                const diff = Math.abs(lastStatement.statement_balance - detectedMetadata.openingBalance);
                if (diff > 0.05) {
                    setContinuityError(`Hueco temporal detectado: El saldo inicial del archivo ($${detectedMetadata.openingBalance}) no coincide con el último saldo conciliado ($${lastStatement.statement_balance}).`);
                } else {
                    setContinuityError(null);
                }
            } else {
                setContinuityError(null);
            }
        }
    }, [selectedAccountId, detectedMetadata]);

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

    const handleFileSelect = async (selectedFile: File) => {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['csv', 'ofx', 'pdf', 'jpg', 'jpeg', 'png'];

        if (!validExtensions.includes(ext || '')) {
            toast.error(t('bankStatementImport.compatibility'));
            return;
        }

        setIsProcessing(true);
        setFile(selectedFile);

        try {
            // Detección Inteligente de Cuenta
            const metadata = await StatementSmartParser.parseMetadata(selectedFile);
            setDetectedMetadata(metadata);

            let accountIdToUse = selectedAccountId;

            if (metadata.accountNumber) {
                const results = findBankAccountsByNumber(metadata.accountNumber);
                if (results.length === 1) {
                    accountIdToUse = results[0].id;
                    setSelectedAccountId(accountIdToUse);
                    toast.success(t('bankReconciliation.accountDetected')
                        .replace('{{account}}', metadata.accountNumber)
                        .replace('{{bank}}', results[0].bank_name));
                } else if (results.length > 1) {
                    setAmbiguousAccounts(results);
                    toast('Varias cuentas candidatas detectadas. Por favor elige la correcta.');
                    setIsProcessing(false);
                    return;
                } else {
                    // Si no se encuentra la cuenta, NO bloqueamos el proceso.
                    // Solo avisamos, pero dejamos que vea la previsualización.
                    toast.error(t('bankReconciliation.accountNotFound')
                        .replace('{{account}}', metadata.accountNumber), { duration: 5000 });
                }
            }

            if (metadata.isValidTriangle === false) {
                setValidationError(t('bankReconciliation.checks.triangleError'));
            } else {
                setValidationError(null);
            }

            if (ext === 'csv') {
                Papa.parse(selectedFile, {
                    complete: (results: Papa.ParseResult<string[]>) => {
                        const data = results.data as string[][];
                        setPreview(data.slice(0, 15));
                        setStep('mapping');
                        toast.success('Integridad de archivo verificada');
                    },
                    header: false,
                    skipEmptyLines: true
                });
            } else if (ext === 'pdf' || ['jpg', 'jpeg', 'png'].includes(ext || '')) {
                if (metadata.transactions && metadata.transactions.length > 0) {
                    // Add headers for clear view
                    const txList = [
                        ['FECHA', 'DESCRIPCIÓN', 'MONTO'],
                        ...metadata.transactions.map(tx => [
                            tx.transaction_date,
                            tx.description,
                            tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                        ])
                    ];
                    setPreview(txList);
                    setStep('mapping');
                    toast.success(`Se recuperaron ${metadata.transactions.length} transacciones`);
                } else {
                    setPreview([
                        ['DATO', 'VALOR DETECTADO'],
                        ['FORMATO', ext?.toUpperCase() || ''],
                        ['MÉTODO', 'INTELIGENCIA DE VISIÓN (OCR)'],
                        ['CUENTA', metadata.accountNumber || 'NO DETECTADA'],
                        ['BANCO', metadata.bankName || 'DESCONOCIDO']
                    ]);
                    setStep('mapping');
                    toast.error('No se detectaron transacciones en el documento');
                }
            } else if (ext === 'ofx') {
                if (metadata.transactions && metadata.transactions.length > 0) {
                    const txList = [
                        ['FECHA', 'DESCRIPCIÓN', 'MONTO'],
                        ...metadata.transactions.map(tx => [
                            tx.transaction_date || '',
                            tx.description || '',
                            tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                        ])
                    ];
                    setPreview(txList);
                    setStep('mapping');
                    toast.success('Datos OFX procesados correctamente');
                } else {
                    toast.error('El archivo OFX no contiene transacciones válidas');
                }
            } else {
                toast.error('Formato no soportado para procesamiento inteligente.');
            }
        } catch (error) {
            toast.error('Fallo en el análisis inteligente del archivo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!file || !selectedAccountId || continuityError || validationError) return;

        setIsProcessing(true);

        const executeInjection = (transactions: Partial<BankTransaction>[]) => {
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
        };

        if (detectedMetadata && (detectedMetadata.format === 'PDF' || detectedMetadata.format === 'OFX' || detectedMetadata.extractionMethod === 'OCR')) {
            if (detectedMetadata.transactions) {
                const txs = detectedMetadata.transactions.map(tx => ({
                    ...tx,
                    bank_account_id: selectedAccountId
                }));
                executeInjection(txs);
            } else {
                toast.error('No se detectaron transacciones en el documento visual.');
                setIsProcessing(false);
            }
            return;
        }

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

                // Validación del Triángulo para CSV
                if (detectedMetadata && detectedMetadata.format === 'CSV') {
                    let credits = 0;
                    let debits = 0;
                    transactions.forEach(tx => {
                        if ((tx.amount || 0) > 0) credits += tx.amount || 0;
                        else debits += Math.abs(tx.amount || 0);
                    });

                    const isValid = StatementSmartParser.validateTriangle({
                        ...detectedMetadata,
                        totalCredits: credits,
                        totalDebits: debits
                    });

                    if (!isValid) {
                        const calculated = (detectedMetadata.openingBalance || 0) + credits - debits;
                        const errorMsg = `Discrepancia en Triángulo de Verdad: Esperado ${detectedMetadata.closingBalance}, Calculado ${calculated.toFixed(2)}`;
                        toast.error(errorMsg);
                        setValidationError(errorMsg);
                        setIsProcessing(false);
                        return;
                    }
                }

                executeInjection(transactions);
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
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('bankStatementImport.title')}</h2>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-3">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('bankStatementImport.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 p-1.5">
                    <div className="px-6 py-4 bg-slate-950 border border-slate-900 rounded-2.5xl shadow-3xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
                        <Database className="w-4 h-4 text-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('bankStatementImport.chartOfAccounts')}</span>
                            <span className="text-[10px] font-black text-white tracking-widest leading-none mt-1">V2.8.5</span>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-950 border border-slate-900 rounded-2.5xl shadow-3xl flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('bankStatementImport.encryption')}</span>
                            <span className="text-[10px] font-black text-white tracking-widest leading-none mt-1 uppercase">Seguridad Activa</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 border-slate-800">
                {/* Protocol Selector - Account selection */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] pointer-events-none"></div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Landmark className="w-4 h-4 text-blue-500" /> Cuenta de Destino
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
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('bankStatementImport.confidential')}</p>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('bankStatementImport.savedTime')}: +15 min</p>
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
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            className={`h-full bg-slate-900 border-4 border-dashed rounded-[3.5rem] p-24 text-center transition-all duration-700 flex flex-col items-center justify-center group relative overflow-hidden cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-700 ${dragActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

                            <div className={`w-32 h-32 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex items-center justify-center mb-10 shadow-2xl transition-all duration-700 ${dragActive ? 'scale-110 border-blue-500/50' : 'group-hover:scale-105 group-hover:bg-slate-900'}`}>
                                <Upload className={`w-12 h-12 ${dragActive ? 'text-blue-500 animate-bounce' : 'text-slate-700'}`} />
                            </div>

                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t('bankStatementImport.selectProtocol')}</h3>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed max-w-sm mb-12">
                                {t('bankStatementImport.mappingDesc')}
                            </p>

                            <input
                                type="file"
                                accept=".pdf,.ofx,.csv,image/jpeg,image/png"
                                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className={`px-14 py-6 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all shadow-3xl flex items-center gap-4 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 hover:-translate-y-1 active:scale-95 ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                <Zap className={`w-5 h-5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
                                {isProcessing ? t('bankReconciliation.analyzingMetadata') : t('bankStatementImport.injectCSV')}
                            </label>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] p-12 shadow-3xl space-y-12 animate-in slide-in-from-bottom-6 duration-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-blue-500/10"></div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Preparar Datos</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-blue-500" /> {t('bankStatementImport.executingHeuristics')}
                                    </p>
                                </div>
                                <button onClick={() => { setStep('upload'); setValidationError(null); setContinuityError(null); }} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {continuityError && (
                                <div className="p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl flex items-center gap-6">
                                    <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Hueco Temporal (Audit Layer)</p>
                                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{continuityError}</p>
                                    </div>
                                </div>
                            )}

                            {validationError && (
                                <div className="p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl flex items-center gap-6 animate-pulse">
                                    <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Bloqueo de Integridad (Triángulo)</p>
                                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">{validationError}</p>
                                    </div>
                                </div>
                            )}

                            {(!detectedMetadata || detectedMetadata.format === 'CSV') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <MappingField label="Timestamp (Fecha)" icon={Calendar} value={mapping.date} onChange={(v) => setMapping(prev => ({ ...prev, date: v }))} />
                                    <MappingField label="Descriptor (Descripción)" icon={Target} value={mapping.description} onChange={(v) => setMapping(prev => ({ ...prev, description: v }))} />
                                    <MappingField label="Cuantía (Monto)" icon={Activity} value={mapping.amount} onChange={(v) => setMapping(prev => ({ ...prev, amount: v }))} />
                                    <MappingField label="Referencia (ID)" icon={ShieldCheck} value={mapping.reference} onChange={(v) => setMapping(prev => ({ ...prev, reference: v }))} />
                                </div>
                            )}

                            <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner">
                                <div className="px-8 py-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {detectedMetadata?.transactions && detectedMetadata.transactions.length > 0
                                            ? `Transacciones Recuperadas (${detectedMetadata.transactions.length})`
                                            : 'Vista Previa de Datos'
                                        }
                                    </span>
                                    {detectedMetadata?.extractionMethod === 'OCR' && (
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            IA VALIDATED
                                        </span>
                                    )}
                                </div>
                                <div className="overflow-x-auto p-4 max-h-80 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-slate-800/30">
                                            {preview.map((row: string[], i: number) => (
                                                <tr key={i} className={`hover:bg-white/[0.02] ${i === 0 ? 'bg-slate-950/50 sticky top-0' : ''}`}>
                                                    {row.map((cell: string | number, j: number) => (
                                                        <td key={j} className={`px-4 py-3 text-[10px] font-black font-mono tracking-tighter truncate max-w-[200px] ${i === 0 ? 'text-slate-400 border-b border-slate-800' : 'text-slate-600'
                                                            }`}>
                                                            {cell}
                                                        </td>
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
                                    {isProcessing ? t('bankReconciliation.analyzingMetadata') : t('bankStatementImport.consolidate')}
                                </button>
                            </footer>
                        </div>
                    )}
                </div>
            </div>
            {/* Modal de Registro de Cuenta Automático */}
            {
                showRegisterForm && detectedMetadata && (
                    <BankAccountForm
                        initialData={{
                            id: 0,
                            account_name: detectedMetadata.accountNumber,
                            bank_name: detectedMetadata.bankName,
                            account_number: detectedMetadata.accountNumber,
                            account_type: 'checking',
                            balance: 0,
                            currency: detectedMetadata.currency || 'USD',
                            is_active: true,
                            created_at: new Date().toISOString()
                        }}
                        onCancel={() => {
                            setShowRegisterForm(false);
                            setFile(null);
                        }}
                        onSubmit={async (data) => {
                            const res = createBankAccount(data);
                            if (res.success && res.id) {
                                setSelectedAccountId(res.id);
                                setAccounts(getBankAccounts());
                                setShowRegisterForm(false);
                                toast.success(t('bankAccountList.addAccount'));
                                // Intentar re-procesar el archivo ahora que la cuenta existe
                                if (file) handleFileSelect(file);
                            } else {
                                toast.error(res.message);
                            }
                        }}
                    />
                )
            }
            {/* Modal de Desambiguación */}
            {
                ambiguousAccounts.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-10 max-w-2xl w-full shadow-3xl space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Varias Cuentas Detectadas</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">El número de cuenta termina en "{detectedMetadata?.accountNumber}" en múltiples entidades.</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {ambiguousAccounts.map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            setSelectedAccountId(account.id);
                                            setAmbiguousAccounts([]);
                                            if (file) handleFileSelect(file);
                                        }}
                                        className="w-full text-left p-6 bg-slate-950 border border-slate-800 rounded-2.5xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-black text-white uppercase tracking-tight">{account.account_name}</div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{account.bank_name} • ****{account.account_number.slice(-4)}</div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => { setAmbiguousAccounts([]); setFile(null); }}
                                    className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Cancelar Proceso
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
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


