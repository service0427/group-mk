import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { KeenIcon } from '@/components';
import { ICampaign } from '@/pages/admin/campaigns/components/CampaignContent';
import { toAbsoluteUrl } from '@/utils';
import { updateCampaign, formatTimeHHMM, updateCampaignStatus } from '../../services/campaignService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// 상태값에 따른 라벨 반환
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pending': return '준비중';
    case 'pause': return '표시안함';
    case 'waiting_approval': return '승인 대기중';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

// 상태값에 따른 색상 반환
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'success';
    case 'pause': return 'warning';
    case 'pending': return 'info';
    case 'completed': return 'primary';
    case 'rejected': return 'danger';
    case 'waiting_approval': return 'primary';
    default: return 'info';
  }
};

// 확장된 캠페인 인터페이스
interface ExtendedCampaign extends ICampaign {
  additionalLogic?: string;
  detailedDescription?: string;
  unitPrice?: string;
  bannerImage?: string;
  rejectionReason?: string; // 반려 사유 필드 추가
}

interface CampaignDetailModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaign | null;
  onSave?: (updatedCampaign: ExtendedCampaign) => void;
  isOperator?: boolean; // 운영자 모드 여부
}

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  open,
  onClose,
  campaign,
  onSave,
  isOperator = false
}) => {
  const [editedCampaign, setEditedCampaign] = useState<ExtendedCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로고 업로드 관련 상태
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 배너 이미지 업로드 관련 상태
  const [uploadedBannerImage, setUploadedBannerImage] = useState<string | null>(null);
  const [bannerImagePreviewUrl, setBannerImagePreviewUrl] = useState<string | null>(null);
  const bannerImageFileInputRef = useRef<HTMLInputElement>(null);
  
  // 배너 이미지 미리보기 모달 상태
  const [bannerPreviewModalOpen, setBannerPreviewModalOpen] = useState<boolean>(false);

  // 캠페인 전체 미리보기 모달 상태
  const [campaignPreviewModalOpen, setCampaignPreviewModalOpen] = useState<boolean>(false);

  // 반려 사유 입력 모달 상태
  const [rejectionModalOpen, setRejectionModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  useEffect(() => {
    if (campaign) {
      
      
      // 캠페인 데이터 포맷 처리
      const minQuantity = campaign.minQuantity ? campaign.minQuantity.replace('개', '') : '0';
      const efficiency = campaign.efficiency ? campaign.efficiency.replace('%', '') : '0';
      
      // 원본 데이터가 있으면 사용, 없으면 UI 표시 값에서 추출
      const unitPrice = campaign.originalData?.unit_price?.toString() || '100';
      const additionalLogicValue = campaign.originalData?.additional_logic?.toString() || campaign.additionalLogic || '0'; 
      const detailedDescValue = campaign.originalData?.detailed_description || campaign.detailedDescription || '';
      
      // add_info 객체 확인
      const addInfo = campaign.originalData?.add_info || {};
      
      // 로고 이미지 설정 (add_info에서 로고 URL을 확인)
      if (addInfo.logo_url) {
        setPreviewUrl(addInfo.logo_url);
        setUploadedLogo('기존 로고 이미지');
      }
      
      // 배너 이미지 설정 (add_info에서 배너 URL을 확인)
      if (addInfo.banner_url) {
        setBannerImagePreviewUrl(addInfo.banner_url);
        setUploadedBannerImage('기존 배너 이미지');
      }
      
      // 반려 사유 확인 (rejected_reason 필드 우선, 없으면 add_info에서 확인)
      let rejectionReasonValue = '';
      if (campaign.originalData?.rejected_reason) {
        // 새로운 rejected_reason 필드에서 먼저 확인
        rejectionReasonValue = campaign.originalData.rejected_reason;
        
      } else if (addInfo.rejection_reason) {
        // 이전 방식(add_info)에서 가져오기 (하위 호환성)
        rejectionReasonValue = addInfo.rejection_reason;
        
      }

      // 항상 최신 데이터 사용
      // 상태값 확인 및 디버깅
      let initialStatus;
      if (typeof campaign.status === 'string') {
        initialStatus = campaign.status;
        
      } else if (typeof campaign.status === 'object') {
        initialStatus = campaign.status.status;
        
      } else {
        initialStatus = campaign.originalData?.status || 'pending';
        
      }

      // originalData에 status가 있으면 그 값을 우선 사용 (서버 데이터 우선)
      const finalStatus = campaign.originalData?.status || initialStatus || 'pending';
      

      setEditedCampaign({
        ...campaign,
        additionalLogic: additionalLogicValue,
        detailedDescription: detailedDescValue,
        unitPrice: unitPrice,
        minQuantity: minQuantity,
        efficiency: efficiency,
        deadline: formatTimeHHMM(campaign.deadline), // 시분 형식 확보
        bannerImage: addInfo.banner_url ? 'banner-image.png' : undefined,
        rejectionReason: rejectionReasonValue, // 반려 사유 설정
        status: {
          label: getStatusLabel(finalStatus),
          color: getStatusColor(finalStatus),
          status: finalStatus
        }
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
  
  // 로고 파일 업로드 처리
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 이하로 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하만 가능합니다.');
      return;
    }
    
    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 데이터를 Base64로 변환하여 저장
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setUploadedLogo(file.name);
    };
    reader.readAsDataURL(file);
  };
  
  // 파일 선택 클릭 핸들러
  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };
  
  // 배너 이미지 업로드 처리
  const handleBannerImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 파일 크기 체크 (10MB 이하로 제한)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하만 가능합니다.');
      return;
    }
    
    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 데이터를 Base64로 변환하여 저장
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerImagePreviewUrl(result);
      setUploadedBannerImage(file.name);
    };
    reader.readAsDataURL(file);
  };
  
  // 배너 이미지 파일 선택 클릭 핸들러
  const handleBannerImageSelectClick = () => {
    bannerImageFileInputRef.current?.click();
  };
  
  const handleSave = async () => {
    if (!editedCampaign) return;

    setLoading(true);
    setError(null);

    try {
      // 상태 값 확인 및 디버깅
      

      let statusValue;
      if (typeof editedCampaign.status === 'string') {
        statusValue = editedCampaign.status;
        
      } else if (typeof editedCampaign.status === 'object' && editedCampaign.status !== null) {
        // status.status가 있고 유효한 값인지 확인
        statusValue = editedCampaign.status.status || 'pending';
        
      } else {
        // 기본값 사용 전에 originalData에서 확인
        statusValue = editedCampaign.originalData?.status || 'pending';
        
      }

      // 반려 상태에서 반려 사유가 비어있는지 확인
      if (statusValue === 'rejected' && (!editedCampaign.rejectionReason || editedCampaign.rejectionReason.trim() === '')) {
        setError('반려 사유를 입력해 주세요.');
        setLoading(false);
        return;
      }

      // 반려 상태 처리를 위한 추가 디버깅 로그
      if (statusValue === 'rejected') {
        
        
        
      }

      // 원본 캠페인 상태 확인
      const originalStatus = campaign.originalData?.status || 'pending';
      const isStatusChanged = statusValue !== originalStatus;

      // 운영자 모드가 아닌 경우(총판) 상태 처리 로직
      let finalStatus = statusValue;
      if (!isOperator) {
        // 1. 승인 요청중 또는 반려됨 상태인 경우 - 무조건 waiting_approval로 변경
        if (originalStatus === 'rejected' || originalStatus === 'waiting_approval') {
          finalStatus = 'waiting_approval';
          
        }
        // 2. 준비중, 진행중, 표시안함 상태인 경우 - 사용자가 선택한 상태로 변경
        else if (['pending', 'active', 'pause'].includes(originalStatus)) {
          finalStatus = statusValue; // 사용자가 선택한 상태 사용
          
        }
        // 3. 반려 상태에서 저장할 경우, 승인 대기중으로 변경
        else if (originalStatus === 'rejected') {
          finalStatus = 'waiting_approval';
          
        }
        // 4. 그 외의 경우는 원래 상태 유지
        else {
          finalStatus = originalStatus;
          
        }
      }

      // 업데이트할 데이터 준비
      const updateData = {
        campaignName: editedCampaign.campaignName,
        description: editedCampaign.description,
        detailedDescription: editedCampaign.detailedDescription,
        unitPrice: editedCampaign.unitPrice,
        deadline: editedCampaign.deadline,
        logo: previewUrl ? 'updated-logo.png' : editedCampaign.logo,
        uploadedLogo: previewUrl,
        bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : editedCampaign.bannerImage,
        uploadedBannerImage: bannerImagePreviewUrl,
        status: finalStatus,
        rejectionReason: finalStatus === 'rejected' ? editedCampaign.rejectionReason : undefined
      };

      console.log('최종 상태 결정:', {
        originalStatus,
        selectedStatus: statusValue,
        isChanged: isStatusChanged,
        finalStatus
      });

      

      // 반려 상태일 때 반려 사유가 포함되었는지 한번 더 확인
      if (statusValue === 'rejected' && finalStatus === 'rejected') {
        

        if (!updateData.rejectionReason) {
          
        }
      }

      // 1. DB 업데이트 - 기본 정보
      const success = await updateCampaign(parseInt(editedCampaign.id), updateData);

      if (!success) {
        throw new Error('캠페인 업데이트에 실패했습니다.');
      }

      // 2. UI 업데이트를 위해 형식 변환 및 originalData 업데이트
      let addInfo = editedCampaign.originalData?.add_info || {};
      if (typeof addInfo === 'string') {
        try {
          addInfo = JSON.parse(addInfo);
        } catch (e) {
          
          addInfo = {};
        }
      }

      // 반려 사유는 더 이상 add_info에 저장하지 않음 (rejected_reason 필드에 직접 저장)
      // DB 저장은 campaignService.ts에서 처리함

      // 상태 객체 생성
      const statusObject = {
        label: getStatusLabel(finalStatus),
        color: getStatusColor(finalStatus),
        status: finalStatus
      };

      

      const updatedCampaign: ExtendedCampaign = {
        ...editedCampaign,
        logo: previewUrl ? 'updated-logo.png' : editedCampaign.logo,
        // 상태를 일관된 형식으로 업데이트
        status: statusObject,
        // originalData 업데이트
        originalData: {
          ...editedCampaign.originalData,
          unit_price: parseFloat(editedCampaign.unitPrice || '0'),
          deadline: formatTimeHHMM(editedCampaign.deadline || ''),
          description: editedCampaign.description,
          detailed_description: editedCampaign.detailedDescription,
          status: finalStatus, // 최종 상태값 저장
          logo: previewUrl ? 'updated-logo.png' : editedCampaign.logo,
          uploaded_logo_data: previewUrl,
          banner_image: bannerImagePreviewUrl ? 'banner-image.png' : editedCampaign.bannerImage,
          uploaded_banner_image_data: bannerImagePreviewUrl,
          add_info: addInfo,
          // 반려 상태일 때 rejected_reason 필드 업데이트
          ...(finalStatus === 'rejected' ? { rejected_reason: editedCampaign.rejectionReason } : {})
        }
      };

      // 3. 부모 컴포넌트에 업데이트 알림
      if (onSave) {
        onSave(updatedCampaign);
      }

      // 4. 성공 메시지 표시 (상태가 변경된 경우)
      if (campaign.originalData?.status !== statusValue) {
        let message = '';
        switch (statusValue) {
          case 'active':
            message = '캠페인이 활성화되어 게시되었습니다.';
            break;
          case 'rejected':
            message = '캠페인이 반려되었습니다.';
            break;
          case 'pending':
            message = '캠페인이 승인되어 준비 상태로 변경되었습니다.';
            break;
          case 'pause':
            message = '캠페인이 표시 중지 상태로 변경되었습니다.';
            break;
          case 'waiting_approval':
            message = '캠페인이 승인 대기 상태로 변경되었습니다.';
            break;
          default:
            message = '캠페인 상태가 변경되었습니다.';
        }
        
      }

      onClose();
    } catch (err) {
      
      setError('캠페인 정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[800px] p-0 overflow-hidden overflow-y-auto max-h-[90vh]">
          <DialogHeader className="bg-background py-4 px-6 border-b">
            <DialogTitle className="text-lg font-medium text-foreground">
              {isOperator ? '캠페인 상세 정보 (운영자 모드)' : '캠페인 내용 수정'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 bg-background">
            <div className="space-y-4">
              {/* 운영자 모드 표시 */}
              {isOperator && (
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-4 rounded-md flex items-start mb-4">
                  <KeenIcon icon="information-circle" className="size-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">운영자 모드</p>
                    <p className="text-sm mt-1">이 모드에서는 캠페인 정보를 보기만 할 수 있으며, 하단의 상태 변경 버튼을 통해 캠페인 상태만 변경할 수 있습니다. 모든 필드는 읽기 전용입니다.</p>
                  </div>
                </div>
              )}
              
              {/* 오류 메시지 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 rounded-md flex items-center mb-4">
                  <KeenIcon icon="warning-triangle" className="size-5 mr-2" />
                  {error}
                </div>
              )}
            
              {/* 헤더 정보 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {previewUrl || editedCampaign.logo ? (
                    <img
                      src={previewUrl || (() => {
                        // 동물 아이콘 목록
                        const animalIcons = [
                          'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
                          'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
                          'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
                        ];

                        // 동물 이름 매핑
                        const animalNameMap: Record<string, string> = {
                          '곰': 'bear', '고양이': 'cat', '소': 'cow', '악어': 'crocodile',
                          '돌고래': 'dolphin', '코끼리': 'elephant', '플라밍고': 'flamingo',
                          '기린': 'giraffe', '말': 'horse', '캥거루': 'kangaroo',
                          '코알라': 'koala', '표범': 'leopard', '사자': 'lion',
                          '라마': 'llama', '올빼미': 'owl', '펠리컨': 'pelican',
                          '펭귄': 'penguin', '양': 'sheep', '테디베어': 'teddy-bear',
                          '거북이': 'turtle', 'bear': 'bear', 'cat': 'cat'
                        };

                        // 기존 로고가 있는 경우
                        if (typeof editedCampaign.originalData?.add_info === 'object' && editedCampaign.originalData.add_info?.logo_url) {
                          return editedCampaign.originalData.add_info.logo_url;
                        }

                        // 파일 경로가 있는 경우
                        if (editedCampaign.logo && (editedCampaign.logo.includes('.svg') || editedCampaign.logo.includes('.png'))) {
                          // 경로에서 동물 이름 추출 시도
                          let animalName = null;
                          const logo = editedCampaign.logo;

                          if (logo.includes('animal/svg/') || logo.includes('animal\\svg\\')) {
                            // animal/svg/cat.svg 또는 animal\svg\cat.svg 형태에서 animal 이름 추출
                            const segments = logo.split(/[\/\\]/); // 슬래시나 백슬래시로 분할
                            for (let i = 0; i < segments.length; i++) {
                              if (segments[i] === 'svg' && i + 1 < segments.length) {
                                animalName = segments[i + 1].split('.')[0]; // .svg 확장자 제거
                                break;
                              }
                            }
                          }

                          // 추출된 동물 이름이 있고 유효한 동물 아이콘인 경우
                          if (animalName && animalIcons.includes(animalName)) {
                            
                            return toAbsoluteUrl(`/media/animal/svg/${animalName}.svg`);
                          }

                          return toAbsoluteUrl(`/media/${editedCampaign.logo}`);
                        }

                        // 동물 이름이 있는 경우
                        if (editedCampaign.logo && animalIcons.includes(editedCampaign.logo)) {
                          
                          return toAbsoluteUrl(`/media/animal/svg/${editedCampaign.logo}.svg`);
                        }

                        // 캠페인 이름에서 동물 추출 (logo 필드가 없는 경우 마지막 대안)
                        if (!editedCampaign.logo) {
                          const name = editedCampaign.campaignName.toLowerCase();

                          // 긴 이름 먼저 매칭하기 위해 이름 길이별로 정렬
                          const sortedEntries = Object.entries(animalNameMap)
                            .sort((a, b) => b[0].length - a[0].length);

                          for (const [animalName, iconName] of sortedEntries) {
                            if (name.includes(animalName.toLowerCase())) {
                              
                              return toAbsoluteUrl(`/media/animal/svg/${iconName}.svg`);
                            }
                          }
                        }

                        // 기본 이미지 선택
                        return toAbsoluteUrl(`/media/animal/svg/${animalIcons[0]}.svg`);
                      })()}
                      className="rounded-full size-16 shrink-0 object-cover"
                      alt="캠페인 로고"
                      onError={(e) => {
                        

                        // 동물 아이콘 및 이름 매핑 정의
                        const animalIcons = [
                          'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
                          'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
                          'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
                        ];

                        // logo 필드 체크
                        if (editedCampaign.logo) {
                          

                          // logo가 동물 이름인 경우
                          if (animalIcons.includes(editedCampaign.logo)) {
                            
                            (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${editedCampaign.logo}.svg`);
                            return;
                          }

                          // 경로에서 동물 이름 추출 시도
                          if (editedCampaign.logo.includes('animal/svg/') || editedCampaign.logo.includes('animal\\svg\\')) {
                            const segments = editedCampaign.logo.split(/[\/\\]/);
                            for (let i = 0; i < segments.length; i++) {
                              if (segments[i] === 'svg' && i + 1 < segments.length) {
                                const animalName = segments[i + 1].split('.')[0];
                                if (animalIcons.includes(animalName)) {
                                  
                                  (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalName}.svg`);
                                  return;
                                }
                              }
                            }
                          }
                        }

                        const animalNameMap: Record<string, string> = {
                          '곰': 'bear', '고양이': 'cat', '소': 'cow', '악어': 'crocodile',
                          '돌고래': 'dolphin', '코끼리': 'elephant', '플라밍고': 'flamingo',
                          '기린': 'giraffe', '말': 'horse', '캥거루': 'kangaroo',
                          '코알라': 'koala', '표범': 'leopard', '사자': 'lion',
                          '라마': 'llama', '올빼미': 'owl', '펠리컨': 'pelican',
                          '펭귄': 'penguin', '양': 'sheep', '테디베어': 'teddy-bear',
                          '거북이': 'turtle', 'bear': 'bear', 'cat': 'cat'
                        };

                        // 캠페인 이름에서 동물 이름 추출
                        const name = editedCampaign.campaignName.toLowerCase();
                        let animalFound = false;

                        // 길이가 긴 동물 이름부터 검사 (더 구체적인 이름이 우선)
                        const sortedEntries = Object.entries(animalNameMap)
                          .sort((a, b) => b[0].length - a[0].length);

                        for (const [animalName, iconName] of sortedEntries) {
                          if (name.includes(animalName.toLowerCase())) {
                            
                            (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${iconName}.svg`);
                            animalFound = true;
                            break;
                          }
                        }

                        // 이름에서 동물을 찾지 못하면 랜덤 아이콘 사용
                        if (!animalFound) {
                          const randomAnimal = animalIcons[Math.floor(Math.random() * animalIcons.length)];
                          
                          (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
                        }
                      }}
                    />
                  ) : (
                    <div className="rounded-full size-16 shrink-0 bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      로고
                    </div>
                  )}
                  {!isOperator && (
                    <button 
                      type="button"
                      onClick={handleFileSelectClick}
                      className="absolute -bottom-1 -right-1 size-6 flex items-center justify-center bg-primary rounded-full text-white shadow-md hover:bg-primary/90"
                      title="로고 업로드"
                    >
                      <KeenIcon icon="camera" className="size-3" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={editedCampaign.campaignName}
                    onChange={(e) => handleChange('campaignName', e.target.value)}
                    className="text-xl font-semibold text-foreground w-full px-3 py-2 border border-border bg-background rounded-md"
                    placeholder="캠페인 이름 입력"
                    disabled={loading || isOperator}
                    readOnly={isOperator}
                  />
                  <div className="mt-1">
                    <span className={`badge badge-${editedCampaign.status.color} badge-outline rounded-[30px]`}>
                      <span className={`size-1.5 rounded-full bg-${editedCampaign.status.color} me-1.5`}></span>
                      {editedCampaign.status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* 캠페인 정보 테이블 */}
              <div className="overflow-hidden border border-border rounded-lg mb-4">
                <table className="min-w-full divide-y divide-border">
                  <tbody className="divide-y divide-border">
                    {/* 캠페인 ID는 히든 값으로 저장 */}
                    <input type="hidden" value={editedCampaign.id || '-'} />
                    
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider w-1/3">
                        로고 업로드
                      </th>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            {!isOperator ? (
                              <button
                                type="button"
                                onClick={handleFileSelectClick}
                                className="btn btn-sm btn-primary"
                                disabled={loading}
                              >
                                <KeenIcon icon="cloud-upload" className="me-1" />
                                로고 이미지 업로드
                              </button>
                            ) : (
                              <span className="text-sm text-muted-foreground">로고 이미지 (읽기 전용)</span>
                            )}
                            {uploadedLogo && (
                              <span className="text-sm text-success">
                                <KeenIcon icon="check-circle" className="me-1" />
                                {uploadedLogo} 업로드됨
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">또는 기본 제공 로고 중 선택:</p>
                          <select
                            value={previewUrl ? '' : editedCampaign.logo}
                            onChange={(e) => {
                              if (e.target.value) {
                                // 업로드된 이미지를 모두 제거하고 드롭다운 선택으로 전환
                                setPreviewUrl(null);
                                setUploadedLogo(null);

                                // 선택된 동물 로고 파일 경로에서 동물 이름 추출
                                const animalName = e.target.value.split('/').pop()?.split('.')[0];
                                

                                // 동물 이름만 저장 (경로 없이)
                                // 예: 'animal/svg/cat.svg' -> 'cat', 'giraffe.svg' -> 'giraffe'
                                handleChange('logo', animalName || e.target.value);

                                // 디버깅 로그
                                console.log('로고 선택 완료', {
                                  path: e.target.value,
                                  extractedName: animalName,
                                  storedValue: animalName || e.target.value,
                                  willOverrideNameSearch: true
                                });
                              }
                            }}
                            className="w-full h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                            disabled={loading || isOperator}
                          >
                            <option value="">기본 제공 로고 선택</option>
                            <option value="animal/svg/bear.svg">곰</option>
                            <option value="animal/svg/cat.svg">고양이</option>
                            <option value="animal/svg/cow.svg">소</option>
                            <option value="animal/svg/crocodile.svg">악어</option>
                            <option value="animal/svg/dolphin.svg">돌고래</option>
                            <option value="animal/svg/elephant.svg">코끼리</option>
                            <option value="animal/svg/flamingo.svg">플라밍고</option>
                            <option value="animal/svg/giraffe.svg">기린</option>
                            <option value="animal/svg/horse.svg">말</option>
                            <option value="animal/svg/kangaroo.svg">캥거루</option>
                            <option value="animal/svg/koala.svg">코알라</option>
                            <option value="animal/svg/leopard.svg">표범</option>
                            <option value="animal/svg/lion.svg">사자</option>
                            <option value="animal/svg/llama.svg">라마</option>
                            <option value="animal/svg/owl.svg">올빼미</option>
                            <option value="animal/svg/pelican.svg">펠리컨</option>
                            <option value="animal/svg/penguin.svg">펭귄</option>
                            <option value="animal/svg/sheep.svg">양</option>
                            <option value="animal/svg/teddy-bear.svg">테디베어</option>
                            <option value="animal/svg/turtle.svg">거북이</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        건당 단가
                      </th>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={editedCampaign.unitPrice}
                            onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                            className="w-24 h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                            disabled={loading || isOperator}
                            readOnly={isOperator}
                          />
                          <span className="ml-2 text-md font-medium text-foreground">원</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        접수마감시간
                      </th>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={editedCampaign.deadline}
                          onChange={(e) => handleChange('deadline', e.target.value)}
                          className="w-36 h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                          disabled={loading || isOperator}
                          readOnly={isOperator}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        배너 이미지
                      </th>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-4">
                            {!isOperator ? (
                              <button
                                type="button"
                                onClick={handleBannerImageSelectClick}
                                className="btn btn-sm btn-primary"
                                disabled={loading}
                              >
                                <KeenIcon icon="image" className="me-1" />
                                배너 이미지 업로드
                              </button>
                            ) : (
                              <span className="text-sm text-muted-foreground">배너 이미지 (읽기 전용)</span>
                            )}
                            {uploadedBannerImage && (
                              <span className="text-sm text-success">
                                <KeenIcon icon="check-circle" className="me-1" />
                                {uploadedBannerImage} 업로드됨
                              </span>
                            )}
                            <input
                              ref={bannerImageFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleBannerImageUpload}
                              className="hidden"
                            />
                          </div>
                          
                          {bannerImagePreviewUrl && (
                            <div className="mt-2 relative flex items-start gap-2">
                              <div className="relative">
                                <img 
                                  src={bannerImagePreviewUrl} 
                                  alt="배너 이미지 미리보기" 
                                  className="w-40 h-auto rounded-md border border-border object-cover"
                                  style={{ maxHeight: '60px' }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setBannerImagePreviewUrl(null);
                                    setUploadedBannerImage(null);
                                  }}
                                  className="absolute -top-2 -right-2 size-5 flex items-center justify-center bg-red-500 rounded-full text-white shadow-md hover:bg-red-600"
                                  title="이미지 제거"
                                >
                                  <KeenIcon icon="cross" className="size-2.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => setBannerPreviewModalOpen(true)}
                                className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <KeenIcon icon="eye" className="me-1" />
                                크게 보기
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">캠페인 상세 페이지에 표시될 배너 이미지를 업로드하세요.</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 설명
                      </th>
                      <td className="px-3 py-2">
                        <textarea
                          value={editedCampaign.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-md min-h-[60px]"
                          rows={2}
                          placeholder="간단한 캠페인 설명을 입력하세요"
                          disabled={loading || isOperator}
                          readOnly={isOperator}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 상세설명
                      </th>
                      <td className="px-3 py-2">
                        <textarea
                          value={editedCampaign.detailedDescription}
                          onChange={(e) => handleChange('detailedDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-md min-h-[100px]"
                          rows={4}
                          placeholder="상세한 캠페인 설명을 입력하세요"
                          disabled={loading || isOperator}
                          readOnly={isOperator}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        캠페인 상태
                      </th>
                      <td className="px-3 py-2">
                        <div className="space-y-3">
                          <select
                            value={
                              // status가 문자열인 경우 그대로 사용
                              typeof editedCampaign.status === 'string'
                                ? editedCampaign.status
                                // status가 객체인 경우 status.status 값을 사용
                                : editedCampaign.status.status || 'pending'
                            }
                            onChange={(e) => {
                              const statusValue = e.target.value;
                              
                              setEditedCampaign(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  status: {
                                    label: getStatusLabel(statusValue),
                                    color: getStatusColor(statusValue),
                                    status: statusValue
                                  }
                                };
                              });
                            }}
                            className="w-full h-10 px-3 py-2 border border-border bg-background text-foreground rounded-md text-md"
                            // 운영자 모드이거나 "승인 요청중" 또는 "반려됨" 상태인 경우 비활성화
                            disabled={
                              loading ||
                              isOperator ||
                              (typeof editedCampaign.status === 'object' &&
                               (editedCampaign.status.status === 'waiting_approval' ||
                                editedCampaign.status.status === 'rejected')) ||
                              (typeof editedCampaign.status === 'string' &&
                               (editedCampaign.status === 'waiting_approval' ||
                                editedCampaign.status === 'rejected'))
                            }
                          >
                            {/* 운영자가 아닐 때는 세 가지 상태만 표시 */}
                            <option value="pending">준비중</option>
                            <option value="active">진행중</option>
                            <option value="pause">표시안함</option>
                            {isOperator && (
                              <>
                                <option value="waiting_approval">승인 대기중</option>
                                <option value="rejected">반려됨</option>
                              </>
                            )}
                          </select>

                          {/* 승인 대기중일 때 빠른 버튼 표시 (운영자 모드가 아닐 때만) */}
                          {!isOperator && ((typeof editedCampaign.status === 'string' && editedCampaign.status === 'waiting_approval') ||
                             (typeof editedCampaign.status !== 'string' && editedCampaign.status.status === 'waiting_approval')) && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => {
                                  setEditedCampaign(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      status: {
                                        label: getStatusLabel('pending'),
                                        color: getStatusColor('pending'),
                                        status: 'pending'
                                      }
                                    };
                                  });
                                }}
                                disabled={loading}
                              >
                                <KeenIcon icon="check" className="me-1 size-3" />
                                <span className="hidden sm:inline">준비상태로 </span>승인
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => {
                                  setEditedCampaign(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      status: {
                                        label: getStatusLabel('rejected'),
                                        color: getStatusColor('rejected'),
                                        status: 'rejected'
                                      }
                                    };
                                  });
                                }}
                                disabled={loading}
                              >
                                <KeenIcon icon="cross" className="me-1 size-3" />
                                반려하기
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 반려 상태일 때 반려 사유 입력 필드 표시 */}
                    {((typeof editedCampaign.status === 'string' && editedCampaign.status === 'rejected') ||
                       (typeof editedCampaign.status !== 'string' && editedCampaign.status.status === 'rejected')) && (
                      <>
                        <tr>
                          <th className="px-3 py-2 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                            반려 사유
                          </th>
                          <td className="px-3 py-2">
                            {/* 운영자 모드일 때는 반려 사유를 편집할 수 있고, 그렇지 않을 때는 텍스트로만 표시 */}
                            {isOperator ? (
                              <textarea
                                value={editedCampaign.rejectionReason || ''}
                                onChange={(e) => handleChange('rejectionReason', e.target.value)}
                                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-md min-h-[80px]"
                                rows={3}
                                placeholder="캠페인이 반려된 사유를 입력하세요. 반려 사유는 해당 캠페인 담당자에게 전달됩니다."
                                disabled={loading && typeof editedCampaign.status !== 'string' && editedCampaign.status.status !== 'rejected'}
                              />
                            ) : (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                                <div className="flex gap-2 items-start">
                                  <KeenIcon icon="warning-triangle" className="text-red-500 size-5 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-red-700 dark:text-red-400 mb-1">반려 사유</p>
                                    <p className="text-red-600 dark:text-red-300 whitespace-pre-line">
                                      {editedCampaign.rejectionReason || '반려 사유가 없습니다.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end items-center gap-3 mt-3 sticky bottom-0 pt-2 pb-1 bg-background border-t border-border">
                {/* 미리보기 버튼 */}
                <Button
                  onClick={() => setCampaignPreviewModalOpen(true)}
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={loading}
                >
                  <KeenIcon icon="eye" className="me-1.5" />
                  미리보기
                </Button>

                {/* 운영자 모드일 때 상태 변경 버튼들 */}
                {isOperator && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        const statusValue = 'pending';  // 승인 시 준비중 상태로 변경
                        setEditedCampaign(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            status: {
                              label: getStatusLabel(statusValue),
                              color: getStatusColor(statusValue),
                              status: statusValue
                            }
                          };
                        });
                        setTimeout(() => handleSave(), 100);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={loading}
                    >
                      <span className="hidden sm:inline">준비상태로 </span>승인
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => {
                        const statusValue = 'pending';
                        setEditedCampaign(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            status: {
                              label: getStatusLabel(statusValue),
                              color: getStatusColor(statusValue),
                              status: statusValue
                            }
                          };
                        });
                        setTimeout(() => handleSave(), 100);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={loading}
                    >
                      준비중
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => {
                        const statusValue = 'pause';
                        setEditedCampaign(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            status: {
                              label: getStatusLabel(statusValue),
                              color: getStatusColor(statusValue),
                              status: statusValue
                            }
                          };
                        });
                        setTimeout(() => handleSave(), 100);
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      disabled={loading}
                    >
                      <span className="hidden sm:inline">표시</span>안함
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => {
                        // 운영자 모드에서는 반려 사유 입력 모달 열기
                        if (isOperator) {
                          setRejectionReason(''); // 반려 사유 초기화
                          setRejectionModalOpen(true); // 모달 열기
                        } else {
                          // 일반 모드에서는 기존 동작 유지
                          const statusValue = 'rejected';
                          setEditedCampaign(prev => {
                            if (!prev) return null;

                            // 반려 상태로 변경하고 반려 사유 스크롤을 위해 약간의 딜레이를 줌
                            setTimeout(() => {
                              // 반려 사유 필드로 스크롤
                              const reasonField = document.querySelector('textarea[placeholder*="반려 사유"]');
                              if (reasonField) {
                                reasonField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                (reasonField as HTMLTextAreaElement).focus();
                              }
                            }, 100);

                            return {
                              ...prev,
                              status: {
                                label: getStatusLabel(statusValue),
                                color: getStatusColor(statusValue),
                                status: statusValue
                              }
                            };
                          });
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={loading}
                    >
                      반려
                    </Button>
                  </div>
                )}

                {/* 저장 버튼 (운영자 모드가 아닐 때만) */}
                {!isOperator && (
                  <Button
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                        저장 중...
                      </span>
                    ) : '저장'}
                  </Button>
                )}

                {/* 취소 버튼 */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 배너 이미지 미리보기 모달 */}
      {bannerPreviewModalOpen && (
        <Dialog open={bannerPreviewModalOpen} onOpenChange={setBannerPreviewModalOpen}>
          <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
            <DialogHeader className="bg-background py-3 px-4 border-b">
              <DialogTitle className="text-lg font-medium text-foreground">배너 이미지 미리보기</DialogTitle>
            </DialogHeader>
            
            <div className="p-4 bg-background flex flex-col">
              {bannerImagePreviewUrl ? (
                <div className="flex justify-center items-center">
                  <img 
                    src={bannerImagePreviewUrl} 
                    alt="배너 이미지 미리보기" 
                    className="max-w-full h-auto rounded-md"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-40 text-muted-foreground">
                  <p>이미지를 찾을 수 없습니다.</p>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setBannerPreviewModalOpen(false)}
                  variant="outline"
                >
                  닫기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* 반려 사유 입력 모달 */}
      {rejectionModalOpen && (
        <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="bg-background py-3 sm:py-4 px-4 sm:px-6 border-b">
              <DialogTitle className="text-base sm:text-lg font-medium text-foreground flex items-center">
                <KeenIcon icon="warning-circle" className="mr-2 text-red-500" />
                캠페인 반려 사유 입력
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 sm:p-6 bg-background">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-md flex items-center mb-4">
                  <KeenIcon icon="warning-triangle" className="size-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  이 캠페인을 반려하는 사유를 입력해주세요. 입력한 사유는 캠페인 담당자에게 전달됩니다.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md text-sm sm:text-md min-h-[120px]"
                  rows={5}
                  placeholder="반려 사유를 구체적으로 입력해주세요"
                  autoFocus
                />
                {rejectionReason.trim().length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    반려 사유는 필수 입력 항목입니다.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 sm:h-10 sm:px-4"
                  onClick={() => setRejectionModalOpen(false)}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-3 sm:h-10 sm:px-4 bg-red-500 hover:bg-red-600 text-white"
                  disabled={rejectionReason.trim().length === 0 || loading}
                  onClick={() => {
                    // 반려 사유가 비어있는지 확인
                    if (!rejectionReason.trim()) {
                      return; // 비어있으면 저장하지 않음
                    }

                    // 로딩 상태 설정
                    setLoading(true);

                    // 상태를 반려로 변경하고 반려 사유 설정
                    

                    setEditedCampaign(prev => {
                      if (!prev) return null;

                      // 반려 상태로 변경 및 사유 설정
                      const updatedCampaign = {
                        ...prev,
                        status: {
                          label: getStatusLabel('rejected'),
                          color: getStatusColor('rejected'),
                          status: 'rejected'
                        },
                        rejectionReason: rejectionReason // 입력받은 반려 사유 설정
                      };

                      console.log('반려 상태로 업데이트된 캠페인:', {
                        status: updatedCampaign.status,
                        rejectionReason: updatedCampaign.rejectionReason
                      });

                      return updatedCampaign;
                    });

                    // 모달 닫기
                    setRejectionModalOpen(false);

                    // 반려 특수 처리 - setEditedCampaign 상태 변경이 적용되기 전에 직접 DB에 업데이트
                    setTimeout(async () => {
                      try {
                        

                        // 캠페인 ID 가져오기
                        const campaignId = editedCampaign?.id;
                        if (!campaignId) {
                          throw new Error('캠페인 ID를 찾을 수 없습니다.');
                        }

                        // 반려 상태와 반려 사유를 직접 DB에 업데이트
                        const success = await updateCampaign(parseInt(campaignId), {
                          status: 'rejected',  // 직접 rejected 상태 지정
                          rejectionReason: rejectionReason
                        });

                        if (!success) {
                          throw new Error('반려 처리 중 오류가 발생했습니다.');
                        }

                        

                        // 성공 시 부모 컴포넌트에 알림
                        if (onSave && editedCampaign) {
                          // 업데이트된 캠페인 데이터 생성
                          const updatedCampaign: ExtendedCampaign = {
                            ...editedCampaign,
                            status: {
                              label: getStatusLabel('rejected'),
                              color: getStatusColor('rejected'),
                              status: 'rejected'
                            },
                            rejectionReason: rejectionReason,
                            originalData: {
                              ...editedCampaign.originalData,
                              status: 'rejected',
                              rejected_reason: rejectionReason
                            }
                          };

                          onSave(updatedCampaign);
                        }

                        // 모달 창 닫기
                        onClose();
                      } catch (err) {
                        
                        setError('반려 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
                        setLoading(false);
                        setRejectionModalOpen(true); // 모달 다시 열기
                      }
                    }, 100);
                  }}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></span>
                      처리중...
                    </span>
                  ) : '반려하기'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 캠페인 전체 미리보기 모달 */}
      {campaignPreviewModalOpen && (
        <Dialog open={campaignPreviewModalOpen} onOpenChange={setCampaignPreviewModalOpen}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden overflow-y-auto max-h-[90vh] border-4 border-primary">
            <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-3 px-4 border-b sticky top-0 z-10 shadow-sm">
              <DialogTitle className="text-lg font-semibold text-foreground flex items-center">
                <KeenIcon icon="eye" className="mr-2 text-primary" />
                캠페인 미리보기
              </DialogTitle>
            </DialogHeader>
            
            <div className="bg-background">
              {/* 배너 이미지 (있을 경우) */}
              {bannerImagePreviewUrl && (
                <div className="w-full">
                  <img 
                    src={bannerImagePreviewUrl} 
                    alt="캠페인 배너" 
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '250px' }}
                  />
                </div>
              )}
              
              <div className="p-6">
                {/* 캠페인 헤더 정보 */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={previewUrl || (
                      typeof editedCampaign.originalData?.add_info === 'object' && editedCampaign.originalData.add_info?.logo_url
                        ? editedCampaign.originalData.add_info.logo_url
                        : toAbsoluteUrl(`/media/${editedCampaign.logo}`)
                    )}
                    className="rounded-full size-16 shrink-0 object-cover"
                    alt="캠페인 로고"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {editedCampaign.campaignName}
                    </h2>
                    <div className="mt-1 flex gap-2">
                      <span className={`badge badge-${editedCampaign.status.color} badge-outline rounded-[30px]`}>
                        <span className={`size-1.5 rounded-full bg-${editedCampaign.status.color} me-1.5`}></span>
                        {editedCampaign.status.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        마감시간: {editedCampaign.deadline}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 캠페인 주요 정보 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">건당 단가</h3>
                    <p className="text-xl font-semibold text-primary">{editedCampaign.unitPrice}원</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">최소 수량</h3>
                    <p className="text-xl font-semibold text-primary">10개</p>
                  </div>
                </div>
                
                {/* 캠페인 설명 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">캠페인 설명</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-foreground whitespace-pre-line">
                      {editedCampaign.description}
                    </p>
                  </div>
                </div>
                
                {/* 캠페인 상세 설명 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">캠페인 상세 설명</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-foreground whitespace-pre-line">
                      {editedCampaign.detailedDescription}
                    </p>
                  </div>
                </div>
                
                {/* 미리보기 알림 */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md text-blue-600 dark:text-blue-300 mb-6">
                  <div className="flex items-start">
                    <KeenIcon icon="information-circle" className="size-5 mr-2 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">미리보기 모드</p>
                      <p className="text-sm mt-1">이 화면은 캠페인이 수정된 후 어떻게 보일지를 미리 보여주는 화면입니다. 실제 데이터는 저장 전까지 반영되지 않습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end p-4 border-t bg-gray-100 dark:bg-gray-800 sticky bottom-0 shadow-lg">
                <Button 
                  onClick={() => setCampaignPreviewModalOpen(false)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <KeenIcon icon="cross" className="me-1 size-4" />
                  닫기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export { CampaignDetailModal };