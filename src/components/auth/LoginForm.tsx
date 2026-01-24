import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, User, AlertCircle, Loader2, Zap, ShieldCheck } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';

// Verificar si Google está configurado
const isGoogleConfigured = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    return clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && clientId.length > 20;
};

const LoginForm: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const showGoogleLogin = isGoogleConfigured();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);
            if (!success) {
                setError('Usuario o contraseña incorrectos');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Por favor intenta de nuevo.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDemoLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const success = await login('demo', 'demo123');
            if (!success) {
                setError('Error en el acceso rápido. Intente manualmente.');
            }
        } catch (err) {
            setError('Error de conexión.');
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
                setError('Error al iniciar sesión con Google');
            }
        } catch (err) {
            setError('Error al procesar login de Google');
            console.error('Google login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

            <div className="relative w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-900/50 mb-4">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">AccountExpress</h1>
                    <p className="text-blue-300 text-sm mt-2 font-medium">Enterprise Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom duration-500">

                    {/* Botón de Acceso Rápido (NEW) */}
                    <button
                        onClick={handleQuickDemoLogin}
                        disabled={loading}
                        className="w-full mb-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden group relative"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-[-20deg]"></div>
                        <Zap className="w-6 h-6 animate-pulse" />
                        <span className="text-lg tracking-wider">ACCESO RÁPIDO DEMO</span>
                    </button>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top duration-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Google Login - Solo si está configurado */}
                    {showGoogleLogin && (
                        <>
                            <div className="mb-6">
                                <GoogleLoginButton
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                />
                            </div>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/20"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white/15 text-white/60 font-semibold text-xs uppercase tracking-widest">O credenciales locales</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Traditional Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-white/80 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="usuario"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/80 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
                        </button>
                    </form>

                    {/* Demo Credentials Footer */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                            <div className="text-[10px] text-white/40 text-center">
                                <p className="font-black uppercase">Admin</p>
                                <p>admin / admin123</p>
                            </div>
                            <div className="text-[10px] text-white/40 text-center border-l border-white/10 pl-4">
                                <p className="font-black uppercase">Demo</p>
                                <p>demo / demo123</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/20 text-[10px] mt-8 uppercase tracking-[0.2em] font-medium">
                    Secured by Iron Core Encryption © 2026
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
