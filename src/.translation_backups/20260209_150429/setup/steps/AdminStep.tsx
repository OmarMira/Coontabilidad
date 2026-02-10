import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface AdminStepProps {
  data: any;
  onNext: (data: any) => void;
}

export const AdminStep: React.FC<AdminStepProps> = ({ data, onNext }) => {
  const [formData, setFormData] = useState({
    username: data.username || '',
    email: data.email || '',
    fullName: data.fullName || '',
    displayName: data.displayName || '',
    password: data.password || '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validatePassword = (password: string): number => {
    let strength = 0;
    if (password.length >= 12) strength += 25;
    if (password.length >= 16) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength(validatePassword(password));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.displayName || formData.displayName.length < 2) {
      newErrors.displayName = 'El nombre para mostrar es requerido';
    }

    if (!formData.password || formData.password.length < 12) {
      newErrors.password = 'La contraseña debe tener al menos 12 caracteres (NIST SP 800-63B)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        displayName: formData.displayName,
        password: formData.password
      });
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return 'Débil';
    if (passwordStrength < 70) return 'Media';
    return 'Fuerte';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">Crear Administrador</h2>
        <p className="text-blue-200 text-sm">Este será el usuario principal del sistema</p>
      </div>

      {/* Username */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <User className="w-4 h-4" />
          Nombre de Usuario
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin"
        />
        {errors.username && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.username}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4" />
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin@empresa.com"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="text-white text-sm font-bold mb-2 block">Nombre Completo</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Juan Pérez"
        />
        {errors.fullName && (
          <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label className="text-white text-sm font-bold mb-2 block">Nombre para Mostrar</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Juan"
        />
        {errors.displayName && (
          <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="text-white text-sm font-bold flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4" />
          Contraseña
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mínimo 12 caracteres"
        />
        {formData.password && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">Fortaleza:</span>
              <span className={`font-bold ${passwordStrength >= 70 ? 'text-green-400' : passwordStrength >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {getStrengthText()}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                style={{ width: `${passwordStrength}%` }}
              />
            </div>
          </div>
        )}
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="text-white text-sm font-bold mb-2 block">Confirmar Contraseña</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Repetir contraseña"
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
        )}
        {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
          <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Las contraseñas coinciden
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6"
      >
        Continuar
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
};
