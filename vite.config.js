import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Fixed (non-hashed) filenames — deliberate. Prerendered pages are
        // generated locally and committed as static HTML (see
        // scripts/prerender.mjs), referencing whatever this build produces.
        // Content-hashed filenames would drift between that local build and
        // Vercel's own separate build, silently breaking every prerendered
        // page's script/link tags. Fixed names guarantee they always match.
        // Cache-Control on /assets/* (see vercel.json) is shortened to
        // compensate for losing hash-based cache-busting.
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
