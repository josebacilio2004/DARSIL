import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true
  },
  server: {
    port: 3005,
    host: true
  }
})
