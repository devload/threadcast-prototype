import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 21001,
    proxy: {
      '/api': {
        target: 'http://localhost:21000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:21000',
        ws: true,
      },
    },
  },
})
