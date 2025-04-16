// NP 트래픽 메뉴에 점 추가를 위한 JavaScript 코드
document.addEventListener('DOMContentLoaded', function() {
  // 이 코드는 DOM이 완전히 로드된 후 실행됩니다
  
  // 활성화된 하위 메뉴가 있는지 주기적으로 확인
  setInterval(function() {
    // 활성화된 메뉴 찾기 (여기서는 "캠페인 소개" 메뉴)
    const activeMenus = document.querySelectorAll('.menu-item.active');
    
    // 모든 활성화된 메뉴에 대해
    activeMenus.forEach(function(activeMenu) {
      // 상위 메뉴 찾기 (여기서는 "NP 트래픽" 메뉴)
      const parentMenuItem = activeMenu.closest('.menu-sub')?.closest('.menu-item');
      
      if (parentMenuItem) {
        // 부모 메뉴의 bullet 요소 찾기
        const parentBullet = parentMenuItem.querySelector('.menu-bullet');
        
        if (parentBullet) {
          // 상위 메뉴에 점 추가
          const bulletStyle = parentBullet.querySelector('::before') || parentBullet;
          
          // 인라인 스타일로 강제 적용
          parentBullet.style.position = 'relative';
          parentBullet.style.display = 'flex';
          
          // 가상 요소를 직접 제어할 수 없으므로 실제 DOM 요소 추가
          if (!parentBullet.querySelector('.parent-dot')) {
            const dot = document.createElement('span');
            dot.className = 'parent-dot';
            dot.style.position = 'absolute';
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.backgroundColor = '#03c75a';
            dot.style.borderRadius = '50%';
            dot.style.top = '50%';
            dot.style.left = '0';
            dot.style.transform = 'translateY(-50%)';
            parentBullet.appendChild(dot);
          }
        }
      }
    });
  }, 500); // 500ms마다 확인
});
