import { logger } from '../../core/logging/SystemLogger';
import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse, useGoogleOneTapLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useLocale } from '../../i18n/useLocale';

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

// 1. Intentar leer del entorno (Prioridad: VITE_GOOGLE_CLIENT_ID > REACT_APP_GOOGLE_CLIENT_ID)
const RECOVERED_ID = '385613242210-7uthrm6ctsvjeauo8tb3kubfgqd7edr4.apps.googleusercontent.com';

const FINAL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.REACT_APP_GOOGLE_CLIENT_ID ||
    RECOVERED_ID; // Recurso forense como fallback


const GoogleLoginInner: React.FC<GoogleLoginButtonProps & { isConfigured: boolean }> = ({ onSuccess, onError, isConfigured }) => {
    const { t, language } = useLocale();

    useGoogleOneTapLogin({
        onSuccess: (credentialResponse) => {
            if (credentialResponse.credential) {
                const decoded = jwtDecode<GoogleUserInfo>(credentialResponse.credential);
                logger.info('GoogleLoginButton', 'one_tap_success', 'Google One Tap success');
                onSuccess(decoded);
            }
        },
        onError: () => {
            logger.info('GoogleLoginButton', 'one_tap_skipped', 'One Tap skipped or failed');
        },
        disabled: !isConfigured,
    });

    const handleSuccess = (credentialResponse: CredentialResponse) => {
        try {
            if (credentialResponse.credential) {
                const decoded = jwtDecode<GoogleUserInfo>(credentialResponse.credential);
                logger.info('GoogleLoginButton', 'login_success', 'Google login exitoso');
                onSuccess(decoded);
            }
        } catch (error) {
            logger.error('GoogleLoginButton', 'decode_error', 'Error decodificando credencial de Google', error);
            onError();
        }
    };

    const handleError = () => {
        logger.error('GoogleLoginButton', 'login_error', 'Error en login de Google');
        onError();
    };

    return (
        <div className="w-full flex justify-center">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"


            />
        </div>
    );
};

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const { t } = useLocale();

    // Validar si tenemos un Client ID usable que NO sea el valor por defecto
    const isGoogleConfigured = React.useMemo(() => {
        return FINAL_CLIENT_ID &&
            FINAL_CLIENT_ID.length > 15 &&
            !FINAL_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');
    }, []);

    React.useEffect(() => {
        logger.info('GoogleLoginButton', 'auth_init', 'Google Auth Init');




    }, [isGoogleConfigured]);

    /* 
    // Google OAuth desactivado temporalmente para localhost
    if (!isGoogleConfigured) {
        return (
            <div className="w-full">
                <button
                    onClick={() => {
                        // ConfirmaciÃ³n explÃ­cita para evitar bypass no deseado
                        if (!window.confirm("âš ï¸ Google Client ID no detectado o invÃ¡lido.\n\nÂ¿Desea acceder al sistema usando MODO SIMULACIÃ“N?")) {
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
                            <span>{t('login.simulateGoogle')}</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={FINAL_CLIENT_ID}>
            <GoogleLoginInner onSuccess={onSuccess} onError={onError} isConfigured={isGoogleConfigured} />
        </GoogleOAuthProvider>
    );
    */
    
    // Google OAuth desactivado temporalmente por solicitud del usuario para evitar bloqueo origin_mismatch
    logger.info('GoogleLoginButton', 'oauth_disabled', 'Google OAuth desactivado temporalmente para localhost');
    return null;
};
