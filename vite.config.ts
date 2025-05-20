import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  base: '/', // 절대 경로 사용
  // Node.js 모듈 브라우저 호환성 문제 해결
  optimizeDeps: {
    exclude: ['ws'] // ws 모듈을 번들링에서 제외
  },
  // 빌드 시 브라우저 호환성 설정
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      ws: fileURLToPath(new URL('./src/hooks/browser-ws-fix.ts', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: undefined // 청크 생성 방식 단순화
      }
    }
  }
});