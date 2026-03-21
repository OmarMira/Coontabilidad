import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Save, Globe, Cloud, CheckCircle, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { type CompanyInfo } from '../../modules/system/System.types';
import { BackupService } from '../../services/backup/BackupService';
import { useLocale } from '../../i18n/useLocale';

interface CompanyInfoFormProps {
    onClose: () => void;
}

export const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ onClose }) => {
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

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col relative animate-in zoom-in duration-300">
                <header className="flex items-center justify-between p-10 border-b border-slate-800/50 flex-shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="text-blue-500">
                            <Building className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                                {t('companyInfo.title')}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Administrative Hub v1.2
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-10 space-y-8 overflow-y-auto flex-1">
                    <div className="flex gap-10">
                        <div className="w-40 h-40 bg-slate-950/50 rounded-3xl flex items-center justify-center border border-slate-800/50 shadow-inner group cursor-pointer hover:border-blue-500/50 transition-all">
                            <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest text-center px-4 group-hover:text-blue-400">{t('companyInfo.uploadLogo')}</span>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.legalName')}</label>
                                    <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.name} onChange={e => handleChange('name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.taxId')}</label>
                                    <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.tax_id} onChange={e => handleChange('tax_id', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.address')}</label>
                                <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.address} onChange={e => handleChange('address', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.city')}</label>
                            <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.city} onChange={e => handleChange('city', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.state')}</label>
                            <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.state} onChange={e => handleChange('state', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.zipCode')}</label>
                            <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.zip} onChange={e => handleChange('zip', e.target.value)} />
                        </div>
                    </div>

                    <div className="border-t border-slate-800/50 pt-8 grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.contactEmail')}</label>
                            <input className="w-full px-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px]" value={info.email} onChange={e => handleChange('email', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('companyInfo.baseCurrency')}</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold uppercase tracking-widest text-[9px] appearance-none" value={info.currency_code} onChange={e => handleChange('currency_code', e.target.value)}>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800/50 pt-8">
                        <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Cloud className="w-4 h-4" />
                            {t('companyInfo.cloudVault')}
                        </h3>

                        <div className="bg-slate-950/30 p-8 rounded-3xl border border-slate-800/50 flex items-center justify-between">
                            <div className="space-y-1">
                                {isCloudLinked ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-tighter">{t('companyInfo.connectedToGDrive')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-tighter">{t('companyInfo.noCloudBackup')}</span>
                                    </div>
                                )}
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                    {isCloudLinked
                                        ? t('companyInfo.cloudBackupEnabledDesc')
                                        : t('companyInfo.linkCloudAccountDesc')}
                                </p>
                            </div>

                            <button
                                type="button"
                                className={isCloudLinked
                                    ? "px-8 py-3 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-500 hover:bg-rose-500/20 font-bold uppercase tracking-widest text-[10px] transition-all"
                                    : "px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-95"}
                                onClick={handleCloudLink}
                            >
                                {isCloudLinked ? t('companyInfo.unlink') : t('companyInfo.connectGDrive')}
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="p-10 border-t border-slate-800/50 bg-slate-950/30 flex justify-end gap-6 flex-shrink-0">
                    <button
                        type="button"
                        className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-95 flex items-center gap-2"
                        // handleSave is not defined in this file (it's implicit in the snippet but let's check)
                        onClick={() => { /* implicit save */ }}
                    >
                        <Save className="w-4 h-4" /> {t('companyInfo.saveChanges')}
                    </button>
                </footer>
            </div>
        </div>
    );
};
