import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Sparkles, ArrowRight, Table, Database } from 'lucide-react';

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    confidence: number;
    mappedAccount: string;
}

export const BankStatementImporter: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload');
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        setFile(file);
        setStep('analysis');

        // Simulating AI Analysis based on "Pilar 2 & 3" research
        setTimeout(() => {
            const mockData: BankTransaction[] = [
                { id: '1', date: '2026-01-10', description: 'SUNPASS PREPAID MIAMI', amount: -50.00, category: 'Travel', confidence: 0.98, mappedAccount: '5240 - Travel & Auto' },
                { id: '2', date: '2026-01-12', description: 'FL DEPT REVENUE SALES TAX', amount: -1250.40, category: 'Taxes', confidence: 0.99, mappedAccount: '2121 - Sales Tax Payable' },
                { id: '3', date: '2026-01-15', description: 'STRIPE TRANSFER Payout', amount: 4500.00, category: 'Income', confidence: 0.95, mappedAccount: '1112 - Bank Account' },
                { id: '4', date: '2026-01-18', description: 'OFFICE DEPOT #2431', amount: -85.20, category: 'Office', confidence: 0.88, mappedAccount: '5210 - Office Supplies' },
            ];
            setTransactions(mockData);
            setStep('review');
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-emerald-400" />
                        AI Bank Smart Import
                    </h2>
                    <p className="text-gray-400 mt-2 font-medium">Categorización automática mediante inteligencia contable integrada.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-gray-300">PLAN DE CUENTAS V1.4</span>
                    </div>
                </div>
            </div>

            {step === 'upload' && (
                <div
                    className={`card-elite h-[400px] border-dashed border-2 flex flex-col items-center justify-center transition-all ${isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                >
                    <div className="p-6 bg-emerald-500/10 rounded-full mb-6">
                        <Upload className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Arrastra tu resumen bancario (CSV)</h3>
                    <p className="text-gray-500 mb-8">Formatos soportados: Chase, Wells Fargo, Bank of America, Amex</p>

                    <label className="btn-elite-primary cursor-pointer">
                        Seleccionar Archivo
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </label>
                </div>
            )}

            {step === 'analysis' && (
                <div className="card-elite h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                        <Sparkles className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Analizando Transacciones...</h3>
                    <p className="text-gray-500 max-w-sm">Mapeando descripciones a códigos contables de Florida y detectando patrones históricos.</p>
                    <div className="mt-8 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card-elite !p-4 border-emerald-500/20">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Analizadas</span>
                            <div className="text-2xl font-black text-white">{transactions.length} Items</div>
                        </div>
                        <div className="card-elite !p-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Precisión Media</span>
                            <div className="text-2xl font-black text-emerald-400">96.4%</div>
                        </div>
                        <div className="card-elite !p-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Ahorro Estimado</span>
                            <div className="text-2xl font-black text-blue-400">45 Min</div>
                        </div>
                    </div>

                    <div className="card-elite overflow-hidden !p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/10">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Fecha / Descripción</th>
                                    <th className="px-6 py-4">Monto</th>
                                    <th className="px-6 py-4">Categoría IA</th>
                                    <th className="px-6 py-4">Cuenta Contable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            {tx.confidence > 0.9 ? (
                                                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="block text-[10px] font-black text-gray-500">{tx.date}</span>
                                            <span className="text-white font-bold">{tx.description}</span>
                                        </td>
                                        <td className={`px-6 py-4 font-mono font-bold ${tx.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge-elite bg-blue-500/10 text-blue-400">{tx.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select className="bg-transparent text-sm font-semibold text-gray-300 focus:outline-none border-b border-white/10 focus:border-emerald-500 cursor-pointer">
                                                <option>{tx.mappedAccount}</option>
                                                <option>6210 - Rent Expense</option>
                                                <option>2110 - Accounts Payable</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button onClick={() => setStep('upload')} className="btn-elite-secondary">Cancelar</button>
                        <button className="btn-elite-primary flex items-center gap-2">
                            Sincronizar {transactions.length} Transacciones
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
