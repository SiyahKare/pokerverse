import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
