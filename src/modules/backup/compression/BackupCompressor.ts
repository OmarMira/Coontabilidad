import lz4js from 'lz4js';

export class BackupCompressor {

    /**
     * Compress data using LZ4
     */
    static compress(data: string | Uint8Array): Uint8Array {
        const inputBuffer = typeof data === 'string'
            ? new TextEncoder().encode(data)
            : data;

        return lz4js.compress(inputBuffer);
    }

    /**
     * Decompress data using LZ4
     */
    static decompress(data: Uint8Array): string {
        const decompressed = lz4js.decompress(data);
        return new TextDecoder().decode(decompressed);
    }
}
