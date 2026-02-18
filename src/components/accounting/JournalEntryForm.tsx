import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Save, Calculator, AlertCircle, Hash, History, CheckCircle2 } from 'lucide-react';
import { type JournalEntry, type JournalLine } from '../../modules/accounting/Accounting.types';
import { useLocale } from '../../i18n/useLocale';

export const JournalEntryForm: React.FC = () => {
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

    return (
        <Card className="bg-slate-900/40 border-slate-800 text-white w-full max-w-5xl mx-auto rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md animate-in zoom-in-95 duration-500">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-slate-950/50 border-b border-slate-800 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                        <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black text-white uppercase tracking-tighter">
                            {t('accounting.journalEntry.title')}
                        </CardTitle>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            {t('accounting.journalEntry.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border shadow-lg transition-all ${balanced
                        ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-900/10 border-red-500/30 text-red-500 animate-pulse'
                        }`}>
                        {balanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {balanced ? t('accounting.journalEntry.balanced') : `${t('accounting.journalEntry.imbalance')}: $${formatNumber(difference)}`}
                    </div>
                    <Button
                        disabled={!balanced || !description}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest px-8 py-6 rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" /> {t('accounting.journalEntry.save')}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-8 space-y-10">
                {/* General Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            {t('accounting.journalEntry.description')}
                        </label>
                        <input
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                            placeholder={t('accounting.journalEntry.descriptionPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Calculator className="w-3.5 h-3.5" />
                            {t('accounting.journalEntry.date')}
                        </label>
                        <input
                            type="date"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Entry Lines Table */}
                <div className="bg-slate-950/30 rounded-3xl border border-slate-800/80 overflow-hidden shadow-inner">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-950/80 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                <th className="py-5 px-6 text-left flex items-center gap-2 font-black">
                                    <Hash className="w-3.5 h-3.5" />
                                    {t('accounting.journalEntry.account')}
                                </th>
                                <th className="py-5 px-6 text-left">{t('accounting.journalEntry.description')}</th>
                                <th className="py-5 px-6 text-right w-32">{t('accounting.journalEntry.debit')}</th>
                                <th className="py-5 px-6 text-right w-32">{t('accounting.journalEntry.credit')}</th>
                                <th className="py-5 px-6 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {lines.map((line, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/20 transition-colors group">
                                    <td className="p-4">
                                        <input
                                            placeholder={t('accounting.journalEntry.accountPlaceholder')}
                                            className="w-full bg-transparent border-b border-slate-800 focus:border-blue-500 outline-none p-2 text-white font-black uppercase tracking-tight text-xs transition-colors"
                                            value={line.account_code}
                                            onChange={e => updateLine(idx, 'account_code', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            placeholder={t('accounting.journalEntry.descriptionPlaceholder')}
                                            className="w-full bg-transparent border-b border-slate-800 focus:border-blue-500 outline-none p-2 text-slate-400 font-bold italic text-xs transition-colors"
                                            value={line.description}
                                            onChange={e => updateLine(idx, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            className="w-full bg-slate-900/50 rounded-xl border border-slate-800 focus:border-emerald-500/50 outline-none p-3 text-right text-emerald-400 font-mono font-black text-sm transition-all"
                                            value={line.debit}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                updateLine(idx, 'debit', Number(e.target.value));
                                                if (Number(e.target.value) > 0) updateLine(idx, 'credit', 0);
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            className="w-full bg-slate-900/50 rounded-xl border border-slate-800 focus:border-orange-500/50 outline-none p-3 text-right text-orange-400 font-mono font-black text-sm transition-all"
                                            value={line.credit}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                updateLine(idx, 'credit', Number(e.target.value));
                                                if (Number(e.target.value) > 0) updateLine(idx, 'debit', 0);
                                            }}
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => removeLine(idx)}
                                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                            title={t('accounting.journalEntry.delete')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-950/60 font-black">
                            <tr>
                                <td colSpan={2} className="p-6">
                                    <button
                                        onClick={addLine}
                                        className="flex items-center gap-2 text-blue-500 hover:text-blue-400 font-black uppercase text-[10px] tracking-widest bg-blue-500/5 hover:bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> {t('accounting.journalEntry.addEntry')}
                                    </button>
                                </td>
                                <td className="p-6 text-right font-mono text-lg text-emerald-400">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{t('accounting.journalEntry.debit')}</div>
                                    {formatNumber(totalDebit)}
                                </td>
                                <td className="p-6 text-right font-mono text-lg text-orange-400">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{t('accounting.journalEntry.credit')}</div>
                                    {formatNumber(totalCredit)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Validation Info Box */}
                <div className="bg-blue-600/5 border border-blue-500/10 rounded-3xl p-6 flex items-start gap-4">
                    <History className="w-6 h-6 text-blue-500 mt-1 shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t('accounting.journalEntry.auditGuideline')}</p>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                            {t('accounting.journalEntry.auditText')}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
