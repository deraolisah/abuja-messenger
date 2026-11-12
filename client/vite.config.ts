import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,     
  plugins: [
    react(),
    tailwindcss()
  ],
  // resolve: {
  //   dedupe: ['react', 'react-dom'] // Key addition
  // },
  server: {
    host: "0.0.0.0",
    port: 3030,
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@abuja-messenger/contracts': fileURLToPath(
        new URL('../shared/contracts/src/index.ts', import.meta.url)
      ),
      // If config is also used, add it as well:
      // '@abuja-messenger/config': fileURLToPath(
      //   new URL('../shared/config/src/index.ts', import.meta.url)
      // ),
    },
  },
})