import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { useLocale } from '../../i18n/useLocale';

export const SecuritySettings = () => {
    const { t } = useLocale();
    return (
        <ModulePlaceholder
            title={t('securitySettings.title')}
            features={[
                t('securitySettings.aes256'),
                t('securitySettings.auth2fa'),
                t('securitySettings.auditLogs')
            ]}
        />
    );
};
