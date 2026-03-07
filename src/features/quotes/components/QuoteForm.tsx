import React, { useState, useEffect } from 'react';
import { Quote, QuoteLine, Customer, Product } from '@/database/simple-db';
import { X, Plus, Trash2, Save, Calculator } from 'lucide-react';
import { useLocale } from '../../../i18n/useLocale';

interface QuoteFormProps {
  quote?: Quote;
  customers: Customer[];
  products: Product[];
  onSave: (quoteData: Partial<Quote>, items: Partial<QuoteLine>[]) => void;
  onCancel: () => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  customers,
  products,
  onSave,
  onCancel
}) => {
  const { t, formatCurrency } = useLocale();

  const [formData, setFormData] = useState<Partial<Quote>>({
    customer_id: quote?.customer_id || 0,
    issue_date: quote?.issue_date || new Date().toISOString().split('T')[0],
    expiration_date: quote?.expiration_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: quote?.status || 'draft',
    notes: quote?.notes || '',
    terms: quote?.terms || t('termsDefault', { defaultValue: 'Válido por 30 días. Precios sujetos a cambio sin previo aviso.' })
  });

  const [items, setItems] = useState<Partial<QuoteLine>[]>(
    quote?.items || [{ description: '', quantity: 1, unit_price: 0, discount_percentage: 0, taxable: true }]
  );

  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

  // Calcular totales cuando cambien los items
  useEffect(() => {
    calculateTotals();
  }, [items, formData.customer_id]);

  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;

    items.forEach(item => {
      const discount = (item.discount_percentage || 0) / 100;
      const lineTotal = (item.quantity || 0) * (item.unit_price || 0) * (1 - discount);
      subtotal += lineTotal;

      if (item.taxable) {
        // Tasa de impuesto simplificada (7% para Miami-Dade)
        tax += lineTotal * 0.07;
      }
    });

    const total = subtotal + tax;

    setTotals({
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    });
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, discount_percentage: 0, taxable: true }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteLine, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        description: product.name,
        unit_price: product.price,
        taxable: true
      };
      setItems(newItems);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      alert(t('quotes.form.alerts.selectCustomer'));
      return;
    }

    if (items.length === 0 || !items[0].description) {
      alert(t('quotes.form.alerts.addItem'));
      return;
    }

    onSave(formData, items);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Calculator className="w-7 h-7" />
            {quote ? t('quotes.form.editTitle') : t('quotes.form.newTitle')}
          </h2>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('quotes.form.customer')}
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>{t('quotes.form.selectCustomer')}</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('quotes.form.statusLabel')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">{t('quotes.form.status.draft')}</option>
                <option value="sent">{t('quotes.form.status.sent')}</option>
                <option value="accepted">{t('quotes.form.status.accepted')}</option>
                <option value="rejected">{t('quotes.form.status.rejected')}</option>
                <option value="expired">{t('quotes.form.status.expired')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('quotes.form.issueDate')}
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('quotes.form.expirationDate')}
              </label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t('quotes.form.itemsTitle')}</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('quotes.form.addItem')}
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                      <label className="block text-xs text-slate-400 mb-1">{t('quotes.form.product')}</label>
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => handleProductSelect(index, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                      >
                        <option value="">{t('quotes.form.selectProduct')}</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs text-slate-400 mb-1">{t('quotes.form.description')}</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        placeholder="Descripción..."
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs text-slate-400 mb-1">{t('quotes.form.quantity')}</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">{t('quotes.form.unitPrice')}</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs text-slate-400 mb-1">{t('quotes.form.discount')}</label>
                      <input
                        type="number"
                        value={item.discount_percentage}
                        onChange={(e) => handleItemChange(index, 'discount_percentage', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div className="col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>{t('quotes.form.subtotal')}</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{t('quotes.form.tax')}</span>
                  <span className="font-semibold">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-white text-xl font-black tracking-tight border-t border-slate-700 pt-2">
                  <span>{t('quotes.form.total')}</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notas y Términos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('quotes.form.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('quotes.form.notesPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('quotes.form.terms')}
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('quotes.form.termsPlaceholder')}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {t('quotes.form.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {quote ? t('quotes.form.update') : t('quotes.form.create')} {t('quotes.form.quote')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
