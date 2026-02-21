import React from 'react';
import { Wifi, WifiOff, Database, Shield, User as UserIcon, Zap, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { OnlineStatus } from './common/OnlineStatus';
import { useAuth } from '../contexts/AuthContext';
// import { LanguageSelector } from './LanguageSelector';
import { useLocale } from '../i18n/useLocale';

interface HeaderProps {
  dbStats: {
    customers: number;
  };
  onAssistantClick?: () => void;
  onNavigate?: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ dbStats, onAssistantClick, onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-8 py-4 sticky top-0 z-[30]">
      <div className="flex items-center justify-between">
        {/* Información del sistema con indicadores de estado */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2.5 group cursor-help">
            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t('header.engineVersion')}</span>
              <span className="text-xs font-bold text-slate-300 leading-none">{t('header.sqliteLocal')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 group cursor-default">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t('header.encryptionProtocol')}</span>
              <span className="text-xs font-bold text-slate-300 leading-none">{t('header.militaryGrade')}</span>
            </div>
          </div>
        </div>

        {/* Espacio central */}
        <div className="flex-1"></div>

        {/* Estado de conexión, Usuario y Botón IA */}
        <div className="flex items-center space-x-6">
          {/* Usuario Conectado */}
          {user && (
            <div
              onClick={() => onNavigate?.('my-profile')}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 shadow-inner group cursor-pointer hover:bg-slate-900 transition-all hover:border-blue-500/30 active:scale-95"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600/30 transition-all">
                <UserIcon className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white leading-none tracking-tight group-hover:text-blue-400 transition-colors">
                  {user.display_name.toUpperCase()}
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-0.5">
                  {t(`roles.${user.role}`)}
                </span>
              </div>
            </div>
          )}

          {/* <LanguageSelector /> */}
          <OnlineStatus />
        </div>
      </div>
    </header>
  );
};