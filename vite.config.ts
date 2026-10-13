import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');
  const apiProxy = {
    target: env.VITE_API_PROXY || 'https://kitchenscale.therugimports.com',
    changeOrigin: true,
    cookieDomainRewrite: '',
  };

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Dev: forward API calls to the Express backend so cookies stay same-origin.
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    proxy: {
      '/api': apiProxy,
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks cache across deploys; app code changes don't invalidate them.
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'i18n', test: /node_modules[\\/](i18next|react-i18next)[\\/]/ },
            { name: 'forms', test: /node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/ },
          ],
        },
      },
    },
  },
  };
});
