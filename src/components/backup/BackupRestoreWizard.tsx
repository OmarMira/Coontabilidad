import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive, Download, Upload, Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { BackupManager } from '@/modules/backup/BackupManager';
import { SQLiteEngine } from '@/core/database/SQLiteEngine';
import { useLocale } from '@/i18n/useLocale';

// Assuming we can instantiate engines or they are passed/context
// For this UI component, we will mock logic for now or instantiate if possible.

export const BackupRestoreWizard: React.FC = () => {
    const { t } = useLocale();
    const [mode, setMode] = useState<'menu' | 'backup' | 'restore'>('menu');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleBackup = async () => {
        setStatus('processing');
        try {
            // Mock
            setTimeout(() => {
                setStatus('success');
                setMessage(t('backup.wizard.successBackup', { name: 'backup_20241230.enc' }));
            }, 1500);
        } catch (e) {
            setStatus('error');
            setMessage(t('backup.wizard.errorBackup'));
        }
    };

    const handleRestore = async (file: File) => {
        setStatus('processing');
        try {
            // Mock
            setTimeout(() => {
                setStatus('success');
                setMessage(t('backup.wizard.successRestore', { name: file.name }));
            }, 2000);
        } catch (e) {
            setStatus('error');
            setMessage(t('backup.wizard.errorRestore'));
        }
    };

    if (mode === 'menu') {
        return (
            <Card className="bg-slate-900 border-white/5 text-white w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-blue-400" />
                        {t('backup.wizard.title')}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        {t('backup.wizard.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={() => setMode('backup')}
                        className="w-full h-16 text-lg justify-start px-6 bg-white/10 hover:bg-white/5 border border-white/10"
                    >
                        <Download className="w-6 h-6 mr-4 text-green-400" />
                        <div className="text-left">
                            <span className="block font-bold">{t('backup.wizard.createBackup')}</span>
                            <span className="text-xs text-slate-500 font-normal">{t('backup.wizard.createBackupDesc')}</span>
                        </div>
                    </Button>
                    <Button
                        onClick={() => setMode('restore')}
                        className="w-full h-16 text-lg justify-start px-6 bg-white/10 hover:bg-white/5 border border-white/10"
                    >
                        <Upload className="w-6 h-6 mr-4 text-orange-400" />
                        <div className="text-left">
                            <span className="block font-bold">{t('backup.wizard.restoreSystem')}</span>
                            <span className="text-xs text-slate-500 font-normal">{t('backup.wizard.restoreSystemDesc')}</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (mode === 'backup') {
        return (
            <Card className="bg-slate-900 border-white/5 text-white w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>{t('backup.wizard.secureBackupTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'success' ? (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <p className="text-green-400">{message}</p>
                            <Button onClick={() => { setMode('menu'); setStatus('idle'); }} variant="outline">{t('common.back')}</Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-500">{t('backup.wizard.passwordLabel')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                                    <input
                                        type="password"
                                        placeholder={t('backup.wizard.passwordPlaceholder')}
                                        className="w-full bg-white/10 border-white/10 rounded p-2 pl-9 text-white"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-600">
                                    {t('backup.wizard.passwordTip')}
                                </p>
                            </div>
                            <Button
                                onClick={handleBackup}
                                disabled={status === 'processing'}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {status === 'processing' ? t('backup.wizard.encrypting') : t('backup.wizard.generateAndDownload')}
                            </Button>
                            <Button variant="ghost" onClick={() => setMode('menu')} className="w-full">{t('common.cancel')}</Button>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (mode === 'restore') {
        return (
            <Card className="bg-slate-900 border-white/5 text-white w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>{t('backup.wizard.restoreSystem')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'success' ? (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <p className="text-green-400">{message}</p>
                            <Button onClick={() => { setMode('menu'); setStatus('idle'); }} variant="outline">{t('common.back')}</Button>
                        </div>
                    ) : (
                        <>
                            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center bg-white/10/50">
                                <Upload className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">{t('backup.wizard.dragAndDrop')}</p>
                                <input type="file" className="hidden" id="file-upload" onChange={(e) => {
                                    if (e.target.files?.[0]) handleRestore(e.target.files[0]);
                                }} />
                                <label htmlFor="file-upload" className="mt-4 inline-block bg-blue-600 px-4 py-2 rounded cursor-pointer hover:bg-blue-700 text-sm">
                                    {t('backup.wizard.selectFile')}
                                </label>
                            </div>

                            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded flex gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-300">
                                    {t('backup.wizard.restoreWarning')}
                                </p>
                            </div>

                            <Button variant="ghost" onClick={() => setMode('menu')} className="w-full">{t('common.cancel')}</Button>
                        </>
                    )}
                </CardContent>
            </Card>
        )
    }

    return null;
};
