import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isHttps = mode === 'https' || process.env.HTTPS === 'true' || process.argv.includes('--https');

  return {
    plugins: [
      react(),
      tailwindcss(),
      isHttps ? basicSsl() : null,
    ].filter(Boolean),
    server: {
      host: true, // Listen on all network addresses (LAN/Wi-Fi for phone camera testing)
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})
