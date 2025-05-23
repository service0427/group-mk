import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogHeaderSpacer
} from '@/components/ui/dialog';

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoText: string;
  setMemoText: (text: string) => void;
  onSave: () => void;
}

const MemoModal: React.FC<MemoModalProps> = ({
  isOpen,
  onClose,
  memoText,
  setMemoText,
  onSave
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 모달이 열리면 텍스트 영역에 포커스 설정
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave();
    onClose();
  };

  // Enter 키로도 저장 가능하도록 설정 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-6 flex-shrink-0">
          <DialogTitle className="text-lg font-medium">메모 관리</DialogTitle>
          <DialogHeaderSpacer />
        </DialogHeader>
        <div className="p-6 bg-background">
          <div className="space-y-2">
            <label htmlFor="memo-text" className="block text-sm font-medium">
              메모 내용
            </label>
            <textarea
              ref={textareaRef}
              id="memo-text"
              rows={5}
              className="w-full border rounded-md p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="여기에 메모를 입력하세요..."
            />
            <div className="text-xs text-muted-foreground mt-1">
              <span className="bg-muted px-1 py-0.5 rounded">Shift+Enter</span> : 줄바꿈 /
              <span className="bg-muted px-1 py-0.5 rounded ml-1">Enter</span> : 저장
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleSave}
          >
            저장
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemoModal;