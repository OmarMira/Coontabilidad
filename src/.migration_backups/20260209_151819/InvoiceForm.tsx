import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Calculator, User, Calendar } from 'lucide-react';
import { Customer, Product, Invoice, InvoiceItem, getFloridaTaxRate } from '../database/simple-db';

interface InvoiceFormProps {
  onSubmit: (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[]) => void;
  onCancel?: () => void;
  customers: Customer[];
  products: Product[];
  initialData?: Invoice;
  isEditing?: boolean;
}

interface FormData {
  customer_id: number | '';
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
}

interface ItemData {
  product_id: number | '';
  description: string;
  quantity: number;
  unit_price: number;
  taxable: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  onCancel,
  customers,
  products,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    customer_id: initialData?.customer_id || '',
    issue_date: initialData?.issue_date || new Date().toISOString().split('T')[0],
    due_date: initialData?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: initialData?.status || 'draft',
    notes: initialData?.notes || ''
  });

  const [items, setItems] = useState<ItemData[]>(
    initialData?.items?.map(item => ({
      product_id: item.product_id || '',
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      taxable: item.taxable
    })) || [
      { product_id: '', description: '', quantity: 1, unit_price: 0, taxable: true }
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  const handleItemChange = (index: number, field: keyof ItemData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Si se selecciona un producto, llenar automáticamente descripción y precio
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unit_price = product.price;
        newItems[index].taxable = product.taxable;
      }
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', description: '', quantity: 1, unit_price: 0, taxable: true }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    const selectedCustomer = customers.find(c => c.id === formData.customer_id);
    const county = selectedCustomer?.florida_county || 'Miami-Dade';
    const taxRate = getFloridaTaxRate(county);

    items.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * taxRate;
      }
    });

    return {
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: subtotal + taxAmount
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    // Validar que la fecha de vencimiento sea posterior a la fecha de emisión
    if (formData.issue_date && formData.due_date && formData.due_date < formData.issue_date) {
      newErrors.due_date = 'Due date must be after issue date';
    }

    // Validar items
    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unit_price < 0) {
        newErrors[`item_${index}_unit_price`] = 'Unit price cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const invoiceData: Partial<Invoice> = {
      customer_id: formData.customer_id as number,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      status: formData.status,
      notes: formData.notes
    };

    const invoiceItems: Partial<InvoiceItem>[] = items.map(item => ({
      product_id: item.product_id || undefined,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      taxable: item.taxable
    }));

    onSubmit(invoiceData, invoiceItems);
  };

  const { subtotal, taxAmount, total } = calculateTotals();
  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-400" />
          {isEditing ? 'Edit Invoice' : 'New Invoice'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer and Date Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Customer *
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => handleInputChange('customer_id', parseInt(e.target.value) || '')}
              className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.customer_id ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                } focus:outline-none`}
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.business_name || customer.name}
                </option>
              ))}
            </select>
            {errors.customer_id && <p className="text-red-400 text-sm mt-1">{errors.customer_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Issue Date *
            </label>
            <input
              type="date"
              value={formData.issue_date}
              onChange={(e) => handleInputChange('issue_date', e.target.value)}
              className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.issue_date ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                } focus:outline-none`}
            />
            {errors.issue_date && <p className="text-red-400 text-sm mt-1">{errors.issue_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.due_date ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                } focus:outline-none`}
            />
            {errors.due_date && <p className="text-red-400 text-sm mt-1">{errors.due_date}</p>}
          </div>
        </div>
        {/* Customer Information Display */}
        {selectedCustomer && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Name:</p>
                <p className="text-white">{selectedCustomer.business_name || selectedCustomer.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Email:</p>
                <p className="text-white">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone:</p>
                <p className="text-white">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Terms:</p>
                <p className="text-white">{selectedCustomer.payment_terms} days</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Invoice Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Product (Optional)
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value) || '')}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${product.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className={`w-full bg-gray-700 text-white px-3 py-2 rounded-md border text-sm transition-colors ${errors[`item_${index}_description`] ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                        } focus:outline-none`}
                      placeholder="Item description"
                    />
                    {errors[`item_${index}_description`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-700 text-white px-3 py-2 rounded-md border text-sm transition-colors ${errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                        } focus:outline-none`}
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-700 text-white px-3 py-2 rounded-md border text-sm transition-colors ${errors[`item_${index}_unit_price`] ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
                        } focus:outline-none`}
                    />
                    {errors[`item_${index}_unit_price`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`item_${index}_unit_price`]}</p>
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Taxable
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.taxable}
                          onChange={(e) => handleItemChange(index, 'taxable', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">Tax</span>
                      </label>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300 p-2 transition-colors"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-400">Line Total: </span>
                  <span className="text-white font-medium">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Invoice Totals */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Invoice Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax ({(getFloridaTaxRate(selectedCustomer?.florida_county || 'Miami-Dade') * 100).toFixed(1)}% FL):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="flex justify-between text-white font-semibold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Additional notes or terms..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};