import React, { useState, useEffect } from 'react';
import { X, FilePlus, User, ArrowRight, ShoppingBag, Tag, Calendar, ShieldCheck } from 'lucide-react';
import { getCustomers, createInvoice, updateARDDocumentStatus, Customer } from '../../database/simple-db';
import { logger } from '../../core/logging/SystemLogger';
import { ARDDocument } from '../../modules/ard/ARD.types';

interface ARDSaleConversionModalProps {
    document: ARDDocument;
    onClose: () => void;
    onSuccess: () => void;
}

export const ARDSaleConversionModal: React.FC<ARDSaleConversionModalProps> = ({ document, onClose, onSuccess }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(document.customer_id || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-ARD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);

    // Extracción de datos del análisis
    const analysis = JSON.parse(document.raw_analysis || '{}');
    const [amount, setAmount] = useState(document.detected_amount || 0);
    const [tax, setTax] = useState(document.detected_tax || 0);
    const [date, setDate] = useState(document.detected_date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(`Venta generada desde ARD: ${document.name} (${analysis.vendor || 'Proveedor/Vendedor no identificado'})`);

    useEffect(() => {
        setCustomers(getCustomers());
    }, []);

    const handleConvert = async () => {
        if (!selectedCustomerId) {
            alert('Por favor, asigne un cliente para la venta.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Preparar datos de la factura
            const invoiceData = {
                customer_id: Number(selectedCustomerId),
                invoice_number: invoiceNumber,
                issue_date: date,
                due_date: new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                subtotal: amount - tax,
                tax_amount: tax,
                total_amount: amount,
                status: 'draft' as const,
                notes: `Conversión automática ARD ID: ${document.id}. Original: ${document.name}`
            };

            // 2. Crear ítems de factura (uno genérico basado en el análisis)
            const items = [
                {
                    description: description,
                    quantity: 1,
                    unit_price: amount - tax,
                    line_total: amount - tax,
                    taxable: tax > 0
                }
            ];

            // 3. Crear la factura en la base de datos
            const result = createInvoice(invoiceData, items, 1); // Mock User ID 1

            if (result.success) {
                // 4. Actualizar estado del documento ARD
                updateARDDocumentStatus(document.id, 'converted');

                logger.info('ARD', 'conversion_to_sale_success', `Documento ${document.id} convertido a factura ${invoiceNumber}`);
                onSuccess();
                onClose();
            } else {
                alert('Error al crear la factura: ' + result.message);
            }
        } catch (e) {
            logger.error('ARD', 'conversion_to_sale_failed', 'Fallo en la conversión a venta', null, e as Error);
            alert('Error crítico durante la conversión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                            <ShoppingBag className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Convertir a Venta Real</h3>
                            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-0.5">Generación Automática de Factura</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Alerta de Integridad */}
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                            Datos verificados por motor OCR - Listos para facturación
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Selección de Cliente */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" /> Cliente Destino
                            </label>
                            <select
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                <option value="">Seleccione el cliente para esta venta...</option>
                                {customers.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                            </select>
                        </div>

                        {/* Número de Factura */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <FilePlus className="w-3 h-3" /> Nº de Factura
                            </label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Fecha */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Fecha Venta
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Monto Total */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3 h-3" /> Monto Total (Final)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-black text-xl focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Impuestos */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3 h-3" /> Impuestos (Tax)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                <input
                                    type="number"
                                    value={tax}
                                    onChange={(e) => setTax(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-black text-xl focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Descripción / Concepto */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                <FilePlus className="w-3 h-3" /> Concepto / Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 font-black text-xs uppercase tracking-widest transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConvert}
                        disabled={isSubmitting}
                        className="flex-2 flex items-center justify-center gap-3 px-12 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
                    >
                        {isSubmitting ? 'Procesando Venta...' : 'Completar Conversión a Venta'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
