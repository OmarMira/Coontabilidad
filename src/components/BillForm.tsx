import React, { useState, useEffect } from 'react';
import {
  Plus, Save, X, Calculator, Truck, Calendar,
  ShieldCheck, Zap, Cpu, Sparkles, DollarSign, Info, Layers, Clock
} from 'lucide-react';
import { Supplier, Product, Bill, BillItem, getFloridaTaxRate } from '../database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface BillFormProps {
  onSubmit: (billData: Partial<Bill>, items: Partial<BillItem>[]) => void;
  onCancel?: () => void;
  suppliers: Supplier[];
  products: Product[];
  initialData?: Bill;
  isEditing?: boolean;
}

interface FormData {
  supplier_id: number | '';
  issue_date: string;
  due_date: string;
  status: 'draft' | 'received' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
}

interface ItemData {
  product_id: number | '';
  description: string;
  quantity: number;
  unit_price: number;
  taxable: boolean;
}

export const BillForm: React.FC<BillFormProps> = ({
  onSubmit,
  onCancel,
  suppliers,
  products,
  initialData,
  isEditing = false
}) => {
  const { t } = useLocale();
  const [formData, setFormData] = useState<FormData>({
    supplier_id: initialData?.supplier_id || '',
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
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleItemChange = (index: number, field: keyof ItemData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unit_price = product.cost || product.price;
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
    const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
    const county = selectedSupplier?.florida_county || 'Miami-Dade';
    const taxRate = getFloridaTaxRate(county);

    items.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      subtotal += lineTotal;
      if (item.taxable) taxAmount += lineTotal * taxRate;
    });

    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const { subtotal, taxAmount, total } = calculateTotals();
  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación: asegurar que hay proveedor seleccionado
    if (!formData.supplier_id) {
      alert(t('billForm.validation.supplier'));
      return;
    }

    // Validación: asegurar que hay al menos un item
    if (!items || items.length === 0) {
      alert(t('billForm.validation.items'));
      return;
    }

    const billData: Partial<Bill> = { ...formData, supplier_id: formData.supplier_id as number };
    const billItems = items.map(item => ({ ...item, product_id: item.product_id || undefined }));
    onSubmit(billData, billItems);
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] shadow-3xl w-full max-w-6xl my-auto overflow-hidden flex flex-col relative transition-all duration-700 animate-in zoom-in-95">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] pointer-events-none"></div>

        {/* Header Hub */}
        <header className="flex items-center justify-between p-10 border-b border-slate-800 relative z-10 bg-slate-900/50">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-orange-600/10 rounded-2.5xl border border-orange-500/20 text-orange-500 shadow-xl animate-pulse">
              {isEditing ? <Cpu className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? t('billForm.titleEdit') : t('billForm.titleNew')}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> {t('billForm.protocol')}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
            <X className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar max-h-[70vh]">

            {/* Phase 1: Supplier & Logic Mapping */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              <div className="xl:col-span-1 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Truck className="w-3.5 h-3.5 text-orange-500" /> {t('billForm.primarySupplier')}
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => handleInputChange('supplier_id', parseInt(e.target.value) || '')}
                    className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none font-black uppercase tracking-widest text-[10px] transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">{t('billForm.selectSupplier')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{(s.business_name || s.name).toUpperCase()}</option>)}
                  </select>
                </div>

                {selectedSupplier && (
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50"></div>
                    <div className="space-y-4 relative z-10">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('billForm.supplierMetadata')}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-bold text-slate-600 uppercase">{t('billForm.jurisdiction')}</p>
                          <p className="text-[10px] font-black text-white">{selectedSupplier.florida_county.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-600 uppercase">{t('billForm.terms')}</p>
                          <p className="text-[10px] font-black text-orange-500">{selectedSupplier.payment_terms} {t('billForm.days')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                <PremiumInput label={t('billForm.issueDate')} icon={Calendar} value={formData.issue_date} onChange={(v: any) => handleInputChange('issue_date', v)} type="date" required />
                <PremiumInput label={t('billForm.dueDate')} icon={Clock} value={formData.due_date} onChange={(v: any) => handleInputChange('due_date', v)} type="date" required />

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Zap className="w-3.5 h-3.5 text-orange-500" /> {t('billForm.operationalStatus')}
                  </label>
                  <div className="flex bg-slate-950 rounded-2xl p-1 border border-slate-800">
                    {['draft', 'received', 'approved', 'paid'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleInputChange('status', s)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Info className="w-3.5 h-3.5 text-orange-500" /> {t('billForm.auditNotes')}
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder={t('billForm.notesPlaceholder')}
                    className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none font-black uppercase tracking-widest text-[10px]"
                  />
                </div>
              </div>
            </div>

            {/* Phase 2: Transaction Matrix (Line Items) */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                  <Layers className="w-6 h-6 text-orange-500" /> {t('billForm.transactionMatrix')}
                </h3>
                <button type="button" onClick={addItem} className="px-6 py-3 bg-orange-600/10 border border-orange-500/20 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
                  {t('billForm.addLine')}
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 hover:border-slate-700 transition-all group/line">
                    <div className="md:col-span-3">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value) || '')}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-orange-500 focus:outline-none text-[10px] font-black uppercase tracking-widest"
                      >
                        <option value="">{t('billForm.productSku')}</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder={t('billForm.description')}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-orange-500 focus:outline-none text-[10px] font-black uppercase tracking-widest"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-orange-500 focus:outline-none text-[10px] font-black font-mono text-center"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-orange-500 focus:outline-none text-[10px] font-black font-mono text-right text-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between gap-4">
                      <div className="text-right flex-1">
                        <p className="text-[8px] font-black text-slate-600 uppercase">Subtotal</p>
                        <p className="text-xs font-black text-white font-mono">{formatCurrency(item.quantity * item.unit_price)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/line:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase 3: Liquid Consolidation (Totals) */}
          <footer className="p-10 border-t border-slate-800 bg-slate-950/80 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex gap-16 order-2 md:order-1">
                <ConsolidationStat label={t('billForm.netSubtotal')} value={formatCurrency(subtotal)} />
                <ConsolidationStat label={t('billForm.taxFlorida')} value={formatCurrency(taxAmount)} />
                <div className="group">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-3">{t('billForm.totalObligated')}</p>
                  <p className="text-5xl font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">{formatCurrency(total)}</p>
                </div>
              </div>

              <div className="flex gap-6 w-full md:w-auto order-1 md:order-2">
                <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all">
                  {t('billForm.abortProtocol')}
                </button>
                <button type="submit" className="flex-1 md:flex-none px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-orange-900/40 hover:-translate-y-1 active:scale-95">
                  <Save className="w-5 h-5" />
                  {isEditing ? t('billForm.confirmAdjustment') : t('billForm.registerObligation')}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

const PremiumInput = ({ label, icon: Icon, value, onChange, type = "text", required, placeholder }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
      <Icon className="w-3.5 h-3.5 text-orange-500" /> {label} {required && '*'}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none font-black uppercase tracking-widest text-[10px] transition-all"
      required={required}
    />
  </div>
);

const ConsolidationStat = ({ label, value }: any) => (
  <div className="text-left">
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-slate-300 font-mono italic">{value}</p>
  </div>
);