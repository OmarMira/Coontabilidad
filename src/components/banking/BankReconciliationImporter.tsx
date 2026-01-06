import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, BankAccount, insertBankTransactions } from '@/database/simple-db';
import { Upload, FileText, Check, AlertCircle, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { detectBankFormat } from './importers/FormatDetector';
import { normalizeTransaction } from './importers/TransactionNormalizer';

export const BankReconciliationImporter: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<{ valid: number, invalid: number } | null>(null);
    const [fileFormat, setFileFormat] = useState<string>('UNKNOWN');

    // Mapeo dinámico
    const [columnMapping, setColumnMapping] = useState({
        date: '',
        description: '',
        amount: '',
        reference: ''
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = () => {
        if (!db) return;
        try {
            const res = db.exec("SELECT * FROM bank_accounts WHERE is_active = 1");
            if (res.length > 0 && res[0].values.length > 0) {
                const cols = res[0].columns;
                const loadedAccounts = res[0].values.map(row => {
                    const acc: any = {};
                    cols.forEach((col, i) => acc[col] = row[i]);
                    return acc as BankAccount;
                });
                setAccounts(loadedAccounts);
                if (loadedAccounts.length > 0) setSelectedAccountId(loadedAccounts[0].id);
            }
        } catch (e) {
            console.error("Error loading accounts", e);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setSuccessMsg(null);
            setErrorMsg(null);
            setStats(null);
            setLoading(true);

            try {
                // 1. Detect Format
                const detection = await detectBankFormat(selectedFile);
                setFileFormat(detection.format);

                if (detection.suggestedParser !== 'CSV') {
                    setErrorMsg(`Formato detectado: ${detection.format}. Por favor usa la pestaña ${detection.suggestedParser}.`);
                    setLoading(false);
                    return;
                }

                // 2. Parse CSV
                Papa.parse(selectedFile, {
                    header: true,
                    preview: 5,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setLoading(false);
                        if (results.meta.fields) {
                            setHeaders(results.meta.fields);
                            setPreviewData(results.data);

                            // Auto-map based on detection metadata or heuristics
                            // FormatDetector returns metadata that might help, but for now we rely on headers
                            // Re-implementing simplified mapping logic or using what we had
                            autoMapColumns(results.meta.fields, detection.metadata);
                        }
                    },
                    error: (error) => {
                        setLoading(false);
                        setErrorMsg(`Error leyendo CSV: ${error.message}`);
                    }
                });

            } catch (err) {
                setLoading(false);
                setErrorMsg('Error analizando archivo.');
            }
        }
    };

    const autoMapColumns = (headers: string[], metadata: any) => {
        const mapping = { date: '', description: '', amount: '', reference: '' };

        // Use FormatDetector metadata if available for mapping hints?
        // Currently FormatDetector mainly identifies format name.
        // We use simple heuristic here.

        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('date') || lower.includes('fecha')) mapping.date = h;
            if (lower.includes('desc') || lower.includes('detail') || lower.includes('payee') || lower.includes('concepto')) mapping.description = h;
            if (lower.includes('amount') || lower.includes('monto') || lower.includes('importe')) mapping.amount = h;
            if (lower.includes('ref') || lower.includes('check') || lower.includes('num')) mapping.reference = h;
        });

        setColumnMapping(mapping);
    };

    const handleImport = () => {
        if (!file || !selectedAccountId) return;

        setLoading(true);
        setErrorMsg(null);
        setStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const transactions: any[] = [];
                let validCount = 0;
                let invalidCount = 0;

                results.data.forEach((row: any) => {
                    // Use TransactionNormalizer
                    const rawDate = row[columnMapping.date];
                    const rawDesc = row[columnMapping.description];
                    const rawAmt = row[columnMapping.amount];
                    const rawRef = row[columnMapping.reference];

                    const normalized = normalizeTransaction(rawDate, rawDesc, rawAmt, rawRef, {
                        strictMode: false, // Be lenient on import to allow manual correction later? No, Gold+ requires valid data.
                        detectNegativesInParens: true
                    });

                    if (normalized.success && normalized.data) {
                        transactions.push({
                            bank_account_id: selectedAccountId,
                            ...normalized.data,
                            status: 'pending'
                        });
                        validCount++;
                    } else {
                        invalidCount++;
                        console.warn('Row failed normalization:', row, normalized.error);
                    }
                });

                if (transactions.length > 0) {
                    const result = insertBankTransactions(transactions);
                    if (result.success) {
                        setSuccessMsg(`Importación completada: ${result.importedCount} nuevas transacciones.`);
                        setStats({ valid: validCount, invalid: invalidCount });
                        if (invalidCount > 0) {
                            setErrorMsg(`Atención: ${invalidCount} filas fueron ignoradas o eran inválidas.`);
                        }
                        setFile(null);
                        setPreviewData([]);
                    } else {
                        setErrorMsg(result.message);
                    }
                } else {
                    setErrorMsg("No se encontraron transacciones válidas para importar.");
                }
                setLoading(false);
            },
            error: (error) => {
                setErrorMsg(`Error crítico al parsear: ${error.message}`);
                setLoading(false);
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Importación Inteligente (CSV)
                    </h2>
                    <p className="text-slate-400">Detecta y normaliza formatos bancarios automáticamente.</p>
                </div>
                {fileFormat !== 'UNKNOWN' && (
                    <span className="bg-blue-900/40 text-blue-200 px-3 py-1 rounded-full text-xs border border-blue-500/30">
                        Formato: {fileFormat}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Control Panel */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Upload className="w-5 h-5 text-blue-400" />
                            Cargar Archivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Cuenta Destino</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedAccountId || ''}
                                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                            >
                                {accounts.length === 0 && <option value="">No hay cuentas activas</option>}
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                                <p className="text-sm text-slate-400 group-hover:text-blue-300">{file ? file.name : "Arrastra archivo CSV"}</p>
                            </div>
                        </div>

                        {successMsg && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-md flex items-center gap-2 animate-in slide-in-from-top-2">
                                <Check className="w-4 h-4" />
                                <div>
                                    <p className="font-bold">¡Éxito!</p>
                                    <p className="text-xs">{successMsg}</p>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md flex items-center gap-2 animate-in slide-in-from-top-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{errorMsg}</span>
                            </div>
                        )}

                        {stats && (
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                <div className="bg-green-900/30 p-2 rounded text-green-300">
                                    <span className="block text-lg font-bold">{stats.valid}</span>
                                    Válidas
                                </div>
                                <div className="bg-red-900/30 p-2 rounded text-red-300">
                                    <span className="block text-lg font-bold">{stats.invalid}</span>
                                    Inválidas
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleImport}
                            disabled={!file || !selectedAccountId || loading || !!errorMsg}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 font-bold"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                            {loading ? 'Procesando...' : 'Confirmar Importación'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Panel de Mapeo */}
                {previewData.length > 0 && (
                    <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex justify-between items-center">
                                <span>Verificación de Columnas</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fecha</label>
                                        <select
                                            value={columnMapping.date}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Descripción</label>
                                        <select
                                            value={columnMapping.description}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monto</label>
                                        <select
                                            value={columnMapping.amount}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Referencia</label>
                                        <select
                                            value={columnMapping.reference}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, reference: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500"
                                        >
                                            <option value="">(Opcional)</option>
                                            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-950/30 p-2 text-xs text-slate-400">
                                Previsualización de datos brutos:
                                <pre className="mt-2 text-xs text-slate-500 font-mono overflow-x-auto">
                                    {JSON.stringify(previewData[0], null, 2)}
                                </pre>
                            </div>

                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
