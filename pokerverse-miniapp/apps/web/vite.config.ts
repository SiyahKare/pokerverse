import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: true,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@pixi')) return 'pixi'
            if (id.includes('wallet') || id.includes('wagmi') || id.includes('viem') || id.includes('appkit')) return 'wallet'
            if (id.includes('react')) return 'vendor'
          }
        }
      }
    },
    minify: 'esbuild'
  },
  optimizeDeps: { exclude: ['@pixi/filter-*', 'pixi-filters'] },
  // Expose both VITE_* and WC_* vars to the client
  envPrefix: ['VITE_', 'WC_'],
  // Monorepo kökünde .env varsa yükleyebilmek için
  envDir: path.resolve(__dirname, '../../../'),
  resolve: {
    alias: {
      '@miniapp': path.resolve(__dirname, '../../src'),
    },
  },
  server: {
    // public/ klasörünü statik servis ederken kök olarak apps/web'in public'i kullanılacak
    fs: {
      // Hem bu workspace'in src'ı hem de miniapp kök src erişimi
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, '../../src'),
        path.resolve(__dirname, 'public'),
      ],
    },
  },
})
