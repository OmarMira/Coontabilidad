import React from 'react';
import { Wifi, WifiOff, Database, Shield, Brain } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  dbStats: {
    customers: number;
  };
  onAssistantClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isOnline, dbStats, onAssistantClick }) => {
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

        {/* Estado de conexión y Botón IA */}
        <div className="flex items-center space-x-6">
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${isOnline
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
            }`}>
            <div className="relative">
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-slate-950 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isOnline ? 'Cloud Synced' : 'Offline Mode'}
            </span>
          </div>

          <div className="w-px h-6 bg-slate-900 mx-2"></div>

          {onAssistantClick && (
            <button
              onClick={onAssistantClick}
              className="flex items-center space-x-2.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/40 transform hover:scale-105 active:scale-95 border border-blue-400/30"
            >
              <Brain className="w-4 h-4 animate-pulse" />
              <span>Smart Assistant</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};