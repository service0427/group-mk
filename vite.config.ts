import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // 번들 분석 플러그인은 로컬에서만 사용 (Cloudflare 빌드 오류 방지)
    // process.env.ANALYZE && visualizer({
    //   filename: './dist/bundle-stats.html',
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    // })
  ].filter(Boolean),
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  base: '/', // 절대 경로 사용
  // Node.js 모듈 브라우저 호환성 문제 해결
  optimizeDeps: {
    exclude: ['ws'], // ws 모듈을 번들링에서 제외
    include: ['xlsx'] // xlsx를 사전 번들링에 포함
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
        // 수동 청크 분리를 제거하여 Vite가 자동으로 최적화하도록 함
        manualChunks: undefined
      }
    }
  },
  // 개발 서버 프록시 설정
  server: {
    proxy: {
      '/api/purchase-guarantee-slot': {
        target: 'http://localhost:8787', // Wrangler 로컬 서버
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
}));