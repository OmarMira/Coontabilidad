import React, { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Rocket } from 'lucide-react';
import UserService from '@/services/UserService';

interface ConfirmationStepProps {
  data: any;
  onNext?: (data: any) => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Crear usuario admin
      const roles = UserService.getRoles();
      const adminRole = roles.find(r => r.name === 'admin');

      if (!adminRole) {
        throw new Error('Rol de administrador no encontrado');
      }

      const result = await UserService.createUser({
        username: data.username,
        email: data.email,
        full_name: data.fullName,
        display_name: data.displayName,
        password: data.password,
        role_id: adminRole.id
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      // 2. Guardar configuración de empresa (si existe la función)
      // TODO: Implementar saveCompanySettings cuando esté disponible

      // 3. Marcar setup como completado
      localStorage.setItem('initial_setup_completed', 'true');
      localStorage.setItem('setup_date', new Date().toISOString());

      // 4. Redirect a login
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">¡Todo Listo!</h2>
        <p className="text-blue-200 text-sm">Revisa la configuración antes de finalizar</p>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Administrador
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-200">Usuario:</span>
              <span className="text-white font-mono">{data.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Email:</span>
              <span className="text-white">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Nombre:</span>
              <span className="text-white">{data.fullName}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Seguridad
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-200">Cifrado:</span>
              <span className="text-white">PBKDF2 600k</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Master Key:</span>
              <span className="text-green-400">✓ Guardada</span>
            </div>
          </div>
        </div>

        {data.companyName && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Empresa
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">Nombre:</span>
                <span className="text-white">{data.companyName}</span>
              </div>
              {data.taxId && (
                <div className="flex justify-between">
                  <span className="text-blue-200">Tax ID:</span>
                  <span className="text-white font-mono">{data.taxId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Configurando Sistema...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Finalizar y Acceder al Sistema
          </>
        )}
      </button>

      <p className="text-center text-blue-200 text-xs">
        Serás redirigido a la pantalla de login automáticamente
      </p>
    </div>
  );
};
