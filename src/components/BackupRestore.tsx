// Deprecado. El sistema ahora usa 'BackupPanel.tsx' y 'BackupService' (Iron Core v1.0).
import React from 'react';
import { useLocale } from '../i18n/useLocale';

export const BackupRestore: React.FC = () => {
  const { t } = useLocale();
  return (
    <div className="p-8 text-center text-slate-400">
      {t('common.deprecatedComponent')}
    </div>
  );
};

export default BackupRestore;