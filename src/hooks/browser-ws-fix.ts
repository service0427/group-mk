// 브라우저 환경에서 WebSocket을 설정하는 파일
// 이 파일은 Supabase가 Node.js의 'ws' 패키지 대신 브라우저의 네이티브 WebSocket을 사용하도록 함

// 브라우저 환경의 네이티브 WebSocket 클래스를 모방하는 클래스 생성
class BrowserWebSocket extends WebSocket {
  constructor(url: string, protocols?: string | string[] | undefined) {
    super(url, protocols);
  }
}

// Supabase realtime-js 모듈에서 가져다 쓸 수 있도록 기본 내보내기로 설정
export default BrowserWebSocket;