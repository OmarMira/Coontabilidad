import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleUserInfo {
    email: string;
    name: string;
    picture: string;
    sub: string; // Google user ID
}

interface GoogleLoginButtonProps {
    onSuccess: (userInfo: GoogleUserInfo) => void;
    onError: () => void;
}

// 1. Intentar leer del entorno (puede fallar si .env está corrupto)
const ENV_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.REACT_APP_GOOGLE_CLIENT_ID ||
    import.meta.env.REACT_APP_CLIENT_ID;

// 2. Clave recuperada forensemente (actualizada)
const RECOVERED_ID = '385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com';

// 3. Selección Final (Prioridad: Environment > Recovered)
const FINAL_CLIENT_ID = (ENV_ID && ENV_ID.length > 10) ? ENV_ID : RECOVERED_ID;

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
    const [isLoading, setIsLoading] = React.useState(false);

    // Validar si tenemos un Client ID usable que NO sea el valor por defecto
    const isGoogleConfigured = React.useMemo(() => {
        return FINAL_CLIENT_ID &&
            FINAL_CLIENT_ID.length > 15 &&
            !FINAL_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');
    }, []);

    React.useEffect(() => {
        console.log('🔐 Google Auth Init:', {
            mode: isGoogleConfigured ? 'PRODUCTION' : 'SIMULATION_READY',
            recoveredKeyUsed: FINAL_CLIENT_ID === RECOVERED_ID,
            keyPreview: FINAL_CLIENT_ID ? `${FINAL_CLIENT_ID.substring(0, 10)}...` : 'NONE'
        });
    }, [isGoogleConfigured]);

    const handleSuccess = (credentialResponse: CredentialResponse) => {
        try {
            if (credentialResponse.credential) {
                const decoded = jwtDecode<GoogleUserInfo>(credentialResponse.credential);
                console.log('✅ Google login exitoso:', decoded);
                onSuccess(decoded);
            }
        } catch (error) {
            console.error('❌ Error decodificando credencial de Google:', error);
            onError();
        }
    };

    const handleError = () => {
        console.error('❌ Error en login de Google');
        onError();
    };

    return (
        <GoogleOAuthProvider clientId={FINAL_CLIENT_ID}>
            <div className="w-full">
                {!isGoogleConfigured ? (
                    <button
                        onClick={() => {
                            // Confirmación explícita para evitar bypass no deseado
                            if (!window.confirm("⚠️ Google Client ID no detectado o inválido.\n\n¿Desea acceder al sistema usando MODO SIMULACIÓN?")) {
                                return;
                            }

                            setIsLoading(true);
                            // Simular latencia de red real de Google (800ms)
                            setTimeout(() => {
                                onSuccess({
                                    email: 'demo@google.com',
                                    name: 'Usuario Google Demo',
                                    picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                                    sub: 'demo_google_id_123456'
                                });
                                setIsLoading(false);
                            }, 800);
                        }}
                        disabled={isLoading}
                        className="w-full bg-white/5 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-600 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="Google logo" className="h-5 w-5" />
                                <span>Simular Login con Google</span>
                            </>
                        )}
                    </button>
                ) : (
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="left"
                    />
                )}
            </div>
        </GoogleOAuthProvider>
    );
};

// Hook para usar Google One Tap
export const useGoogleOneTap = (onSuccess: (userInfo: GoogleUserInfo) => void) => {
    const isGoogleConfigured = FINAL_CLIENT_ID && FINAL_CLIENT_ID.length > 10 && FINAL_CLIENT_ID !== RECOVERED_ID;

    React.useEffect(() => {
        if (isGoogleConfigured) {
            console.log('✅ Google One Tap habilitado');
        } else {
            console.log('⚠️ Google One Tap deshabilitado (no configurado)');
        }
    }, []);
};
