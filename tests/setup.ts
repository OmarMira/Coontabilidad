/**
 * Vitest Setup File
 * Configures test environment for sql.js and other dependencies
 */

import { vi } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock window object for Node.js environment
if (typeof window === 'undefined') {
  global.window = {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any;
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
global.sessionStorage = localStorageMock as any;

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Mock Fetch for WASM loading (wa-sqlite)
import fs from 'fs';
import path from 'path';

// Store original fetch
const originalFetch = global.fetch;

// @ts-ignore
global.fetch = async (url: string | URL, init?: RequestInit) => {
  const urlStr = url.toString();

  // Intercept WASM requests
  if (urlStr.endsWith('.wasm')) {
    // Try wa-sqlite-async.wasm first
    if (urlStr.includes('wa-sqlite-async.wasm')) {
      const wasmPath = path.join(__dirname, '../node_modules/wa-sqlite/dist/wa-sqlite-async.wasm');
      const buffer = fs.readFileSync(wasmPath);
      return new Response(buffer, { headers: { 'Content-Type': 'application/wasm' } });
    }
    // Fallback for sql.js if needed
    if (urlStr.includes('sql-wasm.wasm')) {
      const wasmPath = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
      const buffer = fs.readFileSync(wasmPath);
      return new Response(buffer, { headers: { 'Content-Type': 'application/wasm' } });
    }
  }

  // Fallback to original fetch or MSW will handle it
  // Wait, if we override global.fetch, MSW might be bypassed if it hooks before or after?
  // MSW usually patches global.fetch. If we overwrite it here, we might break MSW.
  // BETTER: Use MSW to handle the WASM request!
  // Reverting this manual patch and relying on MSW handler in just a moment.
  // BUT, handlers.ts is better place.
  // HOWEVER, for unit tests that might NOT use MSW setup?
  // AuditChainService.test.ts DOES use MSW? No, it imports it? 
  // It doesn't seem to import setup.ts automatically unless configured in vite.config.ts.
  // Checking vite.config.ts... yes it does: setupFiles: './tests/setup.ts'

  // So MSW is active. We should add the WASM handler to MSW handlers.ts instead of monkey-patching fetch here.
  return originalFetch ? originalFetch(url, init) : Promise.reject('No fetch');
};


// Configure sql.js to find WASM file in node_modules

// Configure sql.js to find WASM file in node_modules
process.env.SQL_JS_WASM_PATH = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');

// --- MSW Setup ---
import { server } from '../src/mocks/server';
import { beforeAll, afterEach, afterAll } from 'vitest';
import '@testing-library/jest-dom';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test
afterEach(() => server.resetHandlers());


