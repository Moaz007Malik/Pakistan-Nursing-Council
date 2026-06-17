import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiProxy = env.VITE_DEV_API_PROXY || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: devApiProxy,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', () => {});
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
