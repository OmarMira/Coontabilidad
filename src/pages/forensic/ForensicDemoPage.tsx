import React from 'react';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { TaxComplianceDashboard } from './components/TaxComplianceDashboard';
import { AuditChainStatus } from './components/AuditChainStatus';
import { BackupRestoreWidget } from './components/BackupRestoreWidget';
import { DatabaseMaintenance } from '@/components/maintenance/DatabaseMaintenance';
import { useLocale } from '@/i18n/useLocale';

export const ForensicDemoPage: React.FC = () => {
    const { t } = useLocale();

    return (
        <div className="container mx-auto p-6 space-y-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('forensic.title')}</h1>
                    <p className="text-muted-foreground">{t('forensic.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                        {t('forensic.version')}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">
                        {t('forensic.mvp')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Transaction Entry */}
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-lg font-semibold mb-4 text-foreground">{t('forensic.secureEntry')}</h2>
                        <InvoiceForm />
                    </section>
                </div>

                {/* Right Column: Compliance & Security Widgets */}
                <div className="space-y-6">
                    <section>
                        <h2 className="text-lg font-semibold mb-4 text-foreground">{t('forensic.complianceSecurity')}</h2>
                        <div className="space-y-6">
                            <TaxComplianceDashboard />
                            <AuditChainStatus />
                            <BackupRestoreWidget />
                            <DatabaseMaintenance />
                        </div>
                    </section>

                    <div className="p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground">
                        <h3 className="font-semibold mb-2">{t('forensic.technicalStatus')}</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li>{t('forensic.taxEngine')}: <span className="text-green-600 font-mono">{t('forensic.online')}</span></li>
                            <li>{t('forensic.ledger')}: <span className="text-green-600 font-mono">{t('forensic.connected')}</span></li>
                            <li>{t('forensic.encryption')}: <span className="text-green-600 font-mono">{t('forensic.active')}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
