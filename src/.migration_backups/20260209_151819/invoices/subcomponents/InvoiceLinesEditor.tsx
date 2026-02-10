import React from 'react';
import { Product } from '@/database/simple-db';
import { Plus, X } from 'lucide-react';
import { InvoiceLine } from '../InvoiceSchemas';

interface InvoiceLinesEditorProps {
    lines: InvoiceLine[];
    products: Product[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onUpdateLine: (index: number, field: keyof InvoiceLine, value: any) => void;
    errors?: Record<string, string>;
}

export const InvoiceLinesEditor: React.FC<InvoiceLinesEditorProps> = ({
    lines,
    products,
    onAddLine,
    onRemoveLine,
    onUpdateLine,
    errors
}) => {
    const handleProductSelect = (index: number, productId: number) => {
        onUpdateLine(index, 'productId', productId);
        const product = products.find(p => p.id === productId);
        if (product) {
            onUpdateLine(index, 'description', product.name);
            onUpdateLine(index, 'unitPrice', product.price);
            // Default logic: Product is taxable -> taxExempt = false. 
            // Product not taxable -> taxExempt = true.
            // Assuming product.taxable means "Is Taxable"
            onUpdateLine(index, 'taxExempt', !product.taxable);
            onUpdateLine(index, 'cost', product.cost || 0);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</label>
                <button type="button" onClick={onAddLine} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                </button>
            </div>

            <div className="space-y-2">
                {lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-900 p-3 rounded border border-gray-800">
                        <div className="col-span-4">
                            <select
                                value={String(line.productId || 0)}
                                onChange={(e) => handleProductSelect(index, Number(e.target.value))}
                                className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded px-2 py-1 mb-1"
                            >
                                <option value={0}>Select Product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={line.description}
                                onChange={(e) => onUpdateLine(index, 'description', e.target.value)}
                                placeholder="Description"
                                className="w-full bg-transparent text-xs text-gray-400 border-b border-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                            {errors?.[`lines.${index}.description`] && <span className="text-red-500 text-xs">{errors[`lines.${index}.description`]}</span>}
                        </div>

                        <div className="col-span-2">
                            <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => onUpdateLine(index, 'quantity', Number(e.target.value))}
                                className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded px-2 py-1 text-right"
                                placeholder="Qty"
                                step="any"
                            />
                            {errors?.[`lines.${index}.quantity`] && <span className="text-red-500 text-xs">{errors[`lines.${index}.quantity`]}</span>}
                        </div>

                        <div className="col-span-3">
                            <input
                                type="number"
                                value={line.unitPrice}
                                onChange={(e) => onUpdateLine(index, 'unitPrice', Number(e.target.value))}
                                className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded px-2 py-1 text-right"
                                placeholder="Price"
                                step="any"
                            />
                        </div>

                        <div className="col-span-1 flex justify-center pt-2">
                            <input
                                type="checkbox"
                                checked={!line.taxExempt}
                                onChange={(e) => onUpdateLine(index, 'taxExempt', !e.target.checked)}
                                title="Taxable"
                            />
                        </div>

                        <div className="col-span-1 pt-2 flex justify-center">
                            <button type="button" onClick={() => onRemoveLine(index)} className="text-red-500 hover:text-red-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="col-span-1 text-right pt-2 text-sm font-mono text-gray-300">
                            ${(line.quantity * line.unitPrice).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
