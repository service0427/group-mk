import { useState, useCallback, useEffect } from 'react';
import {
  fetchNotifications,
  calculateStats,
  deleteNotifications,
  createMultipleNotifications,
  INotificationWithUser,
  NotificationStats,
  DeleteNotificationsOptions,
  CreateNotificationsParams
} from '../services/notificationService';
import { NotificationType, NotificationStatus, INotification } from '@/types/notification';
import { USER_ROLES } from '@/config/roles.config';
import { toast } from 'sonner';

interface UseNotificationsProps {
  isAdmin: boolean;
}

interface UseNotificationsReturn {
  notifications: INotificationWithUser[];
  stats: NotificationStats;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  filterType: NotificationType | 'all';
  filterUserRole: string | 'all';
  selectedItems: string[];
  handlePageChange: (page: number) => void;
  handleItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleApplyFilter: () => void;
  handleFilterTypeChange: (type: NotificationType | 'all') => void;
  handleFilterUserRoleChange: (role: string | 'all') => void;
  handleSelectionChange: (id: string) => void;
  handleSelectAll: (select: boolean) => void;
  deleteNotificationsHandler: (options: DeleteNotificationsOptions) => Promise<boolean>;
  createNotificationsHandler: (params: CreateNotificationsParams) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = ({ isAdmin }: UseNotificationsProps): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<INotificationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    byType: {
      [NotificationType.SYSTEM]: 0,
      [NotificationType.TRANSACTION]: 0,
      [NotificationType.SERVICE]: 0,
      [NotificationType.SLOT]: 0,
      [NotificationType.MARKETING]: 0,
    },
    byUserRole: {
      [USER_ROLES.DEVELOPER]: 0,
      [USER_ROLES.OPERATOR]: 0,
      [USER_ROLES.DISTRIBUTOR]: 0,
      [USER_ROLES.AGENCY]: 0,
      [USER_ROLES.ADVERTISER]: 0,
    },
    byStatus: {
      [NotificationStatus.UNREAD]: 0,
      [NotificationStatus.READ]: 0,
      [NotificationStatus.ARCHIVED]: 0,
    }
  });

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 알림 필터링 상태
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterUserRole, setFilterUserRole] = useState<string | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 알림 데이터 가져오기
  const loadNotifications = useCallback(async (page = 1) => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const result = await fetchNotifications({
        page,
        itemsPerPage,
        filterType,
        filterUserRole
      });

      setNotifications(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);

      // 통계 업데이트 (전체 알림 기준)
      const updatedStats = await calculateStats(
        result.data,
        result.totalCount,
        result.statusCounts
      );
      setStats(updatedStats);

    } catch (error: any) {
      console.error('알림을 가져오는 중 오류 발생:', error.message);
      toast.error('알림 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterUserRole, itemsPerPage, isAdmin]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 선택된 항목 초기화
    setSelectedItems([]);
  };

  // 페이지당 표시 개수 변경 핸들러
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 첫 페이지로 리셋
  };

  // 필터 적용 핸들러
  const handleApplyFilter = () => {
    setCurrentPage(1); // 필터 적용 시 첫 페이지로 이동
    loadNotifications(1);
  };

  // 필터 타입 변경 핸들러
  const handleFilterTypeChange = (type: NotificationType | 'all') => {
    setFilterType(type);
  };

  // 필터 사용자 역할 변경 핸들러
  const handleFilterUserRoleChange = (role: string | 'all') => {
    setFilterUserRole(role);
  };

  // 선택된 항목 변경 핸들러
  const handleSelectionChange = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 모든 항목 선택/해제 핸들러
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedItems(notifications.map(notification => notification.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 알림 삭제 핸들러
  const deleteNotificationsHandler = async (options: DeleteNotificationsOptions): Promise<boolean> => {
    const success = await deleteNotifications(options);

    if (success) {
      await loadNotifications(1); // 목록 새로고침
      setSelectedItems([]); // 선택 항목 초기화
    }

    return success;
  };

  // 알림 생성 핸들러
  const createNotificationsHandler = async (params: CreateNotificationsParams): Promise<boolean> => {
    const success = await createMultipleNotifications(params);

    if (success) {
      await loadNotifications(1); // 목록 새로고침
    }

    return success;
  };

  // 알림 목록 새로고침
  const refreshNotifications = async () => {
    await loadNotifications(currentPage);
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (isAdmin) {
      loadNotifications(currentPage);
    }
  }, [loadNotifications, isAdmin, currentPage]);

  return {
    notifications,
    stats,
    loading,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    filterType,
    filterUserRole,
    selectedItems,
    handlePageChange,
    handleItemsPerPageChange,
    handleApplyFilter,
    handleFilterTypeChange,
    handleFilterUserRoleChange,
    handleSelectionChange,
    handleSelectAll,
    deleteNotificationsHandler,
    createNotificationsHandler,
    refreshNotifications
  };
};