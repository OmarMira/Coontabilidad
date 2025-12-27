// Cifrado básico con Web Crypto API
export class BasicEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  
  // Generar clave de cifrado desde contraseña
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Ensure salt is proper ArrayBuffer type
    const saltBuffer: ArrayBuffer = salt.buffer instanceof SharedArrayBuffer ? 
      new ArrayBuffer(salt.byteLength).slice(0) : 
      salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
    
    // Copy data if SharedArrayBuffer
    if (salt.buffer instanceof SharedArrayBuffer) {
      const tempArray = new Uint8Array(saltBuffer);
      tempArray.set(new Uint8Array(salt.buffer, salt.byteOffset, salt.byteLength));
    }
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  // Cifrar datos
  static async encrypt(data: Uint8Array, password: string): Promise<{
    encrypted: Uint8Array;
    salt: Uint8Array;
    iv: Uint8Array;
  }> {
    try {
      // Generar salt e IV aleatorios
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Derivar clave
      const key = await this.deriveKey(password, salt);
      
      // Ensure data is proper ArrayBuffer type
      const dataBuffer: ArrayBuffer = data.buffer instanceof SharedArrayBuffer ?
        (() => {
          const newBuffer = new ArrayBuffer(data.byteLength);
          new Uint8Array(newBuffer).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
          return newBuffer;
        })() : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      
      // Cifrar
      const ivBuffer: ArrayBuffer = iv.buffer instanceof SharedArrayBuffer ?
        (() => {
          const newBuffer = new ArrayBuffer(iv.byteLength);
          new Uint8Array(newBuffer).set(new Uint8Array(iv.buffer, iv.byteOffset, iv.byteLength));
          return newBuffer;
        })() : iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
        
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: ivBuffer
        },
        key,
        dataBuffer
      );
      
      return {
        encrypted: new Uint8Array(encrypted),
        salt,
        iv
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  // Descifrar datos
  static async decrypt(
    encryptedData: Uint8Array,
    salt: Uint8Array,
    iv: Uint8Array,
    password: string
  ): Promise<Uint8Array> {
    try {
      // Derivar clave
      const key = await this.deriveKey(password, salt);
      
      // Ensure proper ArrayBuffer types
      const encryptedBuffer: ArrayBuffer = encryptedData.buffer instanceof SharedArrayBuffer ?
        (() => {
          const newBuffer = new ArrayBuffer(encryptedData.byteLength);
          new Uint8Array(newBuffer).set(new Uint8Array(encryptedData.buffer, encryptedData.byteOffset, encryptedData.byteLength));
          return newBuffer;
        })() : encryptedData.buffer.slice(encryptedData.byteOffset, encryptedData.byteOffset + encryptedData.byteLength);
        
      const ivBuffer: ArrayBuffer = iv.buffer instanceof SharedArrayBuffer ?
        (() => {
          const newBuffer = new ArrayBuffer(iv.byteLength);
          new Uint8Array(newBuffer).set(new Uint8Array(iv.buffer, iv.byteOffset, iv.byteLength));
          return newBuffer;
        })() : iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
      
      // Descifrar
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      );
      
      return new Uint8Array(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - invalid password or corrupted data');
    }
  }
  
  // Verificar si Web Crypto API está disponible
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      window.crypto.getRandomValues
    );
  }
  
  // Generar hash para verificación de integridad
  static async hash(data: Uint8Array): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported');
    }
    
    // Ensure proper ArrayBuffer type
    const dataBuffer: ArrayBuffer = data.buffer instanceof SharedArrayBuffer ?
      (() => {
        const newBuffer = new ArrayBuffer(data.byteLength);
        new Uint8Array(newBuffer).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        return newBuffer;
      })() : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Comprimir datos para localStorage
  static async compressData(data: Uint8Array): Promise<string> {
    try {
      // Usar CompressionStream si está disponible
      if (typeof window !== 'undefined' && 'CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        // Escribir datos
        const buffer: ArrayBuffer = data.buffer instanceof SharedArrayBuffer ?
          (() => {
            const newBuffer = new ArrayBuffer(data.byteLength);
            new Uint8Array(newBuffer).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
            return newBuffer;
          })() : data.buffer;
        const bufferSlice = buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        await writer.write(bufferSlice);
        await writer.close();
        
        // Leer datos comprimidos
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        // Combinar chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
    } catch (error) {
      console.warn('Compression failed, using base64:', error);
    }
    
    // Fallback: solo base64
    return btoa(String.fromCharCode(...data));
  }
  
  // Combinar datos cifrados en un solo array
  static combineEncryptedData(encrypted: Uint8Array, salt: Uint8Array, iv: Uint8Array): Uint8Array {
    const combined = new Uint8Array(salt.length + iv.length + encrypted.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encrypted, salt.length + iv.length);
    return combined;
  }
  
  // Separar datos cifrados combinados
  static separateEncryptedData(combined: Uint8Array): {
    salt: Uint8Array;
    iv: Uint8Array;
    encrypted: Uint8Array;
  } {
    if (combined.length < 16 + this.IV_LENGTH) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + this.IV_LENGTH);
    const encrypted = combined.slice(16 + this.IV_LENGTH);
    
    return { salt, iv, encrypted };
  }
}