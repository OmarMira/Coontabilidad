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

// Configure sql.js to find WASM file in node_modules
process.env.SQL_JS_WASM_PATH = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');

