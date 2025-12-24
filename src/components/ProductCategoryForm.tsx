import React, { useState, useEffect } from 'react';
import { X, Tag, Percent, FileText } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isEditing ? 'Modifica la información de la categoría' : 'Agrega una nueva categoría de productos'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de la Categoría *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Ej: Electrónicos, Servicios de Consultoría"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Categoría Padre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría Padre (opcional)
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => handleInputChange('parent_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin categoría padre (categoría principal)</option>
                  {hierarchicalCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.displayName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Selecciona una categoría padre para crear una subcategoría
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción detallada de la categoría"
                  />
                </div>
              </div>

              {/* Tasa de Impuesto por Defecto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tasa de Impuesto por Defecto (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.tax_rate ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.tax_rate && (
                  <p className="mt-1 text-sm text-red-400">{errors.tax_rate}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Tasa de impuesto que se aplicará por defecto a los productos de esta categoría. 
                  Dejar en 0 para usar la tasa estándar de Florida.
                </p>
              </div>

              {/* Estado activo */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-white">
                  Categoría activa (visible en el sistema)
                </label>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">💡 Consejos para Categorías</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Usa nombres descriptivos y específicos</li>
                  <li>• Las subcategorías heredan propiedades de la categoría padre</li>
                  <li>• La tasa de impuesto se puede sobrescribir a nivel de producto</li>
                  <li>• Las categorías inactivas no aparecen en los formularios de productos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isEditing ? 'Actualizar Categoría' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};