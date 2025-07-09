import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createSlotModificationRequest } from '@/services/slotModificationService';
import { useCustomToast } from '@/hooks/useCustomToast';

interface SlotModificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  slotNumber?: number;
  field: string;
  oldValue: string;
  newValue: string;
  onSuccess?: () => void;
}

const fieldLabels: Record<string, string> = {
  mainKeyword: '키워드',
  keywords: '서브키워드',
  mid: 'MID',
  url: 'URL',
  productName: '상품명'
};

export const SlotModificationRequestModal: React.FC<SlotModificationRequestModalProps> = ({
  isOpen,
  onClose,
  slotId,
  slotNumber,
  field,
  oldValue,
  newValue,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useCustomToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showError('수정 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // request_type 결정
      let requestType: 'keyword' | 'mid' | 'both' | 'url' = 'keyword';
      if (field === 'mid') {
        requestType = 'mid';
      } else if (field === 'url') {
        requestType = 'url';
      }

      // old_data와 new_data 생성
      const oldData: Record<string, any> = {};
      const newData: Record<string, any> = {};

      if (field === 'keywords') {
        // 서브키워드 처리
        const oldKeywords = oldValue.split(',').map(k => k.trim()).filter(k => k);
        const newKeywords = newValue.split(',').map(k => k.trim()).filter(k => k);
        
        oldData.keywords = oldKeywords;
        oldData.keyword1 = oldKeywords[0] || '';
        oldData.keyword2 = oldKeywords[1] || '';
        oldData.keyword3 = oldKeywords[2] || '';

        newData.keywords = newKeywords;
        newData.keyword1 = newKeywords[0] || '';
        newData.keyword2 = newKeywords[1] || '';
        newData.keyword3 = newKeywords[2] || '';
      } else {
        oldData[field] = oldValue;
        newData[field] = newValue;
      }

      const result = await createSlotModificationRequest(
        slotId,
        requestType,
        oldData,
        newData,
        reason
      );

      if (result.success) {
        showSuccess('수정 요청이 성공적으로 제출되었습니다.');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.error?.message || '수정 요청 제출 실패');
      }
    } catch (error: any) {
      console.error('수정 요청 제출 실패:', error);
      showError(error.message || '수정 요청 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>슬롯 수정 요청</DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <div className="space-y-4">
            {slotNumber && (
              <div className="text-sm text-gray-500">
                슬롯 번호: #{slotNumber}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                수정 항목
              </label>
              <div className="mt-1 text-sm">
                {fieldLabels[field] || field}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                현재 값
              </label>
              <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {oldValue || '(없음)'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                변경할 값
              </label>
              <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                {newValue}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                수정 사유 <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="수정이 필요한 이유를 입력해주세요."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="text-sm text-gray-500">
              <p className="font-medium mb-1">안내사항:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>수정 요청은 총판의 승인이 필요합니다.</li>
                <li>승인 전까지는 기존 값이 유지됩니다.</li>
                <li>승인/반려 시 알림을 받게 됩니다.</li>
              </ul>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? '제출 중...' : '수정 요청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};