import fs from 'fs';
import path from 'path';

const routesContent = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/assets/*",
    "/media/*",
    "/*.ico",
    "/*.png",
    "/*.svg",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.js",
    "/*.css",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.eot",
    "/*.json",
    "/*.txt"
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

console.log('✅ _routes.json 파일이 생성되었습니다.');