import React, { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Rocket } from 'lucide-react';
import UserService from '@/services/UserService';
import type { SetupData } from '../InitialSetupWizard';
import { useLocale } from '@/i18n/useLocale';

interface ConfirmationStepProps {
  data: SetupData;
  onNext: (data: Partial<SetupData>) => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data, onNext }) => {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Crear usuario admin
      const roles = UserService.getRoles();
      const adminRole = roles.find(r => r.name === 'admin');

      if (!adminRole) {
        throw new Error(t('setup.confirmation.adminRoleNotFound'));
      }

      const result = await UserService.createUser({
        username: data.username || `admin_${Date.now()}`,
        email: data.email || '',
        full_name: data.fullName || '',
        display_name: data.displayName || '',
        password: data.password || '',
        role_id: adminRole.id
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      // 2. Guardar configuración de empresa (si existe la función)
      // TODO: Implementar saveCompanySettings cuando esté disponible

      // 3. Marcar setup como completado
      localStorage.setItem('initial_setup_completed', 'true');
      localStorage.setItem('setup_date', new Date().toISOString());

      // 4. Redirect a login
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.confirmation.unknownError'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">{t('setup.confirmation.title')}</h2>
        <p className="text-blue-200 text-sm">{t('setup.confirmation.subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            {t('setup.steps.admin')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-200">{t('setup.confirmation.user')}:</span>
              <span className="text-white font-mono">{data.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Email:</span>
              <span className="text-white">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">{t('setup.confirmation.name')}:</span>
              <span className="text-white">{data.fullName}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            {t('setup.steps.security')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-200">{t('setup.confirmation.encryption')}:</span>
              <span className="text-white">PBKDF2 600k</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Master Key:</span>
              <span className="text-green-400">✓ {t('setup.confirmation.saved')}</span>
            </div>
          </div>
        </div>

        {data.companyName && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              {t('setup.steps.company')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">{t('setup.confirmation.name')}:</span>
                <span className="text-white">{data.companyName}</span>
              </div>
              {data.taxId && (
                <div className="flex justify-between">
                  <span className="text-blue-200">Tax ID:</span>
                  <span className="text-white font-mono">{data.taxId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('setup.confirmation.configuring')}
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            {t('setup.confirmation.finishAndAccess')}
          </>
        )}
      </button>

      <p className="text-center text-blue-200 text-xs">
        {t('setup.confirmation.redirectNotice')}
      </p>
    </div>
  );
};
