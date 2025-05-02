// 이 파일은 알림 상세 모달 컴포넌트가 다른 파일에서 사용되도록 구현된 임시 조각 코드입니다.
// 실제로는 다음과 같이 사용됩니다:
/*
import { NotificationDetailModal } from '@/components/notifications';
import { INotification } from '@/types/notification';

// 컴포넌트 내부에서:
const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);

// JSX 내부:
{selectedNotification && (
  <NotificationDetailModal
    notification={selectedNotification}
    open={!!selectedNotification}
    onClose={() => setSelectedNotification(null)}
    onMarkAsRead={markAsRead}
    onArchive={archiveNotification}
    onDelete={(id) => {
      setNotificationToDelete(id);
      setDeleteMultiple(false);
      setShowDeleteConfirm(true);
      setSelectedNotification(null);
    }}
  />
)}
*/