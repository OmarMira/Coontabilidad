import React, { useState, useEffect } from 'react';
import { Shield, Download, AlertTriangle, CheckCircle2, ArrowRight, Copy } from 'lucide-react';
import { BasicEncryption } from '../../../core/security/BasicEncryption';

interface SecurityStepProps {
  data: any;
  onNext: (data: any) => void;
}

export const SecurityStep: React.FC<SecurityStepProps> = ({ data, onNext }) => {
  const [masterKey, setMasterKey] = useState(data.masterKey || '');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!masterKey) {
      // Generate master key
      const key = generateMasterKey();
      setMasterKey(key);
    }
  }, []);

  const generateMasterKey = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleDownload = () => {
    const blob = new Blob([`AccountExpress Master Key\n\nKey: ${masterKey}\n\nFecha: ${new Date().toLocaleString()}\n\n⚠️ IMPORTANTE: Guarda esta clave en un lugar seguro. Si la pierdes, no podrás recuperar datos cifrados.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accountexpress-master-key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(masterKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (confirmed) {
      onNext({ masterKey, masterKeySaved: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">Configuración de Seguridad</h2>
        <p className="text-blue-200 text-sm">Master Key para cifrado de datos</p>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-200 font-bold mb-1">⚠️ Importante</h3>
            <p className="text-yellow-200/80 text-sm">
              Esta clave se muestra <strong>solo una vez</strong>. Si la pierdes, no podrás recuperar 
              los datos cifrados. Guárdala en un lugar seguro (gestor de contraseñas, caja fuerte, etc.)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-bold">Master Key</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all flex items-center gap-2"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-green-400 break-all">
          {masterKey}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold mb-3">Especificaciones Técnicas</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-200">Algoritmo:</span>
            <span className="text-white font-mono">PBKDF2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">Iteraciones:</span>
            <span className="text-white font-mono">600,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">Hash:</span>
            <span className="text-white font-mono">SHA-256</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">Estándar:</span>
            <span className="text-white font-mono">NIST SP 800-63B</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
        <input
          type="checkbox"
          id="confirm"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="confirm" className="text-white text-sm cursor-pointer">
          He guardado la Master Key en un lugar seguro y entiendo que no podré recuperarla si la pierdo.
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!confirmed}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        Continuar
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
