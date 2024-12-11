import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  // optimizing Vite for production
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://devproject-hub.onrender.com/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
