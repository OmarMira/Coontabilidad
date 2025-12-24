import React, { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { FLORIDA_COUNTIES } from '../database/simple-db';

interface CustomerFormProps {
  onSubmit: (name: string, email: string, phone: string, county: string) => void;
  onCancel?: () => void;
  initialData?: {
    name: string;
    email: string;
    phone: string;
    florida_county: string;
  };
  isEditing?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    florida_county: initialData?.florida_county || 'Miami-Dade'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(
        formData.name.trim(),
        formData.email.trim(),
        formData.phone.trim(),
        formData.florida_county
      );
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: '',
          email: '',
          phone: '',
          florida_county: 'Miami-Dade'
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        {isEditing ? (
          <>
            <Save className="w-5 h-5 text-blue-500" />
            Editar Cliente
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 text-green-500" />
            Agregar Cliente
          </>
        )}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${
                errors.name 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
              placeholder="Ej: Juan Pérez"
              required
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${
                errors.email 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
              placeholder="ejemplo@email.com"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${
                errors.phone 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
              placeholder="(305) 555-0123"
            />
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Condado de Florida */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Condado de Florida *
            </label>
            <select
              value={formData.florida_county}
              onChange={(e) => handleInputChange('florida_county', e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            >
              {FLORIDA_COUNTIES.map(county => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`px-6 py-2 rounded-md transition-colors flex items-center gap-2 ${
              isEditing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Actualizar Cliente
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Agregar Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};