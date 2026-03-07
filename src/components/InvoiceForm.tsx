import React, { useState, useEffect } from 'react';
import { Plus, Save, XCircle, Calculator, User, Calendar, ShieldCheck } from 'lucide-react';
import { Customer, Product, Invoice, InvoiceItem, getFloridaTaxRate } from '@/database/simple-db';
import { useLocale } from '../i18n/useLocale';

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
  const { t } = useLocale();
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
      newErrors.customer_id = t('invoiceForm.errorCustomer');
    }

    if (!formData.issue_date) {
      newErrors.issue_date = t('invoiceForm.errorIssueDate');
    }

    if (!formData.due_date) {
      newErrors.due_date = t('invoiceForm.errorDueDate');
    }

    // Validar que la fecha de vencimiento sea posterior a la fecha de emisión
    if (formData.issue_date && formData.due_date && formData.due_date < formData.issue_date) {
      newErrors.due_date = t('invoiceForm.errorDateOrder');
    }

    // Validar items
    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = t('invoiceForm.errorDescription');
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = t('invoiceForm.errorQuantity');
      }
      if (item.unit_price < 0) {
        newErrors[`item_${index}_unit_price`] = t('invoiceForm.errorUnitPrice');
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
        <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="text-blue-500">
              {isEditing ? <Calculator className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? t('forms.editInvoice') : t('forms.newInvoice')}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Electronic Billing Protocol v2.5
              </p>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95">
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-10 space-y-10 overflow-y-auto flex-1">
            {/* Customer and Date Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  {t('invoiceForm.customer')}
                </label>
                <div className="relative group/select">
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleInputChange('customer_id', parseInt(e.target.value) || '')}
                    className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] appearance-none cursor-pointer h-[58px]"
                  >
                    <option value="">{t('invoiceForm.selectCustomer')}</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.business_name || customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.customer_id && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">{errors.customer_id}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  {t('invoiceForm.issueDate')}
                </label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => handleInputChange('issue_date', e.target.value)}
                  className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] h-[58px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  {t('invoiceForm.dueDate')}
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] h-[58px]"
                />
              </div>
            </div>

            {/* Customer Information Display */}
            {selectedCustomer && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 relative group overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  {t('invoiceForm.customerInfo')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-[8px] font-bold text-slate-600 uppercase mb-1">{t('customerDetail.name')}</p>
                    <p className="text-[10px] font-black text-white">{selectedCustomer.business_name || selectedCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-600 uppercase mb-1">{t('customerDetail.contact')}</p>
                    <p className="text-[10px] font-black text-white">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-600 uppercase mb-1">{t('customerDetail.primaryPhone')}</p>
                    <p className="text-[10px] font-black text-white">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-600 uppercase mb-1">{t('customerDetail.paymentTerms')}</p>
                    <p className="text-[10px] font-black text-blue-500">{t('common.days', { n: selectedCustomer.payment_terms || 0 })}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Items */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('invoiceForm.items')}</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  {t('invoiceForm.addItem')}
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 hover:border-slate-700 transition-all group/line shadow-inner">
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[8px] font-black text-slate-600 uppercase px-1">{t('invoiceForm.product')}</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value) || '')}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
                      >
                        <option value="">{t('invoiceForm.selectProduct')}</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[8px] font-black text-slate-600 uppercase px-1">{t('invoiceForm.description')}</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none text-[10px] font-black uppercase tracking-widest placeholder:text-slate-700"
                        placeholder={t('invoiceForm.itemDescriptionPlaceholder')}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[8px] font-black text-slate-600 uppercase px-1 text-center block">{t('invoiceForm.quantity')}</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none text-[10px] font-black font-mono text-center"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[8px] font-black text-slate-600 uppercase px-1 text-right block">{t('invoiceForm.unitPrice')}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none text-[10px] font-black font-mono text-right text-emerald-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between gap-4 self-end pb-1">
                      <div className="flex-1 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                        <label className="flex items-center gap-2 cursor-pointer group justify-center">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => handleItemChange(index, 'taxable', e.target.checked)}
                            className="w-3 h-3 rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500/20"
                          />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{t('invoiceForm.tax')}</span>
                        </label>
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all active:scale-90">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  {t('common.status')}
                </label>
                <div className="flex bg-slate-950 rounded-2xl p-1 border border-slate-800">
                  {['draft', 'sent', 'paid', 'overdue'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleInputChange('status', s)}
                      className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${formData.status === s ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  {t('common.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/50 text-white px-6 py-5 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] resize-none placeholder:text-slate-800"
                  placeholder={t('invoiceForm.notesPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Invoice Summary Footer */}
          <footer className="p-10 border-t border-slate-800/50 bg-slate-950/80 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex gap-16">
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('invoiceForm.subtotal')}</p>
                <p className="text-xl font-black text-slate-300 font-mono italic">${subtotal.toFixed(2)}</p>
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('invoiceForm.tax')} ({(getFloridaTaxRate(selectedCustomer?.florida_county || 'Miami-Dade') * 100).toFixed(1)}%)</p>
                <p className="text-xl font-black text-rose-400 font-mono italic">${taxAmount.toFixed(2)}</p>
              </div>
              <div className="group">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-3">{t('invoiceForm.total')}</p>
                <p className="text-5xl font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">${total.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-6 w-full md:w-auto">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 md:flex-none px-8 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 md:flex-none px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40 active:scale-95"
              >
                <Save className="w-5 h-5" />
                {isEditing ? t('invoiceForm.updateInvoice') : t('invoiceForm.createInvoice')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};