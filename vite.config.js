import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        protocol: resolve(__dirname, 'protocol/index.html'),
        bandit: resolve(__dirname, 'bandit/index.html'),
      },
    },
  },
})
