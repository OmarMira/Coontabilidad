// Global minimal TypeScript declarations to cover File System Access API
// and StorageManager used across the codebase. These are intentionally
// lightweight shims to unblock compilation; replace with stricter
// lib types or @types packages in a later refactor.

export {};

declare global {
  interface StorageEstimate {
    usage?: number;
    quota?: number;
  }

  interface StorageManager {
    persist?: () => Promise<boolean>;
    persisted?: () => Promise<boolean>;
    estimate?: () => Promise<StorageEstimate>;
  }

  interface Navigator {
    storage?: StorageManager;
  }

  interface FileSystemWritableFileStream {
    write(data: any): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable?: () => Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemGetOptions {
    create?: boolean;
  }

  interface FileSystemDirectoryHandle {
    name: string;
    getFileHandle(name: string, options?: FileSystemGetOptions): Promise<FileSystemFileHandle>;
    getDirectoryHandle?(name: string, options?: FileSystemGetOptions): Promise<FileSystemDirectoryHandle>;
  }

  function showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
  function showOpenFilePicker(options?: any): Promise<FileSystemFileHandle[]>;
  function showSaveFilePicker(options?: any): Promise<FileSystemFileHandle>;
}
