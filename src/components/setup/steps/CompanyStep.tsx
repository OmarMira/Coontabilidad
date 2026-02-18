import React, { useState } from 'react';
import { Building2, Mail, Phone, MapPin, ArrowRight, Hash } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface CompanyStepProps {
  data: any;
  onNext: (data: any) => void;
}

export const CompanyStep: React.FC<CompanyStepProps> = ({ data, onNext }) => {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    companyName: data.companyName || '',
    taxId: data.taxId || '',
    address: data.address || '',
    phone: data.phone || '',
    companyEmail: data.companyEmail || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName || formData.companyName.length < 2) {
      newErrors.companyName = t('setup.company.validation.nameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">{t('setup.company.title')}</h2>
        <p className="text-blue-200 text-sm">{t('setup.company.subtitle')}</p>
      </div>

      {/* Company Name */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4" />
          {t('setup.company.companyName')} *
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('setup.company.placeholders.companyName')}
        />
        {errors.companyName && (
          <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>
        )}
      </div>

      {/* Tax ID */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4" />
          {t('setup.company.taxId')}
        </label>
        <input
          type="text"
          value={formData.taxId}
          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="XX-XXXXXXX"
        />
      </div>

      {/* Address */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4" />
          {t('setup.company.address')}
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="123 Main St, Miami, FL 33101"
          rows={3}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Phone className="w-4 h-4" />
          {t('setup.company.phone')}
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="(305) 123-4567"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4" />
          {t('setup.company.email')}
        </label>
        <input
          type="email"
          value={formData.companyEmail}
          onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="info@company.com"
        />
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-200 text-sm">
          <strong className="text-white">{t('setup.note')}:</strong> {t('setup.company.noteText')}
        </p>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6"
      >
        {t('setup.continue')}
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
};
