import React, { useState } from 'react';
import { Plus, Save, X, Calculator, User, MapPin } from 'lucide-react';
import { Customer, Product } from '../database/simple-db';
// Note: We use the simple-db types for UI compatibility, 
// but the submission will go to the robust InvoiceService.

interface SalesInvoiceFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    customers: Customer[];
    products: Product[];
    currentUserId: string;
}

interface ItemData {
    product_id: number | '';
    description: string;
    quantity: number;
    unit_price: number;
    taxable: boolean;
    cost: number;
}

const FLORIDA_COUNTIES = [
    'Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Duval', 'Pinellas', 'Lee', 'Polk', 'Brevard'
]; // Simplified list for MVP

export const SalesInvoiceForm: React.FC<SalesInvoiceFormProps> = ({
    onSubmit,
    onCancel,
    customers,
    products,
    currentUserId
}) => {
    const [formData, setFormData] = useState({
        customer_id: '' as number | '',
        county: 'Miami-Dade', // Default or derived from customer
        notes: ''
    });

    const [items, setItems] = useState<ItemData[]>([
        { product_id: '', description: '', quantity: 1, unit_price: 0, taxable: true, cost: 0 }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCustomerChange = (customerId: number) => {
        const cust = customers.find(c => c.id === customerId);
        setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            county: cust?.florida_county && FLORIDA_COUNTIES.includes(cust.florida_county) ? cust.florida_county : prev.county
        }));
    };

    const handleItemChange = (index: number, field: keyof ItemData, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill from product
        if (field === 'product_id' && value) {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                newItems[index].description = product.name;
                newItems[index].unit_price = product.price;
                // Cost is internal, usually hidden, but needed for profit analysis
                newItems[index].cost = product.cost || 0;
                // We assume taxable status might come from product in future, defaulting true
            }
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { product_id: '', description: '', quantity: 1, unit_price: 0, taxable: true, cost: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateEstimation = () => {
        // accurate tax calculation happens on backend, this is just a UI estimate
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
        return subtotal;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customer_id) {
            setError("Customer is required");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                customerId: formData.customer_id,
                county: formData.county,
                userId: currentUserId,
                lines: items.map(i => ({
                    // The Schema lines: { productId: number, description: string... } 
                    // If productId is empty, we must ensure the backend handles it or enforce it. 
                    // Creating 'Ad-hoc' items on the fly might not be supported yet by stock deduction logic.
                    // Let's enforce Product Selection for V1 safety or handle ad-hoc logic.
                    // The Schema says: productId: z.number()
                    productId: i.product_id ? Number(i.product_id) : 0, // 0 might fail FK. 
                    description: i.description,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unit_price),
                    taxable: i.taxable,
                    cost: Number(i.cost)
                }))
            });
        } catch (e: any) {
            setError(e.message || "Transaction Failed");
            setIsSubmitting(false);
        }
    };

    const subtotal = calculateEstimation();

    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="p-2 bg-blue-600 rounded-lg"><Calculator className="w-5 h-5 text-white" /></span>
                    New Sale (Production)
                </h2>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
                    Error: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 p-4 rounded-lg">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <select
                                value={formData.customer_id}
                                onChange={(e) => handleCustomerChange(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 outline-none"
                            >
                                <option value="">Select Customer...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.business_name || c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tax Jurisdiction (County)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <select
                                value={formData.county}
                                onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 outline-none"
                            >
                                {FLORIDA_COUNTIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Determines Surtax Rate (e.g., Miami-Dade 1%)</p>
                    </div>
                </div>

                {/* Lines */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</label>
                        <button type="button" onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Line
                        </button>
                    </div>
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-900 p-2 rounded border border-gray-800">
                                <div className="col-span-4">
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                                        className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded px-2 py-1"
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="Description"
                                        className="w-full mt-1 bg-transparent text-xs text-gray-400 border-none p-0 focus:ring-0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded px-2 py-1 text-right"
                                        placeholder="Qty"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                        className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded px-2 py-1 text-right"
                                        placeholder="Price"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center pt-2">
                                    <input
                                        type="checkbox"
                                        checked={item.taxable}
                                        onChange={(e) => handleItemChange(index, 'taxable', e.target.checked)}
                                    />
                                </div>
                                <div className="col-span-1 pt-2">
                                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="col-span-1 text-right pt-2 text-sm font-mono text-gray-300">
                                    ${(item.quantity * item.unit_price).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                    <div className="text-right flex-1">
                        <span className="text-gray-400 mr-2">Est. Subtotal:</span>
                        <span className="text-xl font-bold text-white">${subtotal.toFixed(2)}</span>
                        <p className="text-xs text-gray-500 mt-1">Final Tax & Total calculated by engine upon submission.</p>
                    </div>
                    <div className="ml-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold shadow-lg transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Processing...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Process Sale
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};
