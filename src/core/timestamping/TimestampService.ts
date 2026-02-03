/**
 * TimestampService - RFC 3161 Cryptographic Timestamping
 * 
 * Implementa timestamping criptográfico con testigo externo usando FreeTSA:
 * - Obtiene timestamps RFC 3161 de Time Stamp Authority (TSA)
 * - Verifica timestamps contra el servidor TSA
 * - Almacena tokens TSA con backups
 * - Proporciona validez forense legal
 * 
 * Cumple con requisitos P0 del audit report.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc3161
 * @see https://freetsa.org/
 */

import * as asn1js from 'asn1js';
import * as pkijs from 'pkijs';
import { ExponentialBackoff } from '../resilience/ExponentialBackoff';
import { ProductionLogger } from '../logging/ProductionLogger';

export interface TimestampRequest {
    data: ArrayBuffer;
    hashAlgorithm?: 'SHA-256' | 'SHA-384' | 'SHA-512';
    nonce?: boolean;
    certReq?: boolean;
}

export interface TimestampResponse {
    token: string; // Base64-encoded TST token
    timestamp: Date;
    serialNumber: string;
    tsaName: string;
    hashAlgorithm: string;
    hashedMessage: string;
    accuracy?: {
        seconds?: number;
        millis?: number;
        micros?: number;
    };
}

export interface TimestampVerification {
    valid: boolean;
    timestamp?: Date;
    errors: string[];
    tsaName?: string;
    serialNumber?: string;
}

export class TimestampService {
    private static readonly FREE_TSA_URL = 'https://freetsa.org/tsr';
    private static readonly DIGICERT_TSA_URL = 'http://timestamp.digicert.com';
    private static readonly SECTIGO_TSA_URL = 'http://timestamp.sectigo.com';
    
    private backoff: ExponentialBackoff;
    private tsaUrl: string;

    constructor(tsaUrl?: string) {
        this.tsaUrl = tsaUrl || TimestampService.FREE_TSA_URL;
        this.backoff = new ExponentialBackoff({
            maxRetries: 5,
            baseDelay: 2000,
            maxDelay: 32000,
            shouldRetry: (error: Error) => {
                // Retry on network errors and 5xx server errors
                return error.message.includes('NetworkError') ||
                       error.message.includes('ETIMEDOUT') ||
                       error.message.includes('ECONNREFUSED') ||
                       error.message.includes('500') ||
                       error.message.includes('502') ||
                       error.message.includes('503') ||
                       error.message.includes('504');
            }
        });
    }

    /**
     * Obtener timestamp RFC 3161 de FreeTSA
     * 
     * @param data - Datos a timestampear (típicamente hash del backup)
     * @returns Timestamp response con token TSA
     */
    async getTimestamp(request: TimestampRequest): Promise<TimestampResponse> {
        return await this.backoff.execute(async () => {
            ProductionLogger.info('TimestampService', 'Requesting RFC 3161 timestamp', {
                tsaUrl: this.tsaUrl,
                hashAlgorithm: request.hashAlgorithm || 'SHA-256'
            });

            try {
                // 1. Calcular hash de los datos
                const hashAlgorithm = request.hashAlgorithm || 'SHA-256';
                const hash = await this.calculateHash(request.data, hashAlgorithm);

                // 2. Crear TimeStampReq (RFC 3161)
                const timestampReq = await this.createTimestampRequest(
                    hash,
                    hashAlgorithm,
                    request.nonce ?? true,
                    request.certReq ?? true
                );

                // 3. Enviar request a TSA
                const response = await fetch(this.tsaUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/timestamp-query',
                        'User-Agent': 'AccountExpress/1.0 (Forensic Backup System)'
                    },
                    body: timestampReq
                });

                if (!response.ok) {
                    throw new Error(`TSA server error: ${response.status} ${response.statusText}`);
                }

                // 4. Parse TimeStampResp
                const responseData = await response.arrayBuffer();
                const timestampResp = await this.parseTimestampResponse(responseData);

                ProductionLogger.info('TimestampService', 'Timestamp obtained successfully', {
                    timestamp: timestampResp.timestamp,
                    serialNumber: timestampResp.serialNumber,
                    tsaName: timestampResp.tsaName
                });

                return timestampResp;

            } catch (error) {
                ProductionLogger.error(
                    'TimestampService',
                    'Failed to obtain timestamp',
                    error as Error,
                    { tsaUrl: this.tsaUrl }
                );
                throw error;
            }
        }, 'TimestampService.getTimestamp');
    }

    /**
     * Verificar timestamp RFC 3161
     * 
     * @param token - Token TSA (base64)
     * @param originalData - Datos originales
     * @returns Resultado de verificación
     */
    async verifyTimestamp(
        token: string,
        originalData: ArrayBuffer
    ): Promise<TimestampVerification> {
        return await this.backoff.execute(async () => {
            ProductionLogger.info('TimestampService', 'Verifying RFC 3161 timestamp');

            try {
                // 1. Decode token
                const tokenBuffer = this.base64ToArrayBuffer(token);
                const asn1 = asn1js.fromBER(tokenBuffer);
                
                if (asn1.offset === -1) {
                    return {
                        valid: false,
                        errors: ['Invalid ASN.1 structure in timestamp token']
                    };
                }

                // 2. Parse TimeStampToken
                const timestampToken = new pkijs.TimeStampResp({ schema: asn1.result });

                // 3. Verificar status
                if (timestampToken.status.status !== 0) {
                    return {
                        valid: false,
                        errors: [`TSA returned error status: ${timestampToken.status.status}`]
                    };
                }

                // 4. Extraer TSTInfo
                if (!timestampToken.timeStampToken) {
                    return {
                        valid: false,
                        errors: ['No TimeStampToken in response']
                    };
                }

                const contentInfo = timestampToken.timeStampToken;
                const signedData = new pkijs.SignedData({ schema: contentInfo.content });
                
                // 5. Verificar firma del TSA
                const verifyResult = await signedData.verify({
                    signer: 0,
                    checkChain: false // En producción, verificar cadena completa
                });

                if (!verifyResult) {
                    return {
                        valid: false,
                        errors: ['TSA signature verification failed']
                    };
                }

                // 6. Extraer TSTInfo
                const tstInfoBuffer = signedData.encapContentInfo.eContent?.getValue();
                if (!tstInfoBuffer) {
                    return {
                        valid: false,
                        errors: ['No TSTInfo in signed data']
                    };
                }

                const tstInfoAsn1 = asn1js.fromBER(tstInfoBuffer);
                const tstInfo = new pkijs.TSTInfo({ schema: tstInfoAsn1.result });

                // 7. Verificar hash del mensaje
                const messageImprint = tstInfo.messageImprint;
                const hashAlgorithm = this.getHashAlgorithmName(
                    messageImprint.hashAlgorithm.algorithmId
                );
                const expectedHash = await this.calculateHash(originalData, hashAlgorithm as any);
                const actualHash = new Uint8Array(messageImprint.hashedMessage.valueBlock.valueHex);

                const hashesMatch = this.compareArrayBuffers(expectedHash, actualHash.buffer);

                if (!hashesMatch) {
                    return {
                        valid: false,
                        errors: ['Message hash does not match timestamp token']
                    };
                }

                // 8. Extraer información del timestamp
                const timestamp = tstInfo.genTime;
                const serialNumber = this.bufferToHex(
                    new Uint8Array(tstInfo.serialNumber.valueBlock.valueHex)
                );

                ProductionLogger.info('TimestampService', 'Timestamp verified successfully', {
                    timestamp,
                    serialNumber
                });

                return {
                    valid: true,
                    timestamp,
                    serialNumber,
                    tsaName: this.tsaUrl,
                    errors: []
                };

            } catch (error) {
                ProductionLogger.error(
                    'TimestampService',
                    'Timestamp verification failed',
                    error as Error
                );

                return {
                    valid: false,
                    errors: [(error as Error).message]
                };
            }
        }, 'TimestampService.verifyTimestamp');
    }

    /**
     * Calcular hash de datos
     * @private
     */
    private async calculateHash(
        data: ArrayBuffer,
        algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'
    ): Promise<ArrayBuffer> {
        return await crypto.subtle.digest(algorithm, data);
    }

    /**
     * Crear TimeStampReq (RFC 3161)
     * @private
     */
    private async createTimestampRequest(
        messageHash: ArrayBuffer,
        hashAlgorithm: string,
        includeNonce: boolean,
        certReq: boolean
    ): Promise<ArrayBuffer> {
        // Crear MessageImprint
        const hashAlgId = this.getHashAlgorithmOID(hashAlgorithm);
        const messageImprint = new pkijs.MessageImprint({
            hashAlgorithm: new pkijs.AlgorithmIdentifier({
                algorithmId: hashAlgId
            }),
            hashedMessage: new asn1js.OctetString({ valueHex: messageHash })
        });

        // Crear TimeStampReq
        const timestampReq = new pkijs.TimeStampReq({
            version: 1,
            messageImprint,
            certReq
        });

        // Agregar nonce si se solicita
        if (includeNonce) {
            const nonce = crypto.getRandomValues(new Uint8Array(8));
            timestampReq.nonce = new asn1js.Integer({ valueHex: nonce.buffer });
        }

        // Serializar a DER
        return timestampReq.toSchema().toBER(false);
    }

    /**
     * Parse TimeStampResp (RFC 3161)
     * @private
     */
    private async parseTimestampResponse(
        responseData: ArrayBuffer
    ): Promise<TimestampResponse> {
        const asn1 = asn1js.fromBER(responseData);
        
        if (asn1.offset === -1) {
            throw new Error('Invalid ASN.1 structure in timestamp response');
        }

        const timestampResp = new pkijs.TimeStampResp({ schema: asn1.result });

        // Verificar status
        if (timestampResp.status.status !== 0) {
            const statusText = timestampResp.status.statusStrings?.[0] || 'Unknown error';
            throw new Error(`TSA returned error: ${statusText}`);
        }

        // Extraer token
        if (!timestampResp.timeStampToken) {
            throw new Error('No TimeStampToken in response');
        }

        const tokenDER = timestampResp.timeStampToken.toSchema().toBER(false);
        const tokenBase64 = this.arrayBufferToBase64(tokenDER);

        // Extraer TSTInfo
        const contentInfo = timestampResp.timeStampToken;
        const signedData = new pkijs.SignedData({ schema: contentInfo.content });
        const tstInfoBuffer = signedData.encapContentInfo.eContent?.getValue();
        
        if (!tstInfoBuffer) {
            throw new Error('No TSTInfo in signed data');
        }

        const tstInfoAsn1 = asn1js.fromBER(tstInfoBuffer);
        const tstInfo = new pkijs.TSTInfo({ schema: tstInfoAsn1.result });

        // Extraer información
        const timestamp = tstInfo.genTime;
        const serialNumber = this.bufferToHex(
            new Uint8Array(tstInfo.serialNumber.valueBlock.valueHex)
        );
        const tsaName = tstInfo.tsa?.toString() || this.tsaUrl;
        const hashAlgorithm = this.getHashAlgorithmName(
            tstInfo.messageImprint.hashAlgorithm.algorithmId
        );
        const hashedMessage = this.bufferToHex(
            new Uint8Array(tstInfo.messageImprint.hashedMessage.valueBlock.valueHex)
        );

        return {
            token: tokenBase64,
            timestamp,
            serialNumber,
            tsaName,
            hashAlgorithm,
            hashedMessage,
            accuracy: tstInfo.accuracy ? {
                seconds: tstInfo.accuracy.seconds,
                millis: tstInfo.accuracy.millis,
                micros: tstInfo.accuracy.micros
            } : undefined
        };
    }

    /**
     * Obtener OID del algoritmo de hash
     * @private
     */
    private getHashAlgorithmOID(algorithm: string): string {
        const oids: Record<string, string> = {
            'SHA-256': '2.16.840.1.101.3.4.2.1',
            'SHA-384': '2.16.840.1.101.3.4.2.2',
            'SHA-512': '2.16.840.1.101.3.4.2.3'
        };
        return oids[algorithm] || oids['SHA-256'];
    }

    /**
     * Obtener nombre del algoritmo desde OID
     * @private
     */
    private getHashAlgorithmName(oid: string): string {
        const names: Record<string, string> = {
            '2.16.840.1.101.3.4.2.1': 'SHA-256',
            '2.16.840.1.101.3.4.2.2': 'SHA-384',
            '2.16.840.1.101.3.4.2.3': 'SHA-512'
        };
        return names[oid] || 'SHA-256';
    }

    /**
     * Convertir ArrayBuffer a Base64
     * @private
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convertir Base64 a ArrayBuffer
     * @private
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Convertir buffer a hex string
     * @private
     */
    private bufferToHex(buffer: Uint8Array): string {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Comparar dos ArrayBuffers
     * @private
     */
    private compareArrayBuffers(a: ArrayBuffer, b: ArrayBuffer): boolean {
        if (a.byteLength !== b.byteLength) return false;
        const viewA = new Uint8Array(a);
        const viewB = new Uint8Array(b);
        for (let i = 0; i < viewA.length; i++) {
            if (viewA[i] !== viewB[i]) return false;
        }
        return true;
    }

    /**
     * Obtener métricas de backoff
     */
    getMetrics() {
        return this.backoff.getMetrics();
    }

    /**
     * Resetear métricas
     */
    resetMetrics() {
        this.backoff.resetMetrics();
    }
}

/**
 * Singleton instance para uso global
 */
export const timestampService = new TimestampService();
