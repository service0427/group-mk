# CLAUDE.md

이 파일은 이 저장소의 코드 작업 시 Claude Code (claude.ai/code)에게 가이드를 제공합니다.

## 빌드 명령어
- 빌드: `npm run build`
- 개발 서버: `npm run dev`
- 린트: `npm run lint`
- 타입 체크: `tsc -b`
- 클린: `npm run clean`
- 프리뷰: `npm run preview`

## 코드 스타일
- 일관된 포맷팅을 위해 ESLint와 Prettier 사용
- 엄격한 타입 체킹과 함께 TypeScript 사용
- 가능한 경우 함수형 프로그래밍 패턴 따르기
- 비동기 코드에는 async/await 사용 (raw promises 사용 지양)
- default exports보다 named exports 선호
- camelCase로 설명적인 변수명 사용
- imports 그룹화: 내장 모듈, 외부 모듈, 내부 모듈
- 에러 처리: async 함수에는 try/catch 사용, 입력값 검증
- 컴포넌트는 작고, 집중적이며, 재사용 가능해야 함
- DRY 원칙을 따르되 가독성을 우선시

## React 모범 사례
- 상태와 부수효과를 위해 React hooks 사용
- 성능 최적화를 위해 메모이제이션(useMemo, useCallback, React.memo) 적용
- 불필요한 재렌더링 방지를 위해 메모이즈된 값과 함께 context API 사용
- useEffect hooks에서 적절한 cleanup 구현
- 컴포넌트를 순수하게 유지하고 단일 책임에 집중

## 한국어 지원
- 대화 시 영어보다 한글을 기반으로 함
- 적절한 경우 한국어 주석과 콘솔 메시지 유지
- 한국어 검색 쿼리를 적절한 인코딩으로 처리
- 한국어 메시지에 응답할 때는 한국어로 답변
- 적절한 경우 코드에 한국어 변수명과 주석 포함

## 빌드 테스트
- 사용자가 직접 실행을 전제로 하고, 사용자 요청에 의해 요청사항만을 실행
- 만약 필요하다면 개발 후 타입 체크만을 진행

## Git 관리
- 사용자가 직접 실행을 전제로 하고, 사용자 요청에 의해 요청사항만을 실행