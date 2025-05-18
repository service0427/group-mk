import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate/DashboardTemplate';
import { KeenIcon } from '@/components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { ICampaign } from '@/pages/admin/campaigns/components/CampaignContent';
import { toAbsoluteUrl } from '@/utils';
import { createCampaign, formatTimeHHMM } from '@/pages/admin/campaigns/services/campaignService';

// 새 캠페인 인터페이스
interface NewCampaign {
  campaignName: string;
  description: string;
  detailedDescription: string;
  logo: string;
  unitPrice: string;
  deadline: string;
  status: string;
  bannerImage: string;
}

const CampaignAddPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // URL에서 서비스 타입 가져오기 (쿼리 파라미터)
  const queryParams = new URLSearchParams(location.search);
  const serviceType = queryParams.get('type') || 'ntraffic'; // 기본값: 네이버 트래픽

  // 기본값으로 채워진 새 캠페인 객체
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    campaignName: '',
    description: '',
    detailedDescription: '',
    logo: '', // 기본 로고를 빈 값으로 설정해 기본 제공 로고 선택이 기본값이 되도록 함
    unitPrice: '100',
    deadline: '18:00',
    status: 'active', // 기본 상태는 '진행중'
    bannerImage: '',
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

  const handleChange = (field: keyof NewCampaign, value: string) => {
    setNewCampaign(prev => ({ ...prev, [field]: value }));
  };

  // 숫자만 입력받는 핸들러
  const handleNumberChange = (field: keyof NewCampaign, value: string) => {
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

  const handleSave = async () => {
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
        status: 'active', // 항상 '진행중' 상태로 제출
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

      // 성공 메시지 표시
      toast.success(`'${newCampaign.campaignName}' 캠페인 제안이 접수되었습니다.`);

      // 캠페인 목록 페이지로 이동
      navigate('/campaign-request');
    } catch (err) {
      setError(err instanceof Error ? err.message : '캠페인 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상태값에 따른 라벨 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return '진행중';
      case 'pending': return '준비중';
      case 'pause': return '표시안함';
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
      default: return 'info';
    }
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

  return (
    <DashboardTemplate
      title={`${getServiceTypeName(serviceType)} 캠페인 등록 신청`}
      description="새로운 캠페인을 제안하고 승인 받을 수 있습니다. 아래 양식을 작성해주세요."
      headerTextClass="text-white"
    >
      <Card className="overflow-hidden mb-6 shadow-md border border-gray-200 dark:border-gray-700">
        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 mx-6 my-4 rounded-md flex items-center shadow-sm border border-red-200 dark:border-red-800/50">
            <KeenIcon icon="warning-triangle" className="size-5 mr-3 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            {/* 헤더 정보 - 표 스타일로 통일 */}
            <div className="overflow-hidden border border-border rounded-lg mb-6 shadow-sm bg-white dark:bg-gray-800/20">
              <div className="flex items-center p-5">
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
                      <Select
                        value={previewUrl ? 'none' : (newCampaign.logo || 'none')}
                        onValueChange={(value) => {
                          // 업로드된 이미지를 모두 제거하고 드롭다운 선택으로 전환
                          setPreviewUrl(null);
                          setUploadedLogo(null);

                          // 'none'을 선택한 경우 로고를 빈 문자열로 설정
                          if (value === 'none') {
                            handleChange('logo', '');
                            return;
                          }

                          if (value) {
                            // 선택된 동물 로고 값
                            const selectedAnimal = value;

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
                            handleChange('logo', value);
                          }
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
                          <SelectValue placeholder="기본 제공 로고 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">기본 제공 로고 선택</SelectItem>
                          <SelectItem value="animal/svg/bear.svg">곰</SelectItem>
                          <SelectItem value="animal/svg/cat.svg">고양이</SelectItem>
                          <SelectItem value="animal/svg/cow.svg">소</SelectItem>
                          <SelectItem value="animal/svg/crocodile.svg">악어</SelectItem>
                          <SelectItem value="animal/svg/dolphin.svg">돌고래</SelectItem>
                          <SelectItem value="animal/svg/elephant.svg">코끼리</SelectItem>
                          <SelectItem value="animal/svg/flamingo.svg">플라밍고</SelectItem>
                          <SelectItem value="animal/svg/giraffe.svg">기린</SelectItem>
                          <SelectItem value="animal/svg/horse.svg">말</SelectItem>
                          <SelectItem value="animal/svg/kangaroo.svg">캥거루</SelectItem>
                          <SelectItem value="animal/svg/koala.svg">코알라</SelectItem>
                          <SelectItem value="animal/svg/leopard.svg">표범</SelectItem>
                          <SelectItem value="animal/svg/lion.svg">사자</SelectItem>
                          <SelectItem value="animal/svg/llama.svg">라마</SelectItem>
                          <SelectItem value="animal/svg/owl.svg">올빼미</SelectItem>
                          <SelectItem value="animal/svg/pelican.svg">펠리컨</SelectItem>
                          <SelectItem value="animal/svg/penguin.svg">펭귄</SelectItem>
                          <SelectItem value="animal/svg/sheep.svg">양</SelectItem>
                          <SelectItem value="animal/svg/teddy-bear.svg">테디베어</SelectItem>
                          <SelectItem value="animal/svg/turtle.svg">거북이</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Input
                    type="text"
                    value={newCampaign.campaignName}
                    onChange={(e) => handleChange('campaignName', e.target.value)}
                    className="text-xl font-semibold"
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
                    <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      건당 단가
                    </th>
                    <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
                      <div className="flex items-center">
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={newCampaign.unitPrice}
                          onChange={(e) => handleNumberChange('unitPrice', e.target.value)}
                          className="w-24"
                          disabled={loading}
                        />
                        <span className="ml-2 text-md font-medium text-foreground">원</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      접수마감시간
                    </th>
                    <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
                      <Input
                        type="time"
                        value={newCampaign.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)}
                        className="w-36"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      배너 이미지
                    </th>
                    <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
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
                    <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      캠페인 설명
                    </th>
                    <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
                      <Textarea
                        value={newCampaign.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="min-h-[60px]"
                        rows={2}
                        placeholder="간단한 캠페인 설명을 입력하세요"
                        disabled={loading}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                      캠페인 상세설명
                    </th>
                    <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
                      <Textarea
                        value={newCampaign.detailedDescription}
                        onChange={(e) => handleChange('detailedDescription', e.target.value)}
                        className="min-h-[100px]"
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
                        <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                          {fieldInfo.label}
                          {fieldInfo.required && <span className="text-red-500 ml-1">*</span>}
                        </th>
                        <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
                          {fieldInfo.type === 'select' ? (
                            <Select
                              value={additionalFields[fieldKey] || fieldInfo.defaultValue || 'none'}
                              onValueChange={(value) => handleAdditionalFieldChange(fieldKey, value)}
                              disabled={loading}
                            >
                              <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
                                <SelectValue placeholder="선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">선택하세요</SelectItem>
                                {fieldInfo.options?.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : fieldInfo.type === 'textarea' ? (
                            <Textarea
                              value={additionalFields[fieldKey] || ''}
                              onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                              className="min-h-[60px]"
                              placeholder={fieldInfo.placeholder}
                              disabled={loading}
                              required={fieldInfo.required}
                            />
                          ) : (
                            <Input
                              type={fieldInfo.type}
                              value={additionalFields[fieldKey] || ''}
                              onChange={(e) => handleAdditionalFieldChange(fieldKey, e.target.value)}
                              className="w-full"
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
          </div>
        </div>

        {/* 버튼 - 푸터 영역 */}
        <div className="flex justify-end items-center gap-3 py-5 px-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
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

    </DashboardTemplate>
  );
};

export default CampaignAddPage;