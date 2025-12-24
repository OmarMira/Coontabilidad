import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Hash, Tag, Truck, BarChart3, AlertTriangle } from 'lucide-react';
import { Product, ProductCategory, Supplier, getProductCategories, getSuppliers } from '../database/simple-db';

interface ProductFormProps {
  onSubmit: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: Product;
  isEditing?: boolean;
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
    // Cargar categorías y proveedores
    setCategories(getProductCategories());
    setSuppliers(getSuppliers());
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    }

    if (formData.price < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }

    if (formData.cost && formData.cost < 0) {
      newErrors.cost = 'El costo no puede ser negativo';
    }

    if (!formData.is_service) {
      if (formData.stock_quantity < 0) {
        newErrors.stock_quantity = 'La cantidad en stock no puede ser negativa';
      }

      if (formData.min_stock_level < 0) {
        newErrors.min_stock_level = 'El stock mínimo no puede ser negativo';
      }

      if (formData.max_stock_level < formData.min_stock_level) {
        newErrors.max_stock_level = 'El stock máximo debe ser mayor al mínimo';
      }

      if (formData.reorder_point < 0) {
        newErrors.reorder_point = 'El punto de reorden no puede ser negativo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Limpiar campos no aplicables para servicios
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
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const tabs = [
    { id: 'basic', label: 'Información Básica', icon: Package },
    { id: 'inventory', label: 'Inventario', icon: BarChart3 },
    { id: 'advanced', label: 'Avanzado', icon: Tag }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isEditing ? 'Modifica la información del producto' : 'Agrega un nuevo producto o servicio al catálogo'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Información Básica */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Tipo de producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Producto
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.is_service}
                        onChange={() => handleInputChange('is_service', false)}
                        className="mr-2"
                      />
                      <span className="text-white">Producto Físico</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.is_service}
                        onChange={() => handleInputChange('is_service', true)}
                        className="mr-2"
                      />
                      <span className="text-white">Servicio</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SKU *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.sku ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Ej: PROD-001"
                      />
                    </div>
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-400">{errors.sku}</p>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Nombre del producto"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categoría
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unidad de medida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unidad de Medida
                    </label>
                    <select
                      value={formData.unit_of_measure}
                      onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="pieza">Pieza</option>
                      <option value="kg">Kilogramo</option>
                      <option value="litro">Litro</option>
                      <option value="metro">Metro</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="hora">Hora</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Precio de Venta *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.price ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-400">{errors.price}</p>
                    )}
                  </div>

                  {/* Costo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Costo
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost || ''}
                        onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cost ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.cost && (
                      <p className="mt-1 text-sm text-red-400">{errors.cost}</p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción detallada del producto"
                  />
                </div>

                {/* Configuración de impuestos */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="taxable"
                      checked={formData.taxable}
                      onChange={(e) => handleInputChange('taxable', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="taxable" className="text-white">
                      Producto gravable (sujeto a impuestos)
                    </label>
                  </div>

                  {formData.taxable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tasa de Impuesto Específica (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tax_rate || ''}
                        onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Dejar vacío para usar tasa por defecto"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Si se deja vacío, se usará la tasa de impuesto por defecto según el condado del cliente
                      </p>
                    </div>
                  )}
                </div>

                {/* Duración del servicio (solo para servicios) */}
                {formData.is_service && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duración del Servicio (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.service_duration || ''}
                      onChange={(e) => handleInputChange('service_duration', parseInt(e.target.value) || undefined)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 60 para 1 hora"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab: Inventario */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                {formData.is_service ? (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-blue-400 mr-2" />
                      <p className="text-blue-300">
                        Los servicios no requieren gestión de inventario
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stock actual */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Cantidad en Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stock_quantity}
                          onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.stock_quantity ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.stock_quantity && (
                          <p className="mt-1 text-sm text-red-400">{errors.stock_quantity}</p>
                        )}
                      </div>

                      {/* Stock mínimo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock Mínimo
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.min_stock_level}
                          onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.min_stock_level ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.min_stock_level && (
                          <p className="mt-1 text-sm text-red-400">{errors.min_stock_level}</p>
                        )}
                      </div>

                      {/* Stock máximo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock Máximo
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.max_stock_level}
                          onChange={(e) => handleInputChange('max_stock_level', parseInt(e.target.value) || 0)}
                          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.max_stock_level ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.max_stock_level && (
                          <p className="mt-1 text-sm text-red-400">{errors.max_stock_level}</p>
                        )}
                      </div>

                      {/* Punto de reorden */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Punto de Reorden
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.reorder_point}
                          onChange={(e) => handleInputChange('reorder_point', parseInt(e.target.value) || 0)}
                          className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.reorder_point ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.reorder_point && (
                          <p className="mt-1 text-sm text-red-400">{errors.reorder_point}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          Cantidad mínima antes de generar alerta de reposición
                        </p>
                      </div>
                    </div>

                    {/* Proveedor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Proveedor Principal
                      </label>
                      <div className="relative">
                        <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          value={formData.supplier_id || ''}
                          onChange={(e) => handleInputChange('supplier_id', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar proveedor</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Código de barras */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Código de Barras
                      </label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Código de barras del producto"
                      />
                    </div>

                    {/* Peso y dimensiones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.weight || ''}
                          onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Dimensiones (LxWxH)
                        </label>
                        <input
                          type="text"
                          value={formData.dimensions}
                          onChange={(e) => handleInputChange('dimensions', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: 10x5x3 cm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Avanzado */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* Período de garantía */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Período de Garantía (días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warranty_period || ''}
                    onChange={(e) => handleInputChange('warranty_period', parseInt(e.target.value) || undefined)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 365 para 1 año"
                  />
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ruta de Imagen
                  </label>
                  <input
                    type="text"
                    value={formData.image_path}
                    onChange={(e) => handleInputChange('image_path', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL o ruta de la imagen del producto"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Información adicional sobre el producto"
                  />
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
                    Producto activo (visible en el catálogo)
                  </label>
                </div>
              </div>
            )}
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
              {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};