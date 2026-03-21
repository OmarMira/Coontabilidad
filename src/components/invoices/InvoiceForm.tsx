import { logger } from '../../core/logging/SystemLogger';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ShieldCheck, PlusCircle, Trash2 } from 'lucide-react';
import { useInvoiceForm } from './useInvoiceForm';
import { CustomerSelector } from './subcomponents/CustomerSelector';
import { TaxSummary } from './subcomponents/TaxSummary';
import { useLocale } from '@/i18n/useLocale';

export const InvoiceForm: React.FC = () => {
    const { t } = useLocale();
    const {
        customer,
        lines,
        subtotal,
        taxAmount,
        total,
        auditHash,
        loading,
        error,
        setCustomer,
        addLine,
        updateLine,
        removeLine,
        saveInvoice
    } = useInvoiceForm();

    const handleSave = async () => {
        const savedId = await saveInvoice();
        if (savedId) {
            logger.info('InvoiceForm', 'info', 'Factura guardada con ID:', savedId);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-10 flex items-center justify-center font-sans relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative animate-in zoom-in duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl pointer-events-none"></div>

                {/* Header Hub */}
                <header className="p-12 border-b border-slate-800/50 relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                            <ShieldCheck className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                                {t('invoiceForm.forensicTitle') || 'FacturaciÃ³n Forense'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                Florida Revenue Compliance v4.2
                            </p>
                        </div>
                    </div>
                </header>

                <div className="p-12 space-y-12 overflow-y-auto max-h-[80vh] custom-scrollbar relative z-10">
                    {/* Customer Selection Block */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                            {t('invoiceForm.customer') || 'CLIENTE'}
                        </label>
                        <div className="bg-slate-950/50 border border-slate-800/50 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 group hover:border-blue-500/30 transition-all">
                            <div className="flex-1 w-full">
                                <CustomerSelector
                                    selectedCustomer={customer}
                                    onSelect={setCustomer}
                                />
                            </div>
                            {customer && (
                                <div className="h-14 px-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('invoiceForm.county') || 'CONDADO'}:</span>
                                    <span className="text-sm font-black text-blue-400 uppercase tracking-tighter">{customer.county}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice Lines Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{t('invoiceForm.items') || 'PRODUCTOS/SERVICIOS'}</h3>
                            <button
                                type="button"
                                onClick={addLine}
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                <PlusCircle className="w-4 h-4" />
                                {t('invoiceForm.addLine') || 'AGREGAR LÃNEA'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {lines.map((line, index) => (
                                <div key={line.id} className="bg-slate-950/30 border border-slate-800/50 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-end group hover:bg-slate-950/50 transition-all">
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">{t('invoiceForm.description') || 'DESCRIPCIÃ“N'}</label>
                                            <input
                                                placeholder={t('invoiceForm.descriptionPlaceholder') || "DescripciÃ³n del servicio..."}
                                                value={line.description}
                                                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                disabled={loading}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold uppercase tracking-widest text-[10px] placeholder:text-slate-800"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1 text-right block">{t('invoiceForm.quantity') || 'CANTIDAD'}</label>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                                                    disabled={loading}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-mono font-black text-sm text-right"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1 text-right block">{t('invoiceForm.price') || 'PRECIO UNITARIO'}</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.unitPrice}
                                                        onChange={(e) => updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                                        disabled={loading}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-mono font-black text-sm text-right text-blue-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeLine(line.id)}
                                        disabled={loading || lines.length <= 1}
                                        className="h-[60px] w-[60px] bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center active:scale-95 disabled:opacity-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tax Summary Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-800/50">
                        <div className="space-y-6">
                            {/* Audit Hash Alert */}
                            {auditHash && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] p-8 space-y-4 animate-in slide-in-from-left duration-700">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none">TransacciÃ³n Auditada</p>
                                            <p className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] mt-2">Inmutable Chain Verified</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/10">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Hash Signature</p>
                                        <p className="text-[10px] font-mono font-black text-emerald-500/80 break-all uppercase italic">
                                            {auditHash.substring(0, 32)}...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Internal Error Message */}
                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/30 rounded-[2rem] p-8 flex items-start gap-4 animate-in shake duration-500">
                                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                                    <p className="text-rose-200 text-sm font-bold uppercase tracking-tight italic">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-950/50 border border-slate-800/50 rounded-[2.5rem] p-10 shadow-inner">
                            <TaxSummary
                                subtotal={subtotal}
                                taxAmount={taxAmount}
                                total={total}
                                county={customer?.county}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Action Hub */}
                <footer className="p-12 border-t border-slate-800/50 bg-slate-950/30 flex justify-end items-center relative z-10">
                    <button
                        onClick={handleSave}
                        disabled={loading || !customer || lines.some(l => !l.description || l.unitPrice <= 0)}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 text-white px-16 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-[12px] transition-all flex items-center justify-center gap-6 shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:-translate-y-2 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                                <span>{t('invoiceForm.saving') || 'PROCESANDO...'}</span>
                            </>
                        ) : (
                            <>
                                <span>{t('invoiceForm.saveWithAudit') || 'GUARDAR CON AUDITORÃA'}</span>
                                <ShieldCheck className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};
