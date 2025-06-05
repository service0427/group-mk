# Alert Modal 마이그레이션 가이드

## 개요
기존의 브라우저 기본 `alert()` 함수를 커스텀 모달로 대체하여 더 나은 사용자 경험을 제공합니다.

## 설치 및 설정
AlertProvider는 이미 ProvidersWrapper에 추가되어 있으므로 별도의 설정이 필요 없습니다.

## 사용법

### 1. Import
```tsx
import { useAlert } from '@/hooks/useAlert';
```

### 2. Hook 사용
```tsx
const { showAlert, showSuccess, showError, showWarning, showInfo } = useAlert();
```

### 3. 기본 사용법

#### Success 메시지
```tsx
// 기존
alert('작업이 성공적으로 완료되었습니다.');

// 새로운 방식
showSuccess('작업이 성공적으로 완료되었습니다.');
```

#### Error 메시지
```tsx
// 기존
alert('오류가 발생했습니다: ' + error.message);

// 새로운 방식
showError('오류가 발생했습니다: ' + error.message);
```

#### Warning 메시지
```tsx
// 기존
alert('승인된 슬롯만 완료 처리할 수 있습니다.');

// 새로운 방식
showWarning('승인된 슬롯만 완료 처리할 수 있습니다.');
```

#### Info 메시지
```tsx
// 기존
alert('새로운 업데이트가 있습니다.');

// 새로운 방식
showInfo('새로운 업데이트가 있습니다.');
```

### 4. 커스텀 사용법

#### 커스텀 제목
```tsx
showSuccess('캠페인이 승인되었습니다.', '캠페인 승인');
showError('파일 업로드에 실패했습니다.', '업로드 오류');
```

#### 커스텀 옵션
```tsx
showAlert('데이터 삭제', '정말로 이 데이터를 삭제하시겠습니까?', {
  type: 'warning',
  confirmText: '확인했습니다'
});
```

## 마이그레이션 예시

### ProfilePage.tsx
```tsx
// Before
alert('이름 변경 중 오류가 발생했습니다: ' + nameError.message);

// After
import { useAlert } from '@/hooks/useAlert';

const { showError } = useAlert();
showError('이름 변경 중 오류가 발생했습니다: ' + nameError.message);
```

### KeywordUploadModal.tsx
```tsx
// Before
alert('엑셀 파일 (.xlsx, .xls 확장자)만 업로드 가능 합니다.');

// After
showError('엑셀 파일 (.xlsx, .xls 확장자)만 업로드 가능 합니다.', '파일 형식 오류');
```

### BusinessUpgradeModal.tsx
```tsx
// Before
alert('파일 크기가 5MB를 초과합니다. 더 작은 이미지를 선택해주세요.');

// After
showWarning('파일 크기가 5MB를 초과합니다.\n더 작은 이미지를 선택해주세요.', '파일 크기 초과');
```

## 장점
1. **일관된 UI**: 모든 알림이 같은 디자인 시스템 사용
2. **더 나은 UX**: 부드러운 애니메이션과 더 나은 가독성
3. **다크모드 지원**: 자동으로 다크모드 스타일 적용
4. **커스터마이징**: 제목, 아이콘, 색상 등 커스터마이징 가능
5. **접근성**: 키보드 탐색 및 스크린리더 지원

## 주의사항
- `alert()`는 동기적으로 실행을 차단하지만, 새로운 모달은 비동기적으로 작동합니다
- 사용자가 확인 버튼을 클릭할 때까지 기다려야 하는 경우 추가 로직이 필요할 수 있습니다