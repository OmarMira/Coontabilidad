import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, CheckCircle, Save, RefreshCw, Shield, FileText, Users, Receipt } from 'lucide-react';
import { getCompanyData, updateCompanyData, checkAccountingDataAssociation, CompanyData } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { LogoUploader } from './LogoUploader';

export function CompanyDataForm() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyData>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [accountingCheck, setAccountingCheck] = useState({ hasData: false, customers: 0, suppliers: 0, invoices: 0, bills: 0 });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<CompanyData>>({});
  const [activeTab, setActiveTab] = useState<'empresa' | 'finanzas' | 'usuarios'>('empresa');

  useEffect(() => {
    loadCompanyData();
    checkAccountingAssociations();
  }, []);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('CompanyDataForm', 'load_start', 'Cargando datos de empresa');
      
      const data = getCompanyData();
      if (data) {
        setCompanyData(data);
        setFormData(data);
        logger.info('CompanyDataForm', 'load_success', 'Datos de empresa cargados');
      } else {
        setError('No se encontraron datos de empresa. Contacte al administrador.');
        logger.warn('CompanyDataForm', 'no_data', 'No se encontraron datos de empresa');
      }
      
    } catch (error) {
      logger.error('CompanyDataForm', 'load_failed', 'Error al cargar datos de empresa', null, error as Error);
      setError('Error al cargar los datos de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const checkAccountingAssociations = () => {
    try {
      const check = checkAccountingDataAssociation();
      setAccountingCheck(check);
      logger.info('CompanyDataForm', 'accounting_check', 'Verificación de datos contables', check);
    } catch (error) {
      logger.error('CompanyDataForm', 'accounting_check_failed', 'Error al verificar datos contables', null, error as Error);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (skipWarning: boolean = false) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setWarnings([]);

      // Si hay datos contables y se están cambiando campos críticos, mostrar advertencia
      if (!skipWarning && accountingCheck.hasData) {
        const criticalFields = ['company_name', 'legal_name', 'tax_id'];
        const hasCriticalChanges = criticalFields.some(field => 
          formData[field as keyof CompanyData] !== companyData?.[field as keyof CompanyData]
        );

        if (hasCriticalChanges) {
          setPendingChanges(formData);
          setShowWarningModal(true);
          setSaving(false);
          return;
        }
      }

      logger.info('CompanyDataForm', 'save_start', 'Guardando datos de empresa', formData);

      const result = updateCompanyData(formData);
      
      if (result.success) {
        setSuccess(result.message);
        if (result.warnings) {
          setWarnings(result.warnings);
        }
        
        // Recargar datos
        await loadCompanyData();
        
        logger.info('CompanyDataForm', 'save_success', 'Datos de empresa guardados correctamente');
      } else {
        setError(result.message);
        logger.error('CompanyDataForm', 'save_failed', 'Error al guardar datos de empresa', { error: result.message });
      }

    } catch (error) {
      logger.error('CompanyDataForm', 'save_exception', 'Excepción al guardar datos de empresa', null, error as Error);
      setError(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
      setShowWarningModal(false);
      setPendingChanges({});
    }
  };

  const confirmSaveWithWarning = () => {
    setFormData(pendingChanges);
    handleSave(true);
  };

  const cancelSaveWithWarning = () => {
    setShowWarningModal(false);
    setPendingChanges({});
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando datos de la empresa...</p>
        </div>
      </div>
    );
  }

  if (error && !companyData) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-300">Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Datos de la Empresa</h1>
            <p className="text-gray-400">Configuración de la empresa propietaria del sistema</p>
          </div>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Alertas de datos contables */}
      {accountingCheck.hasData && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-yellow-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-300 mb-2">⚠️ Empresa con Datos Contables</h3>
              <p className="text-yellow-200 mb-3">
                Esta empresa tiene información contable asociada. Los cambios en datos críticos pueden afectar reportes y documentos.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{accountingCheck.customers} Clientes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">{accountingCheck.suppliers} Proveedores</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">{accountingCheck.invoices} Facturas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-300">{accountingCheck.bills} Compras</span>
                </div>
              </div>
              <p className="text-yellow-200 text-sm">
                💡 <strong>Recomendación:</strong> Cree un respaldo antes de cambiar el nombre de la empresa o datos fiscales.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-green-300">{success}</p>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                <p className="text-yellow-200 text-sm">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario con pestañas */}
      {companyData && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('empresa')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'empresa'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Empresa
              </button>
              <button
                onClick={() => setActiveTab('finanzas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'finanzas'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Finanzas
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'usuarios'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Usuarios
              </button>
            </nav>
          </div>

          {/* Contenido de pestañas */}
          <div className="p-6">
            {activeTab === 'empresa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Información Básica</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Nombre que aparece en facturas y documentos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      value={formData.legal_name || ''}
                      onChange={(e) => handleInputChange('legal_name', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Nombre legal registrado"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tax ID / EIN *
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id || ''}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="+1 (305) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="info@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="www.empresa.com"
                    />
                  </div>

                  {/* Logo de la empresa */}
                  <div className="col-span-full">
                    <LogoUploader
                      currentLogo={formData.logo_path || ''}
                      onLogoChange={(logoPath) => handleInputChange('logo_path', logoPath || '')}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Dirección y configuración */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Dirección y Configuración</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Miami"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estado *
                      </label>
                      <select
                        value={formData.state || 'FL'}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="FL">Florida</option>
                        <option value="CA">California</option>
                        <option value="NY">New York</option>
                        <option value="TX">Texas</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={formData.zip_code || ''}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="33101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Moneda
                    </label>
                    <select
                      value={formData.currency || 'USD'}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="USD">USD - Dólar Estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="CAD">CAD - Dólar Canadiense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Idioma
                    </label>
                    <select
                      value={formData.language || 'es'}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Inicio Año Fiscal
                    </label>
                    <input
                      type="text"
                      value={formData.fiscal_year_start || '01-01'}
                      onChange={(e) => handleInputChange('fiscal_year_start', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="MM-DD (ej: 01-01)"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'finanzas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuraciones de ventas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Configuraciones de Ventas</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comisión Vendedores
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sales_commission_rate || 0}
                        onChange={(e) => handleInputChange('sales_commission_rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.sales_commission_percentage || 0}
                        onChange={(e) => handleInputChange('sales_commission_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="0.00 %"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descuentos
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_amount || 50}
                        onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 50)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.discount_percentage || 0}
                        onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="0.00 %"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tarifa Envío
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.shipping_rate || 0}
                        onChange={(e) => handleInputChange('shipping_rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.shipping_percentage || 0}
                        onChange={(e) => handleInputChange('shipping_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="0.00 %"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Política Reposición (Días)
                    </label>
                    <input
                      type="number"
                      value={formData.reposition_policy_days || 32}
                      onChange={(e) => handleInputChange('reposition_policy_days', parseInt(e.target.value) || 32)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Configuraciones financieras */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Configuraciones Financieras</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Monto Por Mora
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.late_fee_amount || 0}
                        onChange={(e) => handleInputChange('late_fee_amount', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.late_fee_percentage || 0}
                        onChange={(e) => handleInputChange('late_fee_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="0.00 %"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tasa Interés Anual (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      max="100"
                      value={formData.annual_interest_rate || 0}
                      onChange={(e) => handleInputChange('annual_interest_rate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="0.00 %"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Plazo de Gracia (Días)
                    </label>
                    <input
                      type="number"
                      value={formData.grace_period_days || 0}
                      onChange={(e) => handleInputChange('grace_period_days', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Costo Documentación
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.documentation_cost || 0}
                      onChange={(e) => handleInputChange('documentation_cost', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Otros Costos
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.other_costs || 0}
                      onChange={(e) => handleInputChange('other_costs', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre Plan de Cuentas
                    </label>
                    <select
                      value={formData.chart_of_accounts_name || 'Plan de Cuenta Ejemplo'}
                      onChange={(e) => handleInputChange('chart_of_accounts_name', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="Plan de Cuenta Ejemplo">Plan de Cuenta Ejemplo</option>
                      <option value="Plan Contable Estándar">Plan Contable Estándar</option>
                      <option value="Plan Personalizado">Plan Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Formato de Fecha Contables
                    </label>
                    <select
                      value={formData.date_format || 'MM/DD/AAAA'}
                      onChange={(e) => handleInputChange('date_format', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="MM/DD/AAAA">MM/DD/AAAA</option>
                      <option value="DD/MM/AAAA">DD/MM/AAAA</option>
                      <option value="AAAA-MM-DD">AAAA-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usuarios' && (
              <div className="space-y-6">
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-300">Gestión de Usuarios</h3>
                      <p className="text-yellow-200">
                        La gestión de usuarios está en desarrollo. Actualmente el sistema opera con un usuario administrador único.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Usuario Actual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Apellido y Nombre
                      </label>
                      <input
                        type="text"
                        value="USUARIO ADMINISTRADOR"
                        disabled
                        className="w-full bg-gray-600 border border-gray-500 text-gray-300 px-3 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value="••••••"
                        disabled
                        className="w-full bg-gray-600 border border-gray-500 text-gray-300 px-3 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Creador
                      </label>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="rounded border-gray-500"
                        />
                        <span className="text-gray-300 text-sm">Administrador del Sistema</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong>Próximamente:</strong> Gestión completa de usuarios con roles, permisos y autenticación avanzada.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de advertencia */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Confirmar Cambios Críticos</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-300">
                Está a punto de cambiar información crítica de la empresa que tiene datos contables asociados.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
                <p className="text-yellow-200 text-sm">
                  <strong>⚠️ Advertencia:</strong> Estos cambios pueden afectar:
                </p>
                <ul className="text-yellow-200 text-sm mt-2 space-y-1">
                  <li>• Reportes financieros existentes</li>
                  <li>• Documentos ya generados</li>
                  <li>• Referencias en facturas y compras</li>
                </ul>
              </div>
              <p className="text-gray-300 text-sm">
                <strong>Recomendación:</strong> Cree un respaldo antes de continuar.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelSaveWithWarning}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSaveWithWarning}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}