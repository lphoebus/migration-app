import { defineConfig } from 'vite';

export default defineConfig({
  base: '/migration-app/',
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js', // removes leading underscore
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});