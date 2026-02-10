import React, { useState } from 'react';
import { Plus, Save, X, User, MapPin, CreditCard, FileText } from 'lucide-react';
import { FLORIDA_COUNTIES } from '../database/simple-db';
import { AddressAutocomplete } from './ui/AddressAutocomplete';

interface CustomerFormAdvancedProps {
  onSubmit: (customerData: any) => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export const CustomerFormAdvanced: React.FC<CustomerFormAdvancedProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // Información personal
    name: initialData?.name || '',
    business_name: initialData?.business_name || '',
    document_type: initialData?.document_type || 'SSN',
    document_number: initialData?.document_number || '',
    business_type: initialData?.business_type || '',

    // Datos de contacto
    email: initialData?.email || '',
    email_secondary: initialData?.email_secondary || '',
    phone: initialData?.phone || '',
    phone_secondary: initialData?.phone_secondary || '',

    // Dirección
    address_line1: initialData?.address_line1 || '',
    address_line2: initialData?.address_line2 || '',
    city: initialData?.city || 'Miami',
    state: initialData?.state || 'FL',
    zip_code: initialData?.zip_code || '',
    florida_county: initialData?.florida_county || 'Miami-Dade',

    // Datos comerciales
    credit_limit: initialData?.credit_limit || 0,
    payment_terms: initialData?.payment_terms || 30,
    tax_exempt: initialData?.tax_exempt || false,
    tax_id: initialData?.tax_id || '',
    assigned_salesperson: initialData?.assigned_salesperson || '',

    // Metadatos
    status: initialData?.status || 'active',
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados de Estados Unidos
  const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' }
  ];

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'contact', label: 'Contacto', icon: FileText },
    { id: 'address', label: 'Dirección', icon: MapPin },
    { id: 'commercial', label: 'Datos Comerciales', icon: CreditCard }
  ];
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

    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Código postal inválido (formato: 12345 o 12345-6789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);

      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: '', business_name: '', document_type: 'SSN', document_number: '', business_type: '',
          email: '', email_secondary: '', phone: '', phone_secondary: '',
          address_line1: '', address_line2: '', city: 'Miami', state: 'FL', zip_code: '', florida_county: 'Miami-Dade',
          credit_limit: 0, payment_terms: 30, tax_exempt: false, tax_id: '', assigned_salesperson: '',
          status: 'active', notes: ''
        });
        setActiveTab('personal');
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressSelect = async (addressDetails: any) => {
    console.log('Address selected:', addressDetails);

    // Actualizar los campos de dirección con los datos seleccionados
    setFormData(prev => ({
      ...prev,
      address_line1: addressDetails.address,
      city: addressDetails.city,
      state: addressDetails.state,
      zip_code: addressDetails.zipCode,
      florida_county: addressDetails.state === 'FL' && addressDetails.county ?
        addressDetails.county :
        prev.florida_county
    }));
  };

  const handleZipCodeChange = async (zipCode: string) => {
    handleInputChange('zip_code', zipCode);
  };

  const renderPersonalTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nombre Completo / Razón Social *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.name ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
            placeholder="Ej: Juan Pérez o Acme Corp LLC"
            required
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nombre Comercial
          </label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => handleInputChange('business_name', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Nombre comercial o DBA"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tipo de Documento
          </label>
          <select
            value={formData.document_type}
            onChange={(e) => handleInputChange('document_type', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="SSN">SSN - Social Security Number</option>
            <option value="EIN">EIN - Employer Identification Number</option>
            <option value="ITIN">ITIN - Individual Taxpayer ID</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Número de Documento
          </label>
          <input
            type="text"
            value={formData.document_number}
            onChange={(e) => handleInputChange('document_number', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="123-45-6789 o 12-3456789"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tipo de Negocio / Actividad
        </label>
        <input
          type="text"
          value={formData.business_type}
          onChange={(e) => handleInputChange('business_type', e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Ej: Desarrollo de Software, Consultoría, Retail"
        />
      </div>
    </div>
  );
  const renderContactTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email Principal
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.email ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
            placeholder="ejemplo@email.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email Secundario
          </label>
          <input
            type="email"
            value={formData.email_secondary}
            onChange={(e) => handleInputChange('email_secondary', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="secundario@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Teléfono Principal
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
            placeholder="(305) 555-0123"
          />
          {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Teléfono Secundario
          </label>
          <input
            type="tel"
            value={formData.phone_secondary}
            onChange={(e) => handleInputChange('phone_secondary', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="(305) 555-0124"
          />
        </div>
      </div>
    </div>
  );

  const renderAddressTab = () => (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
        <h4 className="text-blue-300 font-medium mb-2">🌟 Autocompletado de Direcciones</h4>
        <p className="text-blue-200 text-sm">
          Busca por ciudad, estado o código postal. Incluye más de 400 ciudades principales de Estados Unidos.
          Usa APIs gratuitas de OpenStreetMap para sugerir direcciones adicionales.
        </p>
      </div>

      {/* Autocompletado de direcciones */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Buscar Ciudad/Estado/Código Postal
        </label>
        <AddressAutocomplete
          value={formData.address_line1}
          onChange={(addr) => handleInputChange('address_line1', addr)}
          onAddressSelect={handleAddressSelect}
          placeholder="Empiece a escribir una dirección..."
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          💡 Tip: Escribe al menos 2 caracteres. Funciona con ciudades, estados y códigos postales de todo Estados Unidos
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Dirección Línea 1 *
        </label>
        <input
          type="text"
          value={formData.address_line1}
          onChange={(e) => handleInputChange('address_line1', e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="1234 Main Street"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Dirección Línea 2
        </label>
        <input
          type="text"
          value={formData.address_line2}
          onChange={(e) => handleInputChange('address_line2', e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Apt 101, Suite 200, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Ciudad *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Miami"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Estado *
          </label>
          <select
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {US_STATES.map(state => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Código Postal *
          </label>
          <input
            type="text"
            value={formData.zip_code}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded-md border transition-colors ${errors.zip_code ? 'border-red-500' : 'border-gray-600 focus:border-blue-500'
              } focus:outline-none`}
            placeholder="33101"
            maxLength={10}
          />
          {errors.zip_code && <p className="text-red-400 text-sm mt-1">{errors.zip_code}</p>}
          <p className="text-xs text-gray-400 mt-1">
            💡 Tip: Al escribir un código postal de 5 dígitos, se completarán automáticamente ciudad y estado
          </p>
        </div>
      </div>

      {/* Condado de Florida - solo mostrar si el estado es FL */}
      {formData.state === 'FL' && (
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
          <p className="text-xs text-gray-400 mt-1">
            Requerido para el cálculo correcto de impuestos de Florida
          </p>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-gray-900 rounded-lg p-4 mt-6">
        <h4 className="text-gray-300 font-medium mb-2">ℹ️ Autocompletado de Direcciones</h4>
        <div className="text-sm text-gray-400 space-y-1">
          <p>• <strong>Funciona con 2+ caracteres:</strong> Escribe ciudad, estado o código postal</p>
          <p>• <strong>Cobertura nacional:</strong> Más de 400 ciudades principales de Estados Unidos</p>
          <p>• <strong>APIs gratuitas:</strong> Usa OpenStreetMap Nominatim (sin costos recurrentes)</p>
          <p>• <strong>Ejemplos:</strong> "Miami", "NY", "90210", "Chicago", "Los Angeles"</p>
          <p>• <strong>Florida:</strong> El condado se selecciona automáticamente cuando es posible</p>
          <p>• Todos los campos marcados con * son obligatorios</p>
        </div>
      </div>
    </div>
  );
  const renderCommercialTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Límite de Crédito ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.credit_limit}
            onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Términos de Pago (días)
          </label>
          <select
            value={formData.payment_terms}
            onChange={(e) => handleInputChange('payment_terms', parseInt(e.target.value))}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value={0}>Pago inmediato</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={45}>45 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tax ID / Número de Impuestos
          </label>
          <input
            type="text"
            value={formData.tax_id}
            onChange={(e) => handleInputChange('tax_id', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="12-3456789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Vendedor Asignado
          </label>
          <select
            value={formData.assigned_salesperson}
            onChange={(e) => handleInputChange('assigned_salesperson', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Sin asignar</option>
            <option value="Ana García">Ana García</option>
            <option value="Carlos López">Carlos López</option>
            <option value="María Rodríguez">María Rodríguez</option>
            <option value="Juan Martínez">Juan Martínez</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Estado del Cliente
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 pt-6">
          <input
            type="checkbox"
            id="tax_exempt"
            checked={formData.tax_exempt}
            onChange={(e) => handleInputChange('tax_exempt', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="tax_exempt" className="text-sm font-medium text-gray-300">
            Exento de Impuestos
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Notas Adicionales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Notas adicionales sobre el cliente..."
        />
      </div>
    </div>
  );
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        {isEditing ? (
          <>
            <Save className="w-5 h-5 text-blue-500" />
            Editar Cliente
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 text-green-500" />
            Nuevo Cliente
          </>
        )}
      </h2>

      {/* Pestañas */}
      <div className="flex space-x-1 mb-6 bg-gray-900 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors flex-1 text-sm ${activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Contenido de las pestañas */}
        <div className="min-h-[400px]">
          {activeTab === 'personal' && renderPersonalTab()}
          {activeTab === 'contact' && renderContactTab()}
          {activeTab === 'address' && renderAddressTab()}
          {activeTab === 'commercial' && renderCommercialTab()}
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-6 border-t border-gray-700">
          <div className="flex space-x-3">
            {activeTab !== 'personal' && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1].id);
                  }
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Anterior
              </button>
            )}

            {activeTab !== 'commercial' && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1].id);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>

          <div className="flex space-x-3">
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
              className={`px-6 py-2 rounded-md transition-colors flex items-center gap-2 ${isEditing
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
                  Crear Cliente
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};