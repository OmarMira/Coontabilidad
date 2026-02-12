import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Save, Globe, Cloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { type CompanyInfo } from '../../modules/system/System.types';
import { BackupService } from '../../services/BackupService';
import { useLocale } from '../../i18n/useLocale';

export const CompanyInfoForm: React.FC = () => {
    const { t } = useLocale();
    const [info, setInfo] = useState<CompanyInfo>({
        name: 'Account Express LLC',
        tax_id: '12-3456789',
        address: '123 Business Rd',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        currency_code: 'USD',
        email: 'info@accountexpress.com',
        phone: '305-555-0101'
    });

    const [isCloudLinked, setIsCloudLinked] = useState(false);

    useEffect(() => {
        // Check for link status on mount
        const token = localStorage.getItem('gdrive_token');
        setIsCloudLinked(!!token);
    }, []);

    const handleChange = (f: keyof CompanyInfo, v: string) => setInfo({ ...info, [f]: v });

    const handleCloudLink = () => {
        if (isCloudLinked) {
            // Unlink logic
            if (window.confirm(t('companyInfo.confirmUnlink'))) {
                import('../../services/GoogleAuthService').then(mod => {
                    mod.GoogleAuthService.signOut();
                });
                setIsCloudLinked(false);
            }
        } else {
            // Link logic
            // Load service dynamically to avoid circular deps if any, or just direct import
            import('../../services/GoogleAuthService').then(mod => {
                mod.GoogleAuthService.signIn().catch(err => {
                    alert(t('companyInfo.gAuthError') + err.message);
                });
            });
        }
    };

    return (
        <Card className="bg-slate-900 border-white/5 text-white w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    {t('companyInfo.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-6">
                    <div className="w-32 h-32 bg-white/10 rounded flex items-center justify-center border border-white/10">
                        <span className="text-slate-600 text-xs text-center p-2">{t('companyInfo.uploadLogo')}</span>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">{t('companyInfo.legalName')}</label>
                                <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.name} onChange={e => handleChange('name', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">{t('companyInfo.taxId')}</label>
                                <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.tax_id} onChange={e => handleChange('tax_id', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">{t('companyInfo.address')}</label>
                            <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.address} onChange={e => handleChange('address', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">{t('companyInfo.city')}</label>
                                <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.city} onChange={e => handleChange('city', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">{t('companyInfo.state')}</label>
                                <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.state} onChange={e => handleChange('state', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">{t('companyInfo.zipCode')}</label>
                                <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.zip} onChange={e => handleChange('zip', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">{t('companyInfo.contactEmail')}</label>
                        <input className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.email} onChange={e => handleChange('email', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">{t('companyInfo.baseCurrency')}</label>
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-600" />
                            <select className="w-full bg-white/10 border-white/10 rounded p-2 text-white" value={info.currency_code} onChange={e => handleChange('currency_code', e.target.value)}>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                    <h3 className="text-sm font-medium text-blue-400 mb-4 flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        {t('companyInfo.cloudVault')}
                    </h3>

                    <div className="bg-white/10/50 p-4 rounded border border-white/10 flex items-center justify-between">
                        <div>
                            {isCloudLinked ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{t('companyInfo.connectedToGDrive')}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">{t('companyInfo.noCloudBackup')}</span>
                                </div>
                            )}
                            <p className="text-xs text-slate-600 mt-1">
                                {isCloudLinked
                                    ? t('companyInfo.cloudBackupEnabledDesc')
                                    : t('companyInfo.linkCloudAccountDesc')}
                            </p>
                        </div>

                        <Button
                            variant={isCloudLinked ? "outline" : "default"}
                            className={isCloudLinked ? "border-red-900 text-red-400 hover:bg-red-900/20" : "bg-blue-600 hover:bg-blue-700"}
                            onClick={handleCloudLink}
                        >
                            {isCloudLinked ? t('companyInfo.unlink') : t('companyInfo.connectGDrive')}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> {t('companyInfo.saveChanges')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
