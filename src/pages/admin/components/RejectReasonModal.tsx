import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';

interface RejectReasonModalProps {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  open,
  onClose,
  onReject
}) => {
  const [reason, setReason] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      await onReject(reason);
      setReason(''); // 초기화
      onClose();
    } catch (error) {
      
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">등업 신청 거부</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
                거부 사유
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="거부 사유를 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                rows={5}
                disabled={processing}
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>* 입력한 거부 사유는 사용자에게 전달됩니다.</p>
              <p>* 명확한 거부 사유와 추가 안내사항을 입력해주세요.</p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="px-6 py-4 border-t flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="btn btn-light"
            disabled={processing}
          >
            취소
          </button>
          <button 
            onClick={handleReject}
            className="btn btn-danger"
            disabled={processing}
          >
            {processing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리중
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                거부하기
              </span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectReasonModal;