import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface AdminStepProps {
  data: any;
  onNext: (data: any) => void;
}

export const AdminStep: React.FC<AdminStepProps> = ({ data, onNext }) => {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    username: data.username || '',
    email: data.email || '',
    fullName: data.fullName || '',
    displayName: data.displayName || '',
    password: data.password || '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validatePassword = (password: string): number => {
    let strength = 0;
    if (password.length >= 12) strength += 25;
    if (password.length >= 16) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength(validatePassword(password));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = t('setup.admin.validation.usernameMin');
    }

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = t('setup.admin.validation.invalidEmail');
    }

    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = t('setup.admin.validation.fullNameRequired');
    }

    if (!formData.displayName || formData.displayName.length < 2) {
      newErrors.displayName = t('setup.admin.validation.displayNameRequired');
    }

    if (!formData.password || formData.password.length < 12) {
      newErrors.password = t('setup.admin.validation.passwordMin');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('setup.admin.validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        displayName: formData.displayName,
        password: formData.password
      });
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return t('setup.admin.strengthWeak');
    if (passwordStrength < 70) return t('setup.admin.strengthMedium');
    return t('setup.admin.strengthStrong');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">{t('setup.admin.title')}</h2>
        <p className="text-blue-200 text-sm">{t('setup.admin.subtitle')}</p>
      </div>

      {/* Username */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <User className="w-4 h-4" />
          {t('setup.admin.username')}
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin"
        />
        {errors.username && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.username}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4" />
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin@company.com"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="text-white text-sm font-bold mb-2 block">{t('setup.admin.fullName')}</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label className="text-white text-sm font-bold mb-2 block">{t('setup.admin.displayName')}</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John"
        />
        {errors.displayName && (
          <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4" />
          {t('setup.admin.password')}
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('setup.admin.placeholders.password')}
        />
        {formData.password && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">{t('setup.admin.strength')}:</span>
              <span className={`font-bold ${passwordStrength >= 70 ? 'text-green-400' : passwordStrength >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {getStrengthText()}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                style={{ width: `${passwordStrength}%` }}
              />
            </div>
          </div>
        )}
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="text-white text-sm font-bold mb-2 block">{t('setup.admin.confirmPassword')}</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('setup.admin.placeholders.confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
        )}
        {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
          <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {t('setup.admin.passwordsMatch')}
          </p>
        )}
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
