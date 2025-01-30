import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    solidPlugin(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          tools: [
            '@motionone/solid',
            '@solidjs/router', 
            '@tanstack/solid-query',
            'solid-js',
            'solid-transition-group'
          ]
        }
      }
    }
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://127.0.0.1:8787'),
  },
  publicDir: 'public',
  optimizeDeps: {
    include: ['@motionone/solid', '@solidjs/router', '@tanstack/solid-query', 'solid-js', 'solid-transition-group']
  }
});
