import React from 'react';
import { Wifi, WifiOff, Database, Shield } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  dbStats: {
    customers: number;
  };
}

export const Header: React.FC<HeaderProps> = ({ isOnline, dbStats }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Información del sistema */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Database className="w-4 h-4" />
            <span>SQLite Local</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Shield className="w-4 h-4 text-green-400" />
            <span>AES-256 Cifrado</span>
          </div>
        </div>

        {/* Espacio central */}
        <div className="flex-1"></div>

        {/* Estado de conexión */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 text-sm ${
            isOnline ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </header>
  );
};