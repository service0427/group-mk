# 채팅 기능 문서

이 문서는 마케팅의 정석 웹사이트에 구현된 채팅 기능에 대한 설명입니다.

## 기능 개요

채팅 기능은 일반 사용자와 운영자 간의 실시간 대화를 가능하게 하는 시스템입니다. 이 기능은 다음과 같은 주요 구성 요소로 이루어져 있습니다:

1. 실시간 메시지 전송 및 수신
2. 채팅방 생성 및 관리
3. 읽음 상태 표시
4. 알림 기능
5. 권한 기반 접근 제어

## Supabase 데이터베이스 구조

채팅 기능은 Supabase의 실시간 기능과 데이터베이스를 활용하여 구현되었습니다. 다음과 같은 테이블을 사용합니다:

1. `chat_rooms`: 채팅방 정보 저장
2. `chat_participants`: 채팅방 참가자 정보 저장
3. `chat_messages`: 메시지 정보 저장

## 컴포넌트 구조

주요 컴포넌트는 다음과 같습니다:

- `Chat.tsx`: 메인 채팅 컴포넌트
- `ChatWindow.tsx`: 채팅창 UI
- `ChatMessage.tsx`: 개별 메시지 표시
- `ChatInput.tsx`: 메시지 입력 컴포넌트
- `ChatIcon.tsx`: 채팅 아이콘
- `ChatRoomList.tsx`: 채팅방 목록
- `ChatSticky.tsx`: 항상 표시되는 스티키 채팅 컴포넌트

## 권한 관리

채팅 기능은 사용자 역할에 따라 다음과 같이 접근이 제어됩니다:

1. `operator`: 운영자 역할로, 모든 사용자와 채팅 가능
2. `advertiser`, `user`, `distributor`: 일반 사용자 역할로, 운영자와 채팅 가능
3. 기타 역할: 채팅 기능 사용 불가

## 주요 특징

1. **운영자 지정 대화**: 사용자는 시스템에 등록된 모든 운영자와 대화할 수 있습니다.
2. **실시간 메시지 전송**: Supabase Realtime 기능을 통한 실시간 메시지 전송
3. **읽음 상태 확인**: 메시지 읽음 상태 표시 기능
4. **알림 기능**: 새 메시지 도착 시 알림 표시
5. **반응형 UI**: 모바일 및 데스크톱 환경에 최적화된 UI

## 사용자 흐름

1. 사용자가 채팅 아이콘 클릭
2. 첫 사용자의 경우 자동으로 새 채팅방 생성
3. 메시지 입력 및 전송
4. 운영자가 답변 작성
5. 사용자가 답변 확인

## 설치 및 설정

1. Supabase 스키마 설정
   - `src/scripts/chat-schema.sql` SQL 스크립트 실행
   - Supabase 프로젝트 대시보드에서 SQL 에디터를 통해 실행

2. 환경 변수 설정
   - `.env` 파일에 다음 값 설정:
   ```
   VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_KEY=your-service-role-key
   ```

3. Supabase Realtime 설정
   - Supabase 프로젝트 대시보드에서 Database > Replication > Realtime 메뉴로 이동
   - `chat_rooms`, `chat_messages`, `chat_participants` 테이블 활성화

## 운영자 채팅 관리

운영자는 채팅 관리 페이지에서 모든 채팅을 확인하고 응답할 수 있습니다:

1. **채팅 관리 페이지 접근**
   - 운영자 계정으로 로그인
   - `/admin/chat` 경로로 이동

2. **주요 기능**
   - 모든 채팅방 목록 확인
   - 읽지 않은 메시지 수 표시
   - 채팅방별 메시지 확인 및 응답
   - 실시간 메시지 수신

3. **접근 권한**
   - `operator` 또는 `admin` 역할을 가진 사용자만 접근 가능

## 개발자 노트

- 채팅 컴포넌트는 `useChat` 훅을 사용하여 구현되었습니다.
- 운영자가 없거나 오프라인 상태여도 메시지를 보낼 수 있습니다.
- Supabase 실시간 구독을 통해 새로운 메시지를 수신합니다.
- 성능 최적화를 위해 메시지 목록은 페이지네이션됩니다(기본 50개).
- 메시지 읽음 상태는 참가자의 last_read_message_id로 추적됩니다.
- 채팅방이 비활성화되면 archived 상태로 변경됩니다.

## 문제 해결

일반적인 문제 및 해결 방법:

1. 메시지가 전송되지 않는 경우
   - 네트워크 연결 확인
   - Supabase 권한 설정 확인
   - 브라우저 콘솔에서 오류 메시지 확인

2. 실시간 업데이트가 동작하지 않는 경우
   - 브라우저 콘솔에서 WebSocket 오류 확인
   - Supabase Realtime 설정 확인 (대시보드에서 테이블 활성화 여부)
   - `chat_rooms`, `chat_messages`, `chat_participants` 테이블이 Realtime에 추가되었는지 확인

3. 테이블 접근 오류가 발생하는 경우
   - SQL 스크립트가 성공적으로 실행되었는지 확인
   - RLS(Row Level Security) 정책이 올바르게 설정되었는지 확인
   - 인증된 사용자로 로그인되어 있는지 확인

4. "Could not find a relationship between 'chat_rooms' and 'last_message'"
   - `chat-schema-fix-relation.sql` 스크립트를 실행하여 테이블 간 관계 수정

5. "infinite recursion detected in policy for relation 'chat_participants'"
   - `chat-schema-update.sql` 스크립트를 실행하여 RLS 정책 수정

## 디버깅 도구

채팅 기능에는 내장된 디버깅 도구가 있습니다:

1. `/chat-debug` 경로에서 디버그 페이지 접근 가능
2. 채팅 컴포넌트 내 '진단 실행' 버튼으로 데이터베이스 연결 및 테이블 상태 확인 가능
3. 브라우저 콘솔에서 자세한 로그 확인 가능