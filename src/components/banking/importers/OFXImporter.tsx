import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, BankAccount, insertBankTransactions, BankTransaction } from '@/database/simple-db';
import { parseOFX } from '@/lib/ofx-parser';
import { OFXStatement } from '@/types/ofx';
import { Upload, FileCode, Check, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { normalizeTransaction } from './TransactionNormalizer';

export const OFXImporter: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<OFXStatement | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            setParsedData(null);
            setLoading(true);

            try {
                const text = await selectedFile.text();
                const statement = await parseOFX(text);
                setParsedData(statement);
            } catch (error) {
                setErrorMsg(`Error al analizar archivo OFX/QFX: ${(error as Error).message}`);
                setFile(null);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleImport = () => {
        if (!parsedData || !selectedAccountId) return;

        setLoading(true);
        try {
            const transactions: Partial<BankTransaction>[] = [];
            let invalidCount = 0;

            parsedData.transactions.forEach(t => {
                const normalized = normalizeTransaction(
                    t.datePosted,
                    t.name + (t.memo ? ` - ${t.memo}` : ''),
                    t.amount,
                    t.fitId,
                    { strictMode: true, detectNegativesInParens: false }
                );

                if (normalized.success && normalized.data) {
                    transactions.push({
                        bank_account_id: selectedAccountId,
                        transaction_date: normalized.data.transaction_date,
                        description: normalized.data.description,
                        amount: normalized.data.amount,
                        reference_number: normalized.data.reference_number,
                        status: 'pending' as const
                    });
                } else {
                    invalidCount++;
                    console.warn("OFX Transaction failed normalization", t, normalized.error);
                }
            });

            if (transactions.length > 0) {
                const result = insertBankTransactions(transactions);

                if (result.success) {
                    setSuccessMsg(`Importación completada: ${result.importedCount} transacciones de OFX.`);
                    if (invalidCount > 0) setErrorMsg(`Atención: ${invalidCount} transacciones ignoradas por datos inválidos.`);
                    setFile(null);
                    setParsedData(null);
                } else {
                    setErrorMsg(result.message);
                }
            } else {
                setErrorMsg("No se encontraron transacciones válidas.");
            }

        } catch (err) {
            setErrorMsg("Error crítico al importar datos.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        Importador OFX/QFX
                    </h2>
                    <p className="text-slate-400">Importación directa de formatos bancarios estándar Open Financial Exchange.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Control Panel */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Upload className="w-5 h-5 text-orange-400" />
                            Cargar Archivo OFX
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Cuenta Destino</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                value={selectedAccountId || ''}
                                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-orange-500 transition-colors cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept=".ofx,.qfx"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <FileCode className="w-10 h-10 text-slate-500 mx-auto mb-2 group-hover:text-orange-400 transition-colors" />
                                <p className="text-sm text-slate-400 group-hover:text-orange-300">{file ? file.name : "Soltar archivo OFX/QFX"}</p>
                            </div>
                        </div>

                        {successMsg && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-md flex items-center gap-2">
                                <Check className="w-4 h-4" /> {successMsg}
                            </div>
                        )}
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {errorMsg}
                            </div>
                        )}

                        <Button
                            onClick={handleImport}
                            disabled={!parsedData || !selectedAccountId || loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20 font-bold"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                            Importar {parsedData?.transactions.length || ''} Transacciones
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                {parsedData && (
                    <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex justify-between items-center">
                                <span>Vista Previa del Estado</span>
                                <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded border border-orange-900/50">
                                    {parsedData.currency} | ID: {parsedData.account.accountId}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <div className="flex gap-4 mb-4 text-xs text-slate-400 border-b border-slate-800 pb-2">
                                <div>
                                    <span className="block font-bold text-slate-500">Inicio</span>
                                    {parsedData.startTime}
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-500">Fin</span>
                                    {parsedData.endTime}
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-500">Balance</span>
                                    ${parsedData.ledgerBalance.amount.toFixed(2)}
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-950/30">
                                <table className="w-full text-sm text-left text-slate-400">
                                    <thead className="text-xs uppercase bg-slate-950 text-slate-300 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Descripción</th>
                                            <th className="px-4 py-3 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.transactions.slice(0, 50).map((t, i) => (
                                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                <td className="px-4 py-2 whitespace-nowrap">{t.datePosted}</td>
                                                <td className="px-4 py-2 max-w-[200px] truncate" title={t.name + ' ' + t.memo}>
                                                    <div className="font-medium text-slate-300">{t.name}</div>
                                                    <div className="text-xs text-slate-500">{t.memo}</div>
                                                </td>
                                                <td className={`px-4 py-2 text-right font-mono ${t.amount >= 0 ? 'text-green-400' : 'text-slate-300'}`}>
                                                    {t.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2 text-xs text-center text-slate-500">
                                {parsedData.transactions.length > 50 ? `Mostrando 50 de ${parsedData.transactions.length} transacciones` : `Total: ${parsedData.transactions.length} transacciones`}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
