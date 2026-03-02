import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Save, Calculator, AlertCircle, Hash, History, CheckCircle2 } from 'lucide-react';
import { type JournalEntry, type JournalLine } from '../../modules/accounting/Accounting.types';
import { useLocale } from '../../i18n/useLocale';

interface JournalEntryFormProps {
    onCancel?: () => void;
    onSave?: (entry: JournalEntry, lines: JournalLine[]) => void;
}

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onCancel, onSave }) => {
    const { t, language } = useLocale();
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = useState<JournalLine[]>([
        { account_code: '', debit: 0, credit: 0, description: '' },
        { account_code: '', debit: 0, credit: 0, description: '' }
    ]);

    const addLine = () => setLines([...lines, { account_code: '', debit: 0, credit: 0, description: '' }]);

    const updateLine = (index: number, field: keyof JournalLine, value: any) => {
        const newLines = [...lines];
        (newLines[index] as any)[field] = value;
        setLines(newLines);
    };

    const removeLine = (index: number) => {
        if (lines.length > 2) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const balanced = difference < 0.01;

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const handleSave = () => {
        if (onSave && balanced && description) {
            onSave({ entry_date: date, description } as JournalEntry, lines);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg">
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                                {t('accounting.journalEntry.title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-blue-500" /> {t('accounting.journalEntry.subtitle')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border shadow-lg transition-all ${balanced
                            ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-900/20 border-rose-500/30 text-rose-400 animate-pulse'
                            }`}>
                            {balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {balanced ? t('accounting.journalEntry.balanced') : `${t('accounting.journalEntry.imbalance')}: $${formatNumber(difference)}`}
                        </div>
                        {onCancel && (
                            <button onClick={onCancel} className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95">
                                <XCircle className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <FileText className="w-3.5 h-3.5 text-blue-500" /> {t('accounting.journalEntry.description')}
                                </label>
                                <div className="relative group/input">
                                    <input
                                        className="w-full bg-slate-950/50 text-white px-8 py-5 rounded-[2rem] border border-slate-800/50 focus:border-blue-500/50 focus:shadow-[0_0_25px_rgba(59,130,246,0.1)] outline-none transition-all font-bold text-sm placeholder:text-slate-800"
                                        placeholder={t('accounting.journalEntry.descriptionPlaceholder')}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Calculator className="w-3.5 h-3.5 text-blue-500" /> {t('accounting.journalEntry.date')}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-slate-950/50 text-white px-8 py-5 rounded-[2rem] border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-mono font-bold text-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Entry Lines Table Container */}
                        <div className="bg-slate-950/30 rounded-[2.5rem] border border-slate-800/80 overflow-hidden shadow-inner p-1">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/80 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                        <th className="py-6 px-8 text-left">{t('accounting.journalEntry.account')}</th>
                                        <th className="py-6 px-8 text-left">{t('accounting.journalEntry.description')}</th>
                                        <th className="py-6 px-8 text-right w-40">{t('accounting.journalEntry.debit')}</th>
                                        <th className="py-6 px-8 text-right w-40">{t('accounting.journalEntry.credit')}</th>
                                        <th className="py-6 px-8 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {lines.map((line, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="p-6">
                                                <input
                                                    placeholder={t('accounting.journalEntry.accountPlaceholder')}
                                                    className="w-full bg-transparent border-b border-slate-800 focus:border-blue-500 outline-none p-3 text-white font-black uppercase tracking-tight text-xs transition-colors"
                                                    value={line.account_code}
                                                    onChange={e => updateLine(idx, 'account_code', e.target.value.toUpperCase())}
                                                />
                                            </td>
                                            <td className="p-6">
                                                <input
                                                    placeholder={t('accounting.journalEntry.descriptionPlaceholder')}
                                                    className="w-full bg-transparent border-b border-slate-800 focus:border-blue-500 outline-none p-3 text-slate-400 font-bold italic text-xs transition-colors"
                                                    value={line.description}
                                                    onChange={e => updateLine(idx, 'description', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-6">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={`w-full bg-slate-900/50 rounded-2xl border border-slate-800 focus:border-emerald-500/50 outline-none p-4 text-right font-mono font-black text-sm transition-all ${line.debit > 0 ? 'text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-700'}`}
                                                    value={line.debit || ''}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => {
                                                        updateLine(idx, 'debit', Number(e.target.value));
                                                        if (Number(e.target.value) > 0) updateLine(idx, 'credit', 0);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-6">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={`w-full bg-slate-900/50 rounded-2xl border border-slate-800 focus:border-rose-500/50 outline-none p-4 text-right font-mono font-black text-sm transition-all ${line.credit > 0 ? 'text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'text-slate-700'}`}
                                                    value={line.credit || ''}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => {
                                                        updateLine(idx, 'credit', Number(e.target.value));
                                                        if (Number(e.target.value) > 0) updateLine(idx, 'debit', 0);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-6 text-center">
                                                <button
                                                    onClick={() => removeLine(idx)}
                                                    className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-90"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-950/60 font-black">
                                    <tr>
                                        <td colSpan={2} className="p-8">
                                            <button
                                                onClick={addLine}
                                                className="flex items-center gap-3 text-blue-500 hover:text-white bg-blue-500/5 hover:bg-blue-600 px-8 py-4 border border-blue-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95"
                                            >
                                                <Plus className="w-4 h-4" /> {t('accounting.journalEntry.addEntry')}
                                            </button>
                                        </td>
                                        <td className="p-8 text-right bg-slate-900/40">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 px-1">{t('accounting.journalEntry.debit')}</div>
                                            <span className="font-mono text-xl text-emerald-400 font-black">${formatNumber(totalDebit)}</span>
                                        </td>
                                        <td className="p-8 text-right bg-slate-900/40">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 px-1">{t('accounting.journalEntry.credit')}</div>
                                            <span className="font-mono text-xl text-rose-400 font-black">${formatNumber(totalCredit)}</span>
                                        </td>
                                        <td className="bg-slate-900/40"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Audit Guideline Box */}
                        <div className="bg-blue-900/10 border border-blue-500/10 rounded-[2rem] p-8 flex items-start gap-6 transition-all hover:bg-blue-900/20">
                            <History className="w-8 h-8 text-blue-500 mt-1 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{t('accounting.journalEntry.auditGuideline')}</p>
                                <p className="text-sm font-bold text-slate-400 leading-relaxed italic">
                                    {t('accounting.journalEntry.auditText')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <footer className="p-10 border-t border-slate-800 bg-slate-950/50 relative z-10 flex items-center justify-between transition-all">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-4 text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-2xl"
                        >
                            Protocolo :: Abortar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!balanced || !description}
                            className={`bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-900/40 active:scale-95 disabled:opacity-20 ${!balanced || !description ? 'cursor-not-allowed' : 'hover:-translate-y-1'}`}
                        >
                            <Save className="w-5 h-5" />
                            {t('accounting.journalEntry.save')}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
};
