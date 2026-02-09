import React, { useState, useEffect } from 'react';
import {
  X, Package, DollarSign, Hash, Tag, Truck, BarChart3,
  AlertTriangle, ShieldCheck, Zap, Cpu, Sparkles, Box, Server,
  Layers, Settings, Info, Maximize2, Save, Plus
} from 'lucide-react';
import { Product, ProductCategory, Supplier, getProductCategories, getSuppliers } from '../database/simple-db';

interface ProductFormProps {
  onSubmit: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: Product;
  isEditing?: boolean;
  categories?: ProductCategory[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'inventory' | 'advanced'>('basic');

  const [formData, setFormData] = useState({
    sku: initialData?.sku || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    cost: initialData?.cost || 0,
    category_id: initialData?.category_id || undefined,
    unit_of_measure: initialData?.unit_of_measure || 'unidad',
    taxable: initialData?.taxable ?? true,
    tax_rate: initialData?.tax_rate || undefined,
    stock_quantity: initialData?.stock_quantity || 0,
    min_stock_level: initialData?.min_stock_level || 0,
    max_stock_level: initialData?.max_stock_level || 100,
    reorder_point: initialData?.reorder_point || 10,
    supplier_id: initialData?.supplier_id || undefined,
    barcode: initialData?.barcode || '',
    image_path: initialData?.image_path || '',
    weight: initialData?.weight || undefined,
    dimensions: initialData?.dimensions || '',
    is_service: initialData?.is_service ?? false,
    service_duration: initialData?.service_duration || undefined,
    warranty_period: initialData?.warranty_period || undefined,
    notes: initialData?.notes || '',
    active: initialData?.active ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCategories(getProductCategories());
    setSuppliers(getSuppliers());
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.sku.trim()) newErrors.sku = 'SKU mandatorio';
    if (!formData.name.trim()) newErrors.name = 'Identificador mandatorio';
    if (formData.price < 0) newErrors.price = 'Valor negativo no permitido';
    if (formData.cost && formData.cost < 0) newErrors.cost = 'Costo negativo no permitido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const productData = { ...formData };
    if (formData.is_service) {
      productData.stock_quantity = 0;
      productData.min_stock_level = 0;
      productData.max_stock_level = 0;
      productData.reorder_point = 0;
      productData.weight = undefined;
      productData.dimensions = '';
      productData.barcode = '';
    } else {
      productData.service_duration = undefined;
    }

    onSubmit(productData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const tabs = [
    { id: 'basic', label: 'Básico', icon: Info },
    { id: 'inventory', label: 'Matriz', icon: Layers },
    { id: 'advanced', label: 'Protocolos', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none"></div>

        {/* Header */}
        <header className="flex items-center justify-between p-10 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-2.5xl border shadow-lg ${isEditing ? 'bg-blue-600/10 border-blue-500/20 text-blue-500' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500'} animate-pulse`}>
              {isEditing ? <Cpu className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? 'Actualizar Ficha de Activo' : 'Sincronizar Nuevo Activo'}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Registro Central de Inventario v4.2
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Tab Selector */}
        <div className="flex px-10 border-b border-slate-800/50 bg-slate-950/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-emerald-400' : 'text-slate-500 hover:text-white'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            {activeTab === 'basic' && (
              <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Type Selector */}
                  <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Naturaleza del Activo</label>
                    <div className="flex gap-4">
                      <TypeButton
                        active={!formData.is_service}
                        onClick={() => handleInputChange('is_service', false)}
                        icon={Box}
                        label="Producto Físico"
                        color="emerald"
                      />
                      <TypeButton
                        active={formData.is_service}
                        onClick={() => handleInputChange('is_service', true)}
                        icon={Server}
                        label="Servicio / Digital"
                        color="rose"
                      />
                    </div>
                  </div>

                  <PremiumInput label="SKU / Hash" icon={Hash} value={formData.sku} error={errors.sku} onChange={(v) => handleInputChange('sku', v)} placeholder="SKU-999-X" required />
                  <div className="md:col-span-2">
                    <PremiumInput label="Nombre del Activo" icon={Package} value={formData.name} error={errors.name} onChange={(v) => handleInputChange('name', v)} placeholder="NOMBRE DESCRIPTIVO" required />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" /> Clasificación Matriz
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-black uppercase tracking-widest text-[10px]"
                    >
                      <option value="">SIN CATEGORÍA</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" /> Unidad de Control
                    </label>
                    <select
                      value={formData.unit_of_measure}
                      onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                      className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-black uppercase tracking-widest text-[10px]"
                    >
                      {['unidad', 'pieza', 'kg', 'litro', 'metro', 'caja', 'paquete', 'hora', 'servicio'].map(u => (
                        <option key={u} value={u}>{u.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <PremiumInput label="Precio Venta (Unit)" icon={DollarSign} value={formData.price.toString()} error={errors.price} onChange={(v) => handleInputChange('price', parseFloat(v) || 0)} type="number" />
                  <PremiumInput label="Costo Adquisición" icon={DollarSign} value={formData.cost.toString()} error={errors.cost} onChange={(v) => handleInputChange('cost', parseFloat(v) || 0)} type="number" />
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                {formData.is_service ? (
                  <div className="p-16 bg-blue-950/10 border-2 border-dashed border-blue-500/20 rounded-[3rem] text-center">
                    <Zap className="w-16 h-16 text-blue-500 mx-auto mb-6 animate-pulse" />
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Activo Intangible Detectado</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Los servicios no requieren métricas de stock físico.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <PremiumInput label="Stock Actual" icon={Box} value={formData.stock_quantity.toString()} onChange={(v) => handleInputChange('stock_quantity', parseInt(v) || 0)} type="number" />
                    <PremiumInput label="Mínimo Seguridad" icon={AlertTriangle} value={formData.min_stock_level.toString()} onChange={(v) => handleInputChange('min_stock_level', parseInt(v) || 0)} type="number" />
                    <PremiumInput label="Punto de Reorden" icon={Zap} value={formData.reorder_point.toString()} onChange={(v) => handleInputChange('reorder_point', parseInt(v) || 0)} type="number" />
                    <PremiumInput label="Máximo Permitido" icon={Maximize2} value={formData.max_stock_level.toString()} onChange={(v) => handleInputChange('max_stock_level', parseInt(v) || 0)} type="number" />

                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                        <Truck className="w-3.5 h-3.5 text-emerald-500" /> Proveedor Primario
                      </label>
                      <select
                        value={formData.supplier_id || ''}
                        onChange={(e) => handleInputChange('supplier_id', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-black uppercase tracking-widest text-[10px]"
                      >
                        <option value="">SELECCIONAR PROVEEDOR</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <PremiumInput label="Código EAN / Barras" icon={Hash} value={formData.barcode} onChange={(v) => handleInputChange('barcode', v)} placeholder="0000000000" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <PremiumInput label="Garantía (Días)" icon={ShieldCheck} value={formData.warranty_period?.toString() || ''} onChange={(v) => handleInputChange('warranty_period', parseInt(v) || undefined)} type="number" />
                  {formData.is_service && <PremiumInput label="Duración (Minutos)" icon={Zap} value={formData.service_duration?.toString() || ''} onChange={(v) => handleInputChange('service_duration', parseInt(v) || undefined)} type="number" />}

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Info className="w-3.5 h-3.5 text-emerald-500" /> Notas Técnicas
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 text-white px-8 py-6 rounded-[2rem] border border-slate-800 focus:border-emerald-500 focus:outline-none font-medium text-sm placeholder:text-slate-800"
                      placeholder="Información adicional para auditoría..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 p-8 bg-slate-950 border border-slate-800 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="taxable"
                      checked={formData.taxable}
                      onChange={(e) => handleInputChange('taxable', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-emerald-600 focus:ring-emerald-500/20"
                    />
                    <label htmlFor="taxable" className="text-xs font-black text-white uppercase tracking-widest">Activo Gravable (Impuestos)</label>
                  </div>
                  <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500/20"
                    />
                    <label htmlFor="active" className="text-xs font-black text-white uppercase tracking-widest">Visibilidad en Catálogo</label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <footer className="p-10 border-t border-slate-800 bg-slate-950/50 relative z-10 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-3 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sincronización inmutable con el repositorio de activos ALPHA.</span>
            </div>

            <div className="flex gap-6 w-full md:w-auto">
              <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all">
                Abortar Protocolo
              </button>
              <button type="submit" className={`flex-1 md:flex-none px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-2xl ${isEditing ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                } hover:-translate-y-1 active:scale-95`}>
                {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {isEditing ? 'Confirmar Sincronización' : 'Ejecutar Alta de Activo'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

const TypeButton = ({ active, onClick, icon: Icon, label, color }: any) => {
  const variants: any = {
    emerald: active ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/40' : 'bg-slate-900 text-slate-500 border-slate-800 opacity-50',
    rose: active ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/40' : 'bg-slate-900 text-slate-500 border-slate-800 opacity-50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all font-black uppercase tracking-tighter text-xs ${variants[color]}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
};

const PremiumInput = ({ label, icon: Icon, value, error, onChange, placeholder, type = "text", required }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
      <Icon className={`w-3.5 h-3.5 ${error ? 'text-rose-500' : 'text-emerald-500'}`} /> {label} {required && '*'}
    </label>
    <div className="relative group/input">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-950 text-white px-8 py-6 rounded-[2.5rem] border transition-all font-black uppercase tracking-widest text-[10px] placeholder:text-slate-800 focus:outline-none ${error ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800 focus:border-emerald-500 focus:shadow-[0_0_25px_rgba(16,185,129,0.1)] group-hover/input:border-slate-700'
          }`}
        placeholder={placeholder}
        required={required}
      />
      {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-3 ml-2 animate-bounce">{error}</p>}
    </div>
  </div>
);