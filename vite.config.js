import { defineConfig } from 'vite';

export default defineConfig({
  // Vite copie automatiquement le contenu de `public/` vers `dist/` à la racine.
  // Les chemins absolus (/css/, /js/, /images/, /data/) fonctionnent en dev ET prod.
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'es2018',
    minify: 'esbuild',
  },

  server: {
    port: 5173,
    open: true,
  },
});
