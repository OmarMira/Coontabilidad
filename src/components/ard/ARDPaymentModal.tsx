import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, FileCheck, ArrowRight, Wallet } from 'lucide-react';
import { getCustomers, getInvoices, createPayment, updateARDDocumentStatus } from '../../database/simple-db';
import { logger } from '../../core/logging/SystemLogger';

interface ARDPaymentModalProps {
    document: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const ARDPaymentModal: React.FC<ARDPaymentModalProps> = ({ document, onClose, onSuccess }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amount, setAmount] = useState(document.detected_amount || 0);
    const [date, setDate] = useState(document.detected_date || new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCustomers(getCustomers());
    }, []);

    useEffect(() => {
        if (selectedCustomerId) {
            // getInvoices only accepts userId/role filters for access control
            // We filter by customerId here on the client side
            const allInvoices = getInvoices();
            const pendingInvoices = allInvoices.filter((inv: any) =>
                inv.customer_id === Number(selectedCustomerId) && inv.status !== 'paid'
            );
            setInvoices(pendingInvoices);
        } else {
            setInvoices([]);
        }
    }, [selectedCustomerId]);

    const handleConfirmPayment = async () => {
        if (!selectedCustomerId || !amount) {
            alert('Por favor seleccione un cliente y verifique el monto.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Registrar el pago en el sistema
            const paymentData = {
                customer_id: Number(selectedCustomerId),
                invoice_id: selectedInvoiceId ? Number(selectedInvoiceId) : undefined,
                amount: Number(amount),
                payment_date: date,
                payment_method: paymentMethod as any,
                reference_number: `ARD-CONV-${document.id}`,
                notes: `Cobro generado automáticamente desde ARD. Documento: ${document.name}`
            };

            const result = createPayment(paymentData, 1); // Mock User ID 1 for now

            if (result.success) {
                // 2. Marcar documento como CONVERTIDO
                updateARDDocumentStatus(document.id, 'converted');

                logger.info('ARD', 'conversion_success', `Documento ${document.id} convertido a pago cliente`);
                onSuccess();
                onClose();
            }
        } catch (e) {
            logger.error('ARD', 'conversion_failed', 'Fallo al convertir documento a pago', null, e as Error);
            alert('Error al procesar el cobro');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <DollarSign className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Convertir a Cobro</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Finalizar Ciclo ARD</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Cliente */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" /> Cliente
                            </label>
                            <select
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                            >
                                <option value="">Seleccione Cliente</option>
                                {customers.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                            </select>
                        </div>

                        {/* Factura (Opcional) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <FileCheck className="w-3 h-3" /> Aplicar a Factura
                            </label>
                            <select
                                value={selectedInvoiceId}
                                onChange={(e) => setSelectedInvoiceId(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                disabled={!selectedCustomerId || invoices.length === 0}
                            >
                                <option value="">Pago a Cuenta (Sin Factura)</option>
                                {invoices.map(i => <option key={i.id} value={i.id} className="bg-slate-900">{i.invoice_number} - Balance: ${i.balance}</option>)}
                            </select>
                        </div>

                        {/* Monto */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-3 h-3" /> Monto Recibido
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-lg focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        {/* Fecha */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Fecha del Cobro
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Método de Pago */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Wallet className="w-3 h-3" /> Método de Pago
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {['cash', 'check', 'transfer', 'card'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${paymentMethod === m ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 font-black text-xs uppercase tracking-widest transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={isSubmitting}
                        className="flex-2 flex items-center justify-center gap-3 px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40"
                    >
                        {isSubmitting ? 'Procesando...' : 'Confirmar Cobro ARD'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
