import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, User, AlertCircle, Loader2, Zap, ShieldCheck } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useLocale } from '../../i18n/useLocale';
// import { LanguageSelector } from '../LanguageSelector';

// Verificar si Google está configurado (Soporte VITE/REACT_APP)
const isGoogleConfigured = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        import.meta.env.REACT_APP_GOOGLE_CLIENT_ID ||
        import.meta.env.REACT_APP_CLIENT_ID || '';
    return clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && clientId.length > 10;
};

const LoginForm: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const { t } = useLocale();
    const showGoogleLogin = true; // Forzar mostrar botón de Google

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('SUBMIT VALUES:', { username, password: password.length });
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);
            if (!success) {
                setError('Usuario o contraseña incorrectos');
            }
        } catch (err) {
            setError(t('login.error'));
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };





    const handleGoogleSuccess = async (userInfo: any) => {
        setLoading(true);
        setError('');

        try {
            const success = await loginWithGoogle(userInfo);
            if (!success) {
                setError('Error al iniciar sesión con Google. Verifica la consola del navegador para más detalles.');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al procesar login de Google: ${errorMsg}`);
            console.error('Google login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-4 relative overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative w-full max-w-[420px] z-10 flex flex-col items-center">
                {/* Logo and Icon */}
                <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 shadow-blue-900/40">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        AccountExpress
                    </h1>
                    <p className="text-blue-400/60 text-sm font-medium mt-1">
                        Enterprise Management System
                    </p>
                </div>

                {/* Login Card */}
                <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-3xl p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    {/* Error Feedback */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-semibold text-red-200">{error}</span>
                        </div>
                    )}

                    {/* Google Login */}
                    {showGoogleLogin && (
                        <div className="mb-8">
                            <GoogleLoginButton
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                            />
                        </div>
                    )}

                    <div className="relative mb-8 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <span className="relative px-4 bg-transparent text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {t('login.orLocalCredentials')}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> {t('login.user')}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                placeholder={t('login.userPlaceholder')}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5" /> {t('login.password')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-2 mt-8 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{t('login.signIn')}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-10 text-center animate-in fade-in duration-1000 delay-300">
                    <p className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">
                        SECURED BY IRON CORE ENCRYPTION © 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;

