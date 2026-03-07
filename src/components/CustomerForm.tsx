import React, { useState } from 'react';
import {
  Plus, Save, XCircle, User, Mail, Phone, MapPin,
  ShieldCheck, Zap, Cpu, Sparkles
} from 'lucide-react';
import { FLORIDA_COUNTIES } from '@/database/simple-db';
import { useLocale } from '../i18n/useLocale';

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
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    florida_county: initialData?.florida_county || 'Miami-Dade'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('customerForm.nameError');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('customerForm.emailError');
    if (formData.phone && !/^[\d\s\-\(\)\+]+$/.test(formData.phone)) newErrors.phone = t('customerForm.phoneError');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData.name.trim(), formData.email.trim(), formData.phone.trim(), formData.florida_county);
      if (!isEditing) setFormData({ name: '', email: '', phone: '', florida_county: 'Miami-Dade' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none"></div>

        <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-6">
            <div className="text-blue-500">
              {isEditing ? <Cpu className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {isEditing ? t('customerForm.titleEdit') : t('customerForm.titleNew')}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {t('customerForm.protocol')}
              </p>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95">
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-10 space-y-10 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Nombre */}
              <PremiumInput
                label={t('customerForm.nameLabel')}
                icon={User}
                value={formData.name}
                error={errors.name}
                onChange={(v) => handleInputChange('name', v)}
                placeholder={t('customerForm.namePlaceholder')}
                required
              />

              {/* Email */}
              <PremiumInput
                label={t('customerForm.emailLabel')}
                icon={Mail}
                value={formData.email}
                error={errors.email}
                onChange={(v) => handleInputChange('email', v)}
                placeholder={t('customerForm.emailPlaceholder')}
                type="email"
              />

              {/* Teléfono */}
              <PremiumInput
                label={t('customerForm.phoneLabel')}
                icon={Phone}
                value={formData.phone}
                error={errors.phone}
                onChange={(v) => handleInputChange('phone', v)}
                placeholder={t('customerForm.phonePlaceholder')}
                type="tel"
              />

              {/* Condado */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> {t('customerForm.countyLabel')}
                </label>
                <div className="relative group/select">
                  <select
                    value={formData.florida_county}
                    onChange={(e) => handleInputChange('florida_county', e.target.value)}
                    className="w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border border-slate-800/50 focus:border-blue-500/50 focus:outline-none font-bold uppercase tracking-widest text-[9px] transition-all appearance-none cursor-pointer group-hover/select:border-slate-700 h-[58px]"
                    required
                  >
                    {FLORIDA_COUNTIES.map(county => (
                      <option key={county} value={county} style={{ color: 'black' }}>{county?.toUpperCase()}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="p-10 border-t border-slate-800/50 bg-slate-950/50 relative z-10 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-4 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('customerForm.encryptionNotice')}</span>
            </div>

            <div className="flex gap-6 w-full md:w-auto">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  {t('customerForm.cancelButton')}
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-lg ${isEditing
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                  } active:scale-95`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? t('customerForm.submitUpdate') : t('customerForm.submitCreate')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

const PremiumInput = ({ label, icon: Icon, value, error, onChange, placeholder, type = "text", required }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${error ? 'text-rose-500' : 'text-blue-500'}`} /> {label} {required && '*'}
    </label>
    <div className="relative group/input">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-950/50 text-white px-6 py-4 rounded-2xl border transition-all font-bold uppercase tracking-widest text-[9px] placeholder:text-slate-800 focus:outline-none ${error
          ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
          : 'border-slate-800/50 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover/input:border-slate-700'
          }`}
        placeholder={placeholder}
        required={required}
      />
      {error && (
        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1 animate-pulse">{error}</p>
      )}
    </div>
  </div>
);