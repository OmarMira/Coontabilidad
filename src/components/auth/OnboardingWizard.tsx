import React, { useState } from 'react';
import { Shield, User, Lock, CheckCircle, ArrowRight, Scale, Mail, Info } from 'lucide-react';
import UserService from '../../services/UserService';
import { useLocale } from '../../i18n/useLocale';

const OnboardingWizard: React.FC = () => {
    const { t } = useLocale();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [formData, setFormData] = useState({
        username: 'admin',
        email: '',
        full_name: '',
        display_name: 'Administrador Principal',
        password: '',
        confirmPassword: ''
    });

    const handleNext = () => {
        if (step === 1 && !acceptedTerms) {
            setError('Debes aceptar los Términos de Servicio y la Política de Privacidad.');
            return;
        }
        setError(null);
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
        setError(null);
    };

    const validateForm = () => {
        if (!formData.username || formData.username.length < 3) return 'Usuario inválido (mín. 3 caracteres)';
        if (!formData.email || !formData.email.includes('@')) return 'Email inválido';
        if (!formData.full_name) return 'Nombre completo requerido';
        if (formData.password.length < 12) return 'La contraseña debe tener al menos 12 caracteres (NIST)';
        if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
        return null;
    };

    const handleFinish = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await UserService.createUser({
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name,
                password: formData.password,
                display_name: formData.display_name,
                role_id: 1 // Suponiendo que 1 es 'Administrador'
            });

            if (result.success) {
                // Éxito, recargar la página para que AppRouter detecte el nuevo usuario
                window.location.reload();
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError('Fallo crítico al crear usuario: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 selection:bg-blue-500/30 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-xl relative group">
                {/* Main Card */}
                <div className="bg-slate-900/80 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500">
                    
                    {/* Header: Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-950 flex">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            style={{ width: `${(step / 3) * 100}%` }}
                        ></div>
                    </div>

                    <div className="p-10 md:p-14 space-y-8">
                        
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4 animate-in slide-in-from-top-2">
                                <Info className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                <p className="text-rose-200 text-xs font-bold uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        {/* STEP 1: WELCOME & LEGAL */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-blue-600/20 rounded-2xl border border-blue-500/30 flex items-center justify-center mb-6">
                                        <Shield className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                                        Configuración Inicial
                                    </h1>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        Bienvenido a Account Express. Para comenzar con la gestión de su empresa, necesitamos cumplir con los protocolos de seguridad y establecer su cuenta maestra.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="flex items-start gap-4 p-6 bg-slate-950/50 border border-slate-800/50 rounded-2xl cursor-pointer hover:border-slate-700 transition-all group/check">
                                        <div className="relative flex items-center mt-1">
                                            <input 
                                                type="checkbox" 
                                                className="peer sr-only"
                                                checked={acceptedTerms}
                                                onChange={() => setAcceptedTerms(!acceptedTerms)}
                                            />
                                            <div className="w-6 h-6 border-2 border-slate-700 rounded-lg bg-slate-900 peer-checked:bg-blue-600 peer-checked:border-blue-500 transition-all flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-white text-xs font-black uppercase tracking-widest leading-none">Acepto el cumplimiento legal</p>
                                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">
                                                He leído y acepto los <a href="/terms" target="_blank" className="text-blue-500 hover:underline">Términos de Servicio</a> y la <a href="/privacy" target="_blank" className="text-blue-500 hover:underline">Política de Privacidad</a> de Account Express.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: USER SETUP */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Cuenta de Administrador</h2>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">NIVEL DE ACCESO: ROOT / ADMIN_01</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nombre Completo</label>
                                            <input 
                                                type="text" 
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                                placeholder="Ej: John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Usuario</label>
                                            <input 
                                                type="text" 
                                                value={formData.username}
                                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                                placeholder="admin"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Email Corporativo</label>
                                            <input 
                                                type="email" 
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                                placeholder="admin@empresa.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nueva Contraseña</label>
                                            <div className="relative">
                                                <input 
                                                    type="password" 
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                                    placeholder="••••••••••••"
                                                />
                                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Confirmar Contraseña</label>
                                            <input 
                                                type="password" 
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                                placeholder="••••••••••••"
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase tracking-wider">
                                            Seguridad: Mínimo 12 caracteres recomendados por NIST SP 800-63B.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: CONFIRM & SYNC */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                                <div className="space-y-4">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-10 h-10 text-emerald-500 animate-in zoom-in duration-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Todo Listo</h2>
                                    <p className="text-slate-400 text-sm font-medium px-4">
                                        Se creará la cuenta maestra **{formData.username}**. Por seguridad, asegúrese de recordar sus credenciales ya que toda la contabilidad local estará vinculada a esta identidad.
                                    </p>
                                </div>

                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-left space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">
                                        <span>Resumen de Instalación</span>
                                        <span className="text-blue-500">v4.0 BUILD</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 text-xs font-bold uppercase tracking-tight">
                                        <span className="text-slate-500">Administrador:</span>
                                        <span className="text-white text-right">{formData.full_name}</span>
                                        <span className="text-slate-500">ID de Usuario:</span>
                                        <span className="text-white text-right">{formData.username}</span>
                                        <span className="text-slate-500">Email:</span>
                                        <span className="text-white text-right max-w-[150px] truncate">{formData.email}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="flex items-center justify-between pt-10 border-t border-slate-800/50">
                            {step > 1 ? (
                                <button 
                                    onClick={handleBack}
                                    className="px-6 py-2.5 text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[11px] active:scale-95"
                                >
                                    Paso Anterior
                                </button>
                            ) : <div></div>}

                            <button 
                                onClick={step === 3 ? handleFinish : handleNext}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-3 shadow-[0_4px_20px_rgba(59,130,246,0.4)] active:scale-95 group"
                            >
                                <span>{loading ? 'Inicializando...' : step === 3 ? 'Finalizar Configuración' : 'Siguiente Paso'}</span>
                                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Secure Footer */}
                <div className="mt-10 flex flex-col items-center gap-4 text-slate-500">
                    <div className="flex items-center gap-2 opacity-50">
                        <Lock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cifrado Local Forense Activo (SHA-256)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
