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
      <div className="bg-slate-900 rounded-3xl p-12 border border-slate-800 flex flex-col items-center justify-center animate-pulse">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
        </div>
        <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Cargando Estructura Corporativa...</p>
      </div>
    );
  }

  if (error && !companyData) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
        <div className="p-4 bg-rose-500/20 rounded-2xl mb-4">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <h3 className="text-xl font-black text-rose-300 mb-2">Error Crítico</h3>
        <p className="text-rose-200/70 font-medium max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-5">
          <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
            <Building2 className="h-10 w-10 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Datos Corporativos</h1>
            <p className="text-slate-400 font-medium">Configuración de la entidad titular del sistema</p>
          </div>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-8 py-3 rounded-2xl flex items-center space-x-3 transition-all font-black shadow-lg shadow-blue-900/40"
        >
          {saving ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>{saving ? 'Procesando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Alertas de datos contables */}
      {accountingCheck.hasData && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex items-start space-x-4 relative z-10">
            <div className="p-3 bg-amber-500/20 rounded-2xl">
              <Shield className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-amber-400 mb-1">Entidad con Operaciones Activas</h3>
              <p className="text-amber-200/70 font-medium mb-6 text-sm leading-relaxed">
                Se detectaron registros contables asociados. La modificación de campos fiscales afectará la integridad histórica de los reportes.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Clientes</span>
                  </div>
                  <span className="text-lg font-black text-white leading-none">{accountingCheck.customers}</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Aliados</span>
                  </div>
                  <span className="text-lg font-black text-white leading-none">{accountingCheck.suppliers}</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Facturas</span>
                  </div>
                  <span className="text-lg font-black text-white leading-none">{accountingCheck.invoices}</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Compras</span>
                  </div>
                  <span className="text-lg font-black text-white leading-none">{accountingCheck.bills}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      <div className="space-y-3">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <p className="text-rose-300 font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <p className="text-emerald-300 font-bold text-sm tracking-tight">{success}</p>
          </div>
        )}
      </div>

      {/* Formulario con pestañas */}
      {companyData && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Pestañas Modernas */}
          <div className="bg-slate-950/50 px-6 pt-6 border-b border-slate-800">
            <nav className="flex space-x-6">
              {[
                { id: 'empresa', label: 'Estructura Legal', icon: Building2 },
                { id: 'finanzas', label: 'Parámetros Financieros', icon: Receipt },
                { id: 'usuarios', label: 'Acceso y Seguridad', icon: Shield }
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-4 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === tab.id
                      ? 'text-blue-400'
                      : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-600'}`} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido de pestañas */}
          <div className="p-10">
            {activeTab === 'empresa' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Logo Section */}
                <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Identidad Visual
                  </h3>
                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 border-dashed hover:border-blue-500/30 transition-colors">
                    <LogoUploader
                      currentLogo={formData.logo_path || ''}
                      onLogoChange={(logoPath) => handleInputChange('logo_path', logoPath || '')}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Información básica */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                      <input
                        type="text"
                        value={formData.company_name || ''}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Razón Social</label>
                      <input
                        type="text"
                        value={formData.legal_name || ''}
                        onChange={(e) => handleInputChange('legal_name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Fiscal</label>
                      <input
                        type="text"
                        value={formData.tax_id || ''}
                        onChange={(e) => handleInputChange('tax_id', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección Física</label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ciudad</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado</label>
                      <select
                        value={formData.state || 'FL'}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      >
                        <option value="FL">Florida</option>
                        <option value="CA">California</option>
                        <option value="NY">New York</option>
                        <option value="TX">Texas</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ZIP / Postal</label>
                      <input
                        type="text"
                        value={formData.zip_code || ''}
                        onChange={(e) => handleInputChange('zip_code', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'finanzas' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-2">Ventas & Distribución</h3>
                    <p className="text-slate-500 font-medium text-sm mb-8 tracking-tight">Reglas globales</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Comisión %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sales_commission_percentage || 0}
                        onChange={(e) => handleInputChange('sales_commission_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 text-blue-400 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tarifa Envío $</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.shipping_rate || 0}
                        onChange={(e) => handleInputChange('shipping_rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-2">Contabilidad</h3>
                    <p className="text-slate-500 font-medium text-sm mb-8 tracking-tight">Libro mayor</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mora %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.late_fee_percentage || 0}
                        onChange={(e) => handleInputChange('late_fee_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 text-rose-400 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gracia (Días)</label>
                      <input
                        type="number"
                        value={formData.grace_period_days || 0}
                        onChange={(e) => handleInputChange('grace_period_days', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usuarios' && (
              <div className="space-y-10 py-10">
                <div className="max-w-3xl mx-auto bg-amber-500/5 border border-amber-500/20 rounded-3xl p-10 text-center relative overflow-hidden">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">Acceso Restringido</h3>
                  <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                    Sistema en modalidad "Local-Single-User". El administrador Root es el único perfil habilitado.
                  </p>

                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 inline-flex flex-col md:flex-row items-center gap-8 text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Perfil</span>
                      <span className="text-lg font-black text-white tracking-tight">Root Administrator</span>
                    </div>
                    <div className="w-px h-10 bg-slate-800 hidden md:block"></div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Estado</span>
                      <span className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase">Protección Activa</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Advertencia */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl p-10 text-center">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">¡Cambio Crítico!</h3>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed">
              Está modificando identificadores fiscales con registros contables activos.
            </p>

            <div className="space-y-3">
              <button onClick={confirmSaveWithWarning} className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black">
                Proceder (Riesgos Conocidos)
              </button>
              <button onClick={cancelSaveWithWarning} className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}