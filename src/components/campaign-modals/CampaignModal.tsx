import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { ICampaign, ExtendedCampaign, getStatusLabel, getStatusColor } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (newCampaign: ExtendedCampaign) => void;
  createCampaign?: (data: any) => Promise<{ success: boolean, error?: string }>;
  serviceType?: string;
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
  serviceType = 'ntraffic',
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
    logo: '',
    unitPrice: '100',
    deadline: '18:00',
    status: 'pending',  // 기본 상태는 '준비중'
    bannerImage: '',
    efficiency: '0',
    minQuantity: '10'
  });

  // 서비스 유형별 추가 필드
  const [additionalFields, setAdditionalFields] = useState<{ [key: string]: string }>({});

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

      // 캠페인 데이터로 newCampaign 상태 업데이트
      setNewCampaign({
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

      // 서비스 타입에 따른 추가 필드 설정
      if (campaign.originalData?.add_info?.additional_fields) {
        try {
          let additionalFieldsData = {};

          if (typeof campaign.originalData.add_info.additional_fields === 'string') {
            additionalFieldsData = JSON.parse(campaign.originalData.add_info.additional_fields);
          } else {
            additionalFieldsData = campaign.originalData.add_info.additional_fields;
          }

          setAdditionalFields(additionalFieldsData);
        } catch (e) {
          // 파싱 오류 무시
        }
      }
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
    additionalFields: { [key: string]: { label: string; type: string; defaultValue: string; placeholder?: string; required?: boolean; options?: Array<{ value: string, label: string }> } };
  }

  // 서비스 유형별 정보 정의
  const serviceTypeInfoMap: { [key: string]: ServiceTypeInfo } = {
    'ntraffic': {
      name: '네이버 트래픽',
      additionalFields: {
        targetKeywords: { label: '타겟 키워드', type: 'text', defaultValue: '', placeholder: '타겟 키워드를 입력하세요 (쉼표로 구분)', required: true },
        targetUrl: { label: '타겟 URL', type: 'url', defaultValue: '', placeholder: 'https://example.com', required: true },
      }
    },
    'NaverShopTraffic': {
      name: '네이버 쇼핑',
      additionalFields: {
        productId: { label: '상품 ID', type: 'text', defaultValue: '', placeholder: '네이버 쇼핑 상품 ID를 입력하세요', required: true },
        targetKeywords: { label: '타겟 키워드', type: 'text', defaultValue: '', placeholder: '타겟 키워드를 입력하세요 (쉼표로 구분)', required: true },
        productCategory: {
          label: '상품 카테고리', type: 'select', defaultValue: '', required: true,
          options: [
            { value: 'fashion', label: '패션의류/잡화' },
            { value: 'beauty', label: '화장품/미용' },
            { value: 'food', label: '식품' },
            { value: 'home', label: '가구/인테리어' },
            { value: 'digital', label: '디지털/가전' },
            { value: 'sports', label: '스포츠/레저' },
          ]
        }
      }
    },
    'NaverPlaceTraffic': {
      name: '네이버 플레이스 트래픽',
      additionalFields: {
        placeId: { label: '장소 ID', type: 'text', defaultValue: '', placeholder: '네이버 플레이스 ID를 입력하세요', required: true },
        targetKeywords: { label: '타겟 키워드', type: 'text', defaultValue: '', placeholder: '타겟 키워드를 입력하세요 (쉼표로 구분)', required: true },
      }
    },
    'NaverPlaceSave': {
      name: '네이버 플레이스 저장',
      additionalFields: {
        placeId: { label: '장소 ID', type: 'text', defaultValue: '', placeholder: '네이버 플레이스 ID를 입력하세요', required: true },
        saveTarget: { label: '저장 목표 수', type: 'number', defaultValue: '10', required: true },
      }
    },
    'NaverPlaceShare': {
      name: '네이버 플레이스 공유',
      additionalFields: {
        placeId: { label: '장소 ID', type: 'text', defaultValue: '', placeholder: '네이버 플레이스 ID를 입력하세요', required: true },
        shareTarget: { label: '공유 목표 수', type: 'number', defaultValue: '10', required: true },
        targetBlog: { label: '타겟 블로그 정보', type: 'text', defaultValue: '', placeholder: '블로그 정보를 입력하세요 (선택사항)' },
      }
    },
    'NaverAuto': {
      name: '네이버 자동완성',
      additionalFields: {
        targetKeywords: { label: '타겟 키워드', type: 'text', defaultValue: '', placeholder: '타겟 키워드를 입력하세요 (쉼표로 구분)', required: true },
        searchFrequency: {
          label: '검색 빈도 (일)', type: 'select', defaultValue: '7', required: true,
          options: [
            { value: '3', label: '3일' },
            { value: '7', label: '7일' },
            { value: '14', label: '14일' },
            { value: '30', label: '30일' },
          ]
        },
      }
    },
    'CoupangTraffic': {
      name: '쿠팡 트래픽',
      additionalFields: {
        productId: { label: '상품 ID', type: 'text', defaultValue: '', placeholder: '쿠팡 상품 ID를 입력하세요', required: true },
        targetUrl: { label: '타겟 URL', type: 'url', defaultValue: '', placeholder: 'https://www.coupang.com/...', required: true },
      }
    },
  };

  // 서비스 유형에 따른 이름 반환
  const getServiceTypeName = (type: string): string => {
    return serviceTypeInfoMap[type]?.name || '네이버 트래픽';
  };

  // 서비스 유형에 따른 추가 필드 초기화
  useEffect(() => {
    if (serviceType && serviceTypeInfoMap[serviceType]) {
      const fieldInfo = serviceTypeInfoMap[serviceType].additionalFields;
      const initialValues: { [key: string]: string } = {};

      // 각 필드의 기본값으로 초기화
      Object.keys(fieldInfo).forEach(key => {
        initialValues[key] = fieldInfo[key].defaultValue;
      });

      setAdditionalFields(initialValues);
    }
  }, [serviceType]);

  // 추가 필드 값 변경 핸들러
  const handleAdditionalFieldChange = (field: string, value: string) => {
    setAdditionalFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // 편집 모드(기존 캠페인이 있는 경우)와 새 캠페인 생성 모드를 구분
    if (campaign && updateCampaign) {
      // 수정 모드
      if (!newCampaign) return;

      setLoading(true);
      setError(null);

      try {
        let statusValue;
        if (typeof newCampaign.status === 'string') {
          statusValue = newCampaign.status;

        } else if (typeof newCampaign.status === 'object' && newCampaign.status !== null) {
          // status.status가 있고 유효한 값인지 확인
          statusValue = newCampaign.status.status || 'pending';

        } else {
          // 기본값 사용 전에 originalData에서 확인
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
        const isStatusChanged = statusValue !== originalStatus;

        // 운영자 모드가 아닌 경우(총판) 상태 처리 로직
        let finalStatus = statusValue;
        if (!isOperator) {
          // 1. 승인 요청중 상태인 경우 - 무조건 waiting_approval로 유지
          if (originalStatus === 'waiting_approval') {
            finalStatus = 'waiting_approval';
          }
          // 2. 반려됨 상태인 경우 - 무조건 waiting_approval로 변경 (재승인 요청)
          else if (originalStatus === 'rejected') {
            finalStatus = 'waiting_approval';
          }
          // 3. 준비중, 진행중, 표시안함 상태인 경우 - 사용자가 선택한 상태로 변경
          else if (['pending', 'active', 'pause'].includes(originalStatus)) {
            finalStatus = statusValue; // 사용자가 선택한 상태 사용
          }
          // 4. 그 외의 경우는 원래 상태 유지
          else {
            finalStatus = originalStatus;
          }
        }

        // 업데이트할 데이터 준비
        const updateData = {
          campaignName: newCampaign.campaignName,
          description: newCampaign.description,
          detailedDescription: newCampaign.detailedDescription,
          unitPrice: newCampaign.unitPrice,
          deadline: newCampaign.deadline,
          logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
          uploadedLogo: previewUrl,
          bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
          uploadedBannerImage: bannerImagePreviewUrl,
          status: finalStatus,
          rejectionReason: finalStatus === 'rejected' ? newCampaign.rejectionReason : undefined,
          additionalFields: additionalFields, // 서비스 유형별 추가 필드
        };

        // DB 업데이트
        const success = await updateCampaign(parseInt(newCampaign.id), updateData);

        if (!success) {
          throw new Error('캠페인 업데이트에 실패했습니다.');
        }

        // UI 업데이트를 위해 형식 변환 및 originalData 업데이트
        let addInfo = newCampaign.originalData?.add_info || {};
        if (typeof addInfo === 'string') {
          try {
            addInfo = JSON.parse(addInfo);
          } catch (e) {
            addInfo = {};
          }
        }

        // 상태 객체 생성
        const statusObject = {
          label: getStatusLabel(finalStatus),
          color: getStatusColor(finalStatus),
          status: finalStatus
        };

        const updatedCampaign: ExtendedCampaign = {
          ...newCampaign,
          logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
          // 상태를 일관된 형식으로 업데이트
          status: statusObject,
          // originalData 업데이트
          originalData: {
            ...newCampaign.originalData,
            unit_price: parseFloat(newCampaign.unitPrice || '0'),
            deadline: formatTimeHHMM(newCampaign.deadline || ''),
            description: newCampaign.description,
            detailed_description: newCampaign.detailedDescription,
            status: finalStatus,
            logo: previewUrl ? 'updated-logo.png' : newCampaign.logo,
            uploaded_logo_data: previewUrl,
            banner_image: bannerImagePreviewUrl ? 'banner-image.png' : newCampaign.bannerImage,
            uploaded_banner_image_data: bannerImagePreviewUrl,
            add_info: {
              ...addInfo,
              additional_fields: additionalFields,
            },
            // 반려 상태일 때 rejected_reason 필드 업데이트
            ...(finalStatus === 'rejected' ? { rejected_reason: newCampaign.rejectionReason } : {})
          }
        };

        // 부모 컴포넌트에 업데이트 알림
        if (onSave) {
          onSave(updatedCampaign);
        }

        onClose();
      } catch (err) {
        setError('캠페인 정보 저장에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    } else {
      // 신규 캠페인 생성 모드
      if (!createCampaign) {
        setError('캠페인 생성 함수가 제공되지 않았습니다.');
        return;
      }

      // 필수 필드 검증
      if (!newCampaign.campaignName.trim()) {
        setError('캠페인 이름은 필수입니다.');
        return;
      }

      // 서비스 유형별 필수 필드 검증
      if (serviceType && serviceTypeInfoMap[serviceType]) {
        const fieldInfo = serviceTypeInfoMap[serviceType].additionalFields;

        for (const [fieldKey, info] of Object.entries(fieldInfo)) {
          if (info.required && (!additionalFields[fieldKey] || additionalFields[fieldKey].trim() === '')) {
            setError(`${info.label}은(는) 필수 입력 항목입니다.`);
            return;
          }
        }
      }

      setLoading(true);
      setError(null);

      try {
        // 1. DB에 새 캠페인 생성
        const result = await createCampaign({
          campaignName: newCampaign.campaignName,
          description: newCampaign.description,
          detailedDescription: newCampaign.detailedDescription,
          logo: previewUrl ? 'uploaded-logo.png' : newCampaign.logo, // 실제 구현에서는 업로드된 파일 경로로 변경
          uploadedLogo: previewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
          bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : null, // 실제 구현에서는 업로드된 파일 경로로 변경
          uploadedBannerImage: bannerImagePreviewUrl, // base64 데이터를 서버로 전달 (실제 구현 시)
          unitPrice: newCampaign.unitPrice,
          deadline: newCampaign.deadline,
          status: 'waiting_approval', // 캠페인 신청 시 항상 '승인 대기중' 상태로 제출
          serviceType: serviceType,
          // 서비스 유형별 추가 필드
          additionalFields: additionalFields,
          // 기본값 설정
          efficiency: '0',
          minQuantity: '10',
          additionalLogic: '0'
        });

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
            // 추가 필드 및 서비스 타입 정보 추가
            serviceType,
            additionalFields,
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
              {campaign ? "캠페인 수정" : "캠페인 추가"}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="py-5 px-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {/* 오류 메시지 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 mb-5 rounded-md flex items-center shadow-sm border border-red-200 dark:border-red-800/50">
                <KeenIcon icon="warning-triangle" className="size-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* 헤더 정보 - 표 스타일로 통일 */}
            <div className="overflow-hidden border border-border rounded-lg mb-6 shadow-sm bg-white dark:bg-gray-800/20">
              <div className="flex items-center p-6">
                <div className="relative flex-shrink-0 mr-4">
                  {previewUrl || newCampaign.logo ? (
                    <img
                      src={previewUrl || toAbsoluteUrl(`/media/${newCampaign.logo}`)}
                      className="rounded-full size-16 object-cover border border-gray-200 shadow-sm"
                      alt="캠페인 로고"
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지 사용
                        (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                      }}
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
                        value={previewUrl ? 'none' : (newCampaign.logo || 'none')}
                        onChange={(e) => {
                          // 업로드된 이미지를 모두 제거하고 드롭다운 선택으로 전환
                          setPreviewUrl(null);
                          setUploadedLogo(null);

                          // 'none'을 선택한 경우 로고를 빈 문자열로 설정
                          if (e.target.value === 'none') {
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
                        <option value="none">기본 제공 로고 선택</option>
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
                      캠페인 설명
                    </th>
                    <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                      <textarea
                        value={newCampaign.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full h-[60px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                        rows={2}
                        placeholder="간단한 캠페인 설명을 입력하세요"
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

                  {/* 서비스 유형별 추가 필드 */}
                  {serviceType && serviceTypeInfoMap[serviceType] &&
                    Object.entries(serviceTypeInfoMap[serviceType].additionalFields).map(([fieldKey, fieldInfo]) => (
                      <tr key={fieldKey}>
                        <th className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                          {fieldInfo.label}
                          {fieldInfo.required && <span className="text-red-500 ml-1">*</span>}
                        </th>
                        <td className="px-6 py-4 bg-white dark:bg-gray-800/20">
                          {fieldInfo.type === 'select' ? (
                            <select
                              value={additionalFields[fieldKey] || fieldInfo.defaultValue || 'none'}
                              onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                              className="w-full h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                              disabled={loading}
                            >
                              <option value="none">선택하세요</option>
                              {fieldInfo.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : fieldInfo.type === 'textarea' ? (
                            <textarea
                              value={additionalFields[fieldKey] || ''}
                              onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                              className="w-full h-[60px] px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                              placeholder={fieldInfo.placeholder}
                              disabled={loading}
                              required={fieldInfo.required}
                            />
                          ) : (
                            <input
                              type={fieldInfo.type}
                              value={additionalFields[fieldKey] || ''}
                              onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                              className="w-full h-10 px-3 py-2 border border-gray-200 bg-white text-foreground rounded-md"
                              placeholder={fieldInfo.placeholder}
                              disabled={loading}
                              required={fieldInfo.required}
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </DialogBody>

          {/* 버튼 - 푸터 영역 */}
          <DialogFooter className="py-4 px-5 border-t bg-gray-50 dark:bg-gray-800/50 sticky bottom-0 z-10 shadow-sm">
            {/* 운영자 모드일 때 표시되는 푸터 */}
            {isOperator && campaign ? (
              <div className="flex justify-end items-center gap-3 w-full">
                <Button
                  onClick={() => setCampaignPreviewModalOpen(true)}
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={loading}
                >
                  <KeenIcon icon="eye" className="me-1.5 size-4" />
                  미리보기
                </Button>

                {/* 운영자 모드일 때 상태 변경 버튼들 */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      const statusValue = 'pending';  // 승인 시 준비중 상태로 변경
                      setNewCampaign(prev => {
                        if (!prev) return prev;
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
                    <KeenIcon icon="check" className="me-1.5 size-4" />
                    <span className="hidden sm:inline">준비상태로 </span>승인
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => {
                      const statusValue = 'pending';
                      setNewCampaign(prev => {
                        if (!prev) return prev;
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
                    <KeenIcon icon="layers" className="me-1.5 size-4" />
                    준비중
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => {
                      const statusValue = 'pause';
                      setNewCampaign(prev => {
                        if (!prev) return prev;
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
                    <KeenIcon icon="hide" className="me-1.5 size-4" />
                    <span className="hidden sm:inline">표시</span>안함
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => {
                      // 운영자 모드에서는 반려 사유 입력 모달 열기
                      setRejectionReason(''); // 반려 사유 초기화
                      setRejectionModalOpen(true); // 모달 열기
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    disabled={loading}
                  >
                    <KeenIcon icon="cross-circle" className="me-1.5 size-4" />
                    반려
                  </Button>
                </div>

                {/* 취소 버튼 */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex justify-end items-center gap-3">
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
                        (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
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
                        <h4 className="font-medium text-primary mb-2">간략 설명</h4>
                        <p className="text-sm whitespace-pre-line text-gray-700 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                          {newCampaign.description || '(캠페인 설명을 입력해주세요)'}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-primary mb-2">상세 설명</h4>
                        <div className="max-h-[200px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                          <p className="whitespace-pre-line text-gray-700">
                            {newCampaign.detailedDescription && newCampaign.detailedDescription !== newCampaign.description ?
                              newCampaign.detailedDescription :
                              (newCampaign.description || '(캠페인 상세 설명을 입력해주세요)')}
                          </p>
                        </div>
                      </div>
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

                  {/* 서비스 유형별 추가 정보 */}
                  {serviceType && serviceTypeInfoMap[serviceType] &&
                    Object.keys(serviceTypeInfoMap[serviceType].additionalFields).length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-3">{getServiceTypeName(serviceType)} 정보</h3>
                        <div className="bg-white p-5 rounded-xl border border-border">
                          <div className="grid gap-4">
                            {Object.entries(serviceTypeInfoMap[serviceType].additionalFields).map(([fieldKey, fieldInfo]) => (
                              <div key={fieldKey} className="flex flex-col">
                                <span className="font-medium text-muted-foreground text-sm mb-1">{fieldInfo.label}</span>
                                <span className="text-foreground">
                                  {fieldInfo.type === 'select' && fieldInfo.options
                                    ? fieldInfo.options.find(opt => opt.value === additionalFields[fieldKey])?.label || additionalFields[fieldKey] || '-'
                                    : additionalFields[fieldKey] || '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* 미리보기 알림 */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md text-blue-600 dark:text-blue-300">
                    <div className="flex items-start">
                      <KeenIcon icon="information-circle" className="size-5 mr-2 shrink-0 mt-0.5" />
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
                <KeenIcon icon="warning-circle" className="mr-2 text-red-500 size-5" />
                캠페인 반려 사유 입력
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="p-6 bg-background overflow-y-auto">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 rounded-md flex items-center mb-4">
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

                    setNewCampaign(prev => {
                      if (!prev) {
                        // 이전 상태가 없는 경우 기본 상태 반환
                        return {
                          id: '',
                          campaignName: '',
                          description: '',
                          detailedDescription: '',
                          logo: '',
                          unitPrice: '100',
                          deadline: '18:00',
                          status: {
                            label: getStatusLabel('rejected'),
                            color: getStatusColor('rejected'),
                            status: 'rejected'
                          },
                          rejectionReason: rejectionReason,
                          efficiency: '0',
                          minQuantity: '10'
                        };
                      }

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

                      return updatedCampaign;
                    });

                    // 모달 닫기
                    setRejectionModalOpen(false);

                    // 반려 처리 직접 DB에 업데이트
                    setTimeout(() => handleSave(), 100);
                  }}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></span>
                      처리중...
                    </span>
                  ) : (
                    <>
                      <KeenIcon icon="cross" className="me-1.5 size-3" />
                      반려하기
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export { CampaignModal };