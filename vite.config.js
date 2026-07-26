import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const clientRoot = fileURLToPath(new URL('./client/', import.meta.url));

export default defineConfig({
  root: clientRoot,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
