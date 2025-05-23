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
  placeholder?: string;
  isUrl?: boolean;
  children?: React.ReactNode;
  showEditIcon?: boolean;
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
  placeholder,
  isUrl = false,
  children,
  showEditIcon
}) => {
  const isEditing = editingCell.id === id && editingCell.field === field;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEditSave();
    } else if (e.key === 'Escape' && onEditCancel) {
      e.preventDefault();
      onEditCancel();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      e.stopPropagation();
      onEditStart(id, field);
    }
  };

  return (
    <div
      className={`editable-cell relative ${!isEditing ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
      onClick={!isEditing ? handleClick : undefined}
      title={!isEditing ? "클릭하여 편집" : ""}
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
              onClick={(e) => {
                e.stopPropagation();
                onEditSave();
              }}
              title="저장 (Enter)"
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
          <div className="w-full overflow-hidden">
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
              <div className="min-w-0">{children}</div>
            ) : (
              <span className="text-foreground truncate block">{value}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableCell;