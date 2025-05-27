import { ComponentType, lazy, LazyExoticComponent } from 'react';

export type PreloadableComponent<T extends ComponentType<any>> = LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};

/**
 * Preload 가능한 lazy 컴포넌트를 생성합니다.
 * 사용자가 링크에 hover할 때 미리 로드할 수 있습니다.
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
  const Component = lazy(factory) as PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}

/**
 * 여러 컴포넌트를 한번에 preload합니다.
 */
export function preloadComponents(components: PreloadableComponent<any>[]): void {
  components.forEach(component => {
    component.preload().catch(() => {
      // 에러 무시 - 실제 사용 시 다시 로드됨
    });
  });
}

/**
 * 링크 hover 시 컴포넌트를 preload하는 이벤트 핸들러
 */
export function createPreloadHandler(component: PreloadableComponent<any>) {
  return () => {
    component.preload().catch(() => {
      // 에러 무시
    });
  };
}