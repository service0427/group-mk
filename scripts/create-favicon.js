import fs from 'fs';
import path from 'path';

try {
  // SVG 데이터 (간단한 원형)
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#3498db" />
    <text x="16" y="22" font-family="Arial" font-size="16" text-anchor="middle" fill="white">M</text>
  </svg>`;
  
  // 대상 디렉토리 확인
  const distDir = path.resolve('./dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // SVG 파일 저장
  fs.writeFileSync(path.join(distDir, 'favicon.svg'), svgData);
  
  // index.html 파일 읽기
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    
    // <head> 태그 찾기
    const headMatch = htmlContent.match(/<head>([\s\S]*?)<\/head>/);
    if (headMatch) {
      // favicon 링크가 있는지 확인
      if (!htmlContent.includes('rel="icon"')) {
        // <head> 태그 내용
        const headContent = headMatch[1];
        // favicon 링크 추가
        const newHeadContent = headContent + 
          '\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
          '\n  <link rel="alternate icon" href="/favicon.ico" type="image/x-icon">';
        
        // 변경된 <head> 태그로 교체
        htmlContent = htmlContent.replace(headMatch[0], '<head>' + newHeadContent + '</head>');
        
        // 수정된 index.html 저장
        fs.writeFileSync(indexHtmlPath, htmlContent);
        console.log('✅ index.html에 favicon 링크가 추가되었습니다.');
      } else {
        console.log('ℹ️ index.html에 이미 favicon 링크가 있습니다.');
      }
    } else {
      console.log('⚠️ index.html에서 <head> 태그를 찾을 수 없습니다.');
    }
  } else {
    console.log('⚠️ index.html 파일을 찾을 수 없습니다.');
  }
  
  // 빈 favicon.ico 파일도 생성 (브라우저 호환성을 위해)
  fs.writeFileSync(path.join(distDir, 'favicon.ico'), Buffer.alloc(0));
  
  console.log('✅ favicon 파일이 생성되었습니다.');
} catch (error) {
  console.error('favicon 생성 중 오류 발생:', error);
}
