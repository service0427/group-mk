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
  placeholder?: string;
  isUrl?: boolean;
  children?: React.ReactNode;
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
  placeholder,
  isUrl = false,
  children
}) => {
  const isEditing = editingCell.id === id && editingCell.field === field;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditSave();
    }
  };

  return (
    <div 
      className="editable-cell py-1" 
      onClick={() => !isEditing && onEditStart(id, field)}
    >
      {isEditing ? (
        <input
          className="input input-bordered input-sm w-full focus:ring-2 focus:ring-primary bg-card"
          value={editingValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
        />
      ) : isUrl ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary">
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </a>
      ) : children ? (
        children
      ) : (
        <span className="text-foreground">{value}</span>
      )}
    </div>
  );
};

export default EditableCell;