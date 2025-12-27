/**
 * ARQUITECTURA MULTICAPA - RESILIENT STORAGE
 * 
 * Sistema de almacenamiento resiliente con múltiples capas de fallback
 */

export interface StorageLayer {
  name: string;
  available: boolean;
  priority: number;
  read(key: string): Promise<any>;
  write(key: string, data: any): Promise<void>;
  delete(key: string): Promise<void>;
}

export class ResilientStorage {
  private layers: StorageLayer[] = [];
  
  constructor() {
    this.initializeLayers();
  }
  
  private initializeLayers() {
    // Capa 1: OPFS (Origin Private File System)
    this.layers.push({
      name: 'OPFS',
      available: 'navigator' in globalThis && 'storage' in navigator,
      priority: 1,
      read: this.readFromOPFS.bind(this),
      write: this.writeToOPFS.bind(this),
      delete: this.deleteFromOPFS.bind(this)
    });
    
    // Capa 2: IndexedDB
    this.layers.push({
      name: 'IndexedDB',
      available: 'indexedDB' in globalThis,
      priority: 2,
      read: this.readFromIndexedDB.bind(this),
      write: this.writeToIndexedDB.bind(this),
      delete: this.deleteFromIndexedDB.bind(this)
    });
    
    // Capa 3: LocalStorage (fallback)
    this.layers.push({
      name: 'LocalStorage',
      available: 'localStorage' in globalThis,
      priority: 3,
      read: this.readFromLocalStorage.bind(this),
      write: this.writeToLocalStorage.bind(this),
      delete: this.deleteFromLocalStorage.bind(this)
    });
  }
  
  async read(key: string): Promise<any> {
    const availableLayers = this.layers
      .filter(layer => layer.available)
      .sort((a, b) => a.priority - b.priority);
    
    for (const layer of availableLayers) {
      try {
        const data = await layer.read(key);
        if (data !== null && data !== undefined) {
          return data;
        }
      } catch (error) {
        console.warn(`ResilientStorage: Error reading from ${layer.name}`, error);
      }
    }
    
    return null;
  }
  
  async write(key: string, data: any): Promise<void> {
    const availableLayers = this.layers
      .filter(layer => layer.available)
      .sort((a, b) => a.priority - b.priority);
    
    let success = false;
    
    for (const layer of availableLayers) {
      try {
        await layer.write(key, data);
        success = true;
        break;
      } catch (error) {
        console.warn(`ResilientStorage: Error writing to ${layer.name}`, error);
      }
    }
    
    if (!success) {
      throw new Error('Failed to write to any storage layer');
    }
  }
  
  private async readFromOPFS(key: string): Promise<any> {
    // Implementación OPFS
    return null;
  }
  
  private async writeToOPFS(key: string, data: any): Promise<void> {
    // Implementación OPFS
  }
  
  private async deleteFromOPFS(key: string): Promise<void> {
    // Implementación OPFS
  }
  
  private async readFromIndexedDB(key: string): Promise<any> {
    // Implementación IndexedDB
    return null;
  }
  
  private async writeToIndexedDB(key: string, data: any): Promise<void> {
    // Implementación IndexedDB
  }
  
  private async deleteFromIndexedDB(key: string): Promise<void> {
    // Implementación IndexedDB
  }
  
  private async readFromLocalStorage(key: string): Promise<any> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  
  private async writeToLocalStorage(key: string, data: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  private async deleteFromLocalStorage(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

export const resilientStorage = new ResilientStorage();
