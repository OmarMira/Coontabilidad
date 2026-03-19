import { logger } from '../core/logging/SystemLogger';
import React, { useState } from 'react';
import { Plus, Save, XCircle, User, MapPin, CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { FLORIDA_COUNTIES } from '@/database/modules/db-invoices';
import { AddressAutocomplete } from './AddressAutocomplete';
import { addressService } from '../services/addressService';
import { useLocale } from '../i18n/useLocale';

interface SupplierFormProps {
  onSubmit: (supplierData: any) => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // InformaciÃ³n personal
    name: initialData?.name || '',
    business_name: initialData?.business_name || '',
    document_type: initialData?.document_type || 'EIN',
    document_number: initialData?.document_number || '',
    business_type: initialData?.business_type || '',

    // Datos de contacto
    email: initialData?.email || '',
    email_secondary: initialData?.email_secondary || '',
    phone: initialData?.phone || '',
    phone_secondary: initialData?.phone_secondary || '',

    // DirecciÃ³n
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
    assigned_buyer: initialData?.assigned_buyer || '',

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
    { id: 'personal', label: t('supplierForm.info'), icon: User },
    { id: 'contact', label: t('customerDetail.contact'), icon: FileText },
    { id: 'address', label: t('customerDetail.address'), icon: MapPin },
    { id: 'commercial', label: t('customerDetail.commercialData'), icon: CreditCard }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('customerForm.errorName');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('common.invalidEmail');
    }

    if (formData.phone && !/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = t('common.invalidPhone');
    }

    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = t('customerForm.errorInvalidZip');
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
          name: '', business_name: '', document_type: 'EIN', document_number: '', business_type: '',
          email: '', email_secondary: '', phone: '', phone_secondary: '',
          address_line1: '', address_line2: '', city: 'Miami', state: 'FL', zip_code: '', florida_county: 'Miami-Dade',
          credit_limit: 0, payment_terms: 30, tax_exempt: false, tax_id: '', assigned_buyer: '',
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
    logger.info('SupplierForm', 'info', 'Address selected:', addressDetails);

    // Actualizar los campos de direcciÃ³n con los datos seleccionados
    setFormData(prev => ({
      ...prev,
      city: addressDetails.city,
      state: addressDetails.state,
      zip_code: addressDetails.zipCode,
      florida_county: addressDetails.state === 'FL' ?
        addressService.getFloridaCounty(addressDetails.county || '', addressDetails.city) :
        prev.florida_county
    }));
  };

  const handleZipCodeChange = async (zipCode: string) => {
    handleInputChange('zip_code', zipCode);

    // Si el cÃ³digo postal tiene 5 dÃ­gitos, buscar automÃ¡ticamente
    if (zipCode.length === 5 && /^\d{5}$/.test(zipCode)) {
      try {
        const result = await addressService.searchByZipCode(zipCode);
        if (result) {
          setFormData(prev => ({
            ...prev,
            city: result.city,
            state: result.stateCode,
            zip_code: result.zipCode,
            florida_county: result.stateCode === 'FL' ? result.county : prev.florida_county
          }));
        }
      } catch (error) {
        logger.error('SupplierForm', 'error', 'Error searching by zip code:', error);
      }
    }
  };

  const renderPersonalTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('supplierForm.name')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full bg-slate-950/50 text-white px-4 py-3 rounded-2xl border transition-all font-bold uppercase tracking-widest text-[9px] focus:outline-none ${errors.name ? 'border-rose-500' : 'border-slate-800/50 focus:border-blue-500/50'
              }`}
            placeholder={t('supplierForm.namePlaceholder')}
            required
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('supplierForm.businessName')}
          </label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => handleInputChange('business_name', e.target.value)}
            className="w-full bg-slate-950/50 text-white px-4 py-3 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px]"
            placeholder={t('supplierForm.businessNamePlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('supplierForm.documentType')}
          </label>
          <select
            value={formData.document_type}
            onChange={(e) => handleInputChange('document_type', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          >
            <option value="EIN">EIN - Employer Identification Number</option>
            <option value="SSN">SSN - Social Security Number</option>
            <option value="ITIN">ITIN - Individual Taxpayer ID</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('supplierForm.documentNumber')}
          </label>
          <input
            type="text"
            value={formData.document_number}
            onChange={(e) => handleInputChange('document_number', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            placeholder={t('supplierForm.documentNumberPlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
          {t('supplierForm.businessActivity')}
        </label>
        <input
          type="text"
          value={formData.business_type}
          onChange={(e) => handleInputChange('business_type', e.target.value)}
          className="w-full bg-slate-950/50 text-white px-4 py-3 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px]"
          placeholder={t('supplierForm.businessActivityPlaceholder')}
        />
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.primaryEmail')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full bg-white/5 text-white px-4 py-2 rounded-md border transition-colors ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-blue-500'
              } focus:outline-none`}
            placeholder={t('supplierForm.emailPlaceholder')}
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.secondaryEmail')}
          </label>
          <input
            type="email"
            value={formData.email_secondary}
            onChange={(e) => handleInputChange('email_secondary', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            placeholder={t('supplierForm.emailSecondaryPlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.primaryPhone')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full bg-white/5 text-white px-4 py-2 rounded-md border transition-colors ${errors.phone ? 'border-red-500' : 'border-white/10 focus:border-blue-500'
              } focus:outline-none`}
            placeholder="(305) 555-0123"
          />
          {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.secondaryPhone')}
          </label>
          <input
            type="tel"
            value={formData.phone_secondary}
            onChange={(e) => handleInputChange('phone_secondary', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            placeholder="(305) 555-0124"
          />
        </div>
      </div>
    </div>
  );

  const renderAddressTab = () => (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
        <h4 className="text-blue-300 font-medium mb-2">{t('customerForm.autoCompleteTitle')}</h4>
        <p className="text-blue-200 text-sm">
          {t('customerForm.autoCompleteHelp')}
          Usa APIs gratuitas de OpenStreetMap para sugerir direcciones adicionales.
        </p>
      </div>

      {/* Autocompletado de direcciones */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
          {t('customerForm.autoCompleteTitle')}
        </label>
        <AddressAutocomplete
          onAddressSelect={handleAddressSelect}
          placeholder={t('customerForm.autoCompletePlaceholder')}
          className="mb-4"
        />
        <p className="text-xs text-slate-500 mt-1">
          {t('customerForm.autoCompleteTip')}
        </p>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
          {t('customerForm.addressLine1')}
        </label>
        <input
          type="text"
          value={formData.address_line1}
          onChange={(e) => handleInputChange('address_line1', e.target.value)}
          className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          placeholder="1234 Main Street"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
          {t('customerForm.addressLine2')}
        </label>
        <input
          type="text"
          value={formData.address_line2}
          onChange={(e) => handleInputChange('address_line2', e.target.value)}
          className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          placeholder="Suite 200, Building B, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.city')}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            placeholder="Miami"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.state')}
          </label>
          <select
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          >
            {US_STATES.map(state => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.zipCode')}
          </label>
          <input
            type="text"
            value={formData.zip_code}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            className={`w-full bg-white/5 text-white px-4 py-2 rounded-md border transition-colors ${errors.zip_code ? 'border-red-500' : 'border-white/10 focus:border-blue-500'
              } focus:outline-none`}
            placeholder="33101"
            maxLength={10}
          />
          {errors.zip_code && <p className="text-red-400 text-sm mt-1">{errors.zip_code}</p>}
        </div>
      </div>

      {/* Condado de Florida - solo mostrar si el estado es FL */}
      {formData.state === 'FL' && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            {t('customerForm.county')}
          </label>
          <select
            value={formData.florida_county}
            onChange={(e) => handleInputChange('florida_county', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            required
          >
            {FLORIDA_COUNTIES.map(county => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {t('customerForm.countyHelp')}
          </p>
        </div>
      )}
    </div>
  );

  const renderCommercialTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.creditLimit')}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.credit_limit}
            onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.paymentTerms')}
          </label>
          <select
            value={formData.payment_terms}
            onChange={(e) => handleInputChange('payment_terms', parseInt(e.target.value))}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          >
            <option value={0}>{t('customerForm.immediatePayment')}</option>
            <option value={15}>{t('customerForm.days', { n: 15 })}</option>
            <option value={30}>{t('customerForm.days', { n: 30 })}</option>
            <option value={45}>{t('customerForm.days', { n: 45 })}</option>
            <option value={60}>{t('customerForm.days', { n: 60 })}</option>
            <option value={90}>{t('customerForm.days', { n: 90 })}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('customerForm.taxId')}
          </label>
          <input
            type="text"
            value={formData.tax_id}
            onChange={(e) => handleInputChange('tax_id', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
            placeholder="12-3456789"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('supplierForm.assignedBuyer')}
          </label>
          <select
            value={formData.assigned_buyer}
            onChange={(e) => handleInputChange('assigned_buyer', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          >
            <option value="">{t('customerForm.unassigned')}</option>
            <option value="Ana GarcÃ­a">Ana GarcÃ­a</option>
            <option value="Carlos LÃ³pez">Carlos LÃ³pez</option>
            <option value="MarÃ­a RodrÃ­guez">MarÃ­a RodrÃ­guez</option>
            <option value="Juan MartÃ­nez">Juan MartÃ­nez</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
            {t('supplierForm.status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          >
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
            <option value="suspended">{t('common.suspended')}</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 pt-6">
          <input
            type="checkbox"
            id="tax_exempt"
            checked={formData.tax_exempt}
            onChange={(e) => handleInputChange('tax_exempt', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-white/5 border-white/10 rounded focus:ring-blue-500"
          />
          <label htmlFor="tax_exempt" className="text-sm font-medium text-slate-400">
            {t('customerForm.taxExempt')}
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">
          {t('customerForm.notes')}
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
          placeholder={t('supplierForm.notesPlaceholder')}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none"></div>

        <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="text-blue-500">
              {isEditing ? <FileText className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? t('supplierForm.titleEdit') : t('supplierForm.titleNew')}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {t('supplierForm.info')}
              </p>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95">
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </header>

        {/* PestaÃ±as */}
        <div className="flex px-10 border-b border-slate-800/50 bg-slate-950/20 relative z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-white'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="min-h-[400px]">
              {activeTab === 'personal' && renderPersonalTab()}
              {activeTab === 'contact' && renderContactTab()}
              {activeTab === 'address' && renderAddressTab()}
              {activeTab === 'commercial' && renderCommercialTab()}
            </div>
          </div>

          <footer className="p-10 border-t border-slate-800 bg-slate-950/50 relative z-10 flex items-center justify-between">
            <div className="flex gap-6">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  {t('common.previous')}
                </button>
              )}

              {activeTab !== 'commercial' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                  }}
                  className="px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                >
                  {t('common.next')}
                </button>
              )}
            </div>

            <div className="flex gap-6 w-full md:w-auto">
              <button
                type="submit"
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40 active:scale-95"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? t('supplierForm.updateSupplier') : t('supplierForm.createSupplier')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};
