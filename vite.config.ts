import { fileURLToPath, URL } from 'node:url'

import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import manifest from './src/manifest'

export default defineConfig({
  resolve: {
    alias: {
      '@ui': fileURLToPath(new URL('./ui', import.meta.url)),
    },
  },
  plugins: [react(), tailwindcss(), crx({ manifest })],
})
