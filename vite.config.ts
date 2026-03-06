import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Note: .wasm files are NOT included in assetsInclude intentionally.
  // wa-sqlite resolves its .wasm at runtime via new URL(..., import.meta.url).
  // Vite's assetsInclude would rename them with a hash, breaking that URL.
  // The .wasm files are served verbatim from /public instead.
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    env: {
      NODE_ENV: 'test',
    },
  },
  envPrefix: ['VITE_', 'REACT_APP_'],
  worker: {
    format: 'es'
  },
  server: {
    port: 3000,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'sql.js'],
    exclude: ['@xenova/transformers', 'wa-sqlite'] // Lazy load AI models and preserve wasm paths
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'esnext',
    // Increase chunk size warning limit (targeting 600KB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Aggressive code splitting to reduce initial bundle size
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // React ecosystem
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          // Icons (heavy)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Charts (heavy)
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // PDF generation (heavy)
          if (id.includes('node_modules/jspdf') ||
            id.includes('node_modules/jspdf-autotable') ||
            id.includes('node_modules/@react-pdf')) {
            return 'vendor-pdf';
          }
          // Database engines (very heavy)
          if (id.includes('node_modules/sql.js')) {
            return 'vendor-database';
          }
          // AI/ML (extremely heavy - lazy load recommended)
          if (id.includes('node_modules/@xenova/transformers') ||
            id.includes('node_modules/ollama')) {
            return 'vendor-ai';
          }
          // Utilities
          if (id.includes('node_modules/date-fns') ||
            id.includes('node_modules/uuid') ||
            id.includes('node_modules/papaparse') ||
            id.includes('node_modules/xlsx')) {
            return 'vendor-utils';
          }
          // Crypto/Security
          if (id.includes('node_modules/sjcl') ||
            id.includes('node_modules/lz4js')) {
            return 'vendor-crypto';
          }
          // State management
          if (id.includes('node_modules/zustand') ||
            id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-state';
          }
          // UI Components
          if (id.includes('node_modules/react-hot-toast') ||
            id.includes('node_modules/react-virtuoso')) {
            return 'vendor-ui';
          }
          // Other vendor code
          if (id.includes('node_modules')) {
            return 'vendor-other';
          }
        },
        // Optimize chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Enable minification with esbuild (faster and more compatible)
    minify: 'esbuild',
    // Strip console.log and console.warn in production (OWASP A03:2021 compliance)
    esbuild: {
      drop: ['console', 'debugger'],
    },
    // Improve CSS code splitting
    cssCodeSplit: true,
    // Source maps only for errors
    sourcemap: false
  },
  // Servir archivos sql.js desde node_modules
  publicDir: 'public',
})
