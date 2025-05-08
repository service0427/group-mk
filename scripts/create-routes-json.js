import fs from 'fs';
import path from 'path';

// Cloudflare Pages에 최적화된 routes.json 내용
const routesContent = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
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