import React from 'react';
import { Wifi, WifiOff, Database, Shield, User as UserIcon, Zap, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { OnlineStatus } from './common/OnlineStatus';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  dbStats: {
    customers: number;
  };
  onAssistantClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ dbStats, onAssistantClick }) => {
  const { user } = useAuth();

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
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Engine v1.2</span>
              <span className="text-xs font-bold text-slate-300 leading-none">SQLite Local Engine</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 group cursor-default">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Encryption Protocol</span>
              <span className="text-xs font-bold text-slate-300 leading-none">AES-256 Military Grade</span>
            </div>
          </div>
        </div>

        {/* Espacio central */}
        <div className="flex-1"></div>

        {/* Estado de conexión, Usuario y Botón IA */}
        <div className="flex items-center space-x-6">
          {/* Usuario Conectado */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 shadow-inner group">
              <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600/30 transition-all">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white leading-none tracking-tight">
                  {user.display_name.toUpperCase()}
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-0.5">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <OnlineStatus />
        </div>
      </div>
    </header>
  );
};