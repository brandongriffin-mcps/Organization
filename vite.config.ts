import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/Organization/",
  resolve: {
    alias: {
      "@icons": path.resolve(__dirname, "./src/icons")
    }
  },
  plugins: [svelte()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          d3: ['d3'],
          exceljs: ['exceljs']
        }
      }
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  worker: {
    format: 'es'
  }
})
