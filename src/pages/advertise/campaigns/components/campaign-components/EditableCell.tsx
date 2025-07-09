import React from 'react';

interface EditableCellProps {
  id: string;
  field: string;
  value: string;
  editingCell: { id: string; field: string };
  editingValue: string;
  onEditStart: (id: string, field: string) => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel?: () => void;
  onModificationRequest?: (id: string, field: string, newValue: string) => void;
  placeholder?: string;
  isUrl?: boolean;
  children?: React.ReactNode;
  showEditIcon?: boolean;
  disabled?: boolean;
  slotStatus?: string;
  hasPendingModification?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  id,
  field,
  value,
  editingCell,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onModificationRequest,
  placeholder,
  isUrl = false,
  children,
  showEditIcon,
  disabled = false,
  slotStatus,
  hasPendingModification = false
}) => {
  const isEditing = editingCell.id === id && editingCell.field === field;
  const isModificationMode = slotStatus === 'approved' || slotStatus === 'active';
  const actuallyDisabled = disabled || hasPendingModification;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isModificationMode && onModificationRequest) {
        onModificationRequest(id, field, editingValue);
      } else {
        onEditSave();
      }
    } else if (e.key === 'Escape' && onEditCancel) {
      e.preventDefault();
      onEditCancel();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing && !actuallyDisabled) {
      e.stopPropagation();
      onEditStart(id, field);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isModificationMode && onModificationRequest) {
      onModificationRequest(id, field, editingValue);
    } else {
      onEditSave();
    }
  };

  return (
    <div
      className={`editable-cell relative ${!isEditing && !actuallyDisabled ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} ${actuallyDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${hasPendingModification ? 'border-l-4 border-yellow-500' : ''}`}
      onClick={!isEditing && !actuallyDisabled ? handleClick : undefined}
      title={!isEditing && !actuallyDisabled ? (isModificationMode ? "클릭하여 수정 요청" : "클릭하여 편집") : hasPendingModification ? "수정 요청 대기중" : actuallyDisabled ? "대기중 상태에서만 편집 가능합니다" : ""}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 min-w-0">
          <input
            className="input input-bordered input-xs flex-1 min-w-0 focus:ring-2 focus:ring-primary bg-white dark:bg-gray-900"
            value={editingValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            onBlur={() => onEditCancel && onEditCancel()}
          />
          <div className="flex gap-0.5 flex-shrink-0">
            <button
              className="btn btn-xs btn-success"
              onClick={handleSaveClick}
              title={isModificationMode ? "수정 요청 (Enter)" : "저장 (Enter)"}
            >
              ✓
            </button>
            <button
              className="btn btn-xs btn-light"
              onClick={(e) => {
                e.stopPropagation();
                onEditCancel && onEditCancel();
              }}
              title="취소 (ESC)"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full min-w-0">
          <div className="w-full overflow-hidden flex items-center gap-2">
            {isUrl ? (
              children || (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block truncate pr-8"
                  title={value}
                  onClick={(e) => e.stopPropagation()}
                >
                  {value}
                </a>
              )
            ) : children ? (
              <div className="min-w-0 flex-1">{children}</div>
            ) : (
              <span className="text-foreground truncate block flex-1">{value}</span>
            )}
            {hasPendingModification && (
              <span className="text-yellow-600 text-xs" title="수정 요청 대기중">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableCell;