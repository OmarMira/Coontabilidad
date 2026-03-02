import React, { useState, useEffect } from 'react';
import { XCircle, Tag, Percent, FileText, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { ProductCategory, getProductCategories } from '../database/simple-db';

interface ProductCategoryFormProps {
  onSubmit: (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: ProductCategory;
  isEditing?: boolean;
}

export const ProductCategoryForm: React.FC<ProductCategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    parent_id: initialData?.parent_id || undefined,
    tax_rate: initialData?.tax_rate || 0,
    active: initialData?.active ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Cargar categorías existentes para el selector de categoría padre
    const allCategories = getProductCategories();
    // Filtrar la categoría actual si estamos editando para evitar referencias circulares
    const availableCategories = isEditing
      ? allCategories.filter(cat => cat.id !== initialData?.id)
      : allCategories;
    setCategories(availableCategories);
  }, [isEditing, initialData?.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la categoría es requerido';
    }

    if (formData.tax_rate < 0 || formData.tax_rate > 100) {
      newErrors.tax_rate = 'La tasa de impuesto debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Obtener categorías jerárquicas para mostrar en el selector
  const getHierarchicalCategories = () => {
    const buildHierarchy = (parentId: number | undefined = undefined, level: number = 0): any[] => {
      const children = categories.filter(cat => cat.parent_id === parentId);
      const result: any[] = [];

      children.forEach(cat => {
        result.push({
          ...cat,
          level,
          displayName: '  '.repeat(level) + cat.name
        });
        result.push(...buildHierarchy(cat.id, level + 1));
      });

      return result;
    };

    return buildHierarchy();
  };

  const hierarchicalCategories = getHierarchicalCategories();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 blur-[120px] pointer-events-none"></div>

        <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="text-blue-500">
              {isEditing ? <Cpu className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Clasificación de Activos v1.0
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95">
            <XCircle className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {/* Nombre */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Tag className={`w-3.5 h-3.5 ${errors.name ? 'text-rose-500' : 'text-blue-500'}`} /> Nombre de la Categoría *
              </label>
              <div className="relative group/input">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full bg-slate-950/50 text-white px-8 py-6 rounded-[2.5rem] border transition-all font-bold uppercase tracking-widest text-[9px] placeholder:text-slate-800 focus:outline-none ${errors.name ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800/50 focus:border-blue-500/50 focus:shadow-[0_0_25px_rgba(59,130,246,0.1)] group-hover/input:border-slate-700'
                    }`}
                  placeholder="Ej: Electrónicos, Servicios de Consultoría"
                />
                {errors.name && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-3 ml-2 animate-bounce">{errors.name}</p>}
              </div>
            </div>

            {/* Categoría Padre */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                Categoría Padre (opcional)
              </label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => handleInputChange('parent_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] h-[58px]"
              >
                <option value="">Sin categoría padre (categoría principal)</option>
                {hierarchicalCategories.map((category) => (
                  <option key={category.id} value={category.id} style={{ color: 'black' }}>
                    {category.displayName.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full bg-slate-950/50 text-white px-8 py-6 rounded-[2rem] border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-medium text-sm placeholder:text-slate-800"
                placeholder="Descripción detallada de la categoría"
              />
            </div>

            {/* Tasa de Impuesto */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Percent className={`w-3.5 h-3.5 ${errors.tax_rate ? 'text-rose-500' : 'text-blue-500'}`} /> Tasa de Impuesto por Defecto (%)
              </label>
              <div className="relative group/input">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                  className={`w-full bg-slate-950/50 text-white px-8 py-6 rounded-[2.5rem] border transition-all font-bold uppercase tracking-widest text-[10px] placeholder:text-slate-800 focus:outline-none ${errors.tax_rate ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800/50 focus:border-blue-500/50 focus:shadow-[0_0_25px_rgba(59,130,246,0.1)] group-hover/input:border-slate-700'
                    }`}
                  placeholder="0.00"
                />
                {errors.tax_rate && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-3 ml-2 animate-bounce">{errors.tax_rate}</p>}
              </div>
            </div>

            {/* Estado activo */}
            <div className="flex items-center gap-4 p-8 bg-slate-950 border border-slate-800 rounded-3xl">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500/20"
              />
              <label htmlFor="active" className="text-xs font-black text-white uppercase tracking-widest cursor-pointer">
                Categoría activa (visible en el sistema)
              </label>
            </div>
          </div>

          <footer className="p-10 border-t border-slate-800 bg-slate-950/50 relative z-10 flex items-center justify-between transition-all">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-2xl"
            >
              Protocolo :: Abortar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95"
            >
              {isEditing ? <Cpu className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              {isEditing ? 'Confirmar Sincronización' : 'Ejecutar Alta'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};