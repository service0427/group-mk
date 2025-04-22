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
import { updateCampaign, formatTimeHHMM } from '../../services/campaignService';

// 확장된 캠페인 인터페이스
interface ExtendedCampaign extends ICampaign {
  additionalLogic?: string;
  detailedDescription?: string;
  unitPrice?: string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (campaign) {
      // 캠페인 데이터 포맷 처리
      const minQuantity = campaign.minQuantity ? campaign.minQuantity.replace('개', '') : '0';
      const efficiency = campaign.efficiency ? campaign.efficiency.replace('%', '') : '0';
      
      // 원본 데이터가 있으면 사용, 없으면 UI 표시 값에서 추출
      const unitPrice = campaign.originalData?.unit_price?.toString() || '100';
      const additionalLogicValue = campaign.originalData?.additional_logic?.toString() || campaign.additionalLogic || '0'; 
      const detailedDescValue = campaign.originalData?.detailed_description || campaign.detailedDescription || '';
      
      // 항상 최신 데이터 사용
      setEditedCampaign({
        ...campaign,
        additionalLogic: additionalLogicValue,
        detailedDescription: detailedDescValue,
        unitPrice: unitPrice,
        minQuantity: minQuantity,
        efficiency: efficiency,
        deadline: formatTimeHHMM(campaign.deadline) // 시분 형식 확보
      });
    }
  }, [campaign]);
  
  if (!campaign || !editedCampaign) return null;
  
  const handleChange = (field: keyof ExtendedCampaign, value: string) => {
    setEditedCampaign(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  // 숫자만 입력받는 핸들러
  const handleNumberChange = (field: keyof ExtendedCampaign, value: string) => {
    // 숫자와 소수점만 허용
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // 소수점이 두 개 이상 있는 경우 첫 번째 소수점만 유지
    const parts = numericValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    
    setEditedCampaign(prev => prev ? { ...prev, [field]: formattedValue } : null);
  };
  
  const handleSave = async () => {
    if (!editedCampaign) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. DB 업데이트
      const success = await updateCampaign(parseInt(editedCampaign.id), {
        campaignName: editedCampaign.campaignName,
        description: editedCampaign.description,
        detailedDescription: editedCampaign.detailedDescription,
        efficiency: editedCampaign.efficiency,
        minQuantity: editedCampaign.minQuantity,
        unitPrice: editedCampaign.unitPrice,
        deadline: editedCampaign.deadline, // formatTimeHHMM 함수는 updateCampaign 내에서 적용됨
        additionalLogic: editedCampaign.additionalLogic
      });
      
      if (!success) {
        throw new Error('캠페인 업데이트에 실패했습니다.');
      }
      
      // 2. UI 업데이트를 위해 형식 변환 및 originalData 업데이트
      const updatedCampaign: ExtendedCampaign = {
        ...editedCampaign,
        efficiency: `${editedCampaign.efficiency}%`,
        minQuantity: `${editedCampaign.minQuantity}개`,
        // originalData 업데이트 (중요: 이 부분이 빠져서 문제가 발생했음)
        originalData: {
          ...editedCampaign.originalData,
          unit_price: parseFloat(editedCampaign.unitPrice || '0'),
          min_quantity: parseInt(editedCampaign.minQuantity || '0'),
          efficiency: parseFloat(editedCampaign.efficiency || '0'),
          deadline: formatTimeHHMM(editedCampaign.deadline || ''),
          additional_logic: parseInt(editedCampaign.additionalLogic || '0'),
          description: editedCampaign.description,
          detailed_description: editedCampaign.detailedDescription,
        }
      };
      
      // 3. 부모 컴포넌트에 업데이트 알림
      if (onSave) {
        onSave(updatedCampaign);
      }
      
      onClose();
    } catch (err) {
      console.error('캠페인 저장 중 오류:', err);
      setError('캠페인 정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="bg-background">
      <ModalContent className="w-full max-w-2xl mx-auto rounded-lg bg-background shadow-lg">
        <ModalHeader className="border-b p-4">
          <ModalTitle className="text-foreground">캠페인 내용 수정</ModalTitle>
          <button 
            onClick={onClose} 
            className="btn btn-icon btn-sm btn-ghost absolute right-4 top-4"
            disabled={loading}
          >
            <KeenIcon icon="cross" className="size-5" />
          </button>
        </ModalHeader>
        <ModalBody className="p-6 bg-background">
          <div className="space-y-6">
            {/* 오류 메시지 */}
            {error && (
              <div className="alert alert-danger mb-4">
                <KeenIcon icon="warning-triangle" className="size-5 mr-2" />
                {error}
              </div>
            )}
          
            {/* 헤더 정보 */}
            <div className="flex items-center gap-4">
              <img
                src={toAbsoluteUrl(`/media/${campaign.logo}`)}
                className="rounded-full size-16 shrink-0"
                alt={campaign.campaignName}
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 이미지 사용
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                }}
              />
              <div>
                <h2 className="text-xl font-semibold text-foreground">{campaign.campaignName}</h2>
                <div className="mt-1">
                  <span className={`badge badge-${campaign.status.color} badge-outline rounded-[30px]`}>
                    <span className={`size-1.5 rounded-full bg-${campaign.status.color} me-1.5`}></span>
                    {campaign.status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 캠페인 정보 테이블 */}
            <div className="overflow-hidden border border-border rounded-lg mb-6">
              <table className="min-w-full divide-y divide-border">
                <tbody className="divide-y divide-border">
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider w-1/3">
                      캠페인 ID
                    </th>
                    <td className="px-4 py-3 text-md text-foreground">
                      {campaign.originalData?.campaign_id || editedCampaign.id}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      건당 단가
                    </th>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={editedCampaign.unitPrice}
                          onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                          className="input w-24 border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading}
                        />
                        <span className="ml-2 text-md font-medium text-foreground">원</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      최소수량
                    </th>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editedCampaign.minQuantity}
                          onChange={(e) => handleNumberChange('minQuantity', e.target.value)}
                          className="input w-24 border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading}
                        />
                        <span className="ml-2 text-md font-medium text-foreground">개</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      추가로직
                    </th>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editedCampaign.additionalLogic}
                          onChange={(e) => handleNumberChange('additionalLogic', e.target.value)}
                          className="input w-24 border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading}
                        />
                        <span className="ml-2 text-md font-medium text-foreground">개</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      상승효율
                    </th>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={editedCampaign.efficiency}
                          onChange={(e) => handleNumberChange('efficiency', e.target.value)}
                          className="input w-24 border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading}
                        />
                        <span className="ml-2 text-md font-medium text-foreground">%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      접수마감시간
                    </th>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={editedCampaign.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)}
                        className="input w-36 border-border bg-background text-foreground rounded-md text-md"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      캠페인 설명
                    </th>
                    <td className="px-4 py-3">
                      <textarea
                        value={editedCampaign.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="input w-full border-border bg-background text-foreground rounded-md text-md min-h-[80px]"
                        rows={3}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      캠페인 상세설명
                    </th>
                    <td className="px-4 py-3">
                      <textarea
                        value={editedCampaign.detailedDescription}
                        onChange={(e) => handleChange('detailedDescription', e.target.value)}
                        className="input w-full border-border bg-background text-foreground rounded-md text-md min-h-[150px]"
                        rows={6}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={handleSave} 
                className="btn btn-md btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                    저장 중...
                  </span>
                ) : '저장'}
              </button>
              <button 
                onClick={onClose} 
                className="btn btn-md btn-light"
                disabled={loading}
              >
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