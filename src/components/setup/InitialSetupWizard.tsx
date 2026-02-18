import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WelcomeStep } from './steps/WelcomeStep';
import { AdminStep } from './steps/AdminStep';
import { SecurityStep } from './steps/SecurityStep';
import { CompanyStep } from './steps/CompanyStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { useLocale } from '@/i18n/useLocale';

export interface SetupData {
  // Admin data
  username?: string;
  email?: string;
  fullName?: string;
  displayName?: string;
  password?: string;

  // Security data
  masterKey?: string;
  masterKeySaved?: boolean;

  // Company data
  companyName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  companyEmail?: string;
}

interface StepProps {
  data: SetupData;
  onNext: (stepData: Partial<SetupData>) => void;
  onComplete?: () => void;
}

interface SetupStep {
  id: number;
  titleKey: string;
  descriptionKey: string;
  component: React.ComponentType<StepProps>;
}

const SETUP_STEPS: SetupStep[] = [
  { id: 1, titleKey: 'setup.steps.welcome', descriptionKey: 'setup.steps.welcomeDesc', component: WelcomeStep },
  { id: 2, titleKey: 'setup.steps.admin', descriptionKey: 'setup.steps.adminDesc', component: AdminStep },
  { id: 3, titleKey: 'setup.steps.security', descriptionKey: 'setup.steps.securityDesc', component: SecurityStep },
  { id: 4, titleKey: 'setup.steps.company', descriptionKey: 'setup.steps.companyDesc', component: CompanyStep },
  { id: 5, titleKey: 'setup.steps.confirmation', descriptionKey: 'setup.steps.confirmationDesc', component: ConfirmationStep }
];

export const InitialSetupWizard: React.FC = () => {
  const { t } = useLocale();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({});

  const handleNext = (stepData: Partial<SetupData>) => {
    setSetupData({ ...setupData, ...stepData });
    setCurrentStep(currentStep + 1);
  };

  const CurrentStepComponent = SETUP_STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">{t('setup.title')}</h1>
          <p className="text-blue-300 text-sm mt-2">{t('setup.subtitle')}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {SETUP_STEPS.map(step => (
              <div key={step.id} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : step.id === currentStep
                        ? 'bg-blue-600 text-white ring-4 ring-blue-400/30'
                        : 'bg-white/10 text-white/40'
                    }`}>
                    {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <p className={`text-xs mt-2 font-semibold ${step.id <= currentStep ? 'text-white' : 'text-white/40'
                    }`}>
                    {t(step.titleKey)}
                  </p>
                </div>
                {step.id < SETUP_STEPS.length && (
                  <div className={`absolute top-5 left-1/2 w-full h-0.5 ${step.id < currentStep ? 'bg-green-500' : 'bg-white/10'
                    }`} style={{ transform: 'translateY(-50%)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step */}
        <CurrentStepComponent
          data={setupData}
          onNext={handleNext}
        />
      </div>
    </div>
  );
};
