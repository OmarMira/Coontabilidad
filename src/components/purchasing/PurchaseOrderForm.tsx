
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Save, Trash2, XCircle, ShieldCheck } from 'lucide-react';
import type { Supplier, Product } from '@/database/modules/db-types';
import { getSuppliers } from '@/database/modules/db-suppliers';
import { getActiveProducts } from '@/database/modules/db-invoices';
import { createPurchaseOrder } from '@/database/modules/db-purchase-orders';
import { toast } from 'react-hot-toast';
import { useLocale } from '../../i18n/useLocale';

interface PurchaseOrderItemRow {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
}

export const PurchaseOrderForm: React.FC<{ onCancel?: () => void, onSuccess?: () => void }> = ({ onCancel, onSuccess }) => {
    const { t } = useLocale();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        supplier_id: 0,
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        notes: ''
    });

    const [items, setItems] = useState<PurchaseOrderItemRow[]>([]);

    // UI State for new item row
    const [newItem, setNewItem] = useState({
        product_id: 0,
        quantity: 1,
        unit_price: 0
    });

    useEffect(() => {
        setSuppliers(getSuppliers());
        setProducts(getActiveProducts());
    }, []);

    // Update unit price when product selected
    useEffect(() => {
        if (newItem.product_id) {
            const prod = products.find(p => p.id === newItem.product_id);
            if (prod) {
                // Use cost if available, otherwise price as fallback or 0
                setNewItem(prev => ({ ...prev, unit_price: prod.cost || 0 }));
            }
        }
    }, [newItem.product_id, products]);

    const handleAddItem = () => {
        if (!newItem.product_id || newItem.quantity <= 0) return;

        const prod = products.find(p => p.id === newItem.product_id);
        if (!prod) return;

        setItems(prev => [...prev, {
            product_id: newItem.product_id,
            product_name: prod.name,
            quantity: newItem.quantity,
            unit_price: newItem.unit_price
        }]);

        // Reset new item input
        setNewItem({ product_id: 0, quantity: 1, unit_price: 0 });
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        return { subtotal, total: subtotal }; // Buying usually doesn't calculate tax automatically without complex logic
    };

    const handleSave = () => {
        if (!formData.supplier_id) {
            toast.error(t('poForm.validation.selectSupplier'));
            return;
        }
        if (items.length === 0) {
            toast.error(t('poForm.validation.addItems'));
            return;
        }

        const totals = calculateTotals();

        // Generate a simple PO Number
        const orderNumber = `PO-${Date.now().toString().slice(-6)}`;

        const result = createPurchaseOrder({
            supplier_id: formData.supplier_id,
            order_number: orderNumber,
            order_date: formData.order_date,
            expected_date: formData.expected_date || undefined,
            status: 'draft',
            total_amount: totals.total,
            notes: formData.notes,
            items: items.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                unit_price: i.unit_price
            }))
        });

        if (result.success) {
            toast.success(t('poForm.success.created'));
            if (onSuccess) onSuccess();
        } else {
            toast.error(t('poForm.error.create') + result.message);
        }
    };

    const { total } = calculateTotals();

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

                {/* Header Hub */}
                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="text-blue-500">
                            <ShoppingCart className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {t('poForm.title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Procurement Protocol v4.0
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 relative z-10 custom-scrollbar">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Supplier */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block">
                                {t('poForm.supplier')}
                            </label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-bold uppercase tracking-widest text-[10px] appearance-none"
                                    value={formData.supplier_id}
                                    onChange={e => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                                >
                                    <option value={0}>{t('poForm.selectSupplier')}</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 font-black">▼</div>
                            </div>
                        </div>

                        {/* Issue Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block">
                                {t('poForm.issueDate')}
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[10px]"
                                value={formData.order_date}
                                onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                            />
                        </div>

                        {/* Expected Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 block">
                                {t('poForm.expectedDate')}
                            </label>
                            <input
                                type="date"
                                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-6 py-4 text-white focus:border-blue-500/50 outline-none transition-all font-black uppercase tracking-widest text-[10px]"
                                value={formData.expected_date}
                                onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-4">
                            <div className="w-8 h-[1px] bg-blue-500/50"></div>
                            {t('poForm.items') || 'ARTÍCULOS DEL PEDIDO'}
                            <div className="w-8 h-[1px] bg-blue-500/50"></div>
                        </h3>

                        <div className="bg-slate-950/30 border border-slate-800/50 rounded-[2rem] overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[1fr,150px,150px,200px,80px] gap-4 p-8 bg-slate-900/50 border-b border-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <div>{t('poForm.col.product')}</div>
                                <div className="text-right">{t('poForm.col.quantity')}</div>
                                <div className="text-right">{t('poForm.col.unitCost')}</div>
                                <div className="text-right">{t('poForm.col.total')}</div>
                                <div></div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-slate-800/30">
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr,150px,150px,200px,80px] gap-4 p-8 items-center group hover:bg-white/5 transition-colors">
                                        <div className="text-[11px] font-black text-white uppercase tracking-wider">{item.product_name}</div>
                                        <div className="text-sm font-black text-white text-right font-mono tracking-tighter">{item.quantity}</div>
                                        <div className="text-sm font-black text-white text-right font-mono tracking-tighter group-hover:text-blue-400 transition-colors">
                                            ${item.unit_price.toFixed(2)}
                                        </div>
                                        <div className="text-base font-black text-blue-400 text-right font-mono tracking-tighter">
                                            ${(item.quantity * item.unit_price).toFixed(2)}
                                        </div>
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => handleRemoveItem(idx)}
                                                className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Item Interaction */}
                                <div className="p-10 bg-blue-500/5 border-t border-blue-500/10 grid grid-cols-[1fr,120px,180px,120px] gap-6 items-end">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest ml-1">{t('poForm.col.product')}</label>
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all font-bold uppercase tracking-widest text-[10px] appearance-none"
                                                value={newItem.product_id}
                                                onChange={e => setNewItem({ ...newItem, product_id: Number(e.target.value) })}
                                            >
                                                <option value={0}>{t('poForm.addProductPlaceholder')}</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 font-black">▼</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest ml-1 text-right block">{t('poForm.col.quantity')}</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all font-mono font-black text-sm text-right"
                                            placeholder="1"
                                            min="1"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest ml-1 text-right block">{t('poForm.col.unitCost')}</label>
                                        <div className="relative group">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-blue-500 outline-none transition-all font-mono font-black text-sm text-right"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                value={newItem.unit_price}
                                                onChange={e => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddItem}
                                        disabled={!newItem.product_id}
                                        className="h-[58px] bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center group/btn"
                                    >
                                        <Plus className="w-6 h-6 group-hover/btn:scale-125 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,350px] gap-12 pt-8">
                        {/* Notes */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('poForm.notesLabel')}</label>
                            <textarea
                                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-[2.5rem] px-8 py-8 text-white focus:border-blue-500 outline-none transition-all font-medium text-sm placeholder:text-slate-800 resize-none"
                                placeholder={t('poForm.notesPlaceholder')}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                            />
                        </div>

                        {/* Grand Total */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-center items-center relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShoppingCart className="w-48 h-48 text-white" />
                            </div>

                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 relative z-10">{t('poForm.totalOrder') || 'TOTAL DEL PEDIDO'}</p>
                            <div className="text-5xl font-black text-white tracking-tighter font-mono relative z-10">
                                <span className="text-2xl text-blue-500 mr-2">$</span>
                                {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>

                            <div className="w-20 h-1 bg-blue-500 rounded-full mt-8 relative z-10 opacity-50"></div>
                        </div>
                    </div>
                </div>

                {/* Footer Hub */}
                <footer className="p-10 border-t border-slate-800/50 bg-slate-950/30 flex justify-end gap-6 flex-shrink-0 relative z-10">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-10 py-5 text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-2xl border border-transparent hover:border-slate-800"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span>{t('poForm.saveDraft')}</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

