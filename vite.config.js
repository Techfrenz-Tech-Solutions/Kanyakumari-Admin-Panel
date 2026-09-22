import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://106.51.20.225'
const devProxy = {
  target: devProxyTarget,
  changeOrigin: true,
  configure(proxy) {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.setHeader('Origin', devProxyTarget)
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    open: '/',
    proxy: {
      '/api': devProxy,
      '/uploads': devProxy,
    },
  },
})
