import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  clearScreen: false,
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: 'esbuild',
    sourcemap: true,
    outDir: 'dist'
  },
  plugins: [],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  root: '.'
}); 