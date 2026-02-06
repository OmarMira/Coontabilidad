
import * as asn1js from 'asn1js';
import { getCrypto, setEngine } from 'pkijs'; // Assuming standard pkijs browser usage
// Ensure crypto engine is set (browser only)
if (typeof window !== 'undefined' && window.crypto) {
    const name = "The name"; // Placeholder
    // pkijs auto-detects browser crypto usually
}

export class ExternalTimestampService {
    private static TSA_URLS = ['https://freetsa.org/tsr', 'http://timestamp.digicert.com']; // Redundant TSAs
    private static TIMEOUT = 5000;

    // ... (rest of methods)

    private static async sendToTSA(data: ArrayBuffer): Promise<ArrayBuffer> {
        // Try Primary then Secondary
        for (const url of this.TSA_URLS) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), this.TIMEOUT);

            try {
                console.log(`[TSA] Attempting handshake with: ${url}`);
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/timestamp-query',
                    },
                    body: data,
                    signal: controller.signal
                });
                clearTimeout(id);

                if (res.ok) {
                    return await res.arrayBuffer();
                } else {
                    console.warn(`[TSA] Server ${url} returned ${res.status}`);
                }
            } catch (e) {
                clearTimeout(id);
                console.warn(`[TSA] Connection failed to ${url}`, e);
            }
        }

        throw new Error('All TSA servers unreachable (Fail-Secure Triggered)');
    }

    private static hexToArrayBuffer(hex: string): ArrayBuffer {
        const view = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return view.buffer;
    }

    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
