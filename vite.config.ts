import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 3000,
    host: true
  },
  optimizeDeps: {
    include: ['sql.js']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'db-vendor': ['sql.js']
        }
      }
    }
  },
  // Servir archivos sql.js desde node_modules
  publicDir: 'public',
  assetsInclude: ['**/*.wasm']
})