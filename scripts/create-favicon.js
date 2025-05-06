import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

<<<<<<< HEAD
async function createFavicons() {
  try {
    // 원본 SVG 파일 경로
    const svgPath = path.resolve('./public/media/brand-logos/marketing-standard-icon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    
    // 대상 디렉토리 확인
    const distDir = path.resolve('./dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // SVG 파일 복사
    fs.writeFileSync(path.join(distDir, 'favicon.svg'), svgContent);
    console.log('✅ SVG 파비콘이 생성되었습니다.');
    
    // 표준 favicon 크기: 16x16, 32x32, 48x48, 64x64
    const sizes = [16, 32, 48, 64];
    
    try {
      // SVG를 PNG로 변환
      // 다양한 크기의 PNG 버퍼와 파일 생성
      const pngBuffers = await Promise.all(
        sizes.map(size => 
          sharp(svgPath)
            .resize(size, size)
            .png()
            .toBuffer()
        )
      );
      
      // 각 크기별 PNG 저장 (웹사이트에서 더 나은 호환성을 위해)
      const pngPaths = [];
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        const pngPath = path.join(distDir, `favicon-${size}x${size}.png`);
        fs.writeFileSync(pngPath, pngBuffers[i]);
        pngPaths.push(pngPath);
      }
      
      // PNG 파일을 사용하여 ICO 파일 생성
      // 모든 크기를 포함하는 ICO 파일을 생성합니다 (16, 32, 48, 64)
      try {
        const icoBuffer = await pngToIco(pngPaths);
        fs.writeFileSync(path.join(distDir, 'favicon.ico'), icoBuffer);
        console.log('✅ 새로운 favicon.ico 파일이 생성되었습니다.');
      } catch (icoError) {
        console.error('ICO 변환 오류:', icoError);
        // 변환 실패시 가장 큰 PNG를 ico로 변환
        try {
          const singleIcoBuffer = await pngToIco([pngPaths[pngPaths.length - 1]]);
          fs.writeFileSync(path.join(distDir, 'favicon.ico'), singleIcoBuffer);
          console.log('⚠️ 단일 크기의 favicon.ico 파일이 생성되었습니다.');
        } catch (singleIcoError) {
          console.error('단일 ICO 변환 오류:', singleIcoError);
          // 완전히 실패한 경우 원본 파일 복사
          const originalFaviconPath = path.resolve('./public/favicon.ico');
          fs.copyFileSync(originalFaviconPath, path.join(distDir, 'favicon.ico'));
          console.log('⚠️ ICO 생성에 실패했습니다. 기존 favicon.ico를 복사했습니다.');
        }
      }
      
      console.log('✅ favicon.ico 및 다양한 크기의 PNG 파비콘이 생성되었습니다.');
    } catch (error) {
      console.error('PNG 변환 오류:', error);
      // 변환 실패시 기존 파일 복사
      const originalFaviconPath = path.resolve('./public/favicon.ico');
      fs.copyFileSync(originalFaviconPath, path.join(distDir, 'favicon.ico'));
      console.log('⚠️ SVG를 PNG로 변환하는 데 실패했습니다. 기존 favicon.ico를 복사했습니다.');
    }
    
    // index.html 파일 읽기 및 업데이트
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
          // favicon 링크 추가 (다양한 크기 및 포맷 지원)
          const newHeadContent = headContent + 
            '\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
            '\n  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">' +
            '\n  <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">' +
            '\n  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">';
          
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
=======
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
>>>>>>> dac694716bf8122054d4f1a622d87e23706628be
    } else {
      console.log('⚠️ index.html 파일을 찾을 수 없습니다.');
    }
    
    // 개발용 public 폴더에도 파일 복사 (SVG, ICO, PNG 파일 모두)
    fs.copyFileSync(path.join(distDir, 'favicon.svg'), path.resolve('./public/favicon.svg'));
    fs.copyFileSync(path.join(distDir, 'favicon.ico'), path.resolve('./public/favicon.ico'));
    
    // PNG 파일도 복사
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const pngFileName = `favicon-${size}x${size}.png`;
      fs.copyFileSync(
        path.join(distDir, pngFileName), 
        path.resolve(`./public/${pngFileName}`)
      );
    }
    
    console.log('✅ 공용 폴더에 모든 파비콘 파일이 복사되었습니다.');
    
  } catch (error) {
    console.error('favicon 생성 중 오류 발생:', error);
  }
<<<<<<< HEAD
=======
  
  console.log('✅ 모든 favicon 파일이 처리되었습니다.');
} catch (error) {
  console.error('favicon 처리 중 오류 발생:', error);
>>>>>>> dac694716bf8122054d4f1a622d87e23706628be
}

createFavicons().catch(err => console.error('Favicon 생성 실패:', err));
