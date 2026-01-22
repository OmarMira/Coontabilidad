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

// IMPORTANTE: Reemplaza esto con tu Google Client ID
// Obtenerlo en: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
    const handleSuccess = (credentialResponse: CredentialResponse) => {
        try {
            if (credentialResponse.credential) {
                const decoded = jwtDecode<GoogleUserInfo>(credentialResponse.credential);
                console.log('Google login exitoso:', decoded);
                onSuccess(decoded);
            }
        } catch (error) {
            console.error('Error decodificando credencial de Google:', error);
            onError();
        }
    };

    const handleError = () => {
        console.error('Error en login de Google');
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
        // Google One Tap se inicializa automáticamente con useOneTap en GoogleLogin
        console.log('Google One Tap habilitado');
    }, []);
};
