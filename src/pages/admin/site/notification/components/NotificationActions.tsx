import React from 'react';
import { KeenIcon } from '@/components/keenicons';

interface NotificationActionsProps {
  selectedItemsCount: number;
  onDeleteSelected: () => void;
  onDeleteOlderThan30Days: () => void;
  onDeleteAll: () => void;
}

const NotificationActions: React.FC<NotificationActionsProps> = ({
  selectedItemsCount,
  onDeleteSelected,
  onDeleteOlderThan30Days,
  onDeleteAll
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        className={`btn btn-sm ${selectedItemsCount > 0 ? 'btn-danger' : 'btn-light-secondary opacity-75 cursor-not-allowed'}`}
        disabled={selectedItemsCount === 0}
        onClick={onDeleteSelected}
      >
        <KeenIcon icon="trash" className="me-1" />
        선택 항목 삭제 ({selectedItemsCount})
      </button>

      <button
        className="btn btn-sm btn-warning"
        onClick={onDeleteOlderThan30Days}
      >
        <KeenIcon icon="calendar-tick" className="me-1" />
        30일 이전 알림 삭제
      </button>

      <button
        className="btn btn-sm btn-danger"
        onClick={onDeleteAll}
      >
        <KeenIcon icon="trash-square" className="me-1" />
        전체 알림 삭제
      </button>
    </div>
  );
};

export default NotificationActions;