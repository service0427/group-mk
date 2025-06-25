import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { useAuthContext } from '@/auth';
import { ICampaign, ExtendedCampaign, getStatusLabel, getStatusColor, CampaignServiceType, convertDbServiceTypeToEnum } from './types';
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
import { CampaignForm } from './CampaignForm';
import { CampaignPreviewModal } from './CampaignPreviewModal';
import type { CampaignFormData } from './CampaignForm';
import { RefundSettings } from '@/types/refund.types';

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
  // 사용자 권한 확인 (개발자도 운영자 모드로 처리)
  const { userRole, currentUser } = useAuthContext();
  const isDeveloper = userRole === 'developer' || currentUser?.role === 'developer';
  const isOperatorMode = isOperator || isDeveloper;
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

  // CampaignForm 데이터 상태
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignName: '',
    description: '',
    detailedDescription: '',
    userInputFields: [],
    logo: '',
    unitPrice: '100',
    minQuantity: '10',
    slotType: 'standard',
    isNegotiable: false,
    guaranteeCount: '',
    guaranteeUnit: '일',
    guaranteePeriod: '',
    targetRank: '1',
    minGuaranteePrice: '',
    maxGuaranteePrice: '',
    refundSettings: {
      enabled: true,
      type: 'immediate',
      requires_approval: false,
      refund_rules: {
        min_usage_days: 0,
        max_refund_days: 7,
        partial_refund: true
      }
    }
  });

  // 초기 폼 데이터 저장 (변경 감지용)
  const [initialFormData, setInitialFormData] = useState<CampaignFormData>({
    campaignName: '',
    description: '',
    detailedDescription: '',
    userInputFields: [],
    logo: '',
    unitPrice: '100',
    minQuantity: '10',
    slotType: 'standard',
    isNegotiable: false,
    guaranteeCount: '',
    guaranteeUnit: '일',
    guaranteePeriod: '',
    targetRank: '1',
    minGuaranteePrice: '',
    maxGuaranteePrice: '',
    refundSettings: {
      enabled: true,
      type: 'immediate',
      requires_approval: false,
      refund_rules: {
        min_usage_days: 0,
        max_refund_days: 7,
        partial_refund: true
      }
    }
  });

  // newCampaign과 formData 동기화
  useEffect(() => {
    setFormData({
      campaignName: newCampaign.campaignName,
      description: newCampaign.description,
      detailedDescription: newCampaign.detailedDescription || '',
      userInputFields: newCampaign.userInputFields || [],
      logo: newCampaign.logo,
      unitPrice: newCampaign.unitPrice || '100',
      minQuantity: newCampaign.minQuantity || '10',
      slotType: newCampaign.slotType || 'standard',
      isNegotiable: newCampaign.isNegotiable || false,
      guaranteeCount: String(newCampaign.guaranteeCount || ''),
      guaranteeUnit: newCampaign.guaranteeUnit || '일',
      guaranteePeriod: String(newCampaign.guaranteePeriod || ''),
      targetRank: String(newCampaign.targetRank || '1'),
      minGuaranteePrice: String(newCampaign.minGuaranteePrice || ''),
      maxGuaranteePrice: String(newCampaign.maxGuaranteePrice || ''),
      refundSettings: newCampaign.refundSettings || {
        enabled: true,
        type: 'immediate',
        requires_approval: false,
        refund_rules: {
          min_usage_days: 0,
          max_refund_days: 7,
          partial_refund: true
        }
      }
    });
  }, [newCampaign]);
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
      // minQuantity는 원본 데이터가 있으면 그것을 사용 (숫자를 문자열로 변환)
      const minQuantity = campaign.originalData?.min_quantity !== undefined
        ? campaign.originalData.min_quantity.toString()
        : (campaign.minQuantity ? campaign.minQuantity.replace('개', '') : '0');
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
          description: field.description || field.desc || '',
          isRequired: field.isRequired || false,
          fieldType: field.fieldType || 'text', // fieldType 추가
          enumOptions: field.enumOptions || undefined, // enumOptions 추가
          order: field.order
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

      // 서비스 타입 가져오기 (originalData에서 우선, 없으면 campaign에서)
      const dbServiceType = campaign.originalData?.service_type || campaign.serviceType || '';
      const convertedServiceType = convertDbServiceTypeToEnum(dbServiceType);

      // 환불 설정 가져오기
      let refundSettingsValue: RefundSettings = {
        enabled: true,
        type: 'immediate',
        requires_approval: false,
        refund_rules: {
          min_usage_days: 0,
          max_refund_days: 7,
          partial_refund: true
        }
      };

      if (campaign.originalData?.refund_settings) {
        refundSettingsValue = campaign.originalData.refund_settings;
      }

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
        serviceType: convertedServiceType, // 변환된 서비스 타입 추가
        originalData: campaign.originalData, // originalData 보존
        // 보장형 슬롯 관련 필드 추가
        slotType: campaign.originalData?.slot_type || campaign.slotType || 'standard',
        isNegotiable: campaign.originalData?.is_negotiable || campaign.isNegotiable || false,
        guaranteeCount: campaign.originalData?.guarantee_count?.toString() || campaign.guaranteeCount?.toString() || '',
        guaranteeUnit: campaign.originalData?.guarantee_unit || campaign.guaranteeUnit || '일',
        guaranteePeriod: campaign.originalData?.guarantee_period?.toString() || campaign.guaranteePeriod?.toString() || '',
        targetRank: campaign.originalData?.target_rank?.toString() || campaign.targetRank?.toString() || '1',
        minGuaranteePrice: campaign.originalData?.min_guarantee_price?.toString() || campaign.minGuaranteePrice?.toString() || '',
        maxGuaranteePrice: campaign.originalData?.max_guarantee_price?.toString() || campaign.maxGuaranteePrice?.toString() || '',
        refundSettings: refundSettingsValue // 환불 설정 추가
      });

      // 초기 폼 데이터도 설정 (변경 감지용)
      const initialData = {
        campaignName: campaign.campaignName || campaign.originalData?.campaign_name || '',
        description: campaign.description || campaign.originalData?.description || '',
        detailedDescription: detailedDescValue,
        userInputFields: userInputFieldsValue,
        logo: campaign.logo || '',
        unitPrice: unitPrice,
        minQuantity: minQuantity,
        slotType: campaign.originalData?.slot_type || campaign.slotType || 'standard',
        isNegotiable: campaign.originalData?.is_negotiable || campaign.isNegotiable || false,
        guaranteeCount: campaign.originalData?.guarantee_count?.toString() || campaign.guaranteeCount?.toString() || '',
        guaranteeUnit: campaign.originalData?.guarantee_unit || campaign.guaranteeUnit || '일',
        guaranteePeriod: campaign.originalData?.guarantee_period?.toString() || campaign.guaranteePeriod?.toString() || '',
        targetRank: campaign.originalData?.target_rank?.toString() || campaign.targetRank?.toString() || '1',
        minGuaranteePrice: campaign.originalData?.min_guarantee_price?.toString() || campaign.minGuaranteePrice?.toString() || '',
        maxGuaranteePrice: campaign.originalData?.max_guarantee_price?.toString() || campaign.maxGuaranteePrice?.toString() || '',
        refundSettings: refundSettingsValue
      };
      setInitialFormData(initialData);

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

  // 모달이 열릴 때마다 폼 데이터 초기화
  useEffect(() => {
    if (open) {
      // 기존 캠페인의 반려 사유가 있으면 설정, 없으면 초기화
      if (campaign?.originalData?.rejected_reason) {
        setRejectionReason(campaign.originalData.rejected_reason);
      } else if (campaign?.rejectionReason) {
        setRejectionReason(campaign.rejectionReason);
      } else {
        setRejectionReason('');
      }
      
      if (!campaign) {
        // 신규 캠페인 모드일 때만 나머지 초기화
      const initialData = {
        campaignName: '',
        description: '',
        detailedDescription: '',
        userInputFields: [],
        logo: '',
        unitPrice: '100',
        minQuantity: '10',
        slotType: 'standard' as const,
        isNegotiable: false,
        guaranteeCount: '',
        guaranteeUnit: '일' as const,
        guaranteePeriod: '',
        targetRank: '1',
        minGuaranteePrice: '',
        maxGuaranteePrice: '',
        refundSettings: {
          enabled: true,
          type: 'immediate' as const,
          requires_approval: false,
          refund_rules: {
            min_usage_days: 0,
            max_refund_days: 7,
            partial_refund: true
          }
        }
      };
      
      setFormData(initialData);
      setInitialFormData(initialData);
      
      // newCampaign도 초기화
      setNewCampaign({
        id: '',
        campaignName: '',
        description: '',
        detailedDescription: '',
        userInputFields: [],
        logo: '',
        unitPrice: '100',
        deadline: '18:00',
        status: 'waiting_approval',
        bannerImage: '',
        efficiency: '0',
        minQuantity: '10'
      });
      
      // 에러 메시지 초기화
      setError(null);
      
      // 이미지 초기화
      setPreviewUrl(null);
      setBannerImagePreviewUrl(null);
      setUploadedLogo(null);
      setUploadedBannerImage(null);
      }
    }
  }, [open, campaign]);

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
  const handleLogoUpload = (file: File) => {
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
  const handleBannerImageUpload = (file: File) => {
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

  // 배너 이미지 제거 핸들러
  const handleBannerImageRemove = () => {
    setBannerImagePreviewUrl(null);
    setUploadedBannerImage(null);
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

  // 폼 데이터 변경 핸들러
  const handleFormDataChange = (data: CampaignFormData) => {
    setFormData(data);
    setNewCampaign(prev => ({
      ...prev,
      ...data
    }));
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

  // 변경사항 감지 함수 - 초기 폼 데이터와 현재 폼 데이터만 비교
  // 필수 필드가 모두 입력되었는지 확인하는 함수
  const isFormValid = () => {
    // 기본 필수 필드 검증
    if (!formData.campaignName.trim()) {
      return false;
    }
    if (!formData.description.trim()) {
      return false;
    }
    if (!formData.detailedDescription || !formData.detailedDescription.trim()) {
      return false;
    }
    
    // 일반 슬롯일 때만 단가와 최소 수량 검증
    if (formData.slotType !== 'guarantee') {
      if (!formData.unitPrice || formData.unitPrice === '0' || formData.unitPrice === '') {
        return false;
      }
      if (!formData.minQuantity || formData.minQuantity === '0' || formData.minQuantity === '') {
        return false;
      }
    }
    
    // 사용자 입력 필드 검증
    if (!formData.userInputFields || formData.userInputFields.length === 0) {
      return false;
    }
    
    // 필수 필드가 최소 1개 이상 있는지 확인
    const hasRequiredField = formData.userInputFields.some(field => field.isRequired === true);
    if (!hasRequiredField) {
      return false;
    }
    
    // 로고 검증 (신규 캠페인일 때만)
    if (!campaign && !previewUrl && (!formData.logo || formData.logo === '')) {
      return false;
    }
    
    return true;
  };

  const hasDataChanged = () => {
    if (!campaign) return false;

    // 폼 필드 변경 확인
    if (formData.campaignName !== initialFormData.campaignName) return true;
    if (formData.description !== initialFormData.description) return true;
    if (formData.detailedDescription !== initialFormData.detailedDescription) return true;
    if (formData.unitPrice !== initialFormData.unitPrice) return true;
    if (formData.minQuantity !== initialFormData.minQuantity) return true;

    // 로고 변경 확인 (초기 URL과 현재 URL이 다른 경우)
    if (previewUrl !== initialLogoUrl) return true;

    // 배너 이미지 변경 확인 (초기 URL과 현재 URL이 다른 경우)
    if (bannerImagePreviewUrl !== initialBannerUrl) return true;

    // 사용자 입력 필드 변경 확인
    if (JSON.stringify(formData.userInputFields) !== JSON.stringify(initialFormData.userInputFields)) return true;

    // 환불 설정 변경 확인
    if (JSON.stringify(formData.refundSettings) !== JSON.stringify(initialFormData.refundSettings)) return true;

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

      // 운영자가 승인/반려 처리하는 경우는 상태를 그대로 사용
      if (isOperatorMode && (statusValue === 'active' || statusValue === 'rejected')) {
        finalStatus = statusValue;
      } else if (!isOperatorMode) {
        // 총판이 수정하는 경우만 자동 상태 변경
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
      if (!skipConfirm && willChangeToWaitingApproval && !isOperatorMode) {
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

      // 업데이트할 데이터 준비 - formData 사용
      let updateData = {
        campaignName: formData.campaignName,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        add_field: formData.userInputFields,
        unitPrice: formData.unitPrice,
        minQuantity: formData.minQuantity, // 최소 수량 추가!
        deadline: newCampaign.deadline,
        logo: logoValue,
        uploadedLogo: previewUrl,
        bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
        uploadedBannerImage: bannerImagePreviewUrl,
        status: finalStatus,
        // 보장형 슬롯 관련 필드 추가 (슬롯 타입은 수정 불가)
        guaranteeCount: formData.guaranteeCount,
        guaranteeUnit: formData.guaranteeUnit,
        guaranteePeriod: formData.guaranteePeriod,
        targetRank: formData.targetRank,
        minGuaranteePrice: formData.minGuaranteePrice,
        maxGuaranteePrice: formData.maxGuaranteePrice,
        refundSettings: formData.refundSettings, // 환불 설정 추가
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
      if (willChangeToWaitingApproval && !isOperatorMode) {
        try {
          // mat_id가 있으면 사용, 없으면 빈 문자열 (운영자 알림이므로 상관없음)
          const matId = newCampaign.originalData?.mat_id || '';
          await createCampaignReapprovalRequestNotification(
            campaignId.toString(),
            newCampaign.campaignName,
            matId
          );
        } catch (notificationError) {
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
        ...formData, // formData로 업데이트
        logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
        status: statusObject,
        originalData: {
          ...newCampaign.originalData,
          unit_price: parseFloat(formData.unitPrice || '0'),
          deadline: formatTimeHHMM(newCampaign.deadline || ''),
          description: formData.description,
          detailed_description: formData.detailedDescription,
          userInputFields: formData.userInputFields,
          status: finalStatus,
          logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
          uploaded_logo_data: previewUrl,
          banner_image: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
          uploaded_banner_image_data: bannerImagePreviewUrl,
          add_info: {
            ...addInfo,
            add_field: formData.userInputFields,
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
    // 필수 필드 검증 (모든 모드에서 공통 적용) - formData 사용
    if (!formData.campaignName.trim()) {
      setError('캠페인 이름은 필수입니다.');
      return;
    }

    // 일반 슬롯일 때만 단가와 최소 수량 검증
    if (formData.slotType !== 'guarantee') {
      if (!formData.unitPrice || formData.unitPrice === '0' || formData.unitPrice === '') {
        setError('건당 단가는 필수이며 0보다 큰 값이어야 합니다.');
        return;
      }

      if (!formData.minQuantity || formData.minQuantity === '0' || formData.minQuantity === '') {
        setError('최소 수량은 필수이며 0보다 큰 값이어야 합니다.');
        return;
      }
    }

    if (!formData.description.trim()) {
      setError('캠페인 소개는 필수입니다.');
      return;
    }

    if (!formData.detailedDescription || !formData.detailedDescription.trim()) {
      setError('캠페인 상세설명은 필수입니다.');
      return;
    }

    // 사용자 입력 필드 검증 - formData 사용
    if (!formData.userInputFields || formData.userInputFields.length === 0) {
      setError('최소 1개 이상의 사용자 입력 필드를 추가해주세요.');
      return;
    }
    
    // 필수 필드가 최소 1개 이상 있는지 확인
    const hasRequiredField = formData.userInputFields.some(field => field.isRequired === true);
    if (!hasRequiredField) {
      setError('최소 1개 이상의 필수 입력 필드가 필요합니다.');
      return;
    }

    // 편집 모드(기존 캠페인이 있는 경우)와 새 캠페인 생성 모드를 구분
    if (campaign && updateCampaign) {
      await performSave(false);
    } else {
      // 신규 캠페인 생성 모드
      // 제공된 createCampaign 함수가 없으면 기본 함수 사용
      const campaignCreator = createCampaign || defaultCreateCampaign;

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
          campaignName: formData.campaignName,
          description: formData.description,
          detailedDescription: formData.detailedDescription,
          logo: logoValue,
          uploadedLogo: previewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
          bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : null, // 실제 구현에서는 업로드된 파일 경로로 변경
          uploadedBannerImage: bannerImagePreviewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
          unitPrice: formData.unitPrice,
          deadline: newCampaign.deadline,
          status: 'waiting_approval', // 캠페인 신청 시 항상 '승인 대기중' 상태로 제출
          serviceType: serviceType,
          // 사용자 입력 필드 정보를 add_field로 전달
          add_field: formData.userInputFields,
          // 기본값 설정
          efficiency: '0',
          minQuantity: formData.minQuantity,
          additionalLogic: '0',
          refundSettings: formData.refundSettings // 환불 설정 추가
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
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) {
          // 모달이 닫힐 때 데이터 초기화
          if (!campaign) {
            // 신규 캐페인 모드일 때만 초기화
            const initialData = {
              campaignName: '',
              description: '',
              detailedDescription: '',
              userInputFields: [],
              logo: '',
              unitPrice: '100',
              minQuantity: '10',
              slotType: 'standard' as const,
              isNegotiable: false,
              guaranteeCount: '',
              guaranteeUnit: '일' as const,
              guaranteePeriod: '',
              targetRank: '1',
              minGuaranteePrice: '',
              maxGuaranteePrice: '',
              refundSettings: {
                enabled: true,
                type: 'immediate' as const,
                requires_approval: false,
                refund_rules: {
                  min_usage_days: 0,
                  max_refund_days: 7,
                  partial_refund: true
                }
              }
            };
            setFormData(initialData);
            setInitialFormData(initialData);
            setError(null);
          }
          onClose();
        }
      }}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[900px] max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="bg-background py-3 sm:py-4 px-4 sm:px-5 border-b flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">
              {campaign ? (isOperatorMode ? "캠페인 수정 (운영자 모드)" : "캠페인 수정") : "캠페인 추가"}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="py-4 sm:py-5 px-4 sm:px-5 overflow-y-auto flex-grow">
            {/* 캠페인 정보 - 모바일과 데스크톱 통합 */}
            <div className="space-y-4">
              {/* CampaignForm 컴포넌트를 사용하여 모바일과 데스크톱 모두 처리 */}
              <CampaignForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                additionalFields={additionalFields}
                onAdditionalFieldsChange={setAdditionalFields}
                serviceType={campaign ? newCampaign.serviceType : serviceType}
                loading={loading}
                error={null}
                onBannerPreview={() => setBannerPreviewModalOpen(true)}
                previewUrl={previewUrl}
                onLogoUpload={handleLogoUpload}
                bannerImagePreviewUrl={bannerImagePreviewUrl}
                onBannerImageUpload={handleBannerImageUpload}
                onBannerImageRemove={handleBannerImageRemove}
                isModal={true}
                isEditMode={!!campaign} // 캠페인이 있으면 편집 모드
              />
            </div>
          </DialogBody>

          {/* 버튼 - 푸터 영역 */}
          <DialogFooter className="py-3 sm:py-4 px-4 sm:px-5 border-t bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
            {/* 운영자 모드일 때 표시되는 푸터 */}
            {isOperatorMode && !!campaign ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end w-full gap-2 sm:gap-3">
                {/* 에러 메시지 - 모바일에서는 상단에 표시 */}
                {error && (
                  <div className="flex items-center text-red-600 text-sm order-first sm:order-none w-full sm:w-auto">
                    <KeenIcon icon="information-2" className="size-4 mr-1.5 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {/* 오른쪽: 버튼들 */}
                <div className="w-full sm:w-auto">
                  {/* 상태별 버튼들 - 모바일에서 2x2 그리드 */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
                    {(() => {
                      const currentStatus = typeof newCampaign.status === 'string'
                        ? newCampaign.status
                        : newCampaign.status?.status || 'pending';

                      // 승인 대기중 상태
                      if (currentStatus === 'waiting_approval') {
                        return (
                          <>
                            {/* 승인 버튼 */}
                            <Button
                              onClick={() => setApprovalModalOpen(true)}
                              className="bg-success hover:bg-success/90 text-white"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="check-circle" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">승인</span>
                              <span className="sm:hidden">승인</span>
                            </Button>

                            {/* 반려 버튼 */}
                            <Button
                              onClick={() => setRejectionModalOpen(true)}
                              className="bg-danger hover:bg-danger/90 text-white"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="shield-cross" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">반려</span>
                              <span className="sm:hidden">반려</span>
                            </Button>

                            {/* 미리보기 버튼 */}
                            <Button
                              onClick={() => setCampaignPreviewModalOpen(true)}
                              variant="outline"
                              className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="eye" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">미리보기</span>
                              <span className="sm:hidden">미리보기</span>
                            </Button>

                            {/* 정보 수정 버튼 */}
                            <Button
                              onClick={handleSave}
                              className="bg-success hover:bg-success/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading || !isFormValid()}
                              size="sm"
                            >
                              {loading ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                  <span className="hidden sm:inline">저장 중...</span>
                                  <span className="sm:hidden">저장</span>
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <KeenIcon icon="notepad-edit" className="me-1 sm:me-1.5 size-4" />
                                  <span className="hidden sm:inline">정보 수정</span>
                                  <span className="sm:hidden">수정</span>
                                </span>
                              )}
                            </Button>
                          </>
                        );
                      }

                      // 반려됨 상태
                      if (currentStatus === 'rejected') {
                        return (
                          <>
                            {/* 반려 사유 수정 버튼 */}
                            <Button
                              onClick={() => setRejectionModalOpen(true)}
                              variant="outline"
                              className="border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="message-dots" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">반려 사유 수정</span>
                              <span className="sm:hidden">반려수정</span>
                            </Button>

                            {/* 승인으로 변경 버튼 */}
                            <Button
                              onClick={() => setApprovalModalOpen(true)}
                              className="bg-success hover:bg-success/90 text-white"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="check-circle" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">승인으로 변경</span>
                              <span className="sm:hidden">승인</span>
                            </Button>

                            {/* 미리보기 버튼 */}
                            <Button
                              onClick={() => setCampaignPreviewModalOpen(true)}
                              variant="outline"
                              className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="eye" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">미리보기</span>
                              <span className="sm:hidden">미리보기</span>
                            </Button>

                            {/* 정보 수정 버튼 */}
                            <Button
                              onClick={handleSave}
                              className="bg-success hover:bg-success/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading || !isFormValid()}
                              size="sm"
                            >
                              {loading ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                  <span className="hidden sm:inline">저장 중...</span>
                                  <span className="sm:hidden">저장</span>
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <KeenIcon icon="notepad-edit" className="me-1 sm:me-1.5 size-4" />
                                  <span className="hidden sm:inline">정보 수정</span>
                                  <span className="sm:hidden">수정</span>
                                </span>
                              )}
                            </Button>
                          </>
                        );
                      }

                      // 진행중 상태
                      if (currentStatus === 'active') {
                        return (
                          <>
                            {/* 일시중지 버튼 */}
                            <Button
                              onClick={() => {
                                newCampaign.status = 'pause';
                                handleSave();
                              }}
                              variant="outline"
                              className="border-orange-300 hover:bg-orange-50 text-orange-600 hover:text-orange-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="shield-cross" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">표시안함</span>
                              <span className="sm:hidden">표시안함</span>
                            </Button>

                            {/* 미리보기 버튼 */}
                            <Button
                              onClick={() => setCampaignPreviewModalOpen(true)}
                              variant="outline"
                              className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="eye" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">미리보기</span>
                              <span className="sm:hidden">미리보기</span>
                            </Button>

                            {/* 정보 수정 버튼 */}
                            <Button
                              onClick={handleSave}
                              className="bg-success hover:bg-success/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading || !isFormValid()}
                              size="sm"
                            >
                              {loading ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                  <span className="hidden sm:inline">저장 중...</span>
                                  <span className="sm:hidden">저장</span>
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <KeenIcon icon="notepad-edit" className="me-1 sm:me-1.5 size-4" />
                                  <span className="hidden sm:inline">정보 수정</span>
                                  <span className="sm:hidden">수정</span>
                                </span>
                              )}
                            </Button>

                            {/* 취소 버튼 */}
                            <Button
                              onClick={onClose}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              disabled={loading}
                              size="sm"
                            >
                              <span className="hidden sm:inline">취소</span>
                              <span className="sm:hidden">취소</span>
                            </Button>
                          </>
                        );
                      }

                      // 일시중지 상태
                      if (currentStatus === 'pause') {
                        return (
                          <>
                            {/* 재개 버튼 */}
                            <Button
                              onClick={() => {
                                newCampaign.status = 'active';
                                handleSave();
                              }}
                              className="bg-success hover:bg-success/90 text-white"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="play-circle" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">캠페인 재개</span>
                              <span className="sm:hidden">재개</span>
                            </Button>

                            {/* 미리보기 버튼 */}
                            <Button
                              onClick={() => setCampaignPreviewModalOpen(true)}
                              variant="outline"
                              className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="eye" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">미리보기</span>
                              <span className="sm:hidden">미리보기</span>
                            </Button>

                            {/* 정보 수정 버튼 */}
                            <Button
                              onClick={handleSave}
                              className="bg-success hover:bg-success/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading || !isFormValid()}
                              size="sm"
                            >
                              {loading ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                  <span className="hidden sm:inline">저장 중...</span>
                                  <span className="sm:hidden">저장</span>
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <KeenIcon icon="notepad-edit" className="me-1 sm:me-1.5 size-4" />
                                  <span className="hidden sm:inline">정보 수정</span>
                                  <span className="sm:hidden">수정</span>
                                </span>
                              )}
                            </Button>

                            {/* 취소 버튼 */}
                            <Button
                              onClick={onClose}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              disabled={loading}
                              size="sm"
                            >
                              <span className="hidden sm:inline">취소</span>
                              <span className="sm:hidden">취소</span>
                            </Button>
                          </>
                        );
                      }

                      // 기타 상태 (pending 포함) - 기본 버튼들
                      return (
                        <>
                          {/* 준비중 상태일 때 표시안함 버튼 추가 */}
                          {currentStatus === 'pending' && (
                            <Button
                              onClick={() => {
                                newCampaign.status = 'pause';
                                handleSave();
                              }}
                              variant="outline"
                              className="border-orange-300 hover:bg-orange-50 text-orange-600 hover:text-orange-700"
                              disabled={loading}
                              size="sm"
                            >
                              <KeenIcon icon="shield-cross" className="me-1 sm:me-1.5 size-4" />
                              <span className="hidden sm:inline">표시안함</span>
                              <span className="sm:hidden">표시안함</span>
                            </Button>
                          )}

                          {/* 미리보기 버튼 */}
                          <Button
                            onClick={() => setCampaignPreviewModalOpen(true)}
                            variant="outline"
                            className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                            disabled={loading}
                            size="sm"
                          >
                            <KeenIcon icon="eye" className="me-1 sm:me-1.5 size-4" />
                            <span className="hidden sm:inline">미리보기</span>
                            <span className="sm:hidden">미리보기</span>
                          </Button>

                          {/* 정보 수정 버튼 */}
                          <Button
                            onClick={handleSave}
                            className="bg-success hover:bg-success/90 text-white"
                            disabled={loading}
                            size="sm"
                          >
                            {loading ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                <span className="hidden sm:inline">저장 중...</span>
                                <span className="sm:hidden">저장</span>
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <KeenIcon icon="notepad-edit" className="me-1 sm:me-1.5 size-4" />
                                <span className="hidden sm:inline">정보 수정</span>
                                <span className="sm:hidden">수정</span>
                              </span>
                            )}
                          </Button>

                          {/* 취소 버튼 */}
                          <Button
                            onClick={onClose}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                            size="sm"
                          >
                            <span className="hidden sm:inline">취소</span>
                            <span className="sm:hidden">취소</span>
                          </Button>
                        </>
                      );
                    })()}
                  </div>

                  {/* 취소 버튼 (승인 대기중과 반려됨 상태에서는 별도 행으로 표시) */}
                  {(() => {
                    const currentStatus = typeof newCampaign.status === 'string'
                      ? newCampaign.status
                      : newCampaign.status?.status || 'pending';
                    
                    if (currentStatus === 'waiting_approval' || currentStatus === 'rejected') {
                      return (
                        <div className="mt-2 sm:hidden">
                          <Button
                            onClick={onClose}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                            disabled={loading}
                            size="sm"
                          >
                            취소
                          </Button>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* 데스크톱에서만 취소 버튼 표시 (승인 대기중과 반려됨 상태) */}
                  {(() => {
                    const currentStatus = typeof newCampaign.status === 'string'
                      ? newCampaign.status
                      : newCampaign.status?.status || 'pending';
                    
                    if (currentStatus === 'waiting_approval' || currentStatus === 'rejected') {
                      return (
                        <div className="hidden sm:block mt-3">
                          <Button
                            onClick={onClose}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                          >
                            취소
                          </Button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ) : (
              /* 일반 모드 푸터 */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end w-full gap-2 sm:gap-3">
                {/* 에러 메시지 - 모바일에서 상단 표시 */}
                {error && (
                  <div className="flex items-center text-red-600 text-sm order-first w-full sm:mr-auto">
                    <KeenIcon icon="information-2" className="size-4 mr-1.5 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {/* 모바일: 버튼 그룹 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  {/* 모바일에서 미리보기와 수정 버튼을 한 줄에 */}
                  <div className="flex gap-2 sm:contents">
                    {/* 미리보기 버튼 */}
                    <Button
                      onClick={() => setCampaignPreviewModalOpen(true)}
                      variant="outline"
                      className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700 flex-1 sm:flex-initial"
                      disabled={loading}
                    >
                      <KeenIcon icon="eye" className="me-1.5 size-4" />
                      미리보기
                    </Button>

                    {/* 캠페인 등록/수정 버튼 */}
                    <Button
                      onClick={handleSave}
                      className="bg-success hover:bg-success/90 text-white flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || !isFormValid()}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          {campaign ? '저장 중...' : '신청 중...'}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <KeenIcon icon={campaign ? "check-circle" : "add-files"} className="me-1.5 size-4" />
                          {campaign ? '캠페인 수정' : '캠페인 등록 신청'}
                        </span>
                      )}
                    </Button>
                  </div>

                  {/* 취소 버튼 - 모바일에서 전체 너비 */}
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
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
                className="bg-primary hover:bg-primary/90 text-white"
              >
                확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 캠페인 미리보기 모달 - CampaignPreviewModal 사용 */}
      <CampaignPreviewModal
        open={campaignPreviewModalOpen}
        onClose={() => setCampaignPreviewModalOpen(false)}
        campaign={{
          ...newCampaign,
          slotType: formData.slotType,
          guaranteeCount: formData.guaranteeCount,
          guaranteeUnit: formData.guaranteeUnit,
          minGuaranteePrice: formData.minGuaranteePrice,
          maxGuaranteePrice: formData.maxGuaranteePrice,
          originalData: {
            ...newCampaign.originalData,
            slot_type: formData.slotType,
            guarantee_count: formData.guaranteeCount,
            guarantee_unit: formData.guaranteeUnit,
            min_guarantee_price: formData.minGuaranteePrice,
            max_guarantee_price: formData.maxGuaranteePrice,
          }
        }}
      />

      {/* 기존 인라인 미리보기 제거 - 주석 처리 */}
      {false && (
      <Dialog open={campaignPreviewModalOpen} onOpenChange={setCampaignPreviewModalOpen}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[900px] p-0 overflow-hidden max-h-[90vh] flex flex-col border-2 sm:border-4 border-primary" aria-describedby={undefined}>
          <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-3 px-4 sm:py-4 sm:px-6 border-b sticky top-0 z-10 shadow-sm">
            <DialogTitle className="text-base sm:text-lg font-medium text-foreground flex items-center">
              <KeenIcon icon="eye" className="mr-2 text-primary size-4 sm:size-5" />
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
                      src={bannerImagePreviewUrl || ''}
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
                      src={bannerImagePreviewUrl || ''}
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

              {/* 캠페인 헤더 정보 - 모바일 최적화 */}
              <div className="bg-background border-b px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* 로고 이미지: 업로드된 이미지 우선, 선택된 동물 로고, 또는 랜덤 동물 로고 */}
                  <img
                    src={(() => {
                      // 업로드된 이미지가 있으면 그것을 사용
                      if (previewUrl) return previewUrl || '';

                      // 기본 제공 로고 중 선택된 것이 있으면 그것을 사용
                      if (formData.logo && formData.logo !== 'none' && formData.logo !== '') {
                        return toAbsoluteUrl(`/media/${formData.logo}`);
                      }

                      // 아무것도 선택되지 않았으면 랜덤 동물 PNG 사용
                      const animalLogos = [
                        'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
                        'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
                        'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
                        'sheep', 'teddy-bear', 'turtle'
                      ];
                      const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
                      return toAbsoluteUrl(`/media/animal/${randomAnimal}.png`);
                    })()}
                    className="rounded-full size-10 sm:size-12 shrink-0 border border-gray-100 shadow-sm"
                    alt="캠페인 로고"
                    onError={(e) => {
                      // 에러 발생시 다른 랜덤 동물로 재시도
                      const animalLogos = [
                        'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant',
                        'flamingo', 'giraffe', 'horse', 'kangaroo', 'koala',
                        'leopard', 'lion', 'llama', 'owl', 'pelican', 'penguin',
                        'sheep', 'teddy-bear', 'turtle'
                      ];
                      const randomAnimal = animalLogos[Math.floor(Math.random() * animalLogos.length)];
                      (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/${randomAnimal}.png`);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center flex-wrap gap-2">
                      <span className="truncate">{formData.campaignName || '(캠페인 이름을 입력해주세요)'}</span>
                      <span className="badge badge-success badge-outline rounded-[30px] h-auto py-0.5 text-xs whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-success me-1.5"></span>
                        진행중
                      </span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 - 모바일 최적화 */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* 상단: 주요 정보 요약 카드 - 모바일에서 2열로 표시 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <KeenIcon icon="rocket" className="text-green-500 size-4 sm:size-5" />
                      <div className="text-xs sm:text-sm text-muted-foreground">상승효율</div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-green-600">
                      60%
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <KeenIcon icon="wallet" className="text-primary size-4 sm:size-5" />
                      <div className="text-xs sm:text-sm text-muted-foreground">건당 단가</div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-primary">
                      {formData.unitPrice ? `${formData.unitPrice}원` : '100원'}
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <KeenIcon icon="purchase" className="text-orange-500 size-4 sm:size-5" />
                      <div className="text-xs sm:text-sm text-muted-foreground">최소 수량</div>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-orange-600">
                      {formData.minQuantity ? `${formData.minQuantity}개` : '10개'}
                    </div>
                  </div>
                </div>

                {/* 중간: 캠페인 설명 - 모바일 최적화 */}
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">캠페인 정보</h3>
                  <div className="bg-white border border-border p-4 sm:p-5 rounded-lg sm:rounded-xl text-sm sm:text-md text-foreground">
                    <div className="mb-3 sm:mb-4">
                      <h4 className="font-medium text-primary mb-1.5 sm:mb-2 text-sm sm:text-base">설명</h4>
                      <p className="text-xs sm:text-sm whitespace-pre-line text-gray-700 bg-blue-50/50 p-2.5 sm:p-3 rounded-md border border-blue-100/50">
                        {formData.description || '(캠페인 설명을 입력해주세요)'}
                      </p>
                    </div>

                    <div className="mb-3 sm:mb-4">
                      <h4 className="font-medium text-primary mb-1.5 sm:mb-2 text-sm sm:text-base">상세 설명</h4>
                      <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto pr-1 sm:pr-2 rounded-md p-2.5 sm:p-3 bg-blue-50/30">
                        <p className="whitespace-pre-line text-gray-700 text-xs sm:text-sm">
                          {formData.detailedDescription && formData.detailedDescription !== formData.description ?
                            formData.detailedDescription :
                            (formData.description || '(캠페인 상세 설명을 입력해주세요)')}
                        </p>
                      </div>
                    </div>

                    {formData.userInputFields && formData.userInputFields.length > 0 && (
                      <div>
                        <h4 className="font-medium text-primary mb-1.5 sm:mb-2 text-sm sm:text-base">사용자 입력 필드</h4>
                        <div className="max-h-[120px] sm:max-h-[150px] overflow-y-auto pr-1 sm:pr-2 rounded-md p-2.5 sm:p-3 bg-blue-50/30">
                          <div className="space-y-1.5 sm:space-y-2">
                            {formData.userInputFields.map((field, index) => (
                              <div key={index} className="flex gap-1.5 sm:gap-2 items-center text-xs sm:text-sm">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-blue-600">{field.fieldName || "(이름 없음)"}</span>
                                  {field.isRequired && (
                                    <span className="text-red-500 text-xs font-bold">*</span>
                                  )}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-gray-700 break-words">{field.description || "(설명 없음)"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 환불 정책 - 모바일 최적화 */}
                {formData.refundSettings?.enabled && (
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                      <KeenIcon icon="shield-tick" className="text-primary size-4 sm:size-5" />
                      환불 정책
                    </h3>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-5 rounded-lg sm:rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="space-y-2.5 sm:space-y-3">
                        {/* 환불 가능 시점 */}
                        <div className="flex items-start gap-2">
                          <KeenIcon icon="time" className="text-amber-600 dark:text-amber-400 size-4 mt-0.5 shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium text-amber-700 dark:text-amber-300">환불 가능 시점: </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {(() => {
                                switch (formData.refundSettings?.type) {
                                  case 'immediate':
                                    return '즉시 환불 가능';
                                  case 'delayed':
                                    return `작업 시작 ${formData.refundSettings?.delay_days || 0}일 후 환불 가능`;
                                  case 'cutoff_based':
                                    return `마감시간(${formData.refundSettings?.cutoff_time || '18:00'}) 이후 환불 가능`;
                                  default:
                                    return '즉시 환불 가능';
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* 환불 승인 필요 여부 */}
                        <div className="flex items-start gap-2">
                          <KeenIcon icon="user-tick" className="text-amber-600 dark:text-amber-400 size-4 mt-0.5 shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium text-amber-700 dark:text-amber-300">환불 승인: </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {formData.refundSettings?.requires_approval ? '총판 승인 필요' : '자동 승인'}
                            </span>
                          </div>
                        </div>

                        {/* 환불 규정 */}
                        {formData.refundSettings?.refund_rules && (
                          <>
                            <div className="flex items-start gap-2">
                              <KeenIcon icon="calendar-tick" className="text-amber-600 dark:text-amber-400 size-4 mt-0.5 shrink-0" />
                              <div className="text-xs sm:text-sm">
                                <span className="font-medium text-amber-700 dark:text-amber-300">최소 사용 일수: </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {formData.refundSettings?.refund_rules?.min_usage_days || 0}일
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <KeenIcon icon="calendar-remove" className="text-amber-600 dark:text-amber-400 size-4 mt-0.5 shrink-0" />
                              <div className="text-xs sm:text-sm">
                                <span className="font-medium text-amber-700 dark:text-amber-300">최대 환불 가능 일수: </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {formData.refundSettings?.refund_rules?.max_refund_days || 7}일
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <KeenIcon icon="percentage" className="text-amber-600 dark:text-amber-400 size-4 mt-0.5 shrink-0" />
                              <div className="text-xs sm:text-sm">
                                <span className="font-medium text-amber-700 dark:text-amber-300">부분 환불: </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {formData.refundSettings?.refund_rules?.partial_refund ? '사용 기간에 따른 부분 환불 가능' : '전액 환불만 가능'}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 미리보기 알림 - 모바일 최적화 */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-4 rounded-md text-blue-600 dark:text-blue-300">
                  <div className="flex items-start">
                    <KeenIcon icon="information-2" className="size-4 sm:size-5 mr-1.5 sm:mr-2 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">미리보기 모드</p>
                      <p className="text-xs sm:text-sm mt-1">이 화면은 캠페인이 등록된 후 어떻게 보일지를 미리 보여주는 화면입니다. 실제 데이터는 저장 전까지 반영되지 않습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="flex-shrink-0 border-t p-4 flex justify-end">
              <Button
                onClick={() => setCampaignPreviewModalOpen(false)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* 승인 확인 모달 */}
      {approvalModalOpen && (
        <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
          <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>캠페인 승인 확인</DialogTitle>
            </DialogHeader>
            <DialogBody className="py-4">
              <p className="text-sm text-muted-foreground">
                이 캠페인을 승인하시겠습니까?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                승인 후 캠페인이 활성화되어 사용자에게 표시됩니다.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setApprovalModalOpen(false)}
              >
                취소
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-white"
                onClick={() => {
                  setApprovalModalOpen(false);
                  // 상태를 active로 설정
                  setNewCampaign(prev => ({ 
                    ...prev, 
                    status: 'active'
                  }));
                  // performSave를 직접 호출하여 운영자 모드 논리 회피
                  setTimeout(async () => {
                    if (campaign && updateCampaign) {
                      await performSave(false);
                    }
                  }, 100);
                }}
              >
                승인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectionModalOpen && (
        <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>캠페인 반려 사유</DialogTitle>
            </DialogHeader>
            <DialogBody className="py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    반려 사유를 입력해주세요
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full mt-2 p-3 border border-gray-200 rounded-md min-h-[120px] text-foreground"
                    placeholder="반려 사유를 상세히 입력해주세요..."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  * 반려 사유는 총판에게 전달되어 캠페인 수정에 참고됩니다.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectionModalOpen(false);
                  setRejectionReason('');
                }}
              >
                취소
              </Button>
              <Button
                className="bg-danger hover:bg-danger/90 text-white"
                onClick={async () => {
                  if (!rejectionReason?.trim()) {
                    setError('반려 사유를 입력해주세요.');
                    return;
                  }
                  setRejectionModalOpen(false);
                  // 상태를 rejected로 설정하고 반려 사유 저장
                  const updatedCampaign = { 
                    ...newCampaign, 
                    status: 'rejected',
                    rejectionReason: rejectionReason
                  };
                  setNewCampaign(updatedCampaign);
                  
                  // 직접 업데이트 수행
                  if (campaign && updateCampaign) {
                    setLoading(true);
                    setError(null);
                    
                    const campaignId = typeof campaign.id === 'string' ? parseInt(campaign.id) : campaign.id;
                    const updateData = {
                      status: 'rejected',
                      rejectionReason: rejectionReason,
                      rejected_reason: rejectionReason
                    };
                    
                    try {
                      const success = await updateCampaign(campaignId, updateData);
                      if (!success) {
                        throw new Error('캠페인 반려 처리에 실패했습니다.');
                      }
                      
                      // 성공 시 모달 닫기
                      if (onSave) {
                        onSave({
                          ...updatedCampaign,
                          status: {
                            label: '반려됨',
                            color: 'danger',
                            status: 'rejected'
                          }
                        });
                      }
                      onClose();
                    } catch (err) {
                      setError('캠페인 반려 처리 중 오류가 발생했습니다.');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              >
                반려
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
              <DialogTitle className="flex items-center text-xl">
                <KeenIcon icon="check-circle" className="text-orange-500 size-6 mr-2" />
                캠페인 재승인 필요
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="py-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <KeenIcon icon="information-2" className="text-orange-600 dark:text-orange-400 size-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                      중요: 캠페인 정보가 변경되었습니다
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      변경사항을 저장하면 캠페인이 자동으로 <span className="font-bold text-orange-900 dark:text-orange-100">'승인 대기중'</span> 상태로 변경됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="size-2 rounded-full bg-orange-500 mr-3"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    현재 진행 중인 캠페인이 <span className="font-semibold">일시 중단</span>됩니다
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="size-2 rounded-full bg-orange-500 mr-3"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    운영자의 <span className="font-semibold">재승인이 필요</span>합니다
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="size-2 rounded-full bg-orange-500 mr-3"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    승인 완료 후 캠페인이 <span className="font-semibold">다시 활성화</span>됩니다
                  </p>
                </div>
              </div>

              <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <KeenIcon icon="shield-tick" className="size-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                  변경사항은 운영자가 검토하여 캠페인 품질을 보장합니다
                </p>
              </div>
            </DialogBody>
            <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  setSaveConfirmModalOpen(false);
                  performSave(true);
                }}
              >
                <KeenIcon icon="check-circle" className="size-4 mr-1.5" />
                변경사항 저장 및 재승인 요청
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaveConfirmModalOpen(false)}
                className="mr-3"
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
