import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Upload, RefreshCw, ShieldCheck, X, Files } from 'lucide-react';
import { detectBankFormat, DetectionResult } from './importers/FormatDetector';
import { normalizeTransaction, NormalizedTransaction } from './importers/TransactionNormalizer';
import { parseOFX } from '@/lib/ofx-parser';
import { parseBankPDF } from '@/lib/pdf-parser';
import { TransactionPreview } from './importers/TransactionPreview';
import Papa from 'papaparse';
import { BankAccount, insertBankTransactions, BankTransaction, getBankTransactions } from '@/database/simple-db';
import { BankImportService } from '@/services/banking/BankImportService';
import { DuplicateDetectionService } from '@/services/banking/DuplicateDetectionService';

type ImportStage = 'upload' | 'mapping' | 'preview' | 'result';

export const BankImportWizard: React.FC<{ accounts: BankAccount[], onComplete: () => void }> = ({ accounts, onComplete }) => {
    const [stage, setStage] = useState<ImportStage>('upload');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<string>(''); // Progress message

    // Batch State
    const [files, setFiles] = useState<File[]>([]);
    const [csvFiles, setCsvFiles] = useState<File[]>([]); // CSVs waiting for mapping
    const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);

    const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
    const [importResult, setImportResult] = useState<{ success: boolean, message: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // CSV Mapping State (Map Once, Apply to All)
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvSampleData, setCsvSampleData] = useState<any[]>([]);
    const [mapping, setMapping] = useState({ date: '', desc: '', amount: '', ref: '' });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setFiles(acceptedFiles); // Store strictly for UI display
        setErrorMsg(null);
        setLoading(true);
        setStage('upload'); // Stay on upload, but show loading overlay if needed?

        try {
            const currentTransactions: NormalizedTransaction[] = [];
            const tempCsvFiles: File[] = [];
            let processedCount = 0;
            const errors: string[] = [];

            // 1. Analyze All Files
            for (let i = 0; i < acceptedFiles.length; i++) {
                const file = acceptedFiles[i];
                setProgress(`Analizando archivo ${i + 1} de ${acceptedFiles.length}...`);

                try {
                    const result = await detectBankFormat(file);

                    if (result.suggestedParser === 'CSV') {
                        tempCsvFiles.push(file);
                    } else if (result.suggestedParser === 'OFX') {
                        const txs = await processOFXInternal(file, i);
                        currentTransactions.push(...txs);
                    } else if (result.suggestedParser === 'PDF') {
                        const txs = await processPDFInternal(file, i);
                        currentTransactions.push(...txs);
                    } else {
                        errors.push(`${file.name}: Formato no soportado`);
                    }
                    processedCount++;
                } catch (e: any) {
                    console.error(e);
                    errors.push(`${file.name}: ${e.message}`);
                }
            }

            setTransactions(currentTransactions); // Add currently processed

            if (tempCsvFiles.length > 0) {
                // Prepare CSV Mapping (using first CSV as template)
                setCsvFiles(tempCsvFiles);
                await prepareCSVPreload(tempCsvFiles[0]); // Go to map
            } else {
                // No CSVs, done?
                if (currentTransactions.length === 0 && errors.length > 0) {
                    setErrorMsg(`Falló el procesamiento de ${errors.length} archivos. ${errors[0]}`);
                    setFiles([]);
                } else if (currentTransactions.length > 0) {
                    if (errors.length > 0) setErrorMsg(`Advertencia: ${errors.length} archivos fallaron. ${errors.join('; ')}`);
                    setStage('preview');
                } else {
                    setErrorMsg("No se encontraron transacciones en los archivos seleccionados.");
                }
            }

        } catch (error: any) {
            setErrorMsg("Error crítico en batch: " + error.message);
        } finally {
            setLoading(false);
            setProgress('');
        }
    }, []);

    // --- Internal Processors (Return Data, Don't Set State) ---

    const processOFXInternal = async (f: File, fileIndex: number): Promise<NormalizedTransaction[]> => {
        const text = await f.text();
        const ofxData = await parseOFX(text);
        const results: NormalizedTransaction[] = [];
        ofxData.transactions.forEach((t, i) => {
            const norm = normalizeTransaction(t.datePosted, t.name + ' ' + t.memo, t.amount, t.fitId || `ofx_${fileIndex}_${i}`);
            if (norm.success && norm.data) results.push(norm.data);
        });
        return results;
    };

    const processPDFInternal = async (f: File, fileIndex: number): Promise<NormalizedTransaction[]> => {
        const results = await parseBankPDF(f);
        const valid: NormalizedTransaction[] = [];
        results.forEach(res => {
            if (res.success && res.data) valid.push(res.data);
        });
        return valid;
    };

    // --- CSV Handling ---

    const prepareCSVPreload = (f: File) => {
        return new Promise<void>((resolve) => {
            Papa.parse(f, {
                header: true,
                skipEmptyLines: true,
                preview: 20,
                complete: (results) => {
                    if (results.meta.fields) {
                        setCsvHeaders(results.meta.fields);
                        setCsvSampleData(results.data);

                        // Auto-map
                        const newMapping = { date: '', desc: '', amount: '', ref: '' };
                        results.meta.fields.forEach(h => {
                            const lower = h.toLowerCase();
                            if (lower.includes('date') || lower.includes('fecha')) newMapping.date = h;
                            if (lower.includes('desc') || lower.includes('detail') || lower.includes('payee') || lower.includes('concepto')) newMapping.desc = h;
                            if (lower.includes('amount') || lower.includes('monto') || lower.includes('importe')) newMapping.amount = h;
                            if (lower.includes('ref') || lower.includes('num') || lower.includes('cheque')) newMapping.ref = h;
                        });
                        setMapping(newMapping);
                        setStage('mapping');
                    } else {
                        setErrorMsg(`El archivo ${f.name} no tiene encabezados.`);
                        // If 1st CSV fails, blocking all? 
                        // For simplicity, yes.
                        resolve();
                    }
                }
            });
        });
    };

    const handleCSVMapConfirm = () => {
        if (!selectedAccount) {
            setErrorMsg("Selecciona una cuenta bancaria destino.");
            return;
        }
        if (!mapping.date || !mapping.desc || !mapping.amount) {
            setErrorMsg("Debes mapear al menos Fecha, Descripción y Monto.");
            return;
        }

        setLoading(true);
        setProgress(`Procesando ${csvFiles.length} archivos CSV...`);

        // Process ALL pending CSVs with this mapping
        const batchPromises = csvFiles.map((file, fileIdx) => {
            return new Promise<NormalizedTransaction[]>((resolve) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const fileTxs: NormalizedTransaction[] = [];
                        results.data.forEach((row: any, i) => {
                            const rDate = mapping.date ? row[mapping.date] : undefined;
                            const rDesc = mapping.desc ? row[mapping.desc] : '';
                            const rAmt = mapping.amount ? row[mapping.amount] : undefined;
                            const rRef = mapping.ref ? row[mapping.ref] : undefined;

                            const norm = normalizeTransaction(rDate, rDesc, rAmt, rRef || `csv_${fileIdx}_${i}`);
                            if (norm.success && norm.data) fileTxs.push(norm.data);
                        });
                        resolve(fileTxs);
                    }
                });
            });
        });

        Promise.all(batchPromises).then(allResults => {
            const merged = allResults.flat();
            // Merge with existing (PDF/OFX)
            setTransactions(prev => [...prev, ...merged]);
            setLoading(false);
            setProgress('');
            setStage('preview');
        });
    };

    // --- Finalize ---

    const handleFinalizeImport = async (selectedIndices: number[]) => {
        if (!selectedAccount) {
            setErrorMsg("No se ha seleccionado una cuenta bancaria.");
            return;
        }
        setLoading(true);

        const toImport = transactions.filter((_, i) => selectedIndices.includes(i));

        try {
            // Convert cents to dollars
            const dbTxs: Partial<BankTransaction>[] = toImport.map(t => ({
                bank_account_id: selectedAccount,
                transaction_date: t.transaction_date,
                description: t.description,
                amount: t.amount / 100, // Cents to Float
                reference_number: t.reference_number,
                status: 'pending' as const
            }));

            // Validate and check for duplicates
            const existingTxs = getBankTransactions(selectedAccount);
            const validationResult = BankImportService.validateImport(
                selectedAccount,
                dbTxs,
                existingTxs
            );

            if (!validationResult.success) {
                // Show validation errors or duplicates detected
                if (validationResult.duplicateDetection?.hasDuplicates) {
                    const userConfirm = confirm(
                        `${validationResult.message}\n\n` +
                        `¿Deseas importar solo las ${validationResult.duplicateDetection.safeToImport.length} transacciones no duplicadas?`
                    );

                    if (userConfirm && validationResult.duplicateDetection.safeToImport.length > 0) {
                        // Import only safe transactions
                        const result = insertBankTransactions(validationResult.duplicateDetection.safeToImport);
                        setImportResult({
                            success: true,
                            message: `${result.importedCount} transacciones importadas. ${validationResult.skippedCount} duplicados omitidos.`
                        });
                        setStage('result');
                    } else {
                        setErrorMsg(validationResult.message);
                        setLoading(false);
                        return;
                    }
                } else {
                    // Other validation errors
                    setErrorMsg(validationResult.message);
                    setLoading(false);
                    return;
                }
            } else {
                // All validations passed, proceed with import
                const result = insertBankTransactions(dbTxs);
                setImportResult(result);
                setStage('result');
            }
        } catch (e) {
            console.error(e);
            setImportResult({ success: false, message: "Error crítico insertando en BD" });
            setStage('result');
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERERS ---

    const renderStageContent = () => {
        if (stage === 'mapping') {
            return (
                <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        {/* Header Content */}
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-500/10 p-2 rounded-lg">
                                <Files className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Importación Batch CSV</h3>
                                <p className="text-xs text-slate-400">
                                    Se detectaron {csvFiles.length} archivos CSV. Mapea las columnas del primero ({csvFiles[0]?.name}) para aplicar a todos.
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStage('upload')}><X className="w-4 h-4" /></Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
                            <CardContent className="space-y-4 p-4">
                                {/* Account Selection & Mapping Fields */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Cuenta Destino</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                        onChange={(e) => setSelectedAccount(Number(e.target.value))}
                                        value={selectedAccount || ''}
                                    >
                                        <option value="">Selecciona cuenta...</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase">Columnas</h4>
                                    {['date', 'desc', 'amount', 'ref'].map(field => (
                                        <div key={field}>
                                            <label className="text-xs text-slate-500 capitalize">{field}</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-sm text-slate-300"
                                                value={(mapping as any)[field]}
                                                onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                                            >
                                                <option value="">(Seleccionar)</option>
                                                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={handleCSVMapConfirm} disabled={!selectedAccount || loading} className="w-full bg-blue-600 font-bold mt-4">
                                    {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : `Procesar ${csvFiles.length} CSVs`}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800 lg:col-span-2 overflow-auto max-h-[500px]">
                            <table className="w-full text-sm text-left text-slate-400">
                                <thead className="text-xs uppercase bg-slate-950 text-slate-300 sticky top-0">
                                    <tr>{csvHeaders.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {csvSampleData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="border-b border-slate-800">
                                            {csvHeaders.map(h => <td key={h} className="px-4 py-2">{row[h]}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </div>
            );
        }

        if (stage === 'preview') {
            return (
                <div className="animate-in slide-in-from-bottom duration-300">
                    {!selectedAccount && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-yellow-500 w-5 h-5" />
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-500">Acción Requerida</h4>
                                    <p className="text-xs text-yellow-200/70">Selecciona cuenta bancaria.</p>
                                </div>
                            </div>
                            <select
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-white min-w-[200px]"
                                onChange={(e) => setSelectedAccount(Number(e.target.value))}
                                value={selectedAccount || ''}
                            >
                                <option value="">Selecciona cuenta...</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_name}</option>)}
                            </select>
                        </div>
                    )}

                    <TransactionPreview
                        transactions={transactions}
                        onConfirm={handleFinalizeImport}
                        onCancel={() => {
                            if (confirm("¿Cancelar importación?")) {
                                setStage('upload');
                                setTransactions([]);
                                setFiles([]);
                                setCsvFiles([]);
                                setErrorMsg(null);
                            }
                        }}
                        loading={loading}
                    />
                </div>
            );
        }

        if (stage === 'result') {
            return (
                <Card className="bg-slate-900 border-slate-800 flex flex-col items-center justify-center p-12">
                    <div className={`p-6 rounded-full mb-6 ${importResult?.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {importResult?.success ? <ShieldCheck className="w-16 h-16 text-green-400" /> : <AlertCircle className="w-16 h-16 text-red-400" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{importResult?.success ? 'Importación Exitosa' : 'Error'}</h2>
                    <p className="text-slate-400 text-center max-w-md mb-8">{importResult?.message}</p>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => { setStage('upload'); setFiles([]); setTransactions([]); setErrorMsg(null); }}>Importar Más</Button>
                        <Button onClick={onComplete} className="bg-blue-600 text-white">Ver Transacciones</Button>
                    </div>
                </Card>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <Card className={`bg-slate-900 border-slate-800 border-dashed border-2 hover:border-blue-500 transition-colors cursor-pointer group flex flex-row items-center justify-center relative shadow-xl ${stage === 'upload' ? 'h-[200px]' : 'h-[100px]'}`}>
                <input
                    type="file"
                    multiple // SUPPORT MULTI-FILE
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    onChange={(e) => {
                        if (e.target.files?.length) onDrop(Array.from(e.target.files));
                    }}
                    accept=".csv,.ofx,.qfx,.pdf,.stmt"
                />
                <div className="flex items-center gap-6">
                    <div className="bg-blue-500/10 p-4 rounded-full group-hover:bg-blue-500/20 transition-all">
                        <Upload className={`text-blue-400 group-hover:scale-110 transition-transform ${stage === 'upload' ? 'w-12 h-12' : 'w-6 h-6'}`} />
                    </div>
                    <div className="text-left">
                        <h3 className={`font-bold text-white ${stage === 'upload' ? 'text-xl' : 'text-md'}`}>
                            {files.length > 0 && stage !== 'upload' ? `Procesando ${files.length} archivos` : 'Arrastra tus estados de cuenta'}
                        </h3>
                        {stage === 'upload' && (
                            <p className="text-slate-400 text-sm max-w-md">
                                Soporta múltiples archivos CSV, OFX, PDF a la vez. (Batch Mode)
                            </p>
                        )}
                        {loading && (
                            <div className="flex flex-col gap-1 mt-1">
                                <p className="text-blue-400 text-sm animate-pulse font-bold flex items-center gap-2">
                                    <RefreshCw className="animate-spin w-3 h-3" /> {progress || 'Procesando...'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Error Message Display */}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in shake">
                    <AlertCircle className="text-red-500 w-5 h-5 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-500">Aviso de Importación</h4>
                        <p className="text-sm text-red-200/80">{errorMsg}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:text-red-300" onClick={() => setErrorMsg(null)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {renderStageContent()}
        </div>
    );
};
