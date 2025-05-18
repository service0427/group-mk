import fs from 'fs';
import path from 'path';

// Cloudflare Pages에 최적화된 routes.json 내용
const routesContent = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/build/*",
    "/assets/*",
    "/media/*",
    "/*.js",
    "/*.css",
    "/*.map",
    "/*.json",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.svg",
    "/*.gif",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.eot"
  ],
  routes: [
    // 인증 관련 경로
    {
      "src": "/auth/login",
      "dest": "/index.html"
    },
    {
      "src": "/auth/signup",
      "dest": "/index.html"
    },
    {
      "src": "/auth/reset-password",
      "dest": "/index.html"
    },
    {
      "src": "/auth/verification",
      "dest": "/index.html"
    },
    {
      "src": "/auth/*",
      "dest": "/index.html"
    },
    
    // 에러 페이지
    {
      "src": "/error/404",
      "dest": "/index.html"
    },
    {
      "src": "/error/500",
      "dest": "/index.html"
    },
    {
      "src": "/error/*",
      "dest": "/index.html"
    },
    
    // 자주 사용하는 경로 명시
    {
      "src": "/advertise/ntraffic/desc",
      "dest": "/index.html"
    },
    {
      "src": "/advertise/ntraffic/campaign",
      "dest": "/index.html"
    },
    {
      "src": "/admin/campaigns/ntraffic",
      "dest": "/index.html"
    },
    
    // 주요 섹션별 경로
    {
      "src": "/advertise/*",
      "dest": "/index.html"
    },
    {
      "src": "/admin/*",
      "dest": "/index.html"
    },
    {
      "src": "/keyword*",
      "dest": "/index.html"
    },
    {
      "src": "/myinfo/*",
      "dest": "/index.html"
    },
    {
      "src": "/cash/*",
      "dest": "/index.html"
    },
    {
      "src": "/point/*",
      "dest": "/index.html"
    },
    {
      "src": "/notice/*",
      "dest": "/index.html"
    },
    {
      "src": "/faq*",
      "dest": "/index.html"
    },
    {
      "src": "/withdraw*",
      "dest": "/index.html"
    },
    {
      "src": "/campaign-request*",
      "dest": "/index.html"
    },
    {
      "src": "/dashboard/*",
      "dest": "/index.html"
    },
    
    // 루트 경로
    {
      "src": "/",
      "dest": "/index.html"
    },
    
    // 모든 나머지 경로 처리
    {
      "src": ".*",
      "dest": "/index.html"
    }
  ]
};

const distDir = path.resolve('./dist');
// 디렉토리가 존재하는지 확인
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// _routes.json 파일 생성
fs.writeFileSync(
  path.join(distDir, '_routes.json'),
  JSON.stringify(routesContent, null, 2)
);

// _redirects 파일 삭제 (존재한다면)
const redirectsPath = path.join(distDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
  fs.unlinkSync(redirectsPath);
  console.log('✅ _redirects 파일이 제거되었습니다. (_routes.json만 사용)');
}

// _headers 파일도 dist에 복사
if (fs.existsSync('./public/_headers')) {
  fs.copyFileSync('./public/_headers', path.join(distDir, '_headers'));
  console.log('✅ _headers 파일이 복사되었습니다.');
}

console.log('✅ _routes.json 파일이 생성되었습니다.');