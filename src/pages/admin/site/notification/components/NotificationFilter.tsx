import React from 'react';
import { NotificationType } from '@/types/notification';
import { KeenIcon } from '@/components/keenicons';

interface NotificationFilterProps {
  filterType: NotificationType | 'all';
  filterUserRole: string | 'all';
  onFilterTypeChange: (type: NotificationType | 'all') => void;
  onFilterUserRoleChange: (role: string | 'all') => void;
  onApplyFilter: () => void;
}

const NotificationFilter: React.FC<NotificationFilterProps> = ({
  filterType,
  filterUserRole,
  onFilterTypeChange,
  onFilterUserRoleChange,
  onApplyFilter
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-2 min-w-[160px] w-auto"
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value as NotificationType | 'all')}
      >
        <option value="all">모든 알림 유형</option>
        <option value={NotificationType.SYSTEM}>시스템</option>
        <option value={NotificationType.TRANSACTION}>결제/캐시</option>
        <option value={NotificationType.SERVICE}>서비스</option>
        <option value={NotificationType.SLOT}>슬롯</option>
        <option value={NotificationType.MARKETING}>마케팅</option>
      </select>

      <select
        className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-2 min-w-[160px] w-auto"
        value={filterUserRole}
        onChange={(e) => onFilterUserRoleChange(e.target.value)}
      >
        <option value="all">모든 회원 유형</option>
        <option value="developer">개발자</option>
        <option value="operator">운영자</option>
        <option value="distributor">총판</option>
        <option value="agency">대행사</option>
        <option value="advertiser">광고주</option>
      </select>

      <button
        className="btn btn-sm btn-primary text-white hover:bg-primary-dark dark:hover:bg-primary-light/90"
        onClick={onApplyFilter}
      >
        <KeenIcon icon="filter" className="me-1" />
        필터 적용
      </button>
    </div>
  );
};

export default NotificationFilter;