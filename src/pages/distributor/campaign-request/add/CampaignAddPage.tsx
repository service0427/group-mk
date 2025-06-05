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
import { CampaignForm, type CampaignFormData } from '@/components/campaign-modals';


const CampaignAddPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // URL에서 서비스 타입 가져오기 (쿼리 파라미터)
  const queryParams = new URLSearchParams(location.search);
  const serviceType = queryParams.get('type') || 'ntraffic'; // 기본값: 네이버 트래픽

  // 비활성화된 서비스 타입 체크
  const disabledServices = [
    CampaignServiceType.NAVER_AUTO,
    CampaignServiceType.NAVER_SHOPPING_FAKESALE,
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

    // 로고 필수 검증 - 업로드된 로고가 없고 기본 로고도 선택하지 않은 경우
    if (!previewUrl && (!formData.logo || formData.logo === '')) {
      setError('로고를 업로드하거나 기본 제공 로고 중 하나를 선택해주세요.');
      return;
    }

    // 로고 필수 검증 - 업로드된 로고가 없고 기본 로고도 선택하지 않은 경우
    if (!previewUrl && (!formData.logo || formData.logo === '')) {
      setError('로고를 업로드하거나 기본 제공 로고 중 하나를 선택해주세요.');
      return;
    }

    // 서비스 유형별 필수 필드 검증은 CampaignForm 컴포넌트에서 처리됨

    setLoading(true);
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
        additionalLogic: '0'
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
            bannerImagePreviewUrl={bannerImagePreviewUrl}
            onBannerImageUpload={handleBannerImageUpload}
            onBannerImageRemove={handleBannerImageRemove}
            isModal={false}
          />
        </div>

        {/* 버튼 - 푸터 영역 */}
        <div className="flex justify-end items-center py-5 px-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center text-red-600 text-sm mr-3">
              <KeenIcon icon="information-circle" className="size-4 mr-1.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 버튼 그룹 */}
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

            {/* 캠페인 등록 신청 버튼 */}
            <Button
              onClick={handleSave}
              className="bg-success hover:bg-success/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                  신청 중...
                </span>
              ) : '캠페인 등록 신청'}
            </Button>

            {/* 취소 버튼 */}
            <Button
              onClick={() => navigate('/campaign-request')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </div>
      </Card>

      {/* 배너 이미지 미리보기 모달 - 사업자등록증 스타일 적용 */}
      {bannerPreviewModalOpen && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 z-[9999]"
          onClick={() => setBannerPreviewModalOpen(false)} // 배경 클릭 시 모달 닫기
          style={{ width: '100vw', height: '100vh' }}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] overflow-auto bg-white rounded-lg p-1 m-4 z-[10000]"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 방지
          >
            {/* 우측 상단 닫기 버튼 */}
            <button
              onClick={() => setBannerPreviewModalOpen(false)}
              className="absolute top-3 right-3 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 상단 닫기 텍스트 배너 */}
            <div className="bg-gray-800/90 text-white py-2 px-4 text-center mb-2">
              <button
                onClick={() => setBannerPreviewModalOpen(false)}
                className="flex items-center justify-center w-full"
              >
                <span>배너 이미지 (클릭하여 닫기)</span>
                <div className="ml-2 inline-flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="flex justify-center">
              {bannerImagePreviewUrl ? (
                <img
                  src={bannerImagePreviewUrl}
                  alt="배너 이미지"
                  className="max-h-[70vh] object-contain"
                  style={{ maxWidth: '100%' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSIxNTAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2NjY2Ij7snbTrr7jsp4Drk6TsnZgg67Cc7IOd7J2EIOyeheugpe2VqeyzkuycvOuhnDwvdGV4dD48L3N2Zz4=";
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-40 text-muted-foreground">
                  <p>이미지를 찾을 수 없습니다.</p>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center gap-4 mt-4 pb-2">
              <a
                href={bannerImagePreviewUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>새 탭에서 열기</span>
              </a>

              <button
                onClick={() => setBannerPreviewModalOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 캠페인 미리보기 다이얼로그 */}
      <Dialog open={campaignPreviewModalOpen} onOpenChange={setCampaignPreviewModalOpen}>
        <DialogContent className="w-[95vw] max-w-full sm:max-w-[900px] p-0 overflow-hidden max-h-[90vh] flex flex-col border-4 border-primary">
          <DialogHeader className="bg-gray-100 dark:bg-gray-800 py-4 px-6 border-b sticky top-0 z-10 shadow-sm">
            <DialogTitle className="text-lg font-medium text-foreground flex items-center">
              <KeenIcon icon="eye" className="mr-2 text-primary size-5" />
              캠페인 상세정보(미리보기)
            </DialogTitle>
            <div className="ml-auto"></div>
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
              <div className="bg-background border-b px-5 py-3">
                <div className="flex items-center gap-4">
                  {/* 로고 이미지: 업로드된 이미지 우선, 선택된 동물 로고, 또는 랜덤 동물 로고 */}
                  <img
                    src={(() => {
                      // 업로드된 이미지가 있으면 그것을 사용
                      if (previewUrl) return previewUrl;

                      // 기본 제공 로고 중 선택된 것이 있으면 그것을 사용
                      if (formData.logo && formData.logo !== 'none') {
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
                    className="rounded-full size-12 shrink-0 border border-gray-100 shadow-sm"
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
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center">
                      {formData.campaignName || '(캠페인 이름을 입력해주세요)'}
                      <span className="badge badge-success badge-outline rounded-[30px] h-auto py-0.5 text-xs ml-2">
                        <span className="size-1.5 rounded-full bg-success me-1.5"></span>
                        진행중
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <KeenIcon icon="wallet" className="text-primary size-5" />
                      <div className="text-sm text-muted-foreground">건당 단가</div>
                    </div>
                    <div className="text-xl font-bold text-primary">
                      {formData.unitPrice ? `${formData.unitPrice}원` : '100원'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <KeenIcon icon="basket" className="text-orange-500 size-5" />
                      <div className="text-sm text-muted-foreground">최소 수량</div>
                    </div>
                    <div className="text-xl font-bold text-orange-600">
                      {formData.minQuantity ? `${formData.minQuantity}개` : '10개'}
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
                </div>

                {/* 중간: 캠페인 설명 */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">캠페인 정보</h3>
                  <div className="bg-white border border-border p-5 rounded-xl text-md text-foreground">
                    <div className="mb-4">
                      <h4 className="font-medium text-primary mb-2">설명</h4>
                      <p className="text-sm whitespace-pre-line text-gray-700 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                        {formData.description || '(캠페인 설명을 입력해주세요)'}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-primary mb-2">상세 설명</h4>
                      <div className="max-h-[200px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                        <p className="whitespace-pre-line text-gray-700">
                          {formData.detailedDescription && formData.detailedDescription !== formData.description ?
                            formData.detailedDescription :
                            (formData.description || '(캠페인 상세 설명을 입력해주세요)')}
                        </p>
                      </div>
                    </div>

                    {formData.userInputFields && formData.userInputFields.length > 0 && (
                      <div>
                        <h4 className="font-medium text-primary mb-2">사용자 입력 필드</h4>
                        <div className="max-h-[150px] overflow-y-auto pr-2 rounded-md p-3 bg-blue-50/30">
                          <div className="space-y-2">
                            {formData.userInputFields.map((field, index) => (
                              <div key={index} className="flex gap-2 items-center text-sm">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-blue-600">{field.fieldName || "(이름 없음)"}</span>
                                  {field.isRequired && (
                                    <span className="text-red-500 text-xs font-bold">*</span>
                                  )}
                                </span>
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
                      <li>해당 캠페인 건당 단가는 {formData.unitPrice ? `${formData.unitPrice}원` : '100원'}입니다.</li>
                      <li>최소 구매 수량은 {formData.minQuantity ? `${formData.minQuantity}개` : '10개'}입니다.</li>
                      <li>데이터는 24시간 내에 집계되며, 결과는 대시보드에서 확인할 수 있습니다.</li>
                    </ul>
                  </div>
                </div>

                {/* 서비스 유형별 추가 정보 */}
                {serviceType && Object.keys(additionalFields).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">{getServiceTypeName(serviceType)} 정보</h3>
                    <div className="bg-white p-5 rounded-xl border border-border">
                      <div className="grid gap-4">
                        {Object.entries(additionalFields).map(([fieldKey, fieldValue]) => (
                          <div key={fieldKey} className="flex flex-col">
                            <span className="font-medium text-muted-foreground text-sm mb-1">{fieldKey}</span>
                            <span className="text-foreground">{fieldValue || '-'}</span>
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

      {/* 캠페인 등록 확인 모달 */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
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