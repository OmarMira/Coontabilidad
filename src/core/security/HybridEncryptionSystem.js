/**
 * SISTEMA DE CIFRADO HÍBRIDO
 * 
 * Triple fallback: WebCrypto API → SJCL → Embedded
 */

export class HybridEncryptionSystem {
  constructor() {
    this.initializeEncryption();
  }
  
  async initializeEncryption() {
    // Detectar capacidades de cifrado disponibles
    this.webCryptoAvailable = 'crypto' in globalThis && 'subtle' in crypto;
    this.sjclAvailable = typeof sjcl !== 'undefined';
    
    console.log('🔐 Encryption capabilities:', {
      webCrypto: this.webCryptoAvailable,
      sjcl: this.sjclAvailable,
      embedded: true
    });
  }
  
  async encrypt(data, password) {
    // Intentar WebCrypto API primero
    if (this.webCryptoAvailable) {
      try {
        return await this.encryptWithWebCrypto(data, password);
      } catch (error) {
        console.warn('WebCrypto failed, falling back to SJCL:', error);
      }
    }
    
    // Fallback a SJCL
    if (this.sjclAvailable) {
      try {
        return this.encryptWithSJCL(data, password);
      } catch (error) {
        console.warn('SJCL failed, falling back to embedded:', error);
      }
    }
    
    // Fallback final: cifrado embebido simple
    return this.encryptWithEmbedded(data, password);
  }
  
  async decrypt(encryptedData, password) {
    const method = encryptedData.method || 'embedded';
    
    switch (method) {
      case 'webcrypto':
        return await this.decryptWithWebCrypto(encryptedData, password);
      case 'sjcl':
        return this.decryptWithSJCL(encryptedData, password);
      case 'embedded':
      default:
        return this.decryptWithEmbedded(encryptedData, password);
    }
  }
  
  async encryptWithWebCrypto(data, password) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // Generar salt y IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derivar clave con PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Cifrar con AES-256-GCM
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );
    
    return {
      method: 'webcrypto',
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }
  
  async decryptWithWebCrypto(encryptedData, password) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Reconstruir buffers
    const salt = new Uint8Array(encryptedData.salt);
    const iv = new Uint8Array(encryptedData.iv);
    const data = new Uint8Array(encryptedData.data);
    
    // Derivar clave
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Descifrar
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    return JSON.parse(decoder.decode(decrypted));
  }
  
  encryptWithSJCL(data, password) {
    // Implementación SJCL
    return {
      method: 'sjcl',
      data: sjcl.encrypt(password, JSON.stringify(data))
    };
  }
  
  decryptWithSJCL(encryptedData, password) {
    return JSON.parse(sjcl.decrypt(password, encryptedData.data));
  }
  
  encryptWithEmbedded(data, password) {
    // Cifrado simple embebido (solo para fallback)
    const dataStr = JSON.stringify(data);
    let encrypted = '';
    
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      const keyChar = password.charCodeAt(i % password.length);
      encrypted += String.fromCharCode(char ^ keyChar);
    }
    
    return {
      method: 'embedded',
      data: btoa(encrypted)
    };
  }
  
  decryptWithEmbedded(encryptedData, password) {
    const encrypted = atob(encryptedData.data);
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      const char = encrypted.charCodeAt(i);
      const keyChar = password.charCodeAt(i % password.length);
      decrypted += String.fromCharCode(char ^ keyChar);
    }
    
    return JSON.parse(decrypted);
  }
}

export const hybridEncryption = new HybridEncryptionSystem();
