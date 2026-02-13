
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Save, Trash2, X } from 'lucide-react';
import { getSuppliers, getActiveProducts, createPurchaseOrder, Supplier, Product } from '@/database/simple-db';
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
        <Card className="bg-slate-900 border-white/5 text-white w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    {t('poForm.title')}
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-white">
                        <X className="w-4 h-4 mr-2" /> {t('poForm.cancel')}
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                        <Save className="w-4 h-4 mr-2" />
                        {t('poForm.saveDraft')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Header Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('poForm.supplier')}</label>
                        <select
                            className="w-full bg-white/10 border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.supplier_id}
                            onChange={e => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                        >
                            <option value={0}>{t('poForm.selectSupplier')}</option>
                            {suppliers.length === 0 && <option disabled>{t('poForm.noSuppliers')}</option>}
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        {suppliers.length === 0 && (
                            <p className="text-xs text-red-400 mt-1">{t('poForm.warning.createSuppliers')}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('poForm.issueDate')}</label>
                        <input
                            type="date"
                            className="w-full bg-white/10 border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.order_date}
                            onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('poForm.expectedDate')}</label>
                        <input
                            type="date"
                            className="w-full bg-white/10 border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.expected_date}
                            onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div className="border border-white/5 rounded-xl overflow-hidden bg-white/10/20">
                    <div className="p-3 bg-white/10/50 border-b border-white/5 flex gap-4 items-center font-medium text-sm text-slate-500">
                        <div className="flex-1">{t('poForm.col.product')}</div>
                        <div className="w-24 text-right">{t('poForm.col.quantity')}</div>
                        <div className="w-32 text-right">{t('poForm.col.unitCost')}</div>
                        <div className="w-32 text-right">{t('poForm.col.total')}</div>
                        <div className="w-10"></div>
                    </div>

                    <div className="divide-y divide-gray-800/50">
                        {items.map((item, idx) => (
                            <div key={idx} className="p-3 flex gap-4 items-center text-sm hover:bg-white/10/30">
                                <div className="flex-1 font-medium">{item.product_name}</div>
                                <div className="w-24 text-right">{item.quantity}</div>
                                <div className="w-32 text-right">${item.unit_price.toFixed(2)}</div>
                                <div className="w-32 text-right text-slate-400 font-mono">${(item.quantity * item.unit_price).toFixed(2)}</div>
                                <div className="w-10 text-right">
                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-300 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Item Row */}
                    <div className="p-3 bg-white/10/30 flex gap-4 items-center border-t border-white/5">
                        <div className="flex-1">
                            <select
                                className="w-full bg-slate-900 border-white/10 rounded p-2 text-sm text-white"
                                value={newItem.product_id}
                                onChange={e => setNewItem({ ...newItem, product_id: Number(e.target.value) })}
                            >
                                <option value={0}>{t('poForm.addProductPlaceholder')}</option>
                                {products.length === 0 && <option disabled>{t('poForm.noProducts')}</option>}
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                                ))}
                            </select>
                            {products.length === 0 && (
                                <p className="text-xs text-red-400 mt-1">{t('poForm.warning.createProducts')}</p>
                            )}
                        </div>
                        <div className="w-24">
                            <input
                                type="number"
                                className="w-full bg-slate-900 border-white/10 rounded p-2 text-sm text-right text-white"
                                placeholder={t('poForm.qtyPlaceholder')}
                                min="1"
                                value={newItem.quantity}
                                onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <div className="w-32">
                            <input
                                type="number"
                                className="w-full bg-slate-900 border-white/10 rounded p-2 text-sm text-right text-white"
                                placeholder={t('poForm.costPlaceholder')}
                                min="0"
                                step="0.01"
                                value={newItem.unit_price}
                                onChange={e => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                            />
                        </div>
                        <div className="w-32 text-right">
                            <Button size="sm" onClick={handleAddItem} disabled={!newItem.product_id} className="bg-blue-600 hover:bg-blue-500">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="w-10"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">{t('poForm.notesLabel')}</label>
                        <textarea
                            className="w-full bg-white/10 border-white/10 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            placeholder={t('poForm.notesPlaceholder')}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">{t('poForm.subtotal')}</span>
                            <span className="text-white font-mono">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                            <span className="text-blue-400 font-bold text-lg">{t('poForm.totalOrder')}</span>
                            <span className="text-2xl font-black tracking-tight text-white font-mono">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
