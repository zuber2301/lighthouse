import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // bind to all interfaces so the dev server is reachable from the host/container
    host: true,
    // allow overriding via env/CLI; default to Docker/Vite default 5173
    port: Number(process.env.VITE_PORT || process.env.PORT) || 5173,
    hmr: {
      // allow configuring HMR host/protocol from env when running in containers
      host: process.env.VITE_HMR_HOST || 'localhost',
      protocol: process.env.VITE_HMR_PROTOCOL || 'ws'
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || process.env.BACKEND_URL || 'http://localhost:18000',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['x-tenant-id']) {
              proxyReq.setHeader('X-Tenant-ID', req.headers['x-tenant-id']);
            }
          });
        }
      },
    },
  },
})
