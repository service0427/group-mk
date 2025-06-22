// 다크모드 z-index 문제 디버깅 스크립트

// DOMContentLoaded 이벤트 발생 시 실행
document.addEventListener('DOMContentLoaded', function() {
  // 다크모드 상태 변경 감지를 위한 MutationObserver 설정
  const htmlElement = document.documentElement;
  
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        const isDarkMode = htmlElement.classList.contains('dark');
        fixDarkMode(isDarkMode);
      }
    });
  });
  
  // HTML 요소의 클래스 변경 감시 시작
  observer.observe(htmlElement, { attributes: true });
  
  // 초기 로드 시 체크
  const isDarkMode = htmlElement.classList.contains('dark');
  fixDarkMode(isDarkMode);
});

// 다크모드 수정 함수
function fixDarkMode(isDarkMode) {
  if (isDarkMode) {
    // #root 요소의 z-index 설정
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.position = 'relative';
      rootElement.style.zIndex = '5';
    }
    
    // 본문 요소들의 z-index 조정
    const contentElements = document.querySelectorAll('.wrapper, .page-template-wrapper, .dashboard-template-wrapper');
    contentElements.forEach(function(element) {
      element.style.position = 'relative';
      element.style.zIndex = '10';
    });
    
    // 컨트롤 요소들의 z-index 조정 - 로더 요소는 제외
    const controlElements = document.querySelectorAll('button:not(.loader):not(.spinner), a:not(.loader), input, select, [role="button"]:not(.loader)');
    controlElements.forEach(function(element) {
      // 로더 관련 클래스가 없는 경우에만 처리
      const hasLoaderClass = element.className && (
        element.className.includes('loader') || 
        element.className.includes('loading') || 
        element.className.includes('spinner') ||
        element.className.includes('progress')
      );
      
      if (!hasLoaderClass && !element.hasAttribute('data-original-z-index')) {
        element.setAttribute('data-original-z-index', getComputedStyle(element).zIndex);
        element.style.position = 'relative';
        element.style.zIndex = '20';
      }
    });
    
    // body 스타일 조정
    document.body.style.position = 'relative';
    document.body.style.zIndex = 'auto';
  } else {
    // 라이트 모드로 변경 시 원래 상태로 복원
    document.querySelectorAll('[data-original-z-index]').forEach(function(element) {
      element.style.zIndex = element.getAttribute('data-original-z-index');
      element.removeAttribute('data-original-z-index');
    });
  }
}