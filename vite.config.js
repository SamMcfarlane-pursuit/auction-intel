import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    // Keep heavy chunks out of the entry modulepreload list so they download only when a
    // component that actually needs them is lazy-loaded (e.g. USMap, MarketGlobe, export flows).
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !/\b(map-engine|three-vendor|export-tools)\b/.test(d)),
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy map engine — fetched only when user opens the Map view (USMap is React.lazy).
          'map-engine': ['maplibre-gl', 'supercluster', 'use-supercluster'],
          // 3D / globe stack — used by MarketGlobe & Market3DMap only.
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', 'react-globe.gl'],
          // PDF export stack — used from report/export actions.
          'export-tools': ['jspdf', 'jspdf-autotable'],
          // Core React runtime stays in the main chunk.
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
