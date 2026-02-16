import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { offlineManager } from '../../utils/offline-manager';
import { useLocale } from '../../i18n/useLocale';

export const OnlineStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(offlineManager.getStatus());
    const { t } = useLocale();

    useEffect(() => {
        return offlineManager.subscribe((status) => {
            setIsOnline(status);
        });
    }, []);

    if (isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 animate-in fade-in duration-300">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('common.synchronized')}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('common.offlineMode')}</span>
        </div>
    );
};
