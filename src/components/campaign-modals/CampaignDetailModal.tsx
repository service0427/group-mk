import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalTitle 
} from '@/components/modal';
import { KeenIcon } from '@/components';
import { ICampaign } from '@/pages/admin/campaigns/components/CampaignContent';
import { toAbsoluteUrl } from '@/utils';

// 확장된 캠페인 인터페이스
interface ExtendedCampaign extends ICampaign {
  additionalLogic?: string;
  detailedDescription?: string;
}

interface CampaignDetailModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaign | null;
  onSave?: (updatedCampaign: ExtendedCampaign) => void;
}

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  open,
  onClose,
  campaign,
  onSave
}) => {
  const [editedCampaign, setEditedCampaign] = useState<ExtendedCampaign | null>(null);
  
  useEffect(() => {
    if (campaign) {
      setEditedCampaign({
        ...campaign,
        additionalLogic: campaign.additionalLogic || '',
        detailedDescription: campaign.detailedDescription || ''
      });
    }
  }, [campaign]);
  
  if (!campaign || !editedCampaign) return null;
  
  const handleChange = (field: keyof ExtendedCampaign, value: string) => {
    setEditedCampaign(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleSave = () => {
    if (editedCampaign && onSave) {
      onSave(editedCampaign);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="w-full max-w-2xl mx-auto rounded-lg bg-white shadow-lg">
        <ModalHeader className="border-b p-4">
          <ModalTitle>캠페인 내용 수정</ModalTitle>
          <button onClick={onClose} className="btn btn-icon btn-sm btn-ghost absolute right-4 top-4">
            <KeenIcon icon="cross" className="size-5" />
          </button>
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="space-y-6">
            {/* 헤더 정보 */}
            <div className="flex items-center gap-4">
              <img
                src={toAbsoluteUrl(`/media/${campaign.logo}`)}
                className="rounded-full size-16 shrink-0"
                alt={campaign.campaignName}
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{campaign.campaignName}</h2>
                <div className="mt-1">
                  <span className={`badge badge-${campaign.status.color} badge-outline rounded-[30px]`}>
                    <span className={`size-1.5 rounded-full bg-${campaign.status.color} me-1.5`}></span>
                    {campaign.status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 캠페인 정보 테이블 */}
            <div className="overflow-hidden border border-gray-200 rounded-lg mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      캠페인 ID
                    </th>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {editedCampaign.id}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인 설명
                    </th>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editedCampaign.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full border-gray-300 rounded-md text-sm text-gray-900"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상승효율
                    </th>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editedCampaign.efficiency}
                          onChange={(e) => handleChange('efficiency', e.target.value)}
                          className="w-full border-gray-300 rounded-md text-sm text-gray-900"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최소수량
                    </th>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editedCampaign.minQuantity}
                          onChange={(e) => handleChange('minQuantity', e.target.value)}
                          className="w-full border-gray-300 rounded-md text-sm text-gray-900"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">개</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      접수마감시간
                    </th>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={editedCampaign.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)}
                        className="border-gray-300 rounded-md text-sm text-gray-900"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      추가로직
                    </th>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editedCampaign.additionalLogic}
                        onChange={(e) => handleChange('additionalLogic', e.target.value)}
                        className="w-full border-gray-300 rounded-md text-sm text-gray-900"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인 상세설명
                    </th>
                    <td className="px-4 py-3">
                      <textarea
                        value={editedCampaign.detailedDescription}
                        onChange={(e) => handleChange('detailedDescription', e.target.value)}
                        className="w-full border-gray-300 rounded-md text-sm text-gray-900 min-h-[150px]"
                        rows={6}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleSave} className="btn btn-sm btn-primary">
                저장
              </button>
              <button onClick={onClose} className="btn btn-sm btn-light">
                취소
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { CampaignDetailModal };
