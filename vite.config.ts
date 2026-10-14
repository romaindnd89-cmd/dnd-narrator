import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La clé Gemini n'est volontairement PAS injectée dans le bundle :
// chaque utilisateur saisit sa propre clé, stockée dans son navigateur.
// (Avant, GEMINI_API_KEY était copiée en clair dans le JavaScript publié.)
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          genai: ['@google/genai'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
