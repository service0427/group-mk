import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // 번들 분석 플러그인 (ANALYZE 환경 변수가 있을 때만)
    process.env.ANALYZE && visualizer({
      filename: './dist/bundle-stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
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
        manualChunks: (id) => {
          // node_modules의 라이브러리를 vendor 청크로 분리
          if (id.includes('node_modules')) {
            // React 관련
            if (id.includes('react')) {
              return 'react-vendor';
            }
            // UI 라이브러리
            if (id.includes('@radix-ui') || id.includes('clsx') || id.includes('tailwind')) {
              return 'ui-vendor';
            }
            // 유틸리티
            if (id.includes('axios') || id.includes('date-fns') || id.includes('lodash')) {
              return 'utils-vendor';
            }
            // Supabase
            if (id.includes('supabase')) {
              return 'supabase-vendor';
            }
            // 나머지 vendor
            return 'vendor';
          }
        }
      }
    }
  }
}));