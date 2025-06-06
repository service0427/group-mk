/**
 * Document 관련 폴리필 및 안전장치
 * 일부 서드파티 라이브러리가 document.contains를 잘못 사용하는 경우를 방지
 */

// HTMLDocument.prototype.contains 폴리필 - 항상 오버라이드
if (typeof HTMLDocument !== 'undefined') {
  const originalContains = HTMLDocument.prototype.contains;
  HTMLDocument.prototype.contains = function(node: any): boolean {
    try {
      // node가 null이거나 undefined인 경우
      if (!node) return false;
      
      // node가 Node가 아닌 경우
      if (!(node instanceof Node)) {
        // 문자열이나 숫자 등 primitive 타입은 조용히 false 반환
        if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
          return false;
        }
        // 객체인 경우만 경고
        if (typeof node === 'object') {
          console.debug('HTMLDocument.contains called with non-Node object:', node);
        }
        return false;
      }
      
      // document는 모든 노드를 포함한다고 간주
      if (node === this) return true;
      
      // documentElement가 있으면 그것으로 체크
      if (this.documentElement) {
        return this.documentElement.contains(node);
      }
      
      // 원래 메서드가 있으면 사용
      if (originalContains) {
        return originalContains.call(this, node);
      }
      
      return false;
    } catch (error) {
      console.warn('HTMLDocument.contains error:', error);
      return false;
    }
  };
}

// document.contains 폴리필 - 항상 추가
if (typeof document !== 'undefined') {
  (document as any).contains = function(node: any): boolean {
    try {
      // node가 null이거나 undefined인 경우
      if (!node) return false;
      
      // node가 Node가 아닌 경우
      if (!(node instanceof Node)) {
        // 문자열이나 숫자 등 primitive 타입은 조용히 false 반환
        if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
          return false;
        }
        // 객체인 경우만 경고
        if (typeof node === 'object') {
          console.debug('document.contains called with non-Node object:', node);
        }
        return false;
      }
      
      return node === document || document.documentElement.contains(node);
    } catch (error) {
      console.warn('document.contains error:', error);
      return false;
    }
  };
}

// Node.prototype.contains 패치 - 모든 Node에 대해 안전한 contains 메서드 제공
const originalNodeContains = Node.prototype.contains;
Node.prototype.contains = function(this: Node, other: any): boolean {
  try {
    // other가 null이거나 undefined인 경우
    if (other == null) return false;
    
    // other가 Node가 아닌 경우
    if (!(other instanceof Node)) {
      // 문자열이나 숫자 등 primitive 타입은 조용히 false 반환
      if (typeof other === 'string' || typeof other === 'number' || typeof other === 'boolean') {
        return false;
      }
      // 객체인 경우만 경고 (디버깅 시 유용)
      if (typeof other === 'object') {
        console.debug('Node.contains called with non-Node object:', other);
      }
      return false;
    }
    
    // this가 Document인 경우 특별 처리
    if (this === document || this instanceof Document) {
      return other === document || document.documentElement.contains(other);
    }
    
    // 원래 메서드 호출
    return originalNodeContains.call(this, other);
  } catch (error) {
    console.warn('Node.contains error:', error, 'this:', this, 'other:', other);
    return false;
  }
};

// 스크롤 이벤트 리스너 래핑하여 contains 관련 오류 방지
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: AddEventListenerOptions | boolean
): void {
  if (type === 'scroll' || type === 'wheel' || type === 'mousewheel') {
    const wrappedListener = function(this: EventTarget, event: Event) {
      try {
        if (typeof listener === 'function') {
          listener.call(this, event);
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent(event);
        }
      } catch (error: any) {
        if (error.message && error.message.includes('contains')) {
          // contains 관련 오류는 조용히 무시
          console.debug('Scroll event contains error ignored:', error.message);
        } else {
          // 다른 오류는 다시 throw
          throw error;
        }
      }
    };
    
    return originalAddEventListener.call(this, type, wrappedListener as EventListener, options);
  }
  
  return originalAddEventListener.call(this, type, listener, options);
};

// contains 메서드를 안전하게 호출하는 헬퍼 함수
export function safeContains(parent: Node | null | undefined, child: Node | null | undefined): boolean {
  if (!parent || !child) return false;
  
  // parent가 document인 경우 특별 처리
  if (parent === document || parent === document.documentElement) {
    return document.documentElement.contains(child);
  }
  
  // parent가 Element가 아닌 경우
  if (!(parent instanceof Element)) {
    return false;
  }
  
  // child가 Node가 아닌 경우
  if (!(child instanceof Node)) {
    return false;
  }
  
  try {
    return parent.contains(child);
  } catch (error) {
    console.warn('safeContains error:', error);
    return false;
  }
}

export {};