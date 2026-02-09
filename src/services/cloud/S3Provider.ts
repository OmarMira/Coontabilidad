import { CloudStorageProvider, CloudDetails } from './CloudStorageProvider';
import { AwsClient } from 'aws4fetch';
import pako from 'pako';

/**
 * S3Provider (Iron Clad Upgrade - Phase 1)
 * Production-ready S3-compatible client with AWS V4 Signing.
 * Supports AWS S3, MinIO, Cloudflare R2, and any S3-compatible storage.
 * 
 * Features:
 * - AWS V4 Signature authentication
 * - Retry logic with exponential backoff
 * - Optional GZIP compression
 * - Robust error handling
 * - Progress reporting
 */
export class S3Provider implements CloudStorageProvider {
    private endpoint: string;
    private bucket: string;
    private accessKey: string;
    private secretKey: string;
    private region: string;
    private awsClient: AwsClient;
    private maxRetries: number = 3;
    private baseRetryDelay: number = 1000; // 1 second

    constructor(config: {
        endpoint: string;
        bucket: string;
        accessKey: string;
        secretKey: string;
        region?: string;
    }) {
        this.endpoint = config.endpoint.replace(/\/$/, '');
        this.bucket = config.bucket;
        this.accessKey = config.accessKey;
        this.secretKey = config.secretKey;
        this.region = config.region || 'us-east-1';

        // Initialize AWS V4 Signing client
        this.awsClient = new AwsClient({
            accessKeyId: this.accessKey,
            secretAccessKey: this.secretKey,
            region: this.region,
            service: 's3'
        });
    }

    /**
     * Uploads data to S3 with retry logic and optional compression.
     * 
     * @param filename - Name of the file in S3
     * @param data - Data to upload (Blob, ArrayBuffer, or string)
     * @param options - Upload options (compress, contentType, onProgress)
     * @returns Promise<void>
     */
    async upload(
        filename: string,
        data: Blob | ArrayBuffer | string,
        options?: {
            compress?: boolean;
            contentType?: string;
            onProgress?: (progress: number) => void;
        }
    ): Promise<void> {
        const compress = options?.compress ?? false;
        const contentType = options?.contentType ?? 'application/octet-stream';
        const onProgress = options?.onProgress;

        // Convert data to ArrayBuffer if needed
        let buffer: ArrayBuffer;
        if (data instanceof Blob) {
            buffer = await data.arrayBuffer();
        } else if (typeof data === 'string') {
            buffer = new TextEncoder().encode(data).buffer;
        } else {
            buffer = data;
        }

        // Optional GZIP compression
        let finalData: ArrayBuffer = buffer;
        let finalContentType = contentType;
        if (compress) {
            const uint8Array = new Uint8Array(buffer);
            const compressed = pako.gzip(uint8Array);
            finalData = compressed.buffer;
            finalContentType = 'application/gzip';
        }

        // Construct S3 URL
        const url = `${this.endpoint}/${this.bucket}/${filename}`;

        // Retry logic with exponential backoff
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.maxRetries) {
            try {
                if (onProgress) {
                    onProgress((attempt / this.maxRetries) * 50); // 0-50% during retries
                }

                // Sign request with AWS V4
                const response = await this.awsClient.fetch(url, {
                    method: 'PUT',
                    body: finalData,
                    headers: {
                        'Content-Type': finalContentType,
                        'Content-Length': finalData.byteLength.toString(),
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`S3 Upload failed (${response.status}): ${errorText}`);
                }

                if (onProgress) {
                    onProgress(100); // Complete
                }

                console.log(`✅ S3 Upload successful: ${filename} (${finalData.byteLength} bytes)`);
                return; // Success!

            } catch (error: any) {
                lastError = error;
                attempt++;

                if (attempt >= this.maxRetries) {
                    console.error(`❌ S3 Upload failed after ${this.maxRetries} attempts:`, error);
                    throw new Error(`S3 Upload failed after ${this.maxRetries} retries: ${error.message}`);
                }

                // Exponential backoff: 1s, 2s, 4s
                const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
                console.warn(`⚠️ S3 Upload attempt ${attempt} failed, retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }

        throw lastError || new Error('S3 Upload failed for unknown reason');
    }

    /**
     * Downloads a file from S3 with retry logic.
     * 
     * @param filename - Name of the file in S3
     * @param options - Download options (decompress, onProgress)
     * @returns Promise<Blob>
     */
    async download(
        filename: string,
        options?: {
            decompress?: boolean;
            onProgress?: (progress: number) => void;
        }
    ): Promise<Blob> {
        const decompress = options?.decompress ?? false;
        const onProgress = options?.onProgress;

        const url = `${this.endpoint}/${this.bucket}/${filename}`;

        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.maxRetries) {
            try {
                if (onProgress) {
                    onProgress((attempt / this.maxRetries) * 50);
                }

                const response = await this.awsClient.fetch(url, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error(`S3 Download failed (${response.status}): ${response.statusText}`);
                }

                let data = await response.arrayBuffer();

                // Optional GZIP decompression
                if (decompress) {
                    const uint8Array = new Uint8Array(data);
                    const decompressed = pako.ungzip(uint8Array);
                    data = decompressed.buffer;
                }

                if (onProgress) {
                    onProgress(100);
                }

                console.log(`✅ S3 Download successful: ${filename} (${data.byteLength} bytes)`);
                return new Blob([data]);

            } catch (error: any) {
                lastError = error;
                attempt++;

                if (attempt >= this.maxRetries) {
                    console.error(`❌ S3 Download failed after ${this.maxRetries} attempts:`, error);
                    throw new Error(`S3 Download failed after ${this.maxRetries} retries: ${error.message}`);
                }

                const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
                console.warn(`⚠️ S3 Download attempt ${attempt} failed, retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }

        throw lastError || new Error('S3 Download failed for unknown reason');
    }

    /**
     * Lists all files in the S3 bucket.
     * 
     * @returns Promise<CloudDetails[]>
     */
    async list(): Promise<CloudDetails[]> {
        const url = `${this.endpoint}/${this.bucket}`;

        try {
            const response = await this.awsClient.fetch(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`S3 List failed (${response.status}): ${response.statusText}`);
            }

            const xmlText = await response.text();

            // Parse S3 XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const contents = xmlDoc.getElementsByTagName('Contents');
            const files: CloudDetails[] = [];

            for (let i = 0; i < contents.length; i++) {
                const content = contents[i];
                const key = content.getElementsByTagName('Key')[0]?.textContent || '';
                const size = parseInt(content.getElementsByTagName('Size')[0]?.textContent || '0');
                const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent || '';

                files.push({
                    name: key,
                    size,
                    lastModified: new Date(lastModified),
                    url: `${this.endpoint}/${this.bucket}/${key}`
                });
            }

            console.log(`✅ S3 List successful: ${files.length} files found`);
            return files;

        } catch (error: any) {
            console.error('❌ S3 List failed:', error);
            throw new Error(`S3 List failed: ${error.message}`);
        }
    }

    /**
     * Deletes a file from S3.
     * 
     * @param filename - Name of the file to delete
     * @returns Promise<void>
     */
    async delete(filename: string): Promise<void> {
        const url = `${this.endpoint}/${this.bucket}/${filename}`;

        try {
            const response = await this.awsClient.fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`S3 Delete failed (${response.status}): ${response.statusText}`);
            }

            console.log(`✅ S3 Delete successful: ${filename}`);

        } catch (error: any) {
            console.error('❌ S3 Delete failed:', error);
            throw new Error(`S3 Delete failed: ${error.message}`);
        }
    }

    /**
     * Tests the connection to S3 by attempting to list files.
     * 
     * @returns Promise<boolean> - true if connection is successful
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.list();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Helper function to sleep for a given duration.
     * 
     * @param ms - Milliseconds to sleep
     * @returns Promise<void>
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
