import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate/DashboardTemplate';
import { KeenIcon } from '@/components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/utils';
import { createCampaign, formatTimeHHMM } from '@/pages/admin/campaigns/services/campaignService';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { CampaignForm, CampaignPreviewModal, type CampaignFormData } from '@/components/campaign-modals';
import { ICampaign } from '@/components/campaign-modals/types';


const CampaignAddPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // URL에서 서비스 타입 가져오기 (쿼리 파라미터)
  const queryParams = new URLSearchParams(location.search);
  const serviceType = queryParams.get('type') || 'ntraffic'; // 기본값: 네이버 트래픽

  // 비활성화된 서비스 타입 체크
  const disabledServices = [
    CampaignServiceType.NAVER_AUTO,
    CampaignServiceType.COUPANG_FAKESALE,
    CampaignServiceType.INSTAGRAM,
    CampaignServiceType.PHOTO_VIDEO_PRODUCTION,
    CampaignServiceType.LIVE_BROADCASTING
  ];

  // 비활성화된 서비스 타입으로 접근 시 리다이렉트
  useEffect(() => {
    if (disabledServices.includes(serviceType as CampaignServiceType)) {
      toast.error('해당 서비스는 아직 준비 중입니다.');
      navigate('/campaign-request');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, navigate]);

  // 캠페인 폼 데이터 상태
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignName: '',
    description: '',
    detailedDescription: '',
    userInputFields: [], // 사용자 입력 필드 추가
    logo: '',
    unitPrice: '100',
    bannerImage: '',
    minQuantity: '10',
    slotType: 'standard',
    isNegotiable: false,
    guaranteeCount: '',
    guaranteeUnit: '일', // 기본값 일
    guaranteePeriod: '', // 보장 기간 추가
    targetRank: '1', // 기본값 1위
    minGuaranteePrice: '',
    maxGuaranteePrice: '',
    deadline: '18:00', // 마감시간 추가, 기본값 18:00
  });

  // 서비스 유형별 추가 필드
  const [additionalFields, setAdditionalFields] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미지 상태 관리
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [bannerImagePreviewUrl, setBannerImagePreviewUrl] = useState<string | null>(null);
  const [uploadedBannerImage, setUploadedBannerImage] = useState<string | null>(null);

  // 배너 이미지 미리보기 모달 상태
  const [bannerPreviewModalOpen, setBannerPreviewModalOpen] = useState<boolean>(false);

  // 캠페인 전체 미리보기 모달 상태
  const [campaignPreviewModalOpen, setCampaignPreviewModalOpen] = useState<boolean>(false);

  // 확인 모달 상태
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  // formData를 ICampaign 형태로 변환하는 함수
  const convertFormDataToCampaign = (data: CampaignFormData): ICampaign => {
    return {
      id: 'preview',
      campaignName: data.campaignName || '(캠페인 이름을 입력해주세요)',
      description: data.description || '(캠페인 설명을 입력해주세요)',
      detailedDescription: data.detailedDescription || '',
      logo: previewUrl || uploadedLogo || data.logo || '',
      efficiency: '60%',
      minQuantity: data.minQuantity ? `${data.minQuantity}개` : '10개',
      deadline: data.deadline || '18:00',
      status: {
        label: '진행중',
        color: 'success',
        status: 'active'
      },
      additionalLogic: '',
      serviceType: getServiceTypeName(serviceType),
      unitPrice: data.unitPrice || '100',
      bannerImage: bannerImagePreviewUrl || uploadedBannerImage || '',
      originalData: {
        slot_type: data.slotType,
        guarantee_count: data.guaranteeCount,
        guarantee_unit: data.guaranteeUnit,
        min_guarantee_price: data.minGuaranteePrice,
        max_guarantee_price: data.maxGuaranteePrice,
        is_negotiable: data.isNegotiable,
        add_info: {
          logo_url: previewUrl || uploadedLogo || '',
          banner_url: bannerImagePreviewUrl || uploadedBannerImage || ''
        }
      }
    };
  };

  // 서비스 유형에 따른 이름 반환
  const getServiceTypeName = (type: string): string => {
    // 먼저 표준화된 서비스 타입에서 확인
    if (SERVICE_TYPE_LABELS[type as CampaignServiceType]) {
      return SERVICE_TYPE_LABELS[type as CampaignServiceType];
    }

    // 레거시 타입 매핑
    switch (type) {
      case 'ntraffic':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_TRAFFIC];
      case 'NaverShopTraffic':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_TRAFFIC];
      case 'NaverShoppingRank':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_RANK];
      case 'NaverPlaceTraffic':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_TRAFFIC];
      case 'NaverPlaceSave':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SAVE];
      case 'NaverPlaceShare':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SHARE];
      case 'NaverPlaceRank':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_RANK];
      case 'NaverAuto':
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_AUTO];
      case 'CoupangTraffic':
        return SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_TRAFFIC];
      default:
        return SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_RANK];
    }
  };

  // 서비스 유형에 따른 추가 필드 초기화
  // CampaignForm 컴포넌트에서 자체적으로 처리하므로 여기서는 빈 객체로 초기화
  useEffect(() => {
    setAdditionalFields({});
  }, [serviceType]);

  // 로고 업로드 핸들러
  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setUploadedLogo(file.name);
      setFormData(prev => ({ ...prev, logo: '' }));
    };
    reader.readAsDataURL(file);
  };

  // 배너 이미지 업로드 핸들러
  const handleBannerImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBannerImagePreviewUrl(result);
      setUploadedBannerImage(file.name);
    };
    reader.readAsDataURL(file);
  };

  // 배너 이미지 제거 핸들러
  const handleBannerImageRemove = () => {
    setBannerImagePreviewUrl(null);
    setUploadedBannerImage(null);
  };

  // 로고 이미지 제거 핸들러
  const handleLogoRemove = () => {
    setPreviewUrl(null);
    setUploadedLogo(null);
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  // 폼 데이터 업데이트 핸들러
  const handleFormDataChange = (newFormData: CampaignFormData) => {
    setFormData(newFormData);
  };

  // validation 체크 함수
  const validateForm = () => {
    // 필수 필드 검증
    if (!formData.campaignName.trim()) {
      setError('캠페인 이름은 필수입니다.');
      return false;
    }

    if (!formData.unitPrice || formData.unitPrice === '0' || formData.unitPrice === '') {
      setError('건당 단가는 필수이며 0보다 큰 값이어야 합니다.');
      return false;
    }

    if (!formData.minQuantity || formData.minQuantity === '0' || formData.minQuantity === '') {
      setError('최소 수량은 필수이며 0보다 큰 값이어야 합니다.');
      return false;
    }

    if (!formData.description.trim()) {
      setError('캠페인 소개는 필수입니다.');
      return false;
    }

    if (!formData.detailedDescription.trim()) {
      setError('캠페인 상세설명은 필수입니다.');
      return false;
    }

    // 로고 필수 검증 - 업로드된 로고가 없고 기본 로고도 선택하지 않은 경우
    if (!previewUrl && (!formData.logo || formData.logo === '')) {
      setError('로고를 업로드하거나 기본 제공 로고 중 하나를 선택해주세요.');
      return false;
    }

    // 입력필드 필수 검증 - 최소 1개 이상의 필수 입력필드가 필요
    if (!formData.userInputFields || formData.userInputFields.length === 0) {
      setError('최소 1개 이상의 필수 s입력필드를 추가해주세요.');
      return false;
    }

    // 입력필드 내용 검증 - 필드명만 필수
    const invalidFields = formData.userInputFields.filter(field => 
      !field.fieldName.trim()
    );
    if (invalidFields.length > 0) {
      setError('모든 입력필드의 필드명을 입력해주세요.');
      return false;
    }

    // 입력필드명 중복 검증
    const fieldNames = formData.userInputFields.map(field => field.fieldName.trim());
    const duplicateFields = fieldNames.filter((name, index) => 
      name && fieldNames.indexOf(name) !== index
    );
    if (duplicateFields.length > 0) {
      setError('중복된 필드명이 있습니다. 각 필드명은 고유해야 합니다.');
      return false;
    }

    // 최소 1개 이상의 필수 입력 필드 검증
    const hasRequiredField = formData.userInputFields.some(field => field.isRequired === true);
    if (!hasRequiredField) {
      setError('최소 1개 이상의 필수 입력 필드가 필요합니다.');
      return false;
    }

    // 보장성 슬롯 관련 검증
    if (formData.slotType === 'guarantee') {
      if (!formData.guaranteePeriod || formData.guaranteePeriod === '0' || formData.guaranteePeriod === '') {
        setError('작업 일수는 필수이며 0보다 큰 값이어야 합니다.');
        return false;
      }

      if (!formData.guaranteeCount || formData.guaranteeCount === '0' || formData.guaranteeCount === '') {
        setError('보장 일수(횟수)는 필수이며 0보다 큰 값이어야 합니다.');
        return false;
      }

      // 보장 순위는 일 단위일 때만 필수
      if (formData.guaranteeUnit === '일' && (!formData.targetRank || formData.targetRank === '0' || formData.targetRank === '')) {
        setError('보장 순위는 필수이며 1-30 사이의 값이어야 합니다.');
        return false;
      }

      if (!formData.minGuaranteePrice || formData.minGuaranteePrice === '0' || formData.minGuaranteePrice === '') {
        setError('최소 보장 가격은 필수이며 0보다 큰 값이어야 합니다.');
        return false;
      }

      if (!formData.maxGuaranteePrice || formData.maxGuaranteePrice === '0' || formData.maxGuaranteePrice === '') {
        setError('최대 보장 가격은 필수이며 0보다 큰 값이어야 합니다.');
        return false;
      }

      if (Number(formData.minGuaranteePrice) > Number(formData.maxGuaranteePrice)) {
        setError('최소 보장 가격은 최대 보장 가격보다 작거나 같아야 합니다.');
        return false;
      }
    }

    setError(null);
    return true;
  };

  // 저장 핸들러 (실제 저장 처리)
  const handleConfirmSave = async () => {
    setConfirmModalOpen(false);
    setLoading(true);

    try {
      // 1. DB에 새 캠페인 생성
      const result = await createCampaign({
        campaignName: formData.campaignName,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        logo: previewUrl ? 'uploaded-logo.png' : formData.logo,
        uploadedLogo: previewUrl,
        bannerImage: bannerImagePreviewUrl ? 'banner-image.png' : null,
        uploadedBannerImage: bannerImagePreviewUrl,
        unitPrice: formData.unitPrice,
        status: 'waiting_approval', // 항상 '승인 대기중' 상태로 제출
        serviceType: serviceType,
        // 서비스 유형별 추가 필드
        additionalFields: additionalFields,
        // 사용자 입력 필드 정보를 add_field로 전달
        add_field: formData.userInputFields,
        // 기본값 설정
        efficiency: '0',
        minQuantity: formData.minQuantity || '10',
        additionalLogic: '0',
        // 보장성 슬롯 관련 필드
        slotType: formData.slotType,
        isNegotiable: formData.isNegotiable,
        guaranteeCount: formData.guaranteeCount,
        guaranteeUnit: formData.guaranteeUnit,
        guaranteePeriod: formData.guaranteePeriod,
        targetRank: formData.targetRank || '1',
        minGuaranteePrice: formData.minGuaranteePrice,
        maxGuaranteePrice: formData.maxGuaranteePrice,
        deadline: formData.deadline || '18:00'
      });

      if (!result.success) {
        throw new Error(result.error || '캠페인 생성에 실패했습니다.');
      }

      // 성공 메시지 표시
      toast.success(`'${formData.campaignName}' 캠페인 제안이 접수되었습니다.`);

      // 캠페인 목록 페이지로 이동
      navigate('/campaign-request');
    } catch (err) {
      setError(err instanceof Error ? err.message : '캠페인 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 등록 신청 버튼 클릭 핸들러
  const handleSave = () => {
    // validation 체크
    if (!validateForm()) {
      return;
    }

    // validateForm에서 설정한 loading을 false로 리셋
    setLoading(false);

    // validation 통과 시 확인 모달 열기
    setConfirmModalOpen(true);
  };

  return (
    <DashboardTemplate
      title={`${getServiceTypeName(serviceType)} 캠페인 등록 신청`}
      description="새로운 캠페인을 제안하고 승인 받을 수 있습니다. 아래 양식을 작성해주세요."
      headerTextClass="text-white"
    >
      <Card className="overflow-hidden mb-6 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <CampaignForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            additionalFields={additionalFields}
            onAdditionalFieldsChange={setAdditionalFields}
            serviceType={serviceType}
            loading={loading}
            error={null} // CampaignForm에서는 에러를 표시하지 않음
            onBannerPreview={() => setBannerPreviewModalOpen(true)}
            previewUrl={previewUrl}
            onLogoUpload={handleLogoUpload}
            onLogoRemove={handleLogoRemove}
            bannerImagePreviewUrl={bannerImagePreviewUrl}
            onBannerImageUpload={handleBannerImageUpload}
            onBannerImageRemove={handleBannerImageRemove}
            isModal={false}
          />
        </div>

        {/* 버튼 - 푸터 영역 */}
        <div className="flex flex-col sm:flex-row justify-end items-center py-4 px-4 sm:px-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 gap-3">
          {/* 에러 메시지 - 모바일에서 상단 표시 */}
          {error && (
            <div className="flex items-center text-red-600 text-sm order-first w-full">
              <KeenIcon icon="information-2" className="size-4 mr-1.5 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* 버튼 그룹 - 오른쪽 정렬 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* 모바일: 미리보기와 캠페인 등록 신청 버튼을 한 줄에 */}
            <div className="flex gap-2 sm:contents">
              {/* 미리보기 버튼 */}
              <Button
                onClick={() => setCampaignPreviewModalOpen(true)}
                variant="outline"
                className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700 flex-1 sm:flex-initial"
                disabled={loading}
              >
                <KeenIcon icon="eye" className="me-1.5 size-4" />
                <span className="hidden sm:inline">미리보기</span>
                <span className="sm:hidden">미리보기</span>
              </Button>

              {/* 캠페인 등록 신청 버튼 */}
              <Button
                onClick={handleSave}
                className="bg-success hover:bg-success/90 text-white flex-1 sm:flex-initial"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                    신청 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <KeenIcon icon="add-files" className="me-1.5 size-4" />
                    캠페인 등록 신청
                  </span>
                )}
              </Button>
            </div>

            {/* 취소 버튼 - 모바일에서 전체 너비 */}
            <Button
              onClick={() => navigate('/campaign-request')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </div>
      </Card>

      {/* 배너 이미지 미리보기 모달 - 모바일 최적화 */}
      {bannerPreviewModalOpen && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/90 z-[9999]"
          onClick={() => setBannerPreviewModalOpen(false)}
        >
          <div
            className="relative w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg p-0 m-2 sm:m-4 z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 우측 상단 닫기 버튼 - 모바일에서 크기 조정 */}
            <button
              onClick={() => setBannerPreviewModalOpen(false)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg transition-all"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 상단 닫기 텍스트 배너 */}
            <div className="bg-gray-800/90 text-white py-2 px-3 sm:px-4 text-center">
              <button
                onClick={() => setBannerPreviewModalOpen(false)}
                className="flex items-center justify-center w-full text-sm sm:text-base"
              >
                <span>배너 이미지 (탭하여 닫기)</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center p-2 sm:p-4">
              {bannerImagePreviewUrl ? (
                <img
                  src={bannerImagePreviewUrl}
                  alt="배너 이미지"
                  className="max-h-[60vh] sm:max-h-[70vh] object-contain w-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSIxNTAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2NjY2Ij7snbTrr7jsp4Drk6TsnZgg67Cc7IOd7J2EIOyeheugpe2VqeyzkuycvOuhnDwvdGV4dD48L3N2Zz4=";
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-40 text-muted-foreground">
                  <p className="text-sm sm:text-base">이미지를 찾을 수 없습니다.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center p-3 sm:p-4 border-t">
              <button
                onClick={() => setBannerPreviewModalOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 캠페인 미리보기 모달 */}
      <CampaignPreviewModal
        open={campaignPreviewModalOpen}
        onClose={() => setCampaignPreviewModalOpen(false)}
        campaign={campaignPreviewModalOpen ? convertFormDataToCampaign(formData) : null}
      />

      {/* 캠페인 등록 확인 모달 */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <KeenIcon icon="add-files" className="text-primary size-5 mr-2" />
              캠페인 등록 신청 확인
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                입력하신 내용으로 캠페인 등록을 신청하시겠습니까?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                신청 후에는 관리자 검토를 거쳐 승인됩니다.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-blue-700 dark:text-blue-300">
                    <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    캠페인 이름
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{formData.campaignName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-blue-700 dark:text-blue-300">
                    <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    서비스 유형
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{getServiceTypeName(serviceType)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-blue-700 dark:text-blue-300">
                    <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    건당 단가
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{formData.unitPrice}원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-blue-700 dark:text-blue-300">
                    <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    최소 수량
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{formData.minQuantity}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-blue-700 dark:text-blue-300">
                    <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    로고 이미지
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {previewUrl ? '업로드됨' : formData.logo ? '기본 제공 로고' : '미등록'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-blue-700 dark:text-blue-300">
                    <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                    배너 이미지
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {bannerImagePreviewUrl ? '업로드됨' : '미등록'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleConfirmSave}
              className="bg-success hover:bg-success/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                  신청 중...
                </span>
              ) : '신청하기'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardTemplate>
  );
};

export default CampaignAddPage;