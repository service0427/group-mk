import React, { useState, useRef, useEffect } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 드롭다운 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex gap-2">
      {/* 선택 삭제 버튼 - 모바일/PC 공통 */}
      <button
        className={`btn btn-sm ${selectedItemsCount > 0 ? 'btn-danger' : 'btn-light-secondary opacity-75 cursor-not-allowed'}`}
        disabled={selectedItemsCount === 0}
        onClick={onDeleteSelected}
        title="선택 항목 삭제"
      >
        <KeenIcon icon="trash" className="me-1" />
        <span>선택 삭제</span> <span>({selectedItemsCount})</span>
      </button>

      {/* 통합 드롭다운 버튼 */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="btn btn-sm btn-warning flex items-center"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title="알림 일괄 삭제"
        >
          <KeenIcon icon="trash-square" className="me-1" />
          <span className="hidden sm:inline">일괄 삭제</span>
          <KeenIcon icon="arrow-down" />
        </button>

        {/* 드롭다운 메뉴 */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-600 rounded shadow-md min-w-[200px]">
            <ul className="py-1 text-xs">
              <li>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-coal-600 flex items-center text-gray-800 dark:text-white"
                  onClick={() => {
                    onDeleteOlderThan30Days();
                    setDropdownOpen(false);
                  }}
                >
                  <KeenIcon icon="calendar-tick" className="me-2 dark:text-blue-300" />
                  <span>30일 이전 알림 삭제</span>
                </button>
              </li>
              <li className="border-t border-gray-200 dark:border-coal-600 mt-1 pt-1">
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-coal-600 text-red-600 dark:text-red-400 flex items-center"
                  onClick={() => {
                    onDeleteAll();
                    setDropdownOpen(false);
                  }}
                >
                  <KeenIcon icon="trash-square" className="me-2" />
                  <span>전체 알림 삭제</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationActions;