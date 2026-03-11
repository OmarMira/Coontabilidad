import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, CheckCircle, Save, RefreshCw, Shield, FileText, Users, Receipt, XCircle, Cloud } from 'lucide-react';
import { getCompanyData, updateCompanyData, checkAccountingDataAssociation, CompanyData } from '@/database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { LogoUploader } from './LogoUploader';
import { BackupService } from '../services/backup/BackupService';
import { useLocale } from '../i18n/useLocale';

interface CompanyDataFormProps {
  onClose?: () => void;
}

export function CompanyDataForm({ onClose }: CompanyDataFormProps) {
  const { t } = useLocale();
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
  const [isCloudLinked, setIsCloudLinked] = useState(false);

  useEffect(() => {
    loadCompanyData();
    checkAccountingAssociations();

    const token = localStorage.getItem('gdrive_token');
    setIsCloudLinked(!!token);
  }, []);

  const handleCloudLink = () => {
    if (isCloudLinked) {
      if (window.confirm(t('companyData.cloud.confirmDisconnect'))) {
        localStorage.removeItem('gdrive_token');
        setIsCloudLinked(false);
      }
    } else {
      BackupService.initiateCloudLink();
    }
  };

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
      setError(`Error al cargar los datos de la empresa: ${error instanceof Error ? error.message : String(error)}`);
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

      const result = await updateCompanyData(formData);

      if (result.success) {
        setSuccess(result.message);
        if (result.warnings) {
          setWarnings(result.warnings);
        }

        await loadCompanyData();

        logger.info('CompanyDataForm', 'save_success', 'Datos de empresa guardados correctamente');

        // Dar un momento para ver el mensaje de éxito antes de cerrar
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
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
        <p className="text-slate-300 font-black uppercase tracking-widest text-xs">{t('companyData.loading')}</p>
      </div>
    );
  }

  if (error && !companyData) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 flex flex-col items-center text-center">
        <div className="p-4 bg-rose-500/20 rounded-2xl mb-4">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <h3 className="text-xl font-black text-rose-300 mb-2">{t('companyData.error')}</h3>
        <p className="text-rose-200/70 font-medium max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        {/* Header Hub */}
        <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg">
              <Building2 className="h-10 w-10 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{t('companyData.title')}</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-blue-500" /> {t('companyData.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center space-x-3 transition-all font-bold shadow-lg shadow-blue-900/40 active:scale-95"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="text-xs">{saving ? t('companyData.saving') : t('companyData.saveButton')}</span>
            </button>
            <button
              onClick={() => onClose ? onClose() : window.history.back()}
              className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {/* Alertas de datos contables */}
            {accountingCheck.hasData && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Shield className="w-32 h-32 text-amber-500" />
                </div>
                <div className="flex items-start space-x-8 relative z-10">
                  <div className="p-5 bg-amber-500/20 rounded-2xl">
                    <Shield className="h-8 w-8 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-amber-400 mb-2 uppercase tracking-tight">{t('companyData.alert.title')}</h3>
                    <p className="text-amber-200/70 font-medium mb-8 text-sm leading-relaxed max-w-2xl">
                      {t('companyData.alert.description')}
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <MetricCard icon={Users} label={t('companyData.alert.customers')} value={accountingCheck.customers} color="blue" />
                      <MetricCard icon={Building2} label={t('companyData.alert.suppliers')} value={accountingCheck.suppliers} color="emerald" />
                      <MetricCard icon={FileText} label={t('companyData.alert.invoices')} value={accountingCheck.invoices} color="purple" />
                      <MetricCard icon={Receipt} label={t('companyData.alert.bills')} value={accountingCheck.bills} color="orange" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensajes de estado */}
            <div className="space-y-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in slide-in-from-top-4">
                  <div className="p-2 bg-rose-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  </div>
                  <p className="text-rose-300 font-bold text-sm tracking-tight">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in slide-in-from-top-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-emerald-300 font-bold text-sm tracking-tight">{success}</p>
                </div>
              )}
            </div>

            {/* Formulario con pestañas */}
            {companyData && (
              <div className="bg-slate-950/30 rounded-[2.5rem] border border-slate-800/80 overflow-hidden shadow-inner flex flex-col flex-1 min-h-0">
                {/* Pestañas Modernas */}
                <div className="bg-slate-950/50 px-10 pt-8 border-b border-slate-800">
                  <nav className="flex space-x-12">
                    {[
                      { id: 'empresa', label: t('companyData.tab.company'), icon: Building2 },
                      { id: 'finanzas', label: t('companyData.tab.finance'), icon: Receipt },
                      { id: 'usuarios', label: t('companyData.tab.users'), icon: Shield }
                    ].map((tab: any) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-4 py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id
                          ? 'text-blue-400'
                          : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-600'}`} />
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] rounded-t-full"></div>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Contenido de pestañas */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  {activeTab === 'empresa' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-in fade-in duration-500">
                      {/* Logo Section */}
                      <div className="lg:col-span-4 space-y-10">
                        <section>
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-8">
                            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            {t('companyData.visual.title')}
                          </h3>
                          <div className="bg-slate-950/80 p-10 rounded-[2.5rem] border-2 border-slate-800 border-dashed hover:border-blue-500/30 transition-all group flex flex-col items-center justify-center">
                            <LogoUploader
                              currentLogo={formData.logo_path || ''}
                              onLogoChange={(logoPath) => handleInputChange('logo_path', logoPath || '')}
                              disabled={saving}
                            />
                          </div>
                        </section>

                        {/* Cloud Vault Section */}
                        <section className="pt-10 border-t border-slate-800/50">
                          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3 mb-8">
                            <Cloud className="w-4 h-4 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                            {t('companyData.cloud.title')}
                          </h3>
                          <div className={`p-8 rounded-[2rem] border transition-all ${isCloudLinked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-slate-800 shadow-inner'}`}>
                            <div className="flex items-center gap-5 mb-6">
                              <div className={`p-3 rounded-2xl ${isCloudLinked ? 'bg-emerald-500/20' : 'bg-slate-950 border border-slate-800'}`}>
                                {isCloudLinked ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 text-slate-500" />}
                              </div>
                              <span className={`text-sm font-black uppercase tracking-tight ${isCloudLinked ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {isCloudLinked ? t('companyData.cloud.linked') : t('companyData.cloud.notLinked')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-8 leading-relaxed font-bold">
                              {isCloudLinked ? t('companyData.cloud.linkedDesc') : t('companyData.cloud.notLinkedDesc')}
                            </p>
                            <button
                              type="button"
                              onClick={handleCloudLink}
                              className={`w-full py-3 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isCloudLinked
                                ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'
                                }`}
                            >
                              {isCloudLinked ? t('companyData.cloud.disconnect') : t('companyData.cloud.connect')}
                            </button>
                          </div>
                        </section>
                      </div>

                      {/* Información básica */}
                      <div className="lg:col-span-8 space-y-12">
                        <section className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DataInput label={t('companyData.field.companyName')} value={formData.company_name || ''} onChange={(v: any) => handleInputChange('company_name', v)} />
                            <DataInput label={t('companyData.field.legalName')} value={formData.legal_name || ''} onChange={(v: any) => handleInputChange('legal_name', v)} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <DataInput label={t('companyData.field.taxId')} value={formData.tax_id || ''} onChange={(v: any) => handleInputChange('tax_id', v)} mono />
                            <div className="md:col-span-2">
                              <DataInput label={t('companyData.field.address')} value={formData.address || ''} onChange={(v: any) => handleInputChange('address', v)} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
                            <div className="col-span-2">
                              <DataInput label={t('companyData.field.city')} value={formData.city || ''} onChange={(v: any) => handleInputChange('city', v)} />
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 block">{t('companyData.field.state')}</label>
                              <div className="relative">
                                <select
                                  value={formData.state || 'FL'}
                                  onChange={(e) => handleInputChange('state', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 text-white px-8 py-5 rounded-2xl focus:border-blue-500 appearance-none font-black text-[10px] uppercase tracking-widest cursor-pointer outline-none transition-all"
                                >
                                  <option value="FL">Florida</option>
                                  <option value="CA">California</option>
                                  <option value="NY">New York</option>
                                  <option value="TX">Texas</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black">▼</div>
                              </div>
                            </div>
                            <DataInput label={t('companyData.field.zipCode')} value={formData.zip_code || ''} onChange={(v: any) => handleInputChange('zip_code', v)} mono />
                          </div>
                        </section>

                        <section className="pt-12 border-t border-slate-800 space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DataInput label={t('companyData.field.phone')} value={formData.phone || ''} onChange={(v: any) => handleInputChange('phone', v)} type="tel" />
                            <DataInput label={t('companyData.field.email')} value={formData.email || ''} onChange={(v: any) => handleInputChange('email', v)} type="email" />
                          </div>
                        </section>
                      </div>
                    </div>
                  )}

                  {activeTab === 'finanzas' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 animate-in fade-in duration-500">
                      <div className="space-y-12">
                        <header>
                          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">{t('companyData.finance.sales')}</h3>
                          <div className="h-1 w-20 bg-blue-500 rounded-full mt-4"></div>
                          <p className="text-slate-500 font-bold text-xs mt-6 leading-relaxed max-w-md uppercase tracking-widest leading-none">{t('companyData.finance.salesDesc')}</p>
                        </header>

                        <div className="grid grid-cols-1 gap-10">
                          <DataInput label={t('companyData.finance.commission')} value={formData.sales_commission_percentage?.toString() || '0'} onChange={(v: any) => handleInputChange('sales_commission_percentage', parseFloat(v) || 0)} type="number" suffix="%" />
                          <DataInput label={t('companyData.finance.shipping')} value={formData.shipping_rate?.toString() || '0'} onChange={(v: any) => handleInputChange('shipping_rate', parseFloat(v) || 0)} type="number" prefix="$" />
                        </div>
                      </div>

                      <div className="space-y-12">
                        <header>
                          <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">{t('companyData.finance.accounting')}</h3>
                          <div className="h-1 w-20 bg-emerald-500 rounded-full mt-4"></div>
                          <p className="text-slate-500 font-bold text-xs mt-6 leading-relaxed max-w-md uppercase tracking-widest leading-none">{t('companyData.finance.accountingDesc')}</p>
                        </header>

                        <div className="grid grid-cols-1 gap-10">
                          <DataInput label={t('companyData.finance.lateFee')} value={formData.late_fee_percentage?.toString() || '0'} onChange={(v: any) => handleInputChange('late_fee_percentage', parseFloat(v) || 0)} type="number" suffix="%" />
                          <DataInput label={t('companyData.finance.gracePeriod')} value={formData.grace_period_days?.toString() || '0'} onChange={(v: any) => handleInputChange('grace_period_days', parseInt(v) || 0)} type="number" suffix={t('companyData.finance.days')} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'usuarios' && (
                    <div className="py-20 animate-in fade-in zoom-in-95 duration-500">
                      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-[3rem] p-16 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-500/20 shadow-blue-900/20 shadow-xl">
                          <Shield className="h-12 w-12 text-blue-500" />
                        </div>
                        <h3 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase">{t('companyData.users.title')}</h3>
                        <p className="text-slate-400 font-bold mb-12 leading-relaxed max-w-2xl mx-auto uppercase tracking-widest text-xs">
                          {t('companyData.users.description')}
                        </p>

                        <div className="bg-slate-950 p-10 rounded-[2rem] border border-slate-800 inline-flex flex-col md:flex-row items-center gap-16 text-left shadow-inner">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block">{t('companyData.users.currentProfile')}</span>
                            <span className="text-2xl font-black text-white tracking-tighter uppercase">{t('companyData.users.profileName')}</span>
                          </div>
                          <div className="w-px h-16 bg-slate-800 hidden md:block"></div>
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block">{t('companyData.users.permissions')}</span>
                            <span className="flex items-center gap-3 text-emerald-500 font-black text-md uppercase group transition-all">
                              <CheckCircle className="w-5 h-5 group-hover:scale-125 duration-500" />
                              {t('companyData.users.access')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="p-10 border-t border-slate-800 bg-slate-950/50 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-full border border-slate-800 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('companyData.systemStatus')}: SECURE_VAULT_ACTIVE</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => onClose ? onClose() : window.history.back()}
                className="px-6 py-2.5 text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 rounded-xl"
              >
                Abortar :: Volver
              </button>
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/60 active:scale-95"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? t('companyData.saving') : t('companyData.saveButton')}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Modal Advertencia */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(245,158,11,0.1)] p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 animate-pulse"></div>
            <div className="w-28 h-28 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-amber-500/20 shadow-amber-900/20 shadow-2xl rotate-12 group hover:rotate-0 transition-transform duration-500">
              <AlertTriangle className="h-14 w-14 text-amber-500" />
            </div>
            <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tight leading-none">{t('companyData.warning.title')}</h3>
            <p className="text-slate-400 font-bold mb-12 leading-relaxed uppercase tracking-widest text-xs">
              {t('companyData.warning.description')}
            </p>

            <div className="grid grid-cols-1 gap-5">
              <button
                onClick={confirmSaveWithWarning}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-900/40 active:scale-95"
              >
                {t('companyData.warning.proceed')}
              </button>
              <button
                onClick={cancelSaveWithWarning}
                className="w-full py-4 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                {t('companyData.warning.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponentes Elite
const MetricCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  };

  return (
    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60 shadow-inner group-hover:scale-105 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-3.5 h-3.5 ${colors[color].split(' ')[0]}`} />
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl font-black text-white leading-none font-mono italic tracking-tighter">{value}</span>
    </div>
  );
};

const DataInput = ({ label, value, onChange, type = "text", mono = false, prefix, suffix }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 block">{label}</label>
    <div className="relative group/input">
      {prefix && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">{prefix}</div>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-950 border border-slate-800/50 text-white p-5 rounded-2xl focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all font-black tracking-widest uppercase text-[10px] outline-none ${prefix ? 'pl-10' : 'px-8'} ${suffix ? 'pr-14' : 'px-8'} ${mono ? 'font-mono' : ''}`}
      />
      {suffix && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-[9px] uppercase tracking-widest">{suffix}</div>}
    </div>
  </div>
);
