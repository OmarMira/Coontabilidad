/**
 * CloudStorageProvider Interface (Iron Clad Objective 3)
 */
export interface CloudDetails {
    name: string;           // Filename in cloud storage
    filename?: string;      // Legacy support
    size: number;           // File size in bytes
    lastModified: Date;     // Last modification date
    url?: string;           // Full URL to the file
}

export interface CloudStorageProvider {
    upload(filename: string, data: Blob | ArrayBuffer | string, options?: any): Promise<void>;
    download(filename: string, options?: any): Promise<Blob>;
    list(): Promise<CloudDetails[]>;
    delete(filename: string): Promise<void>;
    testConnection?(): Promise<boolean>;
}
