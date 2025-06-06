import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { ICampaign, ExtendedCampaign, getStatusLabel, getStatusColor, CampaignServiceType } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createCampaign as defaultCreateCampaign } from '@/pages/admin/campaigns/services/campaignService';
import { createCampaignReapprovalRequestNotification } from '@/utils/notificationActions';

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (newCampaign: ExtendedCampaign) => void;
  createCampaign?: (data: any) => Promise<{ success: boolean, error?: string }>;
  serviceType?: string | CampaignServiceType;
  campaign?: ICampaign | null; // 추가: 편집 모드일 때 캠페인 데이터
  isDetailMode?: boolean; // 추가: 상세 설정 모드 여부
  isOperator?: boolean; // 추가: 운영자 모드 여부
  updateCampaign?: (id: number, data: any) => Promise<boolean>; // 추가: 업데이트 함수
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  open,
  onClose,
  onSave,
  createCampaign,
  serviceType = CampaignServiceType.NAVER_SHOPPING_RANK,
  campaign = null, // 편집 모드일 때 캠페인 데이터
  isDetailMode = false, // 상세 설정 모드 
  isOperator = false, // 운영자 모드 여부
  updateCampaign
}) => {
  // 기본값으로 채워진 새 캠페인 객체
  const [newCampaign, setNewCampaign] = useState<ExtendedCampaign>({
    id: '',
    campaignName: '',
    description: '',
    detailedDescription: '',
    userInputFields: [], // 사용자 슬롯 구매 시 입력 필드 정보 (배열)
    logo: '',
    unitPrice: '100',
    deadline: '18:00',
    status: 'waiting_approval',  // 기본 상태는 '승인 대기중'
    bannerImage: '',
    efficiency: '0',
    minQuantity: '10'
  });


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalFields, setAdditionalFields] = useState<{ [key: string]: string }>({});
  
  // 에러 메시지 자동 제거
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // 5초 후 에러 메시지 제거
      
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  // 승인 확인 모달 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState<boolean>(false);
  
  // 변경사항 저장 확인 모달 상태
  const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState<boolean>(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  // 시간 포맷팅 함수 
  function formatTimeHHMM(timeStr: string): string {
    // 입력이 없거나 이미 HH:MM 형식인 경우 그대로 반환
    if (!timeStr) return '';
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr;

    try {
      // 문자열이 날짜 포맷인 경우 변환
      if (timeStr.includes('T') || timeStr.includes('-')) {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
      }

      // 단순 시간 문자열인 경우
      // "1800" -> "18:00", "930" -> "09:30" 등으로 변환
      if (/^\d{1,4}$/.test(timeStr)) {
        const paddedTime = timeStr.padStart(4, '0');
        return `${paddedTime.slice(0, 2)}:${paddedTime.slice(2, 4)}`;
      }

      // 기타 형식은 그대로 반환
      return timeStr;
    } catch (e) {
      return timeStr;
    }
  }

  // 캠페인 데이터가 있는 경우(편집 모드) 해당 데이터로 상태 초기화
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

      // 사용자 입력 필드 설정
      let userInputFieldsValue = [];

      // 기존 데이터는 add_info.add_field에 저장되어 있음
      if (campaign.originalData?.add_info?.add_field && Array.isArray(campaign.originalData.add_info.add_field)) {
        userInputFieldsValue = campaign.originalData.add_info.add_field.map((field: any) => ({
          fieldName: field.fieldName || field.name || '',
          description: field.description || field.desc || ''
        }));
      }
      // 이전 버전과의 호환성을 위한 처리 (userInputFields가 문자열 형태로 저장된 경우)
      else if (addInfo.userInputFields) {
        try {
          if (typeof addInfo.userInputFields === 'string') {
            const parsed = JSON.parse(addInfo.userInputFields);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
              // 이전 형식: {"fieldName": "description", ...} 객체 형태
              userInputFieldsValue = Object.entries(parsed).map(([fieldName, description]) => ({
                fieldName,
                description: description as string
              }));
            } else if (Array.isArray(parsed)) {
              // 이미 배열 형태로 저장된 경우
              userInputFieldsValue = parsed;
            }
          } else if (Array.isArray(addInfo.userInputFields)) {
            // 이미 배열 형태로 저장된 경우
            userInputFieldsValue = addInfo.userInputFields;
          }
        } catch (e) {
          // 파싱 실패 시 빈 배열 사용
          userInputFieldsValue = [];
        }
      }

      // 로고 이미지 설정 (add_info에서 로고 URL을 확인)
      if (addInfo.logo_url) {
        setPreviewUrl(addInfo.logo_url);
        setInitialLogoUrl(addInfo.logo_url);  // 초기 URL 저장
        setUploadedLogo('기존 로고 이미지');
      } else {
        setPreviewUrl(null);
        setInitialLogoUrl(null);
        setUploadedLogo(null);
      }

      // 배너 이미지 설정 (add_info에서 배너 URL을 확인)
      if (addInfo.banner_url) {
        setBannerImagePreviewUrl(addInfo.banner_url);
        setInitialBannerUrl(addInfo.banner_url);  // 초기 URL 저장
        setUploadedBannerImage('기존 배너 이미지');
      } else {
        setBannerImagePreviewUrl(null);
        setInitialBannerUrl(null);
        setUploadedBannerImage(null);
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

      // 캠페인 데이터로 newCampaign 상태 업데이트
      setNewCampaign({
        id: campaign.id,
        campaignName: campaign.campaignName || campaign.originalData?.campaign_name || '',
        description: campaign.description || campaign.originalData?.description || '',
        detailedDescription: detailedDescValue,
        logo: campaign.logo || '',
        additionalLogic: additionalLogicValue,
        userInputFields: userInputFieldsValue, // 사용자 입력 필드 값 설정
        unitPrice: unitPrice,
        minQuantity: minQuantity,
        efficiency: efficiency,
        deadline: formatTimeHHMM(campaign.originalData?.deadline || campaign.deadline || '18:00'), // 원본 데이터의 deadline 사용
        bannerImage: addInfo.banner_url ? 'banner-image.png' : '',
        rejectionReason: rejectionReasonValue, // 반려 사유 설정
        status: {
          label: getStatusLabel(finalStatus),
          color: getStatusColor(finalStatus),
          status: finalStatus
        },
        originalData: campaign.originalData // originalData 보존
      });

    } else {
      // 새 캠페인 모드일 때 초기화
      setInitialLogoUrl(null);
      setInitialBannerUrl(null);
      setPreviewUrl(null);
      setBannerImagePreviewUrl(null);
      setUploadedLogo(null);
      setUploadedBannerImage(null);
    }
  }, [campaign]);

  const handleChange = (field: keyof ExtendedCampaign, value: string) => {
    setNewCampaign(prev => ({ ...prev, [field]: value }));
  };

  // 숫자만 입력받는 핸들러
  const handleNumberChange = (field: keyof ExtendedCampaign, value: string) => {
    // 숫자와 소수점만 허용
    const numericValue = value.replace(/[^0-9.]/g, '');

    // 소수점이 두 개 이상 있는 경우 첫 번째 소수점만 유지
    const parts = numericValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');

    // unitPrice만 처리 (다른 숫자 필드들은 제거됨)
    if (field === 'unitPrice') {
      setNewCampaign(prev => ({ ...prev, [field]: formattedValue }));
    }
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
      // 항상 새 이미지로 업데이트
      setPreviewUrl(result);
      setUploadedLogo(file.name);

      // 명시적으로 기본 선택을 지우고 업로드 이미지를 사용하도록 설정
      setNewCampaign(prev => ({
        ...prev,
        logo: '' // 기본 선택을 초기화
      }));
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

  // 서비스 유형에 따른 이름 및 필드 정보
  interface ServiceTypeInfo {
    name: string;
  }

  // 서비스 유형별 정보 정의 
  // 새로운 타입과 레거시 타입을 분리해 TypeScript 중복 오류 방지
  const serviceTypeInfoMap: { [key: string]: ServiceTypeInfo } = {
    [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: { name: 'NS 트래픽' },
    [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: { name: 'NS 가구매' },
    [CampaignServiceType.NAVER_SHOPPING_RANK]: { name: 'NS 순위확인' },
    [CampaignServiceType.NAVER_PLACE_TRAFFIC]: { name: 'NP 트래픽' },
    [CampaignServiceType.NAVER_PLACE_SAVE]: { name: 'NP 저장하기' },
    [CampaignServiceType.NAVER_PLACE_SHARE]: { name: 'NP 블로그공유' },
    [CampaignServiceType.NAVER_PLACE_RANK]: { name: 'NP 순위확인' },
    [CampaignServiceType.NAVER_AUTO]: { name: 'N 자동완성' },
    [CampaignServiceType.COUPANG_TRAFFIC]: { name: 'CP 트래픽' },
    [CampaignServiceType.COUPANG_FAKESALE]: { name: 'CP 가구매' }
  };

  // 레거시 문자열 서비스 타입 정보는 getServiceFieldInfo 함수로 이동
  const getServiceFieldInfo = (serviceType: string | CampaignServiceType): ServiceTypeInfo => {
    // CampaignServiceType 타입이면 직접 사용
    if (Object.values(CampaignServiceType).includes(serviceType as CampaignServiceType)) {
      return serviceTypeInfoMap[serviceType as CampaignServiceType];
    }

    // 문자열 타입이 serviceTypeInfoMap에 있는 경우 사용
    if (typeof serviceType === 'string' && serviceTypeInfoMap[serviceType as any]) {
      return serviceTypeInfoMap[serviceType as any];
    }

    // 레거시 문자열 지원 (필요한 경우만 남김)
    if (typeof serviceType === 'string') {
      // 레거시 문자열을 표준화된 타입으로 변환
      if (serviceType === 'NaverShopTraffic') {
        return serviceTypeInfoMap[CampaignServiceType.NAVER_SHOPPING_TRAFFIC];
      }
    }

    // 해당하는 서비스 타입이 없으면 기본 타입 반환
    return serviceTypeInfoMap[CampaignServiceType.NAVER_SHOPPING_RANK];
  };

  // 서비스 유형에 따른 이름 반환
  const getServiceTypeName = (type: string): string => {
    return getServiceFieldInfo(type)?.name || '네이버 트래픽';
  };



  // 초기 로고/배너 URL 저장 (변경 감지용)
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);
  const [initialBannerUrl, setInitialBannerUrl] = useState<string | null>(null);

  // 변경사항 감지 함수를 컴포넌트 레벨로 이동
  const hasDataChanged = () => {
    if (!campaign || !campaign.originalData) return false;
    
    const orig = campaign.originalData || {};
    
    // 주요 필드 변경 확인
    if (newCampaign.campaignName !== orig.campaign_name) return true;
    if (newCampaign.description !== orig.description) return true;
    if (newCampaign.detailedDescription !== orig.detailed_description) return true;
    if (parseFloat(newCampaign.unitPrice || '0') !== orig.unit_price) return true;
    if (formatTimeHHMM(newCampaign.deadline) !== formatTimeHHMM(orig.deadline)) return true;
    
    // 로고 변경 확인 (초기 URL과 현재 URL이 다른 경우)
    if (previewUrl !== initialLogoUrl) return true;
    
    // 배너 이미지 변경 확인 (초기 URL과 현재 URL이 다른 경우)
    if (bannerImagePreviewUrl !== initialBannerUrl) return true;
    
    // 사용자 입력 필드 변경 확인
    const origAddField = orig.add_info?.add_field || [];
    if (JSON.stringify(newCampaign.userInputFields) !== JSON.stringify(origAddField)) return true;
    
    return false;
  };

  // 실제 저장 처리 함수
  const performSave = async (skipConfirm = false) => {
    if (!campaign || !updateCampaign) return;
    
    setLoading(true);
    setError(null);

    try {
      let statusValue;
      if (typeof newCampaign.status === 'string') {
        statusValue = newCampaign.status;
      } else if (typeof newCampaign.status === 'object' && newCampaign.status !== null) {
        statusValue = newCampaign.status.status || 'pending';
      } else {
        statusValue = newCampaign.originalData?.status || 'pending';
      }

      // 반려 상태에서 반려 사유가 비어있는지 확인
      if (statusValue === 'rejected' && (!newCampaign.rejectionReason || newCampaign.rejectionReason.trim() === '')) {
        setError('반려 사유를 입력해 주세요.');
        setLoading(false);
        return;
      }

      // 원본 캠페인 상태 확인
      const originalStatus = campaign.originalData?.status || 'pending';
      const dataChanged = hasDataChanged();

      // 운영자 모드가 아닌 경우(총판) 상태 처리 로직
      let finalStatus = statusValue;
      let willChangeToWaitingApproval = false;
      
      if (!isOperator) {
        if (originalStatus === 'waiting_approval') {
          finalStatus = 'waiting_approval';
        } else if (originalStatus === 'rejected') {
          if (dataChanged) {
            finalStatus = 'waiting_approval';
            willChangeToWaitingApproval = true;
          } else {
            finalStatus = 'rejected';
          }
        } else if (['pending', 'active', 'pause'].includes(originalStatus)) {
          if (dataChanged) {
            finalStatus = 'waiting_approval';
            willChangeToWaitingApproval = true;
          } else {
            finalStatus = statusValue;
          }
        } else {
          finalStatus = originalStatus;
        }
      }
      
      // 확인 모달을 표시해야 하는 경우 (skipConfirm이 false일 때만)
      if (!skipConfirm && willChangeToWaitingApproval && !isOperator) {
        setSaveConfirmModalOpen(true);
        setLoading(false);
        return;
      }

      // 로고가 없는 경우 랜덤 동물 지정
      let logoValue = previewUrl ? 'uploaded-logo.png' : newCampaign.logo;
      if (!previewUrl && (!newCampaign.logo || newCampaign.logo === '')) {
        const animalLogos = [
          'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
          'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
          'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
          'sheep', 'teddy-bear', 'turtle'
        ];
        const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
        logoValue = `animal/svg/${randomAnimal}.svg`;
      }

      // 업데이트할 데이터 준비
      let updateData = {
        campaignName: newCampaign.campaignName,
        description: newCampaign.description,
        detailedDescription: newCampaign.detailedDescription,
        add_field: newCampaign.userInputFields,
        unitPrice: newCampaign.unitPrice,
        deadline: newCampaign.deadline,
        logo: logoValue,
        uploadedLogo: previewUrl,
        bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
        uploadedBannerImage: bannerImagePreviewUrl,
        status: finalStatus,
      };

      // 반려 사유가 있으면 항상 전달
      if ('rejectionReason' in newCampaign && newCampaign.rejectionReason) {
        const campaign = newCampaign as any;
        if (campaign.rejectionReason) {
          const updatedData: any = {
            ...updateData
          };
          updatedData.rejectionReason = campaign.rejectionReason;
          updatedData.rejected_reason = campaign.rejectionReason;
          updateData = updatedData;
        }
      }

      // DB 업데이트
      const campaignId = typeof newCampaign.id === 'string' ? parseInt(newCampaign.id) : newCampaign.id;
      const success = await updateCampaign(campaignId, updateData);

      if (!success) {
        throw new Error('캠페인 업데이트에 실패했습니다.');
      }

      // 재승인 상태로 변경된 경우 운영자에게 알림 전송
      if (willChangeToWaitingApproval && !isOperator) {
        try {
          // mat_id가 있으면 사용, 없으면 빈 문자열 (운영자 알림이므로 상관없음)
          const matId = newCampaign.originalData?.mat_id || '';
          await createCampaignReapprovalRequestNotification(
            campaignId.toString(),
            newCampaign.campaignName,
            matId
          );
        } catch (notificationError) {
          console.error('운영자 알림 전송 중 오류:', notificationError);
          // 알림 전송 실패는 무시하고 계속 진행
        }
      }

      // UI 업데이트를 위해 형식 변환
      let addInfo = newCampaign.originalData?.add_info || {};
      if (typeof addInfo === 'string') {
        try {
          addInfo = JSON.parse(addInfo);
        } catch (e) {
          addInfo = {};
        }
      }

      const statusObject = {
        label: getStatusLabel(finalStatus),
        color: getStatusColor(finalStatus),
        status: finalStatus
      };

      const updatedCampaign: ExtendedCampaign = {
        ...newCampaign,
        logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
        status: statusObject,
        originalData: {
          ...newCampaign.originalData,
          unit_price: parseFloat(newCampaign.unitPrice || '0'),
          deadline: formatTimeHHMM(newCampaign.deadline || ''),
          description: newCampaign.description,
          detailed_description: newCampaign.detailedDescription,
          userInputFields: newCampaign.userInputFields,
          status: finalStatus,
          logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
          uploaded_logo_data: previewUrl,
          banner_image: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
          uploaded_banner_image_data: bannerImagePreviewUrl,
          add_info: {
            ...addInfo,
            add_field: newCampaign.userInputFields,
          },
          ...(finalStatus === 'rejected' ? { rejected_reason: newCampaign.rejectionReason } : {})
        }
      };

      if (onSave) {
        onSave(updatedCampaign);
      }

      onClose();
    } catch (err) {
      setError('캠페인 정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 편집 모드(기존 캠페인이 있는 경우)와 새 캠페인 생성 모드를 구분
    if (campaign && updateCampaign) {
      await performSave(false);
    } else {
      // 신규 캠페인 생성 모드
      // 제공된 createCampaign 함수가 없으면 기본 함수 사용
      const campaignCreator = createCampaign || defaultCreateCampaign;

      // 개발 모드에서 로그 표시
      if (!createCampaign) {
        //
      }

      // 필수 필드 검증
      if (!newCampaign.campaignName.trim()) {
        setError('캠페인 이름은 필수입니다.');
        return;
      }

      // 로고 필수 검증 - 업로드된 로고가 없고 기본 로고도 선택하지 않은 경우
      if (!previewUrl && (!newCampaign.logo || newCampaign.logo === '')) {
        setError('로고를 업로드하거나 기본 제공 로고 중 하나를 선택해주세요.');
        return;
      }

      // 서비스 유형별 필수 필드 검증
      // 현재 additionalFields가 사용되지 않으므로 주석 처리
      // if (serviceType && serviceTypeInfoMap[serviceType]) {
      //   const fieldInfo = serviceTypeInfoMap[serviceType].additionalFields;

      //   for (const [fieldKey, info] of Object.entries(fieldInfo)) {
      //     if (info.required && (!additionalFields[fieldKey] || additionalFields[fieldKey].trim() === '')) {
      //       setError(`${info.label}은(는) 필수 입력 항목입니다.`);
      //       return;
      //     }
      //   }
      // }

      setLoading(true);
      setError(null);

      try {
        // 로고가 없는 경우 랜덤 동물 지정
        let logoValue = previewUrl ? 'uploaded-logo.png' : newCampaign.logo;
        if (!previewUrl && (!newCampaign.logo || newCampaign.logo === '')) {
          const animalLogos = [
            'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
            'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
            'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
            'sheep', 'teddy-bear', 'turtle'
          ];
          const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
          logoValue = `animal/svg/${randomAnimal}.svg`;
        }

        // 디버깅: 서버로 전송되는 데이터 확인
        const dataToSend = {
          campaignName: newCampaign.campaignName,
          description: newCampaign.description,
          detailedDescription: newCampaign.detailedDescription,
          logo: logoValue,
          uploadedLogo: previewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
          bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : null, // 실제 구현에서는 업로드된 파일 경로로 변경
          uploadedBannerImage: bannerImagePreviewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
          unitPrice: newCampaign.unitPrice,
          deadline: newCampaign.deadline,
          status: 'waiting_approval', // 캠페인 신청 시 항상 '승인 대기중' 상태로 제출
          serviceType: serviceType,
          // 사용자 입력 필드 정보를 add_field로 전달
          add_field: newCampaign.userInputFields,
          // 기본값 설정
          efficiency: '0',
          minQuantity: '10',
          additionalLogic: '0'
        };

        // 1. DB에 새 캠페인 생성
        const result = await campaignCreator(dataToSend);

        if (!result.success) {
          throw new Error(result.error || '캠페인 생성에 실패했습니다.');
        }

        // 상태 객체 생성
        const statusObject = {
          label: getStatusLabel('waiting_approval'),
          color: getStatusColor('waiting_approval'),
          status: 'waiting_approval'
        };

        // 성공 시 부모 컴포넌트에 알림
        if (onSave) {
          // 업데이트된 캠페인 데이터 생성
          const savedCampaign: ExtendedCampaign = {
            ...newCampaign,
            id: String(Date.now()), // 임시 ID (실제로는 서버에서 생성된 ID를 받아야 함)
            status: statusObject,
            // 서비스 타입 정보 추가
            serviceType,
          };

          onSave(savedCampaign);
        }

        // 모달 닫기
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '캠페인 생성에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[900px] p-0 overflow-hidden" aria-describedby={undefined}>
          <DialogHeader className="bg-background py-4 px-5 border-b sticky top-0 z-10 shadow-sm">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {campaign ? (isOperator ? "캠페인 수정 (운영자 모드)" : "캠페인 수정") : "캠페인 추가"}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="py-5 px-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {/* 헤더 정보 - 표 스타일로 통일 */}
            <div className="overflow-hidden border border-border rounded-lg mb-6 shadow-sm bg-white dark:bg-gray-800/20">
              <div className="flex items-center p-6">
                <div className="relative flex-shrink-0 mr-4">
                  {previewUrl || newCampaign.logo ? (
                    <img
                      src={previewUrl || toAbsoluteUrl(`/media/${newCampaign.logo}`)}
                      className="rounded-full size-16 object-cover border border-gray-200 shadow-sm"
                      alt="캠페인 로고"
                    />
                  ) : (
                    <div className="rounded-full size-16 bg-gray-100 flex items-center justify-center text-gray-400 font-medium border border-gray-200 shadow-sm">
                      로고
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleFileSelectClick}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                      disabled={loading}
                    >
                      <KeenIcon icon="picture" className="me-1.5 size-4" />
                      로고 이미지 업로드
                    </Button>

                    <span className="text-sm font-medium text-gray-500 mx-2">또는</span>

                    <div className="w-64">
                      <select
                        value={previewUrl ? '' : (newCampaign.logo || '')}
                        onChange={(e) => {
                          // 업로드된 이미지를 모두 제거하고 드롭다운 선택으로 전환
                          setPreviewUrl(null);
                          setUploadedLogo(null);

                          // 빈 값을 선택한 경우 로고를 빈 문자열로 설정
                          if (e.target.value === '') {
                            handleChange('logo', '');
                            return;
                          }

                          if (e.target.value) {
                            // 선택된 동물 로고 값
                            const selectedAnimal = e.target.value;

                            // 동물명 추출 및 한글로 변환
                            const animalNameMap: { [key: string]: string } = {
                              'bear': '곰',
                              'cat': '고양이',
                              'cow': '소',
                              'crocodile': '악어',
                              'dolphin': '돌고래',
                              'elephant': '코끼리',
                              'flamingo': '플라밍고',
                              'giraffe': '기린',
                              'horse': '말',
                              'kangaroo': '캥거루',
                              'koala': '코알라',
                              'leopard': '표범',
                              'lion': '사자',
                              'llama': '라마',
                              'owl': '올빼미',
                              'pelican': '펠리컨',
                              'penguin': '펭귄',
                              'sheep': '양',
                              'teddy-bear': '테디베어',
                              'turtle': '거북이'
                            };

                            // 동물명 추출 (마지막 / 이후, .svg 이전 텍스트)
                            const animalNameWithPath = selectedAnimal.split('/').pop() || '';
                            const englishAnimalName = animalNameWithPath.replace('.svg', '');

                            // 영어 동물명을 한글로 변환
                            const koreanAnimalName = animalNameMap[englishAnimalName] || englishAnimalName;

                            // 5자리 랜덤 숫자 생성 (10000~99999)
                            const randomNum = Math.floor(10000 + Math.random() * 90000);

                            // "[한글 동물명]-[랜덤숫자]" 형식으로 자동 설정 (기존 이름 덮어쓰기)
                            handleChange('campaignName', `${koreanAnimalName}-${randomNum}`);

                            // logo 필드를 선택된 값으로 설정
                            handleChange('logo', e.target.value);
                          }
                        }}
                        className="select w-full h-10 px-3 py-2 border border-gray-200 bg-white focus:border-blue-500 rounded-md text-foreground"
                        disabled={loading}
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
                  </div>
                  <input
                    type="text"
                    value={newCampaign.campaignName}
                    onChange={(e) => handleChange('campaignName', e.target.value)}
                    className="text-xl font-semibold text-foreground px-3 py-2 border border-gray-200 bg-white rounded-md w-full"
                    placeholder="캠페인 이름 입력"
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground mt-1">로고 이미지를 업로드 하거나 기본 제공 로고 중 선택하세요. <span className="text-blue-500">(로고 선택 시 자동으로 "[동물명]-[랜덤숫자]" 형식의 이름이 생성됩니다)</span></p>
                </div>
              </div>
            </div>

            {/* 캠페인 정보 테이블 */}
            <div className="overflow-hidden border border-border rounded-lg mb-6 shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <tbody className="divide-y divide-border">
                  <tr>
                    <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      건당 단가
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={newCampaign.unitPrice}
                          onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                          className="w-24 h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                          disabled={loading}
                        />
                        <span className="ml-2 text-md font-medium text-foreground">원</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      접수마감시간
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <input
                        type="time"
                        value={newCampaign.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)}
                        className="w-36 h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      배너 이미지
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-4">
                          <Button
                            type="button"
                            onClick={handleBannerImageSelectClick}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                            disabled={loading}
                          >
                            <KeenIcon icon="picture" className="me-1.5 size-4" />
                            배너 이미지 업로드
                          </Button>
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
                            <Button
                              type="button"
                              onClick={() => setBannerPreviewModalOpen(true)}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              size="sm"
                            >
                              <KeenIcon icon="eye" className="me-1.5 size-4" />
                              크게 보기
                            </Button>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">캠페인 상세 페이지에 표시될 배너 이미지를 업로드하세요.</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      캠페인 소개
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <textarea
                        value={newCampaign.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full h-[60px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                        rows={2}
                        placeholder="간단한 캠페인 소개를 입력하세요"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      캠페인 상세설명
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <textarea
                        value={newCampaign.detailedDescription}
                        onChange={(e) => handleChange('detailedDescription', e.target.value)}
                        className="w-full h-[100px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                        rows={4}
                        placeholder="상세한 캠페인 설명을 입력하세요"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      사용자 입력 필드
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <div className="space-y-3">
                        {(newCampaign.userInputFields || []).map((field, index) => (
                          <div key={index} className="flex items-center gap-2 border border-gray-200 rounded-md p-2 bg-gray-50 hover:bg-gray-100">
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-shrink-0 w-1/3">
                                <input
                                  type="text"
                                  value={field.fieldName}
                                  onChange={(e) => {
                                    const updatedFields = [...(newCampaign.userInputFields || [])];
                                    updatedFields[index] = { ...updatedFields[index], fieldName: e.target.value };
                                    setNewCampaign(prev => ({ ...prev, userInputFields: updatedFields }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                                  placeholder="필드명 (한글/영문)"
                                  disabled={loading}
                                />
                              </div>
                              <div className="text-gray-400">→</div>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={field.description}
                                  onChange={(e) => {
                                    const updatedFields = [...(newCampaign.userInputFields || [])];
                                    updatedFields[index] = { ...updatedFields[index], description: e.target.value };
                                    setNewCampaign(prev => ({ ...prev, userInputFields: updatedFields }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                                  placeholder="필드 설명 (사용자에게 안내할 내용)"
                                  disabled={loading}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`required-${index}`}
                                  checked={field.isRequired || false}
                                  onChange={(e) => {
                                    const updatedFields = [...(newCampaign.userInputFields || [])];
                                    updatedFields[index] = { ...updatedFields[index], isRequired: e.target.checked };
                                    setNewCampaign(prev => ({ ...prev, userInputFields: updatedFields }));
                                  }}
                                  className="checkbox checkbox-sm"
                                  disabled={loading}
                                />
                                <label htmlFor={`required-${index}`} className="text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                                  필수
                                </label>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-500 hover:text-red-600"
                              onClick={() => {
                                const updatedFields = [...(newCampaign.userInputFields || [])];
                                updatedFields.splice(index, 1);
                                setNewCampaign(prev => ({ ...prev, userInputFields: updatedFields }));
                              }}
                              disabled={loading}
                            >
                              <KeenIcon icon="trash" className="size-4" />
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300"
                          onClick={() => {
                            const updatedFields = [...(newCampaign.userInputFields || [])];
                            updatedFields.push({ fieldName: '', description: '', isRequired: false });
                            setNewCampaign(prev => ({ ...prev, userInputFields: updatedFields }));
                          }}
                          disabled={loading}
                        >
                          <KeenIcon icon="plus" className="size-4 me-1.5" />
                          입력 필드 추가
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground mt-3">
                        <p>사용자가 슬롯 구매 시 입력해야 하는 필드를 정의하세요. 필드명은 한글이나 영문으로, 설명은 사용자에게 안내되는 내용입니다.</p>
                        <p className="mt-1">예시: 방문URL(필드명), '방문할 URL을 입력하세요'(설명)</p>
                      </div>
                    </td>
                  </tr>

                  {/* 반려 상태일 때 반려 사유 표시 */}
                  {newCampaign.status &&
                    (typeof newCampaign.status === 'string'
                      ? newCampaign.status === 'rejected'
                      : newCampaign.status.status === 'rejected') && (
                      <tr>
                        <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider w-1/4">
                          반려 사유
                        </th>
                        <td className="px-6 py-4 bg-red-50 dark:bg-red-900/20">
                          <div className="flex flex-col gap-2">
                            <div className="text-red-600 dark:text-red-400 whitespace-pre-line">
                              {newCampaign.rejectionReason || '(반려 사유가 입력되지 않았습니다)'}
                            </div>
                            {isOperator && (
                              <Button
                                variant="default"
                                size="sm"
                                className="self-start bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => {
                                  setRejectionReason(newCampaign.rejectionReason || '');
                                  setRejectionModalOpen(true);
                                }}
                              >
                                <KeenIcon icon="pencil" className="me-1.5 size-4" />
                                반려 사유 수정
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                </tbody>
              </table>
            </div>
          </DialogBody>

          {/* 버튼 - 푸터 영역 */}
          <DialogFooter className="py-4 px-5 border-t bg-gray-50 dark:bg-gray-800/50 sticky bottom-0 z-10 shadow-sm">
            {/* 운영자 모드일 때 표시되는 푸터 */}
            {isOperator && campaign ? (
              <div className="flex items-center justify-end w-full gap-3">
                {/* 에러 메시지 - 미리보기 버튼 바로 왼쪽에 위치 */}
                {error && (
                  <div className="flex items-center text-red-600 text-sm">
                    <KeenIcon icon="information-2" className="size-4 mr-1.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Button
                  onClick={() => setCampaignPreviewModalOpen(true)}
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={loading}
                >
                  <KeenIcon icon="eye" className="me-1.5 size-4" />
                  미리보기
                </Button>

                {/* 캠페인 내용 수정 저장 버튼 */}
                <Button
                  onClick={handleSave}
                  variant="default"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                      저장 중...
                    </span>
                  ) : (
                    <>
                      <KeenIcon icon="disk" className="me-1.5 size-4" />
                      내용 저장
                    </>
                  )}
                </Button>

                {/* 운영자 모드 상태 변경 버튼 (단순화) */}
                <Button
                  variant="default"
                  onClick={() => setApprovalModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={loading}
                >
                  <KeenIcon icon="check" className="me-1.5 size-4" />
                  승인
                </Button>

                <Button
                  variant="default"
                  onClick={() => {
                    // 운영자 모드에서는 반려 사유 입력 모달 열기
                    // 기존 반려 사유가 있으면 불러오기
                    setRejectionReason(newCampaign.rejectionReason || '');
                    setRejectionModalOpen(true); // 모달 열기
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={loading}
                >
                  <KeenIcon icon="cross-circle" className="me-1.5 size-4" />
                  반려
                </Button>

                {/* 취소 버튼 */}
                <Button
                  variant="default"
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                {/* 왼쪽: 변경사항 안내 메시지 */}
                <div className="flex-1">
                  {campaign && !isOperator && (() => {
                    const orig = campaign.originalData || {};
                    const hasChanges = hasDataChanged();
                    const currentStatus = orig.status || 'pending';
                    
                    // 상태별 메시지 표시
                    if (currentStatus === 'rejected' && hasChanges) {
                      return (
                        <div className="flex items-center text-blue-600 text-sm">
                          <KeenIcon icon="information-2" className="size-4 mr-1.5" />
                          <span>변경사항이 감지되었습니다. 저장 시 재승인 요청이 됩니다.</span>
                        </div>
                      );
                    } else if (['pending', 'active', 'pause'].includes(currentStatus) && hasChanges) {
                      return (
                        <div className="flex items-center text-orange-600 text-sm">
                          <KeenIcon icon="shield-cross" className="size-4 mr-1.5" />
                          <span>변경사항이 감지되었습니다. 저장 시 승인 대기 상태로 변경됩니다.</span>
                        </div>
                      );
                    } else if (currentStatus === 'waiting_approval') {
                      return (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <KeenIcon icon="timer" className="size-4 mr-1.5" />
                          <span>현재 승인 대기 중입니다.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* 에러 메시지 */}
                  {error && (
                    <div className="flex items-center text-red-600 text-sm mt-1">
                      <KeenIcon icon="information" className="size-4 mr-1.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                
                {/* 오른쪽: 버튼들 */}
                <div className="flex items-center gap-3">
                  {/* 미리보기 버튼 */}
                  <Button
                    onClick={() => setCampaignPreviewModalOpen(true)}
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                    disabled={loading}
                  >
                    <KeenIcon icon="eye" className="me-1.5 size-4" />
                    미리보기
                  </Button>

                  {/* 캠페인 등록/수정 버튼 */}
                  <Button
                    onClick={handleSave}
                    className="bg-success hover:bg-success/90 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                        {campaign ? '저장 중...' : '신청 중...'}
                      </span>
                    ) : campaign ? '저장' : '캠페인 등록 신청'}
                  </Button>

                  {/* 취소 버튼 */}
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배너 이미지 미리보기 모달 */}
      {bannerPreviewModalOpen && (
        <Dialog open={bannerPreviewModalOpen} onOpenChange={setBannerPreviewModalOpen}>
          <DialogContent className="w-[95vw] max-w-full sm:max-w-[850px] p-0 overflow-hidden" aria-describedby={undefined}>
            <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10 shadow-sm">
              <DialogTitle className="text-lg font-semibold text-foreground">배너 이미지 미리보기</DialogTitle>
            </DialogHeader>

            <DialogBody className="py-6 px-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
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
            </DialogBody>

            <DialogFooter className="py-4 px-6 border-t bg-gray-50 dark:bg-gray-800/50 sticky bottom-0 z-10 shadow-sm">
              <Button
                onClick={() => setBannerPreviewModalOpen(false)}
                variant="outline"
              >
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 캠페인 미리보기 다이얼로그 */}
      {campaignPreviewModalOpen && (
        <Dialog open={campaignPreviewModalOpen} onOpenChange={setCampaignPreviewModalOpen}>
          <DialogContent className="w-[95vw] max-w-full sm:max-w-[850px] p-0 overflow-hidden max-h-[90vh] flex flex-col border-4 border-primary" aria-describedby={undefined}>
            <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-4 px-6 border-b sticky top-0 z-20 shadow-sm">
              <DialogTitle className="text-lg font-semibold text-foreground flex items-center">
                <KeenIcon icon="eye" className="mr-2 text-primary size-5" />
                캠페인 상세정보(미리보기)
              </DialogTitle>
            </DialogHeader>

            <div className="bg-background flex flex-col max-h-[80vh] w-full">
              <div className="flex-shrink-0">
                {/* 배너 이미지 영역 - 이미지가 없으면 표시하지 않음 */}
                {bannerImagePreviewUrl && (
                  <div className="w-full relative">
                    <div className="absolute inset-0 overflow-hidden">
                      {/* 배경 이미지(블러용) */}
                      <img
                        src={bannerImagePreviewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: 'blur(8px) brightness(0.9)', transform: 'scale(1.1)' }}
                      />
                      {/* 배경 오버레이 */}
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    {/* 실제 이미지 (블러 없음) */}
                    <div className="relative z-10 flex justify-center items-center py-6">
                      <img
                        src={bannerImagePreviewUrl}
                        alt="캠페인 배너"
                        className="object-contain max-h-[160px] max-w-[90%] shadow-lg rounded-md"
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 배경으로 대체
                          e.currentTarget.style.display = 'none';
                          const parentDiv = e.currentTarget.parentElement;
                          if (parentDiv) {
                            parentDiv.innerHTML = `
                              <div class="size-20 rounded-full bg-white/30 flex items-center justify-center">
                                <img
                                  src="${toAbsoluteUrl('/media/app/mini-logo-primary.svg')}"
                                  alt="캠페인 로고"
                                  class="h-14 w-auto"
                                />
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 캠페인 헤더 정보 */}
                <div className="bg-background border-b px-5 py-3 sticky top-0 z-10 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    {/* 로고 이미지: 업로드된 이미지 우선, 선택된 동물 로고, 또는 랜덤 동물 로고 */}
                    <img
                      src={(() => {
                        // 업로드된 이미지가 있으면 그것을 사용
                        if (previewUrl) return previewUrl;

                        // 기본 제공 로고 중 선택된 것이 있으면 그것을 사용
                        if (newCampaign.logo && newCampaign.logo !== 'none') {
                          return toAbsoluteUrl(`/media/${newCampaign.logo}`);
                        }

                        // 아무것도 선택되지 않았으면 랜덤 동물 SVG 사용
                        const animalLogos = [
                          'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
                          'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
                          'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
                          'sheep', 'teddy-bear', 'turtle'
                        ];
                        const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
                        return toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
                      })()}
                      className="rounded-full size-12 shrink-0 border border-gray-100 shadow-sm"
                      alt="캠페인 로고"
                      onError={(e) => {
                        // 에러 발생 시 다른 랜덤 동물로 재시도
                        const animalLogos = [
                          'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
                          'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
                          'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
                          'sheep', 'teddy-bear', 'turtle'
                        ];
                        const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
                        (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
                      }}
                    />
                    <div>
                      <h2 className="text-lg font-semibold text-foreground flex items-center">
                        {newCampaign.campaignName || '(캠페인 이름을 입력해주세요)'}
                        <span className="badge badge-primary badge-outline rounded-[30px] h-auto py-0.5 text-xs ml-2">
                          <span className="size-1.5 rounded-full bg-primary me-1.5"></span>
                          승인 대기중
                        </span>
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* 스크롤 가능한 콘텐츠 영역 */}
              <div className="flex-grow overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* 상단: 주요 정보 요약 카드 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <KeenIcon icon="wallet" className="text-primary size-5" />
                        <div className="text-sm text-muted-foreground">건당 단가</div>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {newCampaign.unitPrice ? `${newCampaign.unitPrice}원` : '100원'}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <KeenIcon icon="rocket" className="text-green-500 size-5" />
                        <div className="text-sm text-muted-foreground">상승효율</div>
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        60%
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <KeenIcon icon="timer" className="text-blue-500 size-5" />
                        <div className="text-sm text-muted-foreground">접수마감시간</div>
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {newCampaign.deadline || '18:00'}
                      </div>
                    </div>
                  </div>

                  {/* 중간: 캠페인 설명 */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">캠페인 정보</h3>
                    <div className="bg-white border border-border p-5 rounded-xl text-md text-foreground">
                      <div className="mb-4">
                        <h4 className="font-medium text-primary mb-2">설명</h4>
                        <p className="text-sm whitespace-pre-line text-gray-700 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                          {newCampaign.description || '(캠페인 설명을 입력해주세요)'}
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-primary mb-2">상세 설명</h4>
                        <div className="max-h-[200px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                          <p className="whitespace-pre-line text-gray-700">
                            {newCampaign.detailedDescription && newCampaign.detailedDescription !== newCampaign.description ?
                              newCampaign.detailedDescription :
                              (newCampaign.description || '(캠페인 상세 설명을 입력해주세요)')}
                          </p>
                        </div>
                      </div>

                      {newCampaign.userInputFields && newCampaign.userInputFields.length > 0 && (
                        <div>
                          <h4 className="font-medium text-primary mb-2">사용자 입력 필드</h4>
                          <div className="max-h-[150px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                            <div className="space-y-2">
                              {newCampaign.userInputFields.map((field, index) => (
                                <div key={index} className="flex gap-2 items-center text-sm">
                                  <span className="font-medium text-blue-600">{field.fieldName || "(이름 없음)"}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-gray-700">{field.description || "(설명 없음)"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 가이드라인 */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">캠페인 가이드라인</h3>
                    <div className="bg-white p-5 rounded-xl text-md text-muted-foreground border border-border">
                      <ul className="list-disc list-inside space-y-1.5">
                        <li>해당 캠페인 건당 단가는 {newCampaign.unitPrice ? `${newCampaign.unitPrice}원` : '100원'}입니다.</li>
                        <li>캠페인 접수 시간은 {newCampaign.deadline || '18:00'}까지 입니다.</li>
                        <li>데이터는 24시간 내에 집계되며, 결과는 대시보드에서 확인할 수 있습니다.</li>
                      </ul>
                    </div>
                  </div>


                  {/* 미리보기 알림 */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md text-blue-600 dark:text-blue-300">
                    <div className="flex items-start">
                      <KeenIcon icon="information-2" className="size-5 mr-2 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">미리보기 모드</p>
                        <p className="text-sm mt-1">이 화면은 캠페인이 등록된 후 어떻게 보일지를 미리 보여주는 화면입니다. 실제 데이터는 저장 전까지 반영되지 않습니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 영역 */}
            <DialogFooter className="py-4 px-6 border-t bg-gray-50 dark:bg-gray-800/50 sticky bottom-0 z-10 shadow-sm">
              <Button
                onClick={() => setCampaignPreviewModalOpen(false)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* 반려 사유 입력 모달 */}
      {rejectionModalOpen && (
        <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh]" aria-describedby={undefined}>
            <DialogHeader className="bg-background py-4 px-6 border-b sticky top-0 z-10 shadow-sm">
              <DialogTitle className="text-base sm:text-lg font-medium text-foreground flex items-center">
                <KeenIcon icon="shield-cross" className="mr-2 text-red-500 size-5" />
                캠페인 반려 사유 입력
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="p-6 bg-background overflow-y-auto">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 rounded-md flex items-center mb-4">
                  <KeenIcon icon="shield-cross" className="size-4 mr-2 flex-shrink-0" />
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
                  className="w-full px-3 py-2 border border-gray-200 bg-white focus:border-blue-500 text-foreground rounded-md text-sm sm:text-md min-h-[120px]"
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
            </DialogBody>

            <DialogFooter className="p-6 pt-0 flex justify-end sticky bottom-0 z-10 shadow-sm bg-background border-t">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-9 px-3 sm:h-10 sm:px-4 bg-red-500 hover:bg-red-600 text-white"
                  disabled={rejectionReason.trim().length === 0 || loading}
                  onClick={async () => {
                    // 반려 사유가 비어있는지 확인
                    if (!rejectionReason.trim()) {
                      return; // 비어있으면 저장하지 않음
                    }

                    // 로딩 상태 설정
                    setLoading(true);

                    try {
                      // 모달 닫기
                      setRejectionModalOpen(false);

                      // 상태 업데이트 대신 직접 handleSave 호출 시 반려 사유 전달
                      // 직접 업데이트 객체 생성 및 저장 요청
                      if (campaign && updateCampaign) {
                        try {
                          // 이전 newCampaign 상태를 업데이트하지 않고 직접 업데이트 객체 생성
                          const updateData = {
                            campaignName: newCampaign.campaignName,
                            description: newCampaign.description,
                            detailedDescription: newCampaign.detailedDescription,
                            additionalInfo: newCampaign.additionalInfo, // 추가 항목 정보
                            unitPrice: newCampaign.unitPrice,
                            deadline: newCampaign.deadline,
                            logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
                            uploadedLogo: previewUrl,
                            bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
                            uploadedBannerImage: bannerImagePreviewUrl,
                            status: 'rejected',
                            // 중요: 새로 입력한 반려 사유 사용
                            rejectionReason: rejectionReason,
                            rejected_reason: rejectionReason
                          };

                          // DB 직접 업데이트
                          const campaignId = typeof newCampaign.id === 'string' ? parseInt(newCampaign.id) : newCampaign.id;
                          const success = await updateCampaign(campaignId, updateData);

                          if (success) {
                            // 성공 시 상태 업데이트 (UI 반영용)
                            setNewCampaign(prev => {
                              if (!prev) return prev;

                              return {
                                ...prev,
                                status: {
                                  label: getStatusLabel('rejected'),
                                  color: getStatusColor('rejected'),
                                  status: 'rejected'
                                },
                                rejectionReason: rejectionReason,
                                originalData: {
                                  ...prev.originalData,
                                  rejected_reason: rejectionReason,
                                  status: 'rejected'
                                }
                              };
                            });

                            // 부모 컴포넌트에 업데이트 알림
                            if (onSave) {
                              const updatedCampaign = {
                                ...newCampaign,
                                status: {
                                  label: getStatusLabel('rejected'),
                                  color: getStatusColor('rejected'),
                                  status: 'rejected'
                                },
                                rejectionReason: rejectionReason
                              };
                              onSave(updatedCampaign as ExtendedCampaign);
                            }

                            onClose();
                          } else {
                            setError('반려 사유 저장에 실패했습니다.');
                            setLoading(false);
                          }
                        } catch (error) {
                          console.error('반려 처리 직접 업데이트 중 오류:', error);
                          setError('반려 처리 중 오류가 발생했습니다.');
                          setLoading(false);
                        }
                      } else {
                        setLoading(false);
                        setError('캠페인 업데이트 함수가 제공되지 않았습니다.');
                      }
                    } catch (error) {
                      console.error('반려 처리 중 오류:', error);
                      setError('반려 처리 중 오류가 발생했습니다.');
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></span>
                      저장중...
                    </span>
                  ) : newCampaign.rejectionReason ? (
                    <>
                      <KeenIcon icon="pencil" className="me-1.5 size-3" />
                      반려 사유 수정하기
                    </>
                  ) : (
                    <>
                      <KeenIcon icon="cross" className="me-1.5 size-3" />
                      반려하기
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 sm:h-10 sm:px-4"
                  onClick={() => setRejectionModalOpen(false)}
                >
                  취소
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 승인 확인 모달 */}
      {approvalModalOpen && (
        <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
          <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <KeenIcon icon="check-circle" className="text-green-500 size-5 mr-2" />
                캠페인 승인 확인
              </DialogTitle>
            </DialogHeader>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  선택한 캠페인을 승인하시겠습니까?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  승인 시 캠페인이 준비중 상태로 변경됩니다.
                </p>
              </div>

              {/* 캠페인 정보 표시 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      캠페인 이름
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {newCampaign.campaignName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      서비스 유형
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {getServiceTypeName(serviceType || '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      건당 단가
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {newCampaign.unitPrice}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      마감 시간
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {newCampaign.deadline || '18:00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      현재 상태
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {getStatusLabel(typeof newCampaign.status === 'object' ? newCampaign.status?.status : newCampaign.status || (campaign?.originalData?.status || 'waiting_approval'))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      변경될 상태
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      준비중
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setApprovalModalOpen(false);

                    if (updateCampaign) {
                      // 로고가 없는 경우 랜덤 동물 지정
                      let logoValue = previewUrl ? 'uploaded-logo.png' : newCampaign.logo;
                      // 빈 문자열도 로고가 없는 것으로 처리
                      if (!previewUrl && (!newCampaign.logo || newCampaign.logo === '')) {
                        const animalLogos = [
                          'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
                          'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
                          'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
                          'sheep', 'teddy-bear', 'turtle'
                        ];
                        const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
                        logoValue = `animal/svg/${randomAnimal}.svg`;
                      }

                      // 승인 상태로 직접 업데이트
                      const updateData = {
                        campaignName: newCampaign.campaignName,
                        description: newCampaign.description,
                        detailedDescription: newCampaign.detailedDescription,
                        add_field: newCampaign.userInputFields,
                        unitPrice: newCampaign.unitPrice,
                        deadline: newCampaign.deadline,
                        logo: logoValue,
                        uploadedLogo: previewUrl,
                        bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
                        uploadedBannerImage: bannerImagePreviewUrl,
                        status: 'pending', // 승인 시 준비중 상태로
                      };

                      const campaignId = typeof newCampaign.id === 'string' ? parseInt(newCampaign.id) : newCampaign.id;
                      const success = await updateCampaign(campaignId, updateData);

                      if (success) {
                        // 성공 시 UI 업데이트
                        const updatedCampaign = {
                          ...newCampaign,
                          status: {
                            label: getStatusLabel('pending'),
                            color: getStatusColor('pending'),
                            status: 'pending'
                          }
                        };

                        if (onSave) {
                          onSave(updatedCampaign as ExtendedCampaign);
                        }

                        onClose();
                      } else {
                        setError('캠페인 승인에 실패했습니다.');
                      }
                    }
                  } catch (error) {
                    console.error('캠페인 승인 중 오류:', error);
                    setError('캠페인 승인 중 오류가 발생했습니다.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                    승인 중...
                  </span>
                ) : (
                  <>
                    승인하기
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setApprovalModalOpen(false)}
                disabled={loading}
              >
                취소
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 변경사항 저장 확인 모달 */}
      {saveConfirmModalOpen && (
        <Dialog open={saveConfirmModalOpen} onOpenChange={setSaveConfirmModalOpen}>
          <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <KeenIcon icon="shield-cross" className="text-yellow-500 size-5 mr-2" />
                캠페인 재승인 요청 확인
              </DialogTitle>
            </DialogHeader>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  캠페인 정보가 변경되어 운영자의 재승인이 필요합니다.
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                  <div className="flex items-start">
                    <KeenIcon icon="information-2" className="text-yellow-600 dark:text-yellow-400 size-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                        저장 시 다음과 같이 변경됩니다:
                      </p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                        <li>• 현재 상태가 <span className="font-semibold">승인 대기중</span>으로 변경됩니다</li>
                        <li>• 운영자가 검토 후 승인/반려를 결정합니다</li>
                        <li>• 승인 전까지 캠페인이 비활성화됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 캠페인 정보 표시 */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-20">캠페인명:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {newCampaign.campaignName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-20">현재 상태:</span>
                      <span className={`badge badge-${
                        typeof campaign?.status === 'object' ? campaign.status.color : 'info'
                      } badge-outline text-xs`}>
                        {typeof campaign?.status === 'object' 
                          ? campaign.status.label 
                          : getStatusLabel(campaign?.originalData?.status || 'pending')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-20">변경 후:</span>
                      <span className="badge badge-warning badge-outline text-xs">
                        승인 대기중
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                계속 진행하시겠습니까?
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={async () => {
                  setSaveConfirmModalOpen(false);
                  // 확인 후 실제 저장 수행
                  await performSave(true); // skipConfirm = true
                }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                    저장 중...
                  </span>
                ) : (
                  <>
                    저장하고 재승인 요청
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaveConfirmModalOpen(false)}
                disabled={loading}
              >
                취소
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export { CampaignModal };