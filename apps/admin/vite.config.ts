import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/' : '/admin/',
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    // Proxy API calls to the Fastify backend. Mirrors production, where Nginx
    // reverse-proxies /api on the same origin — so no CORS in the browser.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
})
