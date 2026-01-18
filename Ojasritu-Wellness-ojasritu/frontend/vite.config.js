import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isCodespaces = Boolean(process.env.CODESPACE_NAME || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN);
const forwardedProtoHeaders = isCodespaces ? { 'X-Forwarded-Proto': 'https' } : undefined;

export default defineConfig({
  base: '/static/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunk for better caching
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    },
    // Optimize build output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
        secure: false,
        xfwd: true,
        headers: forwardedProtoHeaders,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
        secure: false,
        xfwd: true,
        headers: forwardedProtoHeaders,
      }
    }
  }
})