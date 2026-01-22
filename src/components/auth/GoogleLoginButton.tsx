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

// Obtener Client ID del .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Verificar si Google OAuth está configurado
const isGoogleConfigured = GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' &&
    GOOGLE_CLIENT_ID.length > 20;

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
    // Si Google no está configurado, no mostrar nada
    if (!isGoogleConfigured) {
        console.warn('⚠️ Google OAuth no configurado. Crea un archivo .env con VITE_GOOGLE_CLIENT_ID');
        console.warn('📖 Lee GOOGLE_OAUTH_SETUP.md para instrucciones');
        return null;
    }

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
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="w-full">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                    theme="filled_black"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    logo_alignment="left"
                />
            </div>
        </GoogleOAuthProvider>
    );
};

// Hook para usar Google One Tap
export const useGoogleOneTap = (onSuccess: (userInfo: GoogleUserInfo) => void) => {
    React.useEffect(() => {
        if (isGoogleConfigured) {
            console.log('✅ Google One Tap habilitado');
        } else {
            console.log('⚠️ Google One Tap deshabilitado (no configurado)');
        }
    }, []);
};
