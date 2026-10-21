import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vendor code changes far less often than app code, so it gets its own long-lived chunks.
// three.js and Leaflet stay lazy: only the 3D scene and the maps import them.
// gsap and Lenis are split away from motion so the shell never preloads them: the
// scroll timelines belong to the home sections and load with that route's chunk.
const VENDORS = [
  ['three', /\/node_modules\/three\//],
  ['leaflet', /\/node_modules\/leaflet\//],
  ['react', /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//],
  ['scroll', /\/node_modules\/(lenis|gsap)\//],
  ['motion', /\/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//],
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = { '/api': env.API_PROXY_TARGET || 'http://127.0.0.1:8787' }
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { proxy },
    build: {
      target: 'es2022',
      // three.js alone is ~590 kB minified; it only loads with the home page scene.
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            return VENDORS.find(([, pattern]) => pattern.test(id))?.[0]
          },
        },
      },
    },
  }
})
