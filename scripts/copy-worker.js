import fs from 'fs';
import path from 'path';

try {
  // 소스 파일 경로
  const sourceFile = path.resolve('src/worker.js');
  
  // 파일 내용 읽기
  console.log('Worker 파일 경로:', sourceFile);
  
  if (!fs.existsSync(sourceFile)) {
    console.error('Worker 파일이 존재하지 않습니다:', sourceFile);
    process.exit(1);
  }
  
  const workerContent = fs.readFileSync(sourceFile, 'utf-8');
  
  // 대상 디렉토리 확인 및 생성
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // worker.js 파일 복사
  fs.writeFileSync(path.join(distDir, 'worker.js'), workerContent);
  
  console.log('✅ Worker 파일이 dist 폴더로 복사되었습니다.');
} catch (error) {
  console.error('Worker 파일 복사 중 오류 발생:', error);
  process.exit(1);
}