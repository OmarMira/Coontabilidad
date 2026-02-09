declare module 'wa-sqlite' {
  export const SQL: any;
  export function Factory(module: any): any;
  const _default: any;
  export default _default;
}

declare module 'wa-sqlite/dist/wa-sqlite-async.mjs' {
  const factory: any;
  export default factory;
}

declare module 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js' {
  const IDBBatchAtomicVFS: any;
  export { IDBBatchAtomicVFS };
}

declare module 'sql.js' {
  export const initSqlJs: (config?: any) => Promise<any>;
  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): any;
    prepare(sql: string): any;
    close(): void;
  }
  class DatabaseConstructor implements Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): any;
    prepare(sql: string): any;
    close(): void;
  }
  export default initSqlJs;
}
