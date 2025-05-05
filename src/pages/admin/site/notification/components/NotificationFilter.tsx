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
    <div className="flex flex-wrap sm:flex-wrap gap-3">
      {/* 모바일 버전 (1행) - 작은 화면에서만 표시 */}
      <div className="flex w-full flex-row items-center gap-2 sm:hidden">
        <select
          className="select select-sm select-bordered w-auto flex-1 min-w-0"
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value as NotificationType | 'all')}
          aria-label="알림 유형 필터"
        >
          <option value="all">전체 유형</option>
          <option value={NotificationType.SYSTEM}>시스템</option>
          <option value={NotificationType.TRANSACTION}>결제/캐시</option>
          <option value={NotificationType.SERVICE}>서비스</option>
          <option value={NotificationType.SLOT}>슬롯</option>
          <option value={NotificationType.MARKETING}>마케팅</option>
        </select>

        <select
          className="select select-sm select-bordered w-auto flex-1 min-w-0"
          value={filterUserRole}
          onChange={(e) => onFilterUserRoleChange(e.target.value)}
          aria-label="회원 유형 필터"
        >
          <option value="all">전체 회원</option>
          <option value="developer">개발자</option>
          <option value="operator">운영자</option>
          <option value="distributor">총판</option>
          <option value="agency">대행사</option>
          <option value="advertiser">광고주</option>
        </select>

        <button
          className="btn btn-sm btn-primary text-white hover:bg-primary-dark dark:hover:bg-primary-light/90 px-2 flex-none"
          onClick={onApplyFilter}
          title="필터 적용"
        >
          <KeenIcon icon="filter" className="flex-none" />
        </button>
      </div>

      {/* PC 버전 (원래 디자인) - 작은 화면에서는 숨김 */}
      <select
        className="select select-sm select-bordered flex-grow min-w-[160px] w-auto hidden sm:block"
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
        className="select select-sm select-bordered flex-grow min-w-[160px] w-auto hidden sm:block"
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
        className="btn btn-sm btn-primary text-white hover:bg-primary-dark dark:hover:bg-primary-light/90 hidden sm:flex"
        onClick={onApplyFilter}
        title="필터 적용"
      >
        <KeenIcon icon="filter" className="me-1 flex-none" />
        <span>필터 적용</span>
      </button>
    </div>
  );
};

export default NotificationFilter;