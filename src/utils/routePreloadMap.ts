// 컴포넌트를 동적으로 가져오는 방식으로 변경하여 순환 참조 방지
import type { PreloadableComponent } from '@/utils/lazyWithPreload';

// 컴포넌트를 저장할 맵 (lazy loading)
let componentMap: Record<string, PreloadableComponent<any>> | null = null;

/**
 * 컴포넌트 맵을 초기화합니다.
 * AppRoutingSetup에서 호출됩니다.
 */
export function initializeComponentMap(components: Record<string, PreloadableComponent<any>>) {
  componentMap = components;
}

/**
 * 주어진 경로에 해당하는 preload 가능한 컴포넌트를 반환합니다.
 */
export function getPreloadComponent(path: string): PreloadableComponent<any> | null {
  if (!componentMap) {
    console.warn('Component map not initialized');
    return null;
  }

  // 정확한 경로 매칭 - componentMap에서 직접 찾기
  if (componentMap[path]) {
    return componentMap[path];
  }

  // 와일드카드를 포함한 경로들을 체크
  const wildcardPaths = Object.keys(componentMap).filter(key => key.includes('*'));
  
  for (const wildcardPath of wildcardPaths) {
    // 와일드카드를 정규표현식으로 변환
    const pattern = wildcardPath.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return componentMap[wildcardPath];
    }
  }
  
  return null;
}

/**
 * 여러 경로의 컴포넌트를 한번에 preload합니다.
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach(path => {
    const component = getPreloadComponent(path);
    if (component?.preload) {
      component.preload().catch(() => {
        // Preload 실패는 무시
      });
    }
  });
}