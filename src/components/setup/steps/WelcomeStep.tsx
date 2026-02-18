import React from 'react';
import { Rocket, Shield, Database, CheckCircle } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface WelcomeStepProps {
  data: any;
  onNext: (data: any) => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black tracking-tight text-white mb-3">{t('setup.welcome.title')}</h2>
        <p className="text-blue-200">
          {t('setup.welcome.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Shield className="w-8 h-8 text-blue-400 mb-2" />
          <h3 className="text-white font-bold mb-1">{t('setup.welcome.enterpriseSecurity')}</h3>
          <p className="text-blue-200 text-sm">{t('setup.welcome.pbkdf2')}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Database className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-white font-bold mb-1">{t('setup.welcome.localDatabase')}</h3>
          <p className="text-blue-200 text-sm">{t('setup.welcome.sqliteBrowser')}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <CheckCircle className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-white font-bold mb-1">{t('setup.welcome.nistCompliance')}</h3>
          <p className="text-blue-200 text-sm">{t('setup.welcome.federalStandards')}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Rocket className="w-8 h-8 text-orange-400 mb-2" />
          <h3 className="text-white font-bold mb-1">{t('setup.welcome.readyIn5')}</h3>
          <p className="text-blue-200 text-sm">{t('setup.welcome.guidedSetup')}</p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-200 text-sm">
          <strong className="text-white">{t('setup.note')}:</strong> {t('setup.welcome.noteText')}
        </p>
      </div>

      <button
        onClick={() => onNext({})}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {t('setup.welcome.startSetup')}
        <Rocket className="w-5 h-5" />
      </button>
    </div>
  );
};
