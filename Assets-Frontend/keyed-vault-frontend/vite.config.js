import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // AI запросы — идут через Spring Boot (порт 10000), который проксирует на Python (8001)
      // Spring Boot: NotaryController обрабатывает /api/ai/* и передаёт в NotaryService
      '/api/ai': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
        // Увеличиваем таймаут прокси для долгих AI запросов (Claude ~30 сек)
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
        },
      },
      // Все остальные API запросы — Spring Boot
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
      // Защищенное хранилище файлов KeyedVault
      '/vault': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});