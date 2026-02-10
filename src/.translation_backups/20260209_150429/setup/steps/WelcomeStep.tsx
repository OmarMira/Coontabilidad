import React from 'react';
import { Rocket, Shield, Database, CheckCircle } from 'lucide-react';

interface WelcomeStepProps {
  data: any;
  onNext: (data: any) => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black tracking-tight text-white mb-3">¡Bienvenido a AccountExpress!</h2>
        <p className="text-blue-200">
          Vamos a configurar tu sistema en 4 pasos simples
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Shield className="w-8 h-8 text-blue-400 mb-2" />
          <h3 className="text-white font-bold mb-1">Seguridad Enterprise</h3>
          <p className="text-blue-200 text-sm">Cifrado PBKDF2 600k iteraciones</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Database className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-white font-bold mb-1">Base de Datos Local</h3>
          <p className="text-blue-200 text-sm">SQLite cifrado en tu navegador</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <CheckCircle className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-white font-bold mb-1">Cumplimiento NIST</h3>
          <p className="text-blue-200 text-sm">Estándares de seguridad federales</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Rocket className="w-8 h-8 text-orange-400 mb-2" />
          <h3 className="text-white font-bold mb-1">Listo en 5 Minutos</h3>
          <p className="text-blue-200 text-sm">Configuración rápida y guiada</p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-200 text-sm">
          <strong className="text-white">Nota:</strong> Esta configuración solo se realiza una vez. 
          Asegúrate de guardar las credenciales en un lugar seguro.
        </p>
      </div>

      <button
        onClick={() => onNext({})}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        Comenzar Configuración
        <Rocket className="w-5 h-5" />
      </button>
    </div>
  );
};
