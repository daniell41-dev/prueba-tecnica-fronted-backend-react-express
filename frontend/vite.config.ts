import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * En dev, `/api` se manda al backend en `localhost:3000` — así el frontend
 * habla siempre con rutas relativas (`fetch('/api/contacts')`) sin importar
 * si corre con `vite` o detrás de nginx en Docker (ver
 * `docs/07-docker-desktop.md` y `nginx.conf`, que hacen el mismo proxy pero
 * en producción).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
