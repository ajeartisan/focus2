import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Focus2',
        short_name: 'Focus2',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f6fa',
        theme_color: '#4A6FA5',
      },
    }),
  ],
});
