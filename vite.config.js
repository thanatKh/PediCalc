import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Raise warning threshold — react-pdf is intentionally large (lazy-loaded)
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
          if (id.includes('node_modules/@react-pdf') || id.includes('node_modules/pako')) return 'react-pdf';
          if (id.includes('node_modules/radix-ui') || id.includes('node_modules/@radix-ui')) return 'radix-vendor';
          if (id.includes('node_modules/motion')) return 'motion-vendor';
          if (id.includes('node_modules/lucide-react')) return 'lucide-vendor';
        },
      },
    },
  },
})
