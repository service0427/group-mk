import fs from 'fs';
import path from 'path';

try {
  // 대상 디렉토리 확인
  const distDir = path.resolve('./dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // 소스 및 대상 디렉토리 설정
  const publicDir = path.resolve('./public');
  
  // 강제로 파일 교체를 위한 함수
  function forceReplaceFile(sourcePath, targetPath) {
    if (fs.existsSync(sourcePath)) {
      // 대상 디렉토리가 없으면 생성
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 파일 복사
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ ${path.basename(sourcePath)}가 ${path.dirname(targetPath)}에 복사되었습니다.`);
      return true;
    }
    return false;
  }
  
  // 파비콘 파일 강제 복사 (public -> dist)
  forceReplaceFile(path.join(publicDir, 'favicon.svg'), path.join(distDir, 'favicon.svg'));
  forceReplaceFile(path.join(publicDir, 'favicon.ico'), path.join(distDir, 'favicon.ico'));
  
  // PNG 파비콘 복사
  const pngFiles = ['favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png', 'favicon-64x64.png', 'apple-touch-icon.png'];
  
  // 루트 레벨에 PNG 파일 복사
  pngFiles.forEach(file => {
    forceReplaceFile(path.join(publicDir, file), path.join(distDir, file));
  });
  
  // app 디렉토리의 파비콘 파일도 복사 (이전 버전 호환성 유지)
  const appMediaDir = path.join(publicDir, 'media/app');
  const distMediaDir = path.join(distDir, 'media/app');
  
  pngFiles.forEach(file => {
    forceReplaceFile(path.join(appMediaDir, file), path.join(distMediaDir, file));
  });
  
  // 브랜드 로고 파일 복사
  const brandLogosPublicDir = path.join(publicDir, 'media/brand-logos');
  const brandLogosDistDir = path.join(distDir, 'media/brand-logos');
  
  ['marketing-standard-icon.svg', 'marketing-standard-icon-mini.svg'].forEach(file => {
    forceReplaceFile(path.join(brandLogosPublicDir, file), path.join(brandLogosDistDir, file));
  });
  
  // index.html 파일에 favicon 링크 추가 또는 수정
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    
    // <head> 태그 찾기
    const headMatch = htmlContent.match(/<head>([\s\S]*?)<\/head>/);
    if (headMatch) {
      // 모든 favicon 관련 링크 제거
      let headContent = headMatch[1];
      headContent = headContent.replace(/<link rel="icon"[^>]*>/g, '');
      headContent = headContent.replace(/<link rel="apple-touch-icon"[^>]*>/g, '');
      
      // 연속된 빈 줄 제거
      headContent = headContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // favicon 링크 추가 (다양한 크기와 형식 지원)
      const newHeadContent = headContent + 
        '\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
        '\n  <link rel="icon" href="/favicon.ico" type="image/x-icon">' +
        '\n  <link rel="apple-touch-icon" href="/apple-touch-icon.png">' +
        '\n  <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">' +
        '\n  <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png">';
      
      // 변경된 <head> 태그로 교체
      htmlContent = htmlContent.replace(headMatch[0], '<head>' + newHeadContent + '</head>');
      
      // 수정된 index.html 저장
      fs.writeFileSync(indexHtmlPath, htmlContent);
      console.log('✅ index.html의 favicon 링크가 업데이트되었습니다.');
    } else {
      console.log('⚠️ index.html에서 <head> 태그를 찾을 수 없습니다.');
    }
  } else {
    console.log('⚠️ index.html 파일을 찾을 수 없습니다.');
  }
  
  console.log('✅ 모든 favicon 파일이 처리되었습니다.');
} catch (error) {
  console.error('favicon 처리 중 오류 발생:', error);
}
