declare module '../core/security/SimpleEncryption' {
  export class SimpleEncryption {
    static encrypt(data: Uint8Array | string, key?: string): Promise<Uint8Array | string>;
    static decrypt(data: Uint8Array | string, key?: string): Promise<Uint8Array | string>;
  }
}

declare namespace google {
  namespace accounts {
    const id: any;
    namespace oauth2 {
      interface TokenResponse {
        access_token?: string;
        expires_in?: string | number;
        scope?: string;
        token_type?: string;
        error?: any;
      }

      interface TokenClient {
        callback?: (resp: TokenResponse) => void;
        requestAccessToken(options?: any): void;
      }

      function initTokenClient(options: any): TokenClient;
      function revoke(token: string, cb?: (resp?: any) => void): void;
    }
  }
}

// Fallback: allow unknown modules to be imported without type errors during migration
declare module '*';
