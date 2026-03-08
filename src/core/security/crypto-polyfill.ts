/**
 * Browser-compatible polyfill for 'crypto' module
 * Redirects module imports to the native Web Crypto API
 */
const webCrypto = typeof window !== 'undefined' ? (window.crypto || (window as any).msCrypto) : null;

export const getRandomValues = webCrypto ? webCrypto.getRandomValues.bind(webCrypto) : null;
export const subtle = webCrypto ? webCrypto.subtle : null;

export default {
    getRandomValues,
    subtle,
    ...webCrypto
};
