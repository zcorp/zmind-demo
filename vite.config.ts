import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const { DEMO_BASE_PATH = '/' } = loadEnv(mode, '.', '');

  return {
    base: DEMO_BASE_PATH,
    plugins: [react()],
    root: '.',
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    server: {
      port: 5173,
      host: '0.0.0.0'
    }
  };
});
