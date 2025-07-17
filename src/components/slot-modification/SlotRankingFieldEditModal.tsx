import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { KeenIcon } from '@/components';
import { useCustomToast } from '@/hooks/useCustomToast';
import { createSlotModificationRequest, updateSlotInputData } from '@/services/slotModificationService';

interface SlotRankingFieldEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: any;
  onSuccess?: () => void;
}

export const SlotRankingFieldEditModal: React.FC<SlotRankingFieldEditModalProps> = ({
  open,
  onOpenChange,
  slot,
  onSuccess
}) => {
  const { showSuccess, showError } = useCustomToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [requestReason, setRequestReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<Array<{
    fieldName: string;
    fieldLabel: string;
    mappingKey: string;
  }>>([]);

  // ranking_field_mapping에서 매핑된 필드들 추출
  useEffect(() => {
    if (slot && open) {
      const mapping = slot.campaign?.ranking_field_mapping || {};
      const fields: Array<{
        fieldName: string;
        fieldLabel: string;
        mappingKey: string;
      }> = [];
      const data: Record<string, string> = {};

      // 매핑된 필드들을 확인 - SlotList와 동일한 방식 사용
      if (mapping.keyword) {
        const fieldName = mapping.keyword;
        fields.push({ 
          fieldName, 
          fieldLabel: '키워드',
          mappingKey: 'keyword'
        });
        data[fieldName] = slot.inputData?.[fieldName] || '';
      }

      if (mapping.product_id) {
        const fieldName = mapping.product_id;
        fields.push({ 
          fieldName, 
          fieldLabel: '상품 ID',
          mappingKey: 'product_id'
        });
        data[fieldName] = slot.inputData?.[fieldName] || '';
      }

      if (mapping.title) {
        const fieldName = mapping.title;
        fields.push({ 
          fieldName, 
          fieldLabel: '상품명',
          mappingKey: 'title'
        });
        data[fieldName] = slot.inputData?.[fieldName] || '';
      }

      if (mapping.link || mapping.url) {
        const fieldName = mapping.link || mapping.url;
        fields.push({ 
          fieldName, 
          fieldLabel: 'URL',
          mappingKey: 'link'
        });
        data[fieldName] = slot.inputData?.[fieldName] || '';
      }

      setMappedFields(fields);
      setFormData(data);
      setRequestReason('');
    }
  }, [slot, open]);

  const needsApproval = slot?.status === 'approved' || slot?.status === 'active';

  const handleSubmit = async () => {
    if (!slot) return;

    // 에러 메시지 초기화
    setErrorMessage(null);

    // 승인된 슬롯의 경우 수정 사유 필수
    if (needsApproval && !requestReason.trim()) {
      setErrorMessage('수정 사유를 입력해주세요.');
      showError('수정 사유를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      if (needsApproval) {
        // 수정 요청 생성 - 변경된 필드만 포함
        const oldData: Record<string, any> = {};
        const newData: Record<string, any> = {};
        let hasChanges = false;

        for (const field of mappedFields) {
          const oldValue = slot.inputData?.[field.fieldName] || '';
          const newValue = formData[field.fieldName] || '';
          
          if (oldValue !== newValue) {
            oldData[field.fieldName] = oldValue;
            newData[field.fieldName] = newValue;
            hasChanges = true;
          }
        }

        if (!hasChanges) {
          showError('변경된 내용이 없습니다.');
          return;
        }

        const result = await createSlotModificationRequest(
          slot.id,
          'both', // 여러 필드를 동시에 수정하므로 both 사용
          oldData,
          newData,
          requestReason
        );

        if (result.success) {
          showSuccess('수정 요청이 접수되었습니다. 총판 승인 후 반영됩니다.');
          onOpenChange(false);
          onSuccess?.();
        } else {
          throw new Error(result.error?.message || '수정 요청 생성 실패');
        }
      } else {
        // 대기중 상태: 바로 수정
        const updatedData = {
          ...slot.inputData,
          ...formData
        };

        const result = await updateSlotInputData(slot.id, updatedData);

        if (result.success) {
          showSuccess('순위측정 필드가 수정되었습니다.');
          onOpenChange(false);
          onSuccess?.();
        } else {
          throw new Error(result.error?.message || '필드 수정 실패');
        }
      }
    } catch (error: any) {
      console.error('순위측정 필드 수정 오류:', error);
      const errorMsg = error.message || '필드 수정 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setRequestReason('');
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>순위측정 필드 수정</DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <div className="space-y-4">
            {needsApproval && (
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <KeenIcon icon="information-2" className="size-4" />
                  <span>승인된 슬롯은 수정 요청 후 총판 승인이 필요합니다.</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <KeenIcon icon="cross-circle" className="size-4" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {mappedFields.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                순위측정 필드 매핑이 설정되지 않았습니다.
              </div>
            ) : (
              <>
                {mappedFields.map((field) => (
                  <div key={field.fieldName}>
                    <Label htmlFor={field.fieldName}>
                      {field.fieldLabel} ({field.fieldName})
                    </Label>
                    {field.mappingKey === 'link_field' ? (
                      <Textarea
                        id={field.fieldName}
                        value={formData[field.fieldName] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                        placeholder={`${field.fieldLabel}을(를) 입력하세요`}
                        className="mt-1"
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={field.fieldName}
                        value={formData[field.fieldName] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                        placeholder={`${field.fieldLabel}을(를) 입력하세요`}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}

                {needsApproval && (
                  <div>
                    <Label htmlFor="requestReason">
                      수정 사유 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="requestReason"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="수정이 필요한 이유를 입력해주세요"
                      className="mt-1"
                      rows={3}
                      required
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={
              isLoading || 
              mappedFields.length === 0 ||
              (needsApproval && !requestReason.trim())
            }
          >
            {isLoading ? '처리 중...' : needsApproval ? '수정 요청' : '수정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};