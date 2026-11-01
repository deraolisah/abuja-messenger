import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,     
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom'] // Key addition
  },
  server: {
    host: "0.0.0.0",
    port: 3030,
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})