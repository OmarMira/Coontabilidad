import { crypto } from '../../core/security/CryptoPolyfill';

/**
 * Genera un hash único para una transacción bancaria para evitar duplicados.
 * Combina fecha, monto (en centavos para evitar precisión flotante), descripción y ID de cuenta.
 */
export async function generateTransactionHash(
    date: string,
    amount: number,
    description: string,
    bankAccountId: number
): Promise<string> {
    // Normalizamos el monto a centavos para consistencia de hash
    const amountInCents = Math.round(amount * 100);
    const rawData = `${date}|${amountInCents}|${description.trim().toUpperCase()}|${bankAccountId}`;

    // Usamos SHA-256
    const msgUint8 = new TextEncoder().encode(rawData);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}
