import React, { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalTitle 
} from '@/components/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeenIcon } from '@/components';

interface CampaignStatusModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  currentStatus: string;
  onStatusChange: (campaignId: string, newStatus: string) => void;
}

const CampaignStatusModal: React.FC<CampaignStatusModalProps> = ({
  open,
  onClose,
  campaignId,
  campaignName,
  currentStatus,
  onStatusChange
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleSubmit = () => {
    onStatusChange(campaignId, selectedStatus);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="w-full max-w-md mx-auto rounded-lg bg-white shadow-lg">
        <ModalHeader className="border-b p-4">
          <ModalTitle>캠페인 상태 변경</ModalTitle>
          <button onClick={onClose} className="btn btn-icon btn-sm btn-ghost absolute right-4 top-4">
            <KeenIcon icon="cross" className="size-5" />
          </button>
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-1">{campaignName}</h3>
              <p className="text-sm text-gray-500">아래에서 캠페인 상태를 변경할 수 있습니다.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">상태</label>
              <Select 
                value={selectedStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">진행중</SelectItem>
                  <SelectItem value="pause">일시정지</SelectItem>
                  <SelectItem value="pending">준비중</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
                  <SelectItem value="rejected">반려됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={onClose} 
                className="btn btn-sm btn-light"
              >
                취소
              </button>
              <button 
                onClick={handleSubmit} 
                className="btn btn-sm btn-primary"
              >
                변경하기
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { CampaignStatusModal };
