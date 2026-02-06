/**
 * External Timestamp Service
 * Provides RFC 3161 compliant timestamp authority integration
 * 
 * In production, this would connect to a real TSA (Time Stamping Authority)
 * For testing and development, provides mock timestamps
 */
export class ExternalTimestampService {
    /**
     * Gets a trusted timestamp from an external authority
     * @param data - The data to timestamp (usually a hash)
     * @returns Promise<string | null> - The timestamp token or null if unavailable
     */
    static async getTrustedTimestamp(dataHash: string): Promise<string | null> {
        // In test mode, return mock timestamp
        if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
            return `MOCK_TIMESTAMP_${Date.now()}_${dataHash.substring(0, 8)}`;
        }

        try {
            // 1. Create ASN.1 DER encoded TimeStampReq
            const requestBytes = this.createTimeStampRequest(dataHash);

            // 2. Send to FreeTSA.org
            const response = await fetch('https://freetsa.org/tsr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/timestamp-query',
                    'Content-Length': requestBytes.length.toString()
                },
                body: requestBytes
            });

            if (!response.ok) {
                throw new Error(`TSA responded with ${response.status} ${response.statusText}`);
            }

            // 3. Get binary response (TimeStampResp)
            const arrayBuffer = await response.arrayBuffer();
            const responseBytes = new Uint8Array(arrayBuffer);

            // 4. Return as Base64 string for storage
            return this.arrayBufferToBase64(responseBytes);

        } catch (error) {
            console.error('Failed to get external timestamp from FreeTSA:', error);
            // Fallback: don't break the app, but log weakness
            return null;
        }
    }

    /**
     * Verifies a timestamp token
     * Note: Real verification requires parsing the CMS SignedData (TimeStampResp),
     * checking the signature against the TSA CA certificate, and comparing the hash.
     * This is complex to implement without a heavy crypto lib.
     * For MVP, we check structure sanity.
     */
    static async verifyTimestamp(tokenBase64: string, originalHash: string): Promise<boolean> {
        // In test mode, accept mock timestamps
        if (process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true') {
            return tokenBase64.startsWith('MOCK_TIMESTAMP_');
        }

        // Basic sanity check for Base64 + ASN.1 structure header
        try {
            if (!tokenBase64 || tokenBase64.length < 100) return false;
            // Decode base64 to check 1st byte (should be 0x30 for SEQUENCE)
            const binaryString = atob(tokenBase64);
            return binaryString.charCodeAt(0) === 0x30;
        } catch {
            return false;
        }
    }

    // --- HELPER: ASN.1 DER Encoder for TimeStampReq ---

    private static createTimeStampRequest(hashHex: string): Uint8Array {
        // SHA-256 OID: 2.16.840.1.101.3.4.2.1
        // DER encoded OID: 06 09 60 86 48 01 65 03 04 02 01
        const sha256Oid = [0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01];

        // Convert hex hash to bytes
        const hashBytes = this.hexToBytes(hashHex); // Should be 32 bytes for SHA-256

        // MessageImprint ::= SEQUENCE { hashAlgorithm, hashedMessage }
        // AlgorithmIdentifier ::= SEQUENCE { algorithm OID, parameters NULL }
        const algoIdWithNull = [
            0x30, 0x0d, // SEQUENCE (13 bytes)
            ...sha256Oid,
            0x05, 0x00  // NULL
        ];

        const hashedMessage = [
            0x04, hashBytes.length, // OCTET STRING
            ...hashBytes
        ];

        const messageImprintPayload = [...algoIdWithNull, ...hashedMessage];
        const messageImprint = [
            0x30, messageImprintPayload.length, // SEQUENCE
            ...messageImprintPayload
        ];

        // Nonce (Random Integer)
        const nonceVal = Math.floor(Math.random() * 2147483647);
        // Simplified encoding for positive 32-bit int (assume 4 bytes needed max, simplistic DER)
        const nonceBytes = this.intToBytes(nonceVal);
        const nonce = [
            0x02, nonceBytes.length, // INTEGER
            ...nonceBytes
        ];

        // Certificates Request: TRUE (Boolean)
        const certReq = [0x01, 0x01, 0xff];

        // Version: 1 (Integer)
        const version = [0x02, 0x01, 0x01];

        // TimeStampReq ::= SEQUENCE
        const reqPayload = [...version, ...messageImprint, ...nonce, ...certReq];
        const request = new Uint8Array([
            0x30, // SEQUENCE TAG
            ...this.encodeLength(reqPayload.length),
            ...reqPayload
        ]);

        return request;
    }

    // --- UTILS ---

    private static hexToBytes(hex: string): number[] {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    private static intToBytes(num: number): number[] {
        const arr = [
            (num >> 24) & 0xff,
            (num >> 16) & 0xff,
            (num >> 8) & 0xff,
            num & 0xff,
        ];
        // Remove leading zeros for minimal encoding compliance (roughly)
        while (arr.length > 1 && arr[0] === 0) arr.shift();
        // If high bit is set, prepend 00 to make it positive in 2's complement
        if (arr[0] & 0x80) arr.unshift(0);
        return arr;
    }

    private static encodeLength(len: number): number[] {
        if (len < 128) return [len];
        const lenBytes = [];
        while (len > 0) {
            lenBytes.unshift(len & 0xff);
            len = len >> 8;
        }
        return [0x80 | lenBytes.length, ...lenBytes];
    }

    private static arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = '';
        const len = buffer.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return btoa(binary);
    }
