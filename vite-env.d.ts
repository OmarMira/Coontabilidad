/// <reference types="vite/client" />

// Tipos para Web APIs modernas
interface Navigator {
  storage?: {
    getDirectory(): Promise<FileSystemDirectoryHandle>;
  };
}

interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  close(): Promise<void>;
}

// Tipos para Compression Streams
interface CompressionStream extends TransformStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}

interface CompressionStreamConstructor {
  new (format: string): CompressionStream;
}

declare var CompressionStream: CompressionStreamConstructor;

// Tipos para sql.js
declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface Statement {
    run(params?: any[]): void;
    getAsObject(params?: any[]): Record<string, any>[];
    free(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  interface SqlJsStatic {
    Database: {
      new (data?: ArrayLike<number> | Buffer | null): Database;
    };
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>;
  export default initSqlJs;
}