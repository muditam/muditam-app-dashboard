import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [react()],
  server: {
    proxy: {
      '/widget-api/api/commerce-widget': {
        target: env.WIDGET_API_BASE_URL || env.VITE_API_BASE_URL || 'https://muditam-app-backend-ca1c8b03db09.herokuapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/widget-api/, ''),
        configure: (proxy) => {
          // This is a server-to-server development proxy. changeOrigin only
          // changes Host; forwarding the browser Origin triggers upstream CORS.
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
      '/shiptrack-api': {
        target: env.SHIPTRACK_API_BASE_URL || 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/shiptrack-api/, ''),
      },
    },
  },
  };
})
