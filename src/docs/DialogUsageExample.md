# Dialog 사용 예제

이 문서는 현재 구현된 DialogProvider의 기능을 사용하는 방법을 보여줍니다. 특히 알림 컴포넌트에서 `showAlert`와 `showConfirm` 함수를 활용하는 예제를 제공합니다.

## NotificationDropdown 예제 (삭제 기능에 showConfirm 적용)

다음은 NotificationDropdown에서 알림 삭제 전에 확인 다이얼로그를 표시하는 예제입니다:

```tsx
import { useDialog } from '@/components/dialog';  // 변경된 임포트 위치

// 기존 함수 대신 다음과 같이 수정
const handleDeleteNotification = (notification: INotification) => {
  // useDialog에서 showConfirm 함수 사용
  showConfirm(
    '알림 삭제',  // 제목
    '이 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',  // 메시지
    async (confirmed) => {  // 확인/취소 콜백 함수
      if (confirmed) {
        if (onDelete) {
          await onDelete(notification.id);
          toast.success('알림을 삭제했습니다');
        }
        // 필요 시 모달 닫기 등의 추가 작업
      }
    },
    {
      confirmText: '삭제',  // 확인 버튼 텍스트
      cancelText: '취소',   // 취소 버튼 텍스트
      confirmButtonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'  // 확인 버튼 스타일
    }
  );
};
```

## NotificationDetailModal 예제 (삭제/보관 기능에 showConfirm 적용)

NotificationDetailModal에서 삭제 및 보관 버튼 클릭 이벤트 핸들러를 수정하는 예제입니다:

```tsx
import { useDialog } from '@/components/dialog';

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  open = true,
  onClose,
  onMarkAsRead,
  onArchive,
  onDelete
}) => {
  const { showConfirm } = useDialog();
  const navigate = useNavigate();
  const toast = useToast();
  
  // 삭제 처리 함수 - showConfirm 사용
  const handleDelete = () => {
    showConfirm(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async (confirmed) => {
        if (confirmed) {
          if (onDelete) {
            await onDelete(notification.id);
            toast.success('알림을 삭제했습니다');
          }
          onClose();
        }
      },
      {
        confirmText: '삭제',
        cancelText: '취소',
        confirmButtonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      }
    );
  };
  
  // 보관 처리 함수 - showConfirm 사용
  const handleArchive = () => {
    showConfirm(
      '알림 보관',
      '이 알림을 보관하시겠습니까?',
      async (confirmed) => {
        if (confirmed) {
          if (onArchive) {
            await onArchive(notification.id);
            toast.info('알림을 보관함으로 이동했습니다');
          }
          onClose();
        }
      }
    );
  };
  
  // 이후 JSX 반환 부분에서 버튼 클릭 이벤트 핸들러를 수정합니다
  return (
    <>
      {/* ... 기존 코드 ... */}
      <DialogFooter className="flex flex-row justify-between gap-2 items-center px-4 py-3">
        <div className="flex gap-2">
          <button
            className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white px-6"
            onClick={handleArchive}  // 이벤트 핸들러 변경
          >
            보관
          </button>
          <button
            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white px-6"
            onClick={handleDelete}   // 이벤트 핸들러 변경
          >
            삭제
          </button>
        </div>
        <button
          className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white px-6"
          onClick={onClose}
        >
          닫기
        </button>
      </DialogFooter>
      {/* ... 기존 코드 ... */}
    </>
  );
};
```

## 알림 처리 예제 (showAlert 사용)

알림 메시지를 표시하는 예제입니다:

```tsx
import { useDialog } from '@/components/dialog';

// 컴포넌트 내부에서...
const { showAlert } = useDialog();

// 성공 알림 표시
const showSuccessMessage = () => {
  showAlert(
    '성공',
    '작업이 성공적으로 완료되었습니다.',
    () => {
      console.log('알림 확인 버튼 클릭됨');
      // 필요 시 추가 작업
    }
  );
};

// 에러 알림 표시
const showErrorMessage = (errorMsg: string) => {
  showAlert(
    '오류',
    `작업 중 오류가 발생했습니다: ${errorMsg}`,
    () => {
      // 오류 알림 확인 후 처리할 작업
    }
  );
};
```

## 추가 참고사항

- `showAlert`와 `showConfirm` 함수는 기존 `AlertConfirmDialogs` 컴포넌트와 호환되도록 설계되었습니다.
- 이전 AlertConfirmDialogs 컴포넌트에서 마이그레이션 할 때 메서드 시그니처를 변경하지 않고 그대로 사용할 수 있습니다.
- 메서드를 통해 호출된 다이얼로그는 App.tsx에 포함된 단일 Dialog 컴포넌트를 통해 렌더링됩니다.
- 다이얼로그 내부에서 다른 다이얼로그를 호출할 수도 있습니다 (중첩 다이얼로그).